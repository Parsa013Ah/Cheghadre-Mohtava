import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bot } from '../database/entities/bot.entity';
import { Account } from '../database/entities/account.entity';
import { Group } from '../database/entities/group.entity';
import { AccountGroup } from '../database/entities/account-group.entity';
import { LinkDoniChannel } from '../database/entities/link-doni-channel.entity';
import { Job } from '../database/entities/job.entity';
import { BotService } from './bot.service';
import { BotController } from './bot.controller';
import { BotWorker } from './bot.worker';

@Module({
  imports: [TypeOrmModule.forFeature([Bot, Account, Group, AccountGroup, LinkDoniChannel, Job])],
  controllers: [BotController],
  providers: [BotService, BotWorker],
  exports: [BotService, BotWorker],
})
export class BotModule {}
