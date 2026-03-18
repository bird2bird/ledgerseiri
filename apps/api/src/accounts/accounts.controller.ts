import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { AccountsService } from './accounts.service';

@Controller('api')
export class AccountsController {
  constructor(private readonly service: AccountsService) {}

  @Get('accounts')
  list() {
    return this.service.list();
  }


  @Get('/account-balances')
  listBalances() {
    return this.service.listBalances();
  }

  @Post('accounts')
  create(@Body() body: unknown) {
    return this.service.create((body || {}) as any);
  }

  @Patch('accounts/:id')
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.service.update(id, (body || {}) as any);
  }
}
