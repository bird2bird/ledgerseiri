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
    PlatformAdminGuard,
    PrismaService,
  ],
})
export class PlatformOpsModule {}
