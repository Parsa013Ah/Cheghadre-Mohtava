import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Bot } from './bot.entity';
import { AccountGroup } from './account-group.entity';

export enum AccountStatus {
  ACTIVE = 'active',
  DISCONNECTED = 'disconnected',
  BANNED = 'banned',
  WAITING_CODE = 'waiting_code',
  WAITING_2FA = 'waiting_2fa',
}

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  phoneCodeHash: string;

  @Column({ type: 'text', nullable: true })
  sessionString: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  username: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ nullable: true })
  profilePhoto: string;

  @Column({ nullable: true })
  userId: number;

  @Column({
    type: 'simple-enum',
    enum: AccountStatus,
    default: AccountStatus.DISCONNECTED,
  })
  status: AccountStatus;

  @Column({ nullable: true })
  botId: number;

  @ManyToOne(() => Bot, (bot) => bot.accounts, { nullable: true })
  @JoinColumn({ name: 'botId' })
  bot: Bot;

  @OneToMany(() => AccountGroup, (ag) => ag.account, { cascade: true })
  accountGroups: AccountGroup[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
