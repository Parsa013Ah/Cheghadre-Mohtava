import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Account } from './account.entity';

export enum BotStatus {
  STOPPED = 'stopped',
  RUNNING = 'running',
  ERROR = 'error',
}

@Entity('bots')
export class Bot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  token: string;

  @Column({ nullable: true })
  username: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({
    type: 'simple-enum',
    enum: BotStatus,
    default: BotStatus.STOPPED,
  })
  status: BotStatus;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Account, (account) => account.bot)
  accounts: Account[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
