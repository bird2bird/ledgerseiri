import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('api')
export class AccountsController {
  constructor(private readonly service: AccountsService) {}

  @Get('accounts')
  list(@Req() req: any) {
    return this.service.list(req.user?.companyId);
  }


  @Get('/account-balances')
  listBalances(@Req() req: any) {
    return this.service.listBalances(req.user?.companyId);
  }

  @Post('accounts')
  create(@Req() req: any, @Body() body: unknown) {
    return this.service.create({
      ...((body || {}) as any),
      companyId: req.user?.companyId,
    });
  }

  @Patch('accounts/:id')
  update(@Req() req: any, @Param('id') id: string, @Body() body: unknown) {
    return this.service.update(id, {
      ...((body || {}) as any),
      companyId: req.user?.companyId,
    });
  }
}
