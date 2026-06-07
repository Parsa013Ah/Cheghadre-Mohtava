import {
  Controller,
  Post,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { MessageService } from './message.service';

@Controller('messages')
export class MessageController {
  constructor(private messageService: MessageService) {}

  @Post('send')
  async send(
    @Body('accountId', ParseIntPipe) accountId: number,
    @Body('groupId', ParseIntPipe) groupId: number,
    @Body('message') message: string,
  ) {
    await this.messageService.send(accountId, groupId, message);
    return { message: 'Message sent successfully' };
  }

  @Post('send-multiple')
  async sendMultiple(
    @Body('accountId', ParseIntPipe) accountId: number,
    @Body('groupIds') groupIds: number[],
    @Body('message') message: string,
  ) {
    return this.messageService.sendToMultipleGroups(accountId, groupIds, message);
  }
}
