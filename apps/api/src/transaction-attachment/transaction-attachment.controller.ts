import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { TransactionAttachmentService } from './transaction-attachment.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class TransactionAttachmentController {
  constructor(private readonly service: TransactionAttachmentService) {}

  @Get('api/transactions/:id/attachments')
  list(@Req() req: any, @Param('id') id: string) {
    return this.service.listForTransaction(id, req.user?.companyId);
  }
}
