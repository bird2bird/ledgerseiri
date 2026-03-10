import { Body, Controller, Get, Post } from '@nestjs/common';
import { AccountService } from './account.service';

@Controller()
export class AccountController {
  constructor(private readonly service: AccountService) {}

  @Get('api/accounts')
  list() {
    return this.service.list();
  }

  @Get('api/accounts/meta')
  meta() {
    return this.service.getMeta();
  }

  @Post('api/accounts')
  create(@Body() body: unknown) {
    return this.service.create((body || {}) as any);
  }

  @Get('api/account-balances')
  balances() {
    return this.service.balances();
  }
}
