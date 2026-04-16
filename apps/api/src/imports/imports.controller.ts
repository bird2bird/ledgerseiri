import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ImportsService } from './imports.service';
import { DetectMonthConflictsDto } from './dto/detect-month-conflicts.dto';
import { PreviewImportDto } from './dto/preview-import.dto';
import { CommitImportDto } from './dto/commit-import.dto';

@Controller('api/imports')
export class ImportsController {
  constructor(private readonly service: ImportsService) {}

  @Post('detect-month-conflicts')
  detectMonthConflicts(@Body() body: DetectMonthConflictsDto) {
    return this.service.detectMonthConflicts(body);
  }

  @Post('preview')
  preview(@Body() body: PreviewImportDto) {
    return this.service.previewImport(body);
  }

  @Post(':importJobId/commit')
  commit(
    @Param('importJobId') importJobId: string,
    @Body() body: CommitImportDto
  ) {
    return this.service.commitImport(importJobId, body);
  }

  @Get('history')
  history(
    @Query('module') module?: string,
    @Query('companyId') companyId?: string
  ) {
    return this.service.listHistory({ module, companyId });
  }
}
