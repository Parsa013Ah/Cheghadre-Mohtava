import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Account } from './account.entity';
import { Group } from './group.entity';

export enum JoinStatus {
  PENDING = 'pending',
  JOINED = 'joined',
  LEFT = 'left',
  FAILED = 'failed',
}

@Entity('account_groups')
@Unique(['accountId', 'groupId'])
export class AccountGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  accountId: number;

  @ManyToOne(() => Account, (account) => account.accountGroups, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @Column()
  groupId: number;

  @ManyToOne(() => Group, (group) => group.accountGroups, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'groupId' })
  group: Group;

  @Column({
    type: 'simple-enum',
    enum: JoinStatus,
    default: JoinStatus.PENDING,
  })
  status: JoinStatus;

  @CreateDateColumn()
  joinedAt: Date;
}
