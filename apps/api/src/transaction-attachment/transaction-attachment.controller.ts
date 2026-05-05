import { Body, Controller, Get, Param, Post, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
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

  @Get('api/transactions/:id/attachments/:attachmentId/download')
  async download(
    @Req() req: any,
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @Res() res: any,
  ) {
    const result = await this.service.downloadForTransaction(
      id,
      attachmentId,
      req.user?.companyId,
    );

    const encodedName = encodeURIComponent(result.downloadName).replace(/['()]/g, escape);
    res.setHeader('Content-Type', result.mimeType || 'application/octet-stream');
    res.setHeader('Content-Length', String(result.sizeBytes || 0));
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.downloadName.replace(/["\\]/g, '_')}"; filename*=UTF-8''${encodedName}`,
    );
    res.setHeader('Cache-Control', 'private, no-store');

    return res.sendFile(result.absolutePath);
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
