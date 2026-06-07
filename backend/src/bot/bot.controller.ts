import { Controller, Post, Body, Get, Delete, Param } from '@nestjs/common';
import { BotService } from './bot.service';

@Controller('bot')
export class BotController {
  constructor(private botService: BotService) {}

  @Post('start')
  async startBot(@Body('token') token: string) {
    await this.botService.startBot(token);
    return { message: 'Bot started successfully' };
  }

  @Post('stop')
  async stopBot() {
    await this.botService.stopBot();
    return { message: 'Bot stopped successfully' };
  }
}
