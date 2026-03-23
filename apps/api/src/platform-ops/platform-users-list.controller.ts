import { Controller, Get, UseGuards } from '@nestjs/common';
import { PlatformAdminGuard } from '../platform-auth/platform-admin.guard';
import { PlatformUsersListService } from './platform-users-list.service';

@Controller('api/platform/users')
@UseGuards(PlatformAdminGuard)
export class PlatformUsersListController {
  constructor(private readonly service: PlatformUsersListService) {}

  @Get('list')
  getList() {
    return this.service.getList();
  }
}
