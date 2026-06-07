import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LinkDoniChannel } from '../database/entities/link-doni-channel.entity';
import { Group } from '../database/entities/group.entity';
import { Account } from '../database/entities/account.entity';
import { LinkDoniService } from './link-doni.service';
import { LinkDoniController } from './link-doni.controller';
import { BotWorker } from '../bot/bot.worker';

@Module({
  imports: [TypeOrmModule.forFeature([LinkDoniChannel, Group, Account])],
  controllers: [LinkDoniController],
  providers: [LinkDoniService, BotWorker],
  exports: [LinkDoniService],
})
export class LinkDoniModule {}
