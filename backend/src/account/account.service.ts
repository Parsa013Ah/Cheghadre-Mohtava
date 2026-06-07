import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account, AccountStatus } from '../database/entities/account.entity';
import { BotWorker } from '../bot/bot.worker';

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    private botWorker: BotWorker,
  ) {}

  async findAll(page = 0, limit = 5): Promise<{ data: Account[]; total: number; page: number; totalPages: number }> {
    const [data, total] = await this.accountRepository.findAndCount({
      skip: page * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<Account> {
    return this.accountRepository.findOne({ where: { id } });
  }

  async sendCode(phone: string) {
    return this.botWorker.sendCode(phone);
  }

  async verifyCode(accountId: number, code: string) {
    return this.botWorker.verifyCode(accountId, code);
  }

  async verify2FA(accountId: number, password: string) {
    return this.botWorker.verify2FA(accountId, password);
  }

  async updateProfile(id: number, firstName?: string, bio?: string) {
    return this.botWorker.updateProfile(id, firstName, bio);
  }

  async disconnect(id: number) {
    return this.botWorker.disconnectAccount(id);
  }

  async deletePrivateChats(id: number): Promise<number> {
    return this.botWorker.deleteAllPrivateChats(id);
  }

  async remove(id: number): Promise<void> {
    await this.disconnect(id);
    await this.accountRepository.delete(id);
  }
}
