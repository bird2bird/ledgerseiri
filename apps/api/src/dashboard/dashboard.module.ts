import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AccountsModule } from '../accounts/accounts.module';
import { DashboardApiController } from "./dashboard_api.controller";
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [AccountsModule],
  controllers: [DashboardController, DashboardApiController],
  providers: [PrismaService, DashboardService],
})
export class DashboardModule {}
