import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job, JobStatus } from '../database/entities/job.entity';

@Injectable()
export class JobService {
  private readonly logger = new Logger(JobService.name);

  constructor(
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
  ) {}

  async findAll(page = 0, limit = 10): Promise<{ data: Job[]; total: number; page: number; totalPages: number }> {
    const [data, total] = await this.jobRepository.findAndCount({
      skip: page * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number): Promise<Job> {
    return this.jobRepository.findOne({ where: { id } });
  }
}
