import { Body, Controller, Get, Post } from '@nestjs/common';
import { JobService } from './job.service';

@Controller()
export class JobController {
  constructor(private readonly service: JobService) {}

  @Get('api/import-jobs')
  listImportJobs() {
    return this.service.listImportJobs();
  }

  @Get('api/import-jobs/meta')
  importMeta() {
    return this.service.getImportMeta();
  }

  @Post('api/import-jobs')
  createImportJob(@Body() body: unknown) {
    return this.service.createImportJob(body);
  }

  @Get('api/export-jobs')
  listExportJobs() {
    return this.service.listExportJobs();
  }

  @Get('api/export-jobs/meta')
  exportMeta() {
    return this.service.getExportMeta();
  }

  @Post('api/export-jobs')
  createExportJob(@Body() body: unknown) {
    return this.service.createExportJob(body);
  }
}
