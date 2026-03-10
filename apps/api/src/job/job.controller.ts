import { Body, Controller, Get, Post } from '@nestjs/common';
import { JobService } from './job.service';

@Controller()
export class JobController {
  constructor(private readonly service: JobService) {}

  @Get('api/import-jobs')
  listImportJobs() {
    return {
      ...this.service.list(),
      domain: 'import-jobs',
    };
  }

  @Get('api/import-jobs/meta')
  importMeta() {
    return {
      ...this.service.getMeta(),
      domain: 'import-jobs',
    };
  }

  @Post('api/import-jobs')
  createImportJob(@Body() body: unknown) {
    return {
      ...this.service.create(body),
      domain: 'import-jobs',
    };
  }

  @Get('api/export-jobs')
  listExportJobs() {
    return {
      ok: true,
      domain: 'export-jobs',
      action: 'list',
      items: [],
      message: 'export-jobs list skeleton ready',
    };
  }

  @Get('api/export-jobs/meta')
  exportMeta() {
    return {
      ok: true,
      domain: 'export-jobs',
      status: 'skeleton',
      message: 'export-jobs service is ready for Step 31/32 implementation',
    };
  }

  @Post('api/export-jobs')
  createExportJob(@Body() body: unknown) {
    return {
      ok: true,
      domain: 'export-jobs',
      action: 'create',
      payload: body,
      mode: 'stub',
      message: 'export-jobs create stub',
    };
  }
}
