import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../database/entities/account.entity';
import { Group } from '../database/entities/group.entity';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { BotWorker } from '../bot/bot.worker';

@Module({
  imports: [TypeOrmModule.forFeature([Account, Group])],
  controllers: [MessageController],
  providers: [MessageService, BotWorker],
  exports: [MessageService],
})
export class MessageModule {}
