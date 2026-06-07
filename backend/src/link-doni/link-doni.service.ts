import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LinkDoniChannel } from '../database/entities/link-doni-channel.entity';
import { Group } from '../database/entities/group.entity';
import { Account } from '../database/entities/account.entity';
import { BotWorker } from '../bot/bot.worker';

@Injectable()
export class LinkDoniService {
  private readonly logger = new Logger(LinkDoniService.name);

  constructor(
    @InjectRepository(LinkDoniChannel)
    private linkDoniRepository: Repository<LinkDoniChannel>,
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    private botWorker: BotWorker,
  ) {}

  async findAll(): Promise<LinkDoniChannel[]> {
    return this.linkDoniRepository.find({ order: { createdAt: 'DESC' } });
  }

  async extract(accountId: number, channelLink: string, count: number): Promise<Group[]> {
    return this.botWorker.extractLinksFromChannel(accountId, channelLink, count);
  }

  async remove(id: number): Promise<void> {
    await this.linkDoniRepository.delete(id);
  }
}
