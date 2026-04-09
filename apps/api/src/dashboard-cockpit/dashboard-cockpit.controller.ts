import { Controller, Get, Query } from '@nestjs/common';
import { DashboardCockpitService } from './dashboard-cockpit.service';
import type {
  DashboardCockpitBusinessView,
  DashboardCockpitRange,
} from './dashboard-cockpit.service';

@Controller('dashboard-cockpit')
export class DashboardCockpitController {
  constructor(private readonly dashboardCockpitService: DashboardCockpitService) {}

  @Get()
  getCockpit(
    @Query('businessView') businessView?: DashboardCockpitBusinessView,
    @Query('range') range?: DashboardCockpitRange,
  ) {
    return this.dashboardCockpitService.getCockpit({
      businessView: (businessView ?? 'amazon') as DashboardCockpitBusinessView,
      range: (range ?? '30d') as DashboardCockpitRange,
    });
  }
}
