import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from '../database/entities/group.entity';
import { AccountGroup, JoinStatus } from '../database/entities/account-group.entity';

@Injectable()
export class GroupService {
  private readonly logger = new Logger(GroupService.name);

  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(AccountGroup)
    private accountGroupRepository: Repository<AccountGroup>,
  ) {}

  async findAll(page = 0, limit = 10): Promise<{ data: any[]; total: number; page: number; totalPages: number }> {
    const [groups, total] = await this.groupRepository.findAndCount({
      skip: page * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const data = [];
    for (const group of groups) {
      const joinedCount = await this.accountGroupRepository.count({
        where: { groupId: group.id, status: JoinStatus.JOINED },
      });
      data.push({ ...group, joinedAccountsCount: joinedCount });
    }

    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number): Promise<any> {
    const group = await this.groupRepository.findOne({ where: { id } });
    if (!group) return null;
    const joinedCount = await this.accountGroupRepository.count({
      where: { groupId: group.id, status: JoinStatus.JOINED },
    });
    return { ...group, joinedAccountsCount: joinedCount };
  }

  async remove(id: number): Promise<void> {
    await this.accountGroupRepository.delete({ groupId: id });
    await this.groupRepository.delete(id);
  }

  async getGroupAccounts(groupId: number): Promise<any[]> {
    const accountGroups = await this.accountGroupRepository.find({
      where: { groupId },
      relations: ['account'],
    });
    return accountGroups.map((ag) => ({
      account: ag.account,
      status: ag.status,
      joinedAt: ag.joinedAt,
    }));
  }

  async getStats(): Promise<any> {
    const totalGroups = await this.groupRepository.count();
    const totalJoined = await this.accountGroupRepository.count({
      where: { status: JoinStatus.JOINED },
    });
    return { totalGroups, totalJoined };
  }
}
