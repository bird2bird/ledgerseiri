import { APP_GUARD } from '@nestjs/core';
import { TenantStatusMiddleware } from './tenant-status.middleware';
import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { SecurityModule } from './security/security.module';
import { AuthModule } from './auth/auth.module';
import { CompanyModule } from './company/company.module';
import { TransactionModule } from './transaction/transaction.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { StoreModule } from './store/store.module';
import { HealthController } from './health.controller';
import { JobModule } from './job/job.module';
import { ImportsModule } from './imports/imports.module';
import { PaymentModule } from './payment/payment.module';
import { InvoiceModule } from './invoice/invoice.module';
import { InventoryModule } from './inventory/inventory.module';
import { CatalogModule } from './catalog/catalog.module';
import { TransactionCategoryModule } from './transaction-category/transaction-category.module';
import { FundTransferModule } from './fund-transfer/fund-transfer.module';
import { AccountsModule } from './accounts/accounts.module';
import { ReportsModule } from './reports/reports.module';
import { AccountModule } from './account/account.module';
import { BillingModule } from './billing/billing.module';
import { ReconciliationDecisionModule } from "./reconciliation-decision/reconciliation-decision.module";
import { PlatformAuthModule } from './platform-auth/platform-auth.module';
import { PlatformOpsModule } from './platform-ops/platform-ops.module';
import { DashboardCockpitModule } from './dashboard-cockpit/dashboard-cockpit.module';


@Module({
      imports: [
    DashboardCockpitModule,
    ReconciliationDecisionModule,
      WorkspaceModule,
      AuthModule,
      PlatformAuthModule,
      PlatformOpsModule,
      CompanyModule,
      StoreModule,
      TransactionModule,
      DashboardModule,
      AccountModule,
      FundTransferModule,
    AccountsModule,
    ReportsModule,
      TransactionCategoryModule,
      CatalogModule,
      InventoryModule,
      InvoiceModule,
      PaymentModule,
      JobModule,
      ImportsModule,
      SecurityModule,
        BillingModule,
      ],
    controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantStatusMiddleware).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
  }
}
