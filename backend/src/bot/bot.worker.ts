import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Account, AccountStatus } from '../database/entities/account.entity';
import { Group } from '../database/entities/group.entity';
import { AccountGroup, JoinStatus } from '../database/entities/account-group.entity';
import { LinkDoniChannel } from '../database/entities/link-doni-channel.entity';
import { Job, JobType, JobStatus } from '../database/entities/job.entity';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { Api } from 'telegram/tl';

@Injectable()
export class BotWorker {
  private readonly logger = new Logger(BotWorker.name);
  private clients: Map<number, TelegramClient> = new Map();
  private apiId: number;
  private apiHash: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(AccountGroup)
    private accountGroupRepository: Repository<AccountGroup>,
    @InjectRepository(LinkDoniChannel)
    private linkDoniRepository: Repository<LinkDoniChannel>,
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
  ) {
    this.apiId = Number(this.configService.get('API_ID') || process.env.API_ID || 0);
    this.apiHash = this.configService.get('API_HASH') || process.env.API_HASH || '';
  }

  getClient(accountId: number): TelegramClient | undefined {
    return this.clients.get(accountId);
  }

  async createClient(account: Account): Promise<TelegramClient> {
    const stringSession = new StringSession(account.sessionString || '');
    const client = new TelegramClient(stringSession, this.apiId, this.apiHash, {
      connectionRetries: 5,
      useWSS: true,
    });

    await client.connect();

    if (account.sessionString) {
      const isAuthorized = await client.isUserAuthorized();
      if (!isAuthorized) {
        account.status = AccountStatus.DISCONNECTED;
        await this.accountRepository.save(account);
        throw new Error('Session expired. Please reconnect.');
      }
    }

    this.clients.set(account.id, client);
    return client;
  }

  async getOrCreateClient(account: Account): Promise<TelegramClient> {
    if (this.clients.has(account.id)) {
      try {
        const client = this.clients.get(account.id);
        if (client.connected) {
          return client;
        }
      } catch {}
    }
    return this.createClient(account);
  }

  async sendCode(phone: string): Promise<{ phoneCodeHash: string; account: Account }> {
    const client = new TelegramClient(
      new StringSession(''),
      this.apiId,
      this.apiHash,
      { connectionRetries: 5, useWSS: true },
    );

    await client.connect();
    const result = await client.sendCode(
      { apiId: this.apiId, apiHash: this.apiHash },
      phone,
    );

    let account = await this.accountRepository.findOne({ where: { phone } });
    if (!account) {
      account = this.accountRepository.create({
        phone,
        phoneCodeHash: result.phoneCodeHash,
        status: AccountStatus.WAITING_CODE,
      });
    } else {
      account.phoneCodeHash = result.phoneCodeHash;
      account.status = AccountStatus.WAITING_CODE;
    }
    await this.accountRepository.save(account);
    client.destroy();

    return { phoneCodeHash: result.phoneCodeHash, account };
  }

  async verifyCode(accountId: number, code: string): Promise<Account> {
    const account = await this.accountRepository.findOne({ where: { id: accountId } });
    if (!account) throw new Error('Account not found');

    const client = new TelegramClient(
      new StringSession(''),
      this.apiId,
      this.apiHash,
      { connectionRetries: 5, useWSS: true },
    );

    await client.connect();

    try {
      await client.invoke(
        new Api.auth.SignIn({
          phoneNumber: account.phone,
          phoneCodeHash: account.phoneCodeHash,
          phoneCode: code,
        }),
      );
    } catch (error: any) {
      if (error.errorMessage === 'SESSION_PASSWORD_NEEDED') {
        account.status = AccountStatus.WAITING_2FA;
        await this.accountRepository.save(account);
        client.destroy();
        throw new Error('2FA password required');
      }
      client.destroy();
      throw error;
    }

    account.sessionString = client.session.save();
    const me = await client.getMe() as any;
    account.userId = Number(me.id);
    account.firstName = me.firstName || '';
    account.lastName = me.lastName || '';
    account.username = me.username || '';
    account.status = AccountStatus.ACTIVE;

    await this.accountRepository.save(account);
    this.clients.set(account.id, client);

    return account;
  }

  async verify2FA(accountId: number, password: string): Promise<Account> {
    const account = await this.accountRepository.findOne({ where: { id: accountId } });
    if (!account) throw new Error('Account not found');

    const client = new TelegramClient(
      new StringSession(''),
      this.apiId,
      this.apiHash,
      { connectionRetries: 5, useWSS: true },
    );

    await client.connect();

    try {
      await client.signInWithPassword(
        { apiId: this.apiId, apiHash: this.apiHash },
        { password },
      );
    } catch (error: any) {
      client.destroy();
      throw new Error('Invalid 2FA password');
    }

    account.sessionString = client.session.save();
    const me = await client.getMe() as any;
    account.userId = Number(me.id);
    account.firstName = me.firstName || '';
    account.lastName = me.lastName || '';
    account.username = me.username || '';
    account.status = AccountStatus.ACTIVE;

    await this.accountRepository.save(account);
    this.clients.set(account.id, client);

    return account;
  }

  async updateProfile(accountId: number, firstName?: string, bio?: string): Promise<Account> {
    const account = await this.accountRepository.findOne({ where: { id: accountId } });
    if (!account) throw new Error('Account not found');

    const client = await this.getOrCreateClient(account);

    try {
      if (firstName) {
        await client.invoke(
          new Api.account.UpdateProfile({
            firstName,
            lastName: account.lastName || '',
          }),
        );
        account.firstName = firstName;
      }

      if (bio !== undefined) {
        await client.invoke(
          new Api.account.UpdateProfile({
            about: bio,
          }),
        );
        account.bio = bio;
      }

      await this.accountRepository.save(account);
    } catch (error: any) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    return account;
  }

  async disconnectAccount(accountId: number): Promise<void> {
    const account = await this.accountRepository.findOne({ where: { id: accountId } });
    if (!account) throw new Error('Account not found');

    if (this.clients.has(accountId)) {
      const client = this.clients.get(accountId);
      try {
        await client.invoke(new Api.auth.LogOut());
      } catch {}
      client.destroy();
      this.clients.delete(accountId);
    }

    account.sessionString = null;
    account.status = AccountStatus.DISCONNECTED;
    await this.accountRepository.save(account);
  }

  async extractLinksFromChannel(
    accountId: number,
    channelLink: string,
    count: number,
  ): Promise<Group[]> {
    const account = await this.accountRepository.findOne({ where: { id: accountId } });
    if (!account) throw new Error('Account not found');

    const client = await this.getOrCreateClient(account);
    const existingLinks = (await this.groupRepository.find()).map((g) => g.link);
    const existingSet = new Set(existingLinks);

    let channel;
    try {
      channel = await client.getEntity(channelLink);
    } catch {
      throw new Error('Cannot access channel. Make sure the account is a member.');
    }

    const messages = await client.getMessages(channel, { limit: count * 3 });

    const extractedGroups: Group[] = [];
    const groupLinkRegex = /(?:https?:\/\/)?t\.me\/(?:joinchat\/)?([a-zA-Z0-9_\-]+)/gi;

    for (const msg of messages) {
      if (extractedGroups.length >= count) break;

      const text = msg.message || '';
      const matches = [...text.matchAll(groupLinkRegex)];

      for (const match of matches) {
        if (extractedGroups.length >= count) break;
        const link = match[0].startsWith('http') ? match[0] : `https://${match[0]}`;

        if (!existingSet.has(link) && !extractedGroups.some((g) => g.link === link)) {
          const group = this.groupRepository.create({
            link,
            sourceChannel: channelLink,
          });
          const saved = await this.groupRepository.save(group);
          existingSet.add(link);
          extractedGroups.push(saved);
        }
      }
    }

    const channelTitle = (channel as any).title || channelLink;
    let linkDoni = await this.linkDoniRepository.findOne({ where: { link: channelLink } });
    if (!linkDoni) {
      linkDoni = this.linkDoniRepository.create({
        link: channelLink,
        title: channelTitle,
        channelId: Number((channel as any).id),
        totalExtracted: extractedGroups.length,
      });
    } else {
      linkDoni.totalExtracted += extractedGroups.length;
    }
    await this.linkDoniRepository.save(linkDoni);

    return extractedGroups;
  }

  async joinGroup(account: Account, group: Group): Promise<JoinStatus> {
    try {
      const client = await this.getOrCreateClient(account);
      const hash = group.link.includes('joinchat')
        ? group.link.split('joinchat/')[1]?.split('?')[0]
        : group.link.split('t.me/')[1]?.split('?')[0];

      if (!hash) {
        this.logger.error(`Invalid group link: ${group.link}`);
        return JoinStatus.FAILED;
      }

      const result = await client.invoke(
        new Api.messages.ImportChatInvite({ hash }),
      );

      return JoinStatus.JOINED;
    } catch (error: any) {
      this.logger.error(`Failed to join ${group.link} with account ${account.id}: ${error.message}`);
      return JoinStatus.FAILED;
    }
  }

  async joinAllAccountsToAllGroups(): Promise<void> {
    const accounts = await this.accountRepository.find({
      where: { status: AccountStatus.ACTIVE },
    });
    const groups = await this.groupRepository.find();

    for (const account of accounts) {
      for (const group of groups) {
        const exists = await this.accountGroupRepository.findOne({
          where: { accountId: account.id, groupId: group.id },
        });
        if (exists) continue;

        const status = await this.joinGroup(account, group);
        const ag = this.accountGroupRepository.create({
          accountId: account.id,
          groupId: group.id,
          status,
        });
        await this.accountGroupRepository.save(ag);
      }
    }
  }

  async distributeGroupsAmongAccounts(): Promise<void> {
    const accounts = await this.accountRepository.find({
      where: { status: AccountStatus.ACTIVE },
    });
    const groups = await this.groupRepository.find();

    if (accounts.length === 0) return;

    const groupsPerAccount = Math.ceil(groups.length / accounts.length);

    for (let i = 0; i < accounts.length; i++) {
      const start = i * groupsPerAccount;
      const end = Math.min(start + groupsPerAccount, groups.length);
      const accountGroups = groups.slice(start, end);

      for (const group of accountGroups) {
        const exists = await this.accountGroupRepository.findOne({
          where: { accountId: accounts[i].id, groupId: group.id },
        });
        if (exists) continue;

        const status = await this.joinGroup(accounts[i], group);
        const ag = this.accountGroupRepository.create({
          accountId: accounts[i].id,
          groupId: group.id,
          status,
        });
        await this.accountGroupRepository.save(ag);
      }
    }
  }

  async leaveGroupForAccount(account: Account, group: Group): Promise<void> {
    try {
      const client = await this.getOrCreateClient(account);
      const entity = await client.getEntity(group.link);
      await client.invoke(
        new Api.messages.LeaveChat({ chatId: entity.id }),
      );
    } catch (error: any) {
      this.logger.error(`Failed to leave group ${group.link}: ${error.message}`);
    }
  }

  async leaveAllGroupsForAllAccounts(): Promise<void> {
    const accounts = await this.accountRepository.find({
      where: { status: AccountStatus.ACTIVE },
    });

    for (const account of accounts) {
      const joinedGroups = await this.accountGroupRepository.find({
        where: { accountId: account.id, status: JoinStatus.JOINED },
        relations: ['group'],
      });

      for (const ag of joinedGroups) {
        await this.leaveGroupForAccount(account, ag.group);
        ag.status = JoinStatus.LEFT;
        await this.accountGroupRepository.save(ag);
      }
    }
  }

  async leaveGroupForAllAccounts(groupId: number): Promise<void> {
    const accounts = await this.accountRepository.find({
      where: { status: AccountStatus.ACTIVE },
    });
    const group = await this.groupRepository.findOne({ where: { id: groupId } });
    if (!group) return;

    for (const account of accounts) {
      const ag = await this.accountGroupRepository.findOne({
        where: { accountId: account.id, groupId, status: JoinStatus.JOINED },
      });
      if (!ag) continue;

      await this.leaveGroupForAccount(account, group);
      ag.status = JoinStatus.LEFT;
      await this.accountGroupRepository.save(ag);
    }
  }

  async sendMessageToGroup(
    accountId: number,
    groupId: number,
    message: string,
  ): Promise<void> {
    const account = await this.accountRepository.findOne({ where: { id: accountId } });
    const group = await this.groupRepository.findOne({ where: { id: groupId } });
    if (!account || !group) throw new Error('Account or Group not found');

    const client = await this.getOrCreateClient(account);
    const entity = await client.getEntity(group.link);
    await client.sendMessage(entity, { message });
  }

  async getAllGroups(): Promise<Group[]> {
    return this.groupRepository.find({ order: { createdAt: 'DESC' } });
  }

  async getAllGroupsWithAccounts(): Promise<any[]> {
    const groups = await this.groupRepository.find({
      order: { createdAt: 'DESC' },
    });

    const result = [];
    for (const group of groups) {
      const count = await this.accountGroupRepository.count({
        where: { groupId: group.id, status: JoinStatus.JOINED },
      });
      result.push({ ...group, joinedAccountsCount: count });
    }
    return result;
  }
}
