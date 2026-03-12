import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { DashboardApiController } from "./dashboard_api.controller";
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  controllers: [DashboardController, DashboardApiController],
  providers: [PrismaService, DashboardService],
})
export class DashboardModule {}
