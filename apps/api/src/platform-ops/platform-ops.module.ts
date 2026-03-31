import { PlatformUsersControlService } from './platform-users-control.service';
import { PlatformTenantsControlService } from './platform-tenants-control.service';
import { PlatformUsersControlController } from './platform-users-control.controller';
import { PlatformTenantsControlController } from './platform-tenants-control.controller';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { PlatformAdminGuard } from '../platform-auth/platform-admin.guard';

import { PlatformTenantsController } from './platform-tenants.controller';
import { PlatformUsersController } from './platform-users.controller';
import { PlatformReconciliationController } from './platform-reconciliation.controller';
import { PlatformRevenueController } from './platform-revenue.controller';

import { PlatformTenantsListController } from './platform-tenants-list.controller';
import { PlatformUsersListController } from './platform-users-list.controller';
import { PlatformReconciliationListController } from './platform-reconciliation-list.controller';
import { PlatformReconciliationOverrideController } from './platform-reconciliation-override.controller';

import { PlatformTenantsService } from './platform-tenants.service';
import { PlatformUsersService } from './platform-users.service';
import { PlatformReconciliationService } from './platform-reconciliation.service';
import { PlatformRevenueService } from './platform-revenue.service';

import { PlatformTenantsListService } from './platform-tenants-list.service';
import { PlatformUsersListService } from './platform-users-list.service';
import { PlatformReconciliationListService } from './platform-reconciliation-list.service';
import { PlatformReconciliationOverrideService } from './platform-reconciliation-override.service';
import { PlatformReconciliationOpsService } from './platform-reconciliation-ops.service';
import { PlatformReconciliationOpsController } from './platform-reconciliation-ops.controller';
import { PlatformReconciliationBatchService } from './platform-reconciliation-batch.service';
import { PlatformExecutiveSummaryService } from './platform-executive-summary.service';
import { PlatformUserInsightsService } from './platform-user-insights.service';
import { PlatformReconciliationBatchController } from './platform-reconciliation-batch.controller';
import { PlatformExecutiveSummaryController } from './platform-executive-summary.controller';
import { PlatformUserInsightsController } from './platform-user-insights.controller';
import { PlatformReconciliationOperationController } from './platform-reconciliation-operation.controller';
import { PlatformReconciliationOperationService } from './platform-reconciliation-operation.service';
import { PlatformOperationController } from './platform-operation.controller';
import { PlatformOperationService } from './platform-operation.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.PLATFORM_JWT_SECRET || 'platform_dev_secret_change_me',
      signOptions: { expiresIn: '30m' },
    }),
  ],
  controllers: [
    PlatformTenantsControlController,
    PlatformUsersControlController,

    PlatformTenantsController,
    PlatformUsersController,
    PlatformReconciliationController,
    PlatformRevenueController,
    PlatformTenantsListController,
    PlatformUsersListController,
    PlatformReconciliationListController,
    PlatformReconciliationOverrideController,
    PlatformReconciliationOpsController,
    PlatformReconciliationBatchController,
    PlatformExecutiveSummaryController,
    PlatformUserInsightsController,
    PlatformOperationController,
    PlatformReconciliationOperationController,
  ],
  providers: [
    PlatformTenantsControlService,
    PlatformUsersControlService,

    PlatformTenantsService,
    PlatformUsersService,
    PlatformReconciliationService,
    PlatformRevenueService,
    PlatformTenantsListService,
    PlatformUsersListService,
    PlatformReconciliationListService,
    PlatformReconciliationOverrideService,
    PlatformReconciliationOpsService,
    PlatformReconciliationBatchService,
    PlatformExecutiveSummaryService,
    PlatformUserInsightsService,
    PlatformOperationService,
    PlatformReconciliationOperationService,
    PlatformAdminGuard,
    PrismaService,
  ],
})
export class PlatformOpsModule {}
