import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../database/entities/account.entity';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { BotWorker } from '../bot/bot.worker';

@Module({
  imports: [TypeOrmModule.forFeature([Account])],
  controllers: [AccountController],
  providers: [AccountService, BotWorker],
  exports: [AccountService],
})
export class AccountModule {}
