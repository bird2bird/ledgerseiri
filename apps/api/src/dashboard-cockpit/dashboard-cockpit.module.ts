import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { DashboardCockpitController } from './dashboard-cockpit.controller';
import { DashboardCockpitService } from './dashboard-cockpit.service';

@Module({
  controllers: [DashboardCockpitController],
  providers: [DashboardCockpitService, PrismaService],
  exports: [DashboardCockpitService],
})
export class DashboardCockpitModule {}
