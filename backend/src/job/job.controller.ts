import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { JobService } from './job.service';

@Controller('jobs')
export class JobController {
  constructor(private jobService: JobService) {}

  @Get()
  async findAll(@Query('page', ParseIntPipe) page = 0, @Query('limit', ParseIntPipe) limit = 10) {
    return this.jobService.findAll(page, limit);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.jobService.findOne(id);
  }
}
