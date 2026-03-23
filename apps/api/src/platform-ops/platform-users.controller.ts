import { Controller, Get, UseGuards } from '@nestjs/common';
import { PlatformAdminGuard } from '../platform-auth/platform-admin.guard';
import { PlatformUsersService } from './platform-users.service';

@Controller('api/platform/users')
@UseGuards(PlatformAdminGuard)
export class PlatformUsersController {
  constructor(private readonly platformUsersService: PlatformUsersService) {}

  @Get('summary')
  getSummary() {
    return this.platformUsersService.getSummary();
  }
}
