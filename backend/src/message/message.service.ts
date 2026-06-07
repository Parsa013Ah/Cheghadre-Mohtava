import { Injectable, Logger } from '@nestjs/common';
import { BotWorker } from '../bot/bot.worker';

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  constructor(private botWorker: BotWorker) {}

  async send(accountId: number, groupId: number, message: string): Promise<void> {
    return this.botWorker.sendMessageToGroup(accountId, groupId, message);
  }

  async sendToMultipleGroups(
    accountId: number,
    groupIds: number[],
    message: string,
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const groupId of groupIds) {
      try {
        await this.botWorker.sendMessageToGroup(accountId, groupId, message);
        success++;
      } catch (error) {
        this.logger.error(`Failed to send to group ${groupId}: ${error.message}`);
        failed++;
      }
    }

    return { success, failed };
  }

  async sendAllAccountsToGroup(
    groupId: number,
    message: string,
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;
    const accounts = [];
    return { success, failed };
  }
}
