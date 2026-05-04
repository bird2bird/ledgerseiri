import { Body, Controller, Get, Param, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { TRANSACTION_ATTACHMENT_MAX_FILE_SIZE_BYTES } from './transaction-attachment.constants';
import { TransactionAttachmentService } from './transaction-attachment.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class TransactionAttachmentController {
  constructor(private readonly service: TransactionAttachmentService) {}

  @Get('api/transactions/:id/attachments')
  list(@Req() req: any, @Param('id') id: string) {
    return this.service.listForTransaction(id, req.user?.companyId);
  }

  @Post('api/transactions/:id/attachments')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: TRANSACTION_ATTACHMENT_MAX_FILE_SIZE_BYTES,
      },
    }),
  )
  create(
    @Req() req: any,
    @Param('id') id: string,
    @Body('documentType') documentType: string,
    @UploadedFile() file?: any,
  ) {
    return this.service.createForTransaction(
      id,
      req.user?.companyId,
      documentType,
      file,
      req.user?.sub || req.user?.id || null,
    );
  }
}
