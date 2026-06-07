import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { AccountGroup } from './account-group.entity';

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  link: string;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  groupId: number;

  @Column({ nullable: true })
  username: string;

  @Column({ nullable: true })
  sourceChannel: string;

  @Column({ default: false })
  isScraped: boolean;

  @OneToMany(() => AccountGroup, (ag) => ag.group, { cascade: true })
  accountGroups: AccountGroup[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
