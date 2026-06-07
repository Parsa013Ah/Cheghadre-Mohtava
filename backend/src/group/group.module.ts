import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from '../database/entities/group.entity';
import { Account } from '../database/entities/account.entity';
import { AccountGroup } from '../database/entities/account-group.entity';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';
import { BotWorker } from '../bot/bot.worker';

@Module({
  imports: [TypeOrmModule.forFeature([Group, Account, AccountGroup])],
  controllers: [GroupController],
  providers: [GroupService, BotWorker],
  exports: [GroupService],
})
export class GroupModule {}
