import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bot } from '../database/entities/bot.entity';
import { Account } from '../database/entities/account.entity';
import { BotService } from './bot.service';
import { BotController } from './bot.controller';
import { BotWorker } from './bot.worker';

@Module({
  imports: [TypeOrmModule.forFeature([Bot, Account])],
  controllers: [BotController],
  providers: [BotService, BotWorker],
  exports: [BotService, BotWorker],
})
export class BotModule {}
