import { Body, Controller, Patch, Param, UseGuards } from '@nestjs/common';
import { PlatformAdminGuard } from '../platform-auth/platform-admin.guard';
import { PlatformUsersControlService } from './platform-users-control.service';

@Controller('api/platform/users')
@UseGuards(PlatformAdminGuard)
export class PlatformUsersControlController {
  constructor(private readonly service: PlatformUsersControlService) {}

  @Patch(':id/unassign')
  unassign(@Param('id') id: string) {
    return this.service.unassign(id);
  }

  @Patch(':id/assign')
  assign(@Param('id') id: string, @Body() body: { companyId: string }) {
    return this.service.assign(id, body.companyId);
  }
}
