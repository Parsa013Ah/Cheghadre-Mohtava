import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotModule } from './bot/bot.module';
import { AccountModule } from './account/account.module';
import { GroupModule } from './group/group.module';
import { MessageModule } from './message/message.module';
import { LinkDoniModule } from './link-doni/link-doni.module';
import { JobModule } from './job/job.module';
import { Account } from './database/entities/account.entity';
import { Bot } from './database/entities/bot.entity';
import { Group } from './database/entities/group.entity';
import { AccountGroup } from './database/entities/account-group.entity';
import { LinkDoniChannel } from './database/entities/link-doni-channel.entity';
import { Job } from './database/entities/job.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'better-sqlite3',
        database: config.get('DATABASE_PATH') || './data/database.sqlite',
        entities: [
          Account,
          Bot,
          Group,
          AccountGroup,
          LinkDoniChannel,
          Job,
        ],
        synchronize: true,
        autoLoadEntities: true,
      }),
    }),
    BotModule,
    AccountModule,
    GroupModule,
    MessageModule,
    LinkDoniModule,
    JobModule,
  ],
})
export class AppModule {}
