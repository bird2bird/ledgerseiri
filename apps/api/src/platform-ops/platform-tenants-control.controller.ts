import { Body, Controller, Patch, Param, Req, UseGuards } from '@nestjs/common';
import { PlatformAdminGuard } from '../platform-auth/platform-admin.guard';
import { PlatformTenantsControlService } from './platform-tenants-control.service';

@Controller('api/platform/tenants')
@UseGuards(PlatformAdminGuard)
export class PlatformTenantsControlController {
  constructor(private readonly service: PlatformTenantsControlService) {}

  @Patch(':id/suspend')
  suspend(
    @Param('id') id: string,
    @Body() body: { note?: string },
    @Req() req: any,
  ) {
    return this.service.suspend(id, {
      note: body?.note || '',
      adminId: req?.platformAdmin?.id || null,
      adminEmail: req?.platformAdmin?.email || null,
    });
  }

  @Patch(':id/activate')
  activate(
    @Param('id') id: string,
    @Body() body: { note?: string },
    @Req() req: any,
  ) {
    return this.service.activate(id, {
      note: body?.note || '',
      adminId: req?.platformAdmin?.id || null,
      adminEmail: req?.platformAdmin?.email || null,
    });
  }
}
