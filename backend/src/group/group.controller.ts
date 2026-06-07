import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { GroupService } from './group.service';

@Controller('groups')
export class GroupController {
  constructor(private groupService: GroupService) {}

  @Get()
  async findAll(@Query('page', ParseIntPipe) page = 0, @Query('limit', ParseIntPipe) limit = 10) {
    return this.groupService.findAll(page, limit);
  }

  @Get('stats')
  async getStats() {
    return this.groupService.getStats();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.groupService.findOne(id);
  }

  @Get(':id/accounts')
  async getGroupAccounts(@Param('id', ParseIntPipe) id: number) {
    return this.groupService.getGroupAccounts(id);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.groupService.remove(id);
    return { message: 'Group removed successfully' };
  }
}
