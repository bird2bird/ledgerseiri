import { Controller, Patch, Param, UseGuards } from '@nestjs/common';
import { PlatformAdminGuard } from '../platform-auth/platform-admin.guard';
import { PlatformTenantsControlService } from './platform-tenants-control.service';

@Controller('api/platform/tenants')
@UseGuards(PlatformAdminGuard)
export class PlatformTenantsControlController {
  constructor(private readonly service: PlatformTenantsControlService) {}

  @Patch(':id/suspend')
  suspend(@Param('id') id: string) {
    return this.service.suspend(id);
  }

  @Patch(':id/activate')
  activate(@Param('id') id: string) {
    return this.service.activate(id);
  }
}
