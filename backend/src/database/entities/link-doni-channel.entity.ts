import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('link_doni_channels')
export class LinkDoniChannel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  link: string;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  channelId: number;

  @Column({ default: 0 })
  totalExtracted: number;

  @Column({ nullable: true })
  lastExtractedMessageId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
