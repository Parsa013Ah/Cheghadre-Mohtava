import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { LinkDoniService } from './link-doni.service';

@Controller('link-doni')
export class LinkDoniController {
  constructor(private linkDoniService: LinkDoniService) {}

  @Get()
  async findAll() {
    return this.linkDoniService.findAll();
  }

  @Post('extract')
  async extract(
    @Body('accountId', ParseIntPipe) accountId: number,
    @Body('channelLink') channelLink: string,
    @Body('count', ParseIntPipe) count: number,
  ) {
    return this.linkDoniService.extract(accountId, channelLink, count);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.linkDoniService.remove(id);
    return { message: 'Removed successfully' };
  }
}
