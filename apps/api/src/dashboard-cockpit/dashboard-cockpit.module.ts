import { Module } from '@nestjs/common';
import { DashboardCockpitController } from './dashboard-cockpit.controller';
import { DashboardCockpitService } from './dashboard-cockpit.service';

@Module({
  controllers: [DashboardCockpitController],
  providers: [DashboardCockpitService],
  exports: [DashboardCockpitService],
})
export class DashboardCockpitModule {}
