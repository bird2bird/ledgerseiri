import { Controller, Get, UseGuards } from '@nestjs/common';
import { PlatformAdminGuard } from '../platform-auth/platform-admin.guard';
import { PlatformTenantsService } from './platform-tenants.service';

@Controller('api/platform/tenants')
@UseGuards(PlatformAdminGuard)
export class PlatformTenantsController {
  constructor(private readonly platformTenantsService: PlatformTenantsService) {}

  @Get('summary')
  getSummary() {
    return this.platformTenantsService.getSummary();
  }
}
