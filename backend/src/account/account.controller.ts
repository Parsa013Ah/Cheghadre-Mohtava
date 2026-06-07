import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { AccountService } from './account.service';

@Controller('accounts')
export class AccountController {
  constructor(private accountService: AccountService) {}

  @Get()
  async findAll(@Query('page', ParseIntPipe) page = 0, @Query('limit', ParseIntPipe) limit = 5) {
    return this.accountService.findAll(page, limit);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.accountService.findOne(id);
  }

  @Post('send-code')
  async sendCode(@Body('phone') phone: string) {
    return this.accountService.sendCode(phone);
  }

  @Post(':id/verify-code')
  async verifyCode(
    @Param('id', ParseIntPipe) id: number,
    @Body('code') code: string,
  ) {
    return this.accountService.verifyCode(id, code);
  }

  @Post(':id/verify-2fa')
  async verify2FA(
    @Param('id', ParseIntPipe) id: number,
    @Body('password') password: string,
  ) {
    return this.accountService.verify2FA(id, password);
  }

  @Put(':id/profile')
  async updateProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body('firstName') firstName?: string,
    @Body('bio') bio?: string,
  ) {
    return this.accountService.updateProfile(id, firstName, bio);
  }

  @Post(':id/disconnect')
  async disconnect(@Param('id', ParseIntPipe) id: number) {
    await this.accountService.disconnect(id);
    return { message: 'Disconnected successfully' };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.accountService.remove(id);
    return { message: 'Account removed successfully' };
  }
}
