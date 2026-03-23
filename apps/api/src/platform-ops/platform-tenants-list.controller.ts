import { Controller, Get, UseGuards } from '@nestjs/common';
import { PlatformAdminGuard } from '../platform-auth/platform-admin.guard';
import { PlatformTenantsListService } from './platform-tenants-list.service';

@Controller('api/platform/tenants')
@UseGuards(PlatformAdminGuard)
export class PlatformTenantsListController {
  constructor(private readonly service: PlatformTenantsListService) {}

  @Get('list')
  getList() {
    return this.service.getList();
  }
}
