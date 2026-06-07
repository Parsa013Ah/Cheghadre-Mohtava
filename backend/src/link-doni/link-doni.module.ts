import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LinkDoniChannel } from '../database/entities/link-doni-channel.entity';
import { Group } from '../database/entities/group.entity';
import { Account } from '../database/entities/account.entity';
import { LinkDoniService } from './link-doni.service';
import { LinkDoniController } from './link-doni.controller';
import { BotModule } from '../bot/bot.module';

@Module({
  imports: [TypeOrmModule.forFeature([LinkDoniChannel, Group, Account]), BotModule],
  controllers: [LinkDoniController],
  providers: [LinkDoniService],
  exports: [LinkDoniService],
})
export class LinkDoniModule {}
