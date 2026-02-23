import { Module } from '@nestjs/common';
import { SecurityModule } from './security/security.module';
import { AuthModule } from './auth/auth.module';
import { CompanyModule } from './company/company.module';
import { TransactionModule } from './transaction/transaction.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { StoreModule } from './store/store.module';
import { HealthController } from './health.controller';

@Module({
  imports: [AuthModule, CompanyModule, StoreModule, TransactionModule, DashboardModule,
    SecurityModule,
],
  controllers: [HealthController],
})
export class AppModule {}
