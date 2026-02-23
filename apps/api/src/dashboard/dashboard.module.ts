import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { DashboardApiController } from "./dashboard_api.controller";
import { DashboardController } from './dashboard.controller';

@Module({
  controllers: [DashboardController, DashboardApiController],
  providers: [PrismaService],
})
export class DashboardModule {}
