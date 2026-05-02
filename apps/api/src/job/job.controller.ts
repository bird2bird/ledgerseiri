import { Body, Controller, Get, Param, Post } from '@nestjs/common';
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

  // Step109-Z1-H11-J-IMPORT-JOB-DETAIL-API:
  // Keep specific routes before :id to avoid route ambiguity.
  @Get('api/import-jobs/:id/staging-rows')
  listImportJobStagingRows(@Param('id') id: string) {
    return this.service.listImportJobStagingRows(id);
  }

  @Get('api/import-jobs/:id/transactions')
  listImportJobTransactions(@Param('id') id: string) {
    return this.service.listImportJobTransactions(id);
  }

  @Get('api/import-jobs/:id')
  getImportJobDetail(@Param('id') id: string) {
    return this.service.getImportJobDetail(id);
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
