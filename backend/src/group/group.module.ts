import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from '../database/entities/group.entity';
import { AccountGroup } from '../database/entities/account-group.entity';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';
import { BotModule } from '../bot/bot.module';

@Module({
  imports: [TypeOrmModule.forFeature([Group, AccountGroup]), BotModule],
  controllers: [GroupController],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {}
