import { Body, Controller, Patch, Param, Req, UseGuards } from '@nestjs/common';
import { PlatformAdminGuard } from '../platform-auth/platform-admin.guard';
import { PlatformUsersControlService } from './platform-users-control.service';

@Controller('api/platform/users')
@UseGuards(PlatformAdminGuard)
export class PlatformUsersControlController {
  constructor(private readonly service: PlatformUsersControlService) {}

  @Patch(':id/unassign')
  unassign(
    @Param('id') id: string,
    @Body() body: { note?: string },
    @Req() req: any,
  ) {
    return this.service.unassign(id, {
      note: body?.note || '',
      adminId: req?.platformAdmin?.id || null,
      adminEmail: req?.platformAdmin?.email || null,
    });
  }

  @Patch(':id/assign')
  assign(
    @Param('id') id: string,
    @Body() body: { companyId: string; note?: string },
    @Req() req: any,
  ) {
    return this.service.assign(id, body.companyId, {
      note: body?.note || '',
      adminId: req?.platformAdmin?.id || null,
      adminEmail: req?.platformAdmin?.email || null,
    });
  }
}
