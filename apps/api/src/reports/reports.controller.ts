import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('api/reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('cashflow')
  getCashflow(
    @Query('range') range?: 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom',
  ) {
    return this.service.getCashflowReport(range);
  }
}
