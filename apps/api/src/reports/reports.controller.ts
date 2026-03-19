import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('api/reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('income')
  getIncome(
    @Query('range') range?: 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom',
  ) {
    return this.service.getIncomeReport(range);
  }

  @Get('expense')
  getExpense(
    @Query('range') range?: 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom',
  ) {
    return this.service.getExpenseReport(range);
  }

  @Get('profit')
  getProfit(
    @Query('range') range?: 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom',
  ) {
    return this.service.getProfitReport(range);
  }

  @Get('cashflow')
  getCashflow(
    @Query('range') range?: 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom',
  ) {
    return this.service.getCashflowReport(range);
  }
  @Get('detail')
  getDetail(
    @Query('kind') kind?: 'cashflow' | 'income' | 'expense' | 'profit',
    @Query('metric') metric?: string,
    @Query('range') range?: 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom',
    @Query('storeId') storeId?: string,
  ) {
    return this.service.getDetailReport(kind, metric, range, storeId);
  }

}
