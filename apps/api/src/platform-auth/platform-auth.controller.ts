import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { PlatformAuthService } from './platform-auth.service';
import { PlatformAdminGuard } from './platform-admin.guard';

@Controller('platform-auth')
export class PlatformAuthController {
  constructor(private readonly platformAuthService: PlatformAuthService) {}

  @Post('login')
  login(@Body() body: any) {
    return this.platformAuthService.login(body?.email, body?.password);
  }

  @Post('refresh')
  refresh(@Body() body: any) {
    return this.platformAuthService.refresh(body?.refreshToken);
  }

  @Post('logout')
  logout(@Body() body: any) {
    return this.platformAuthService.logout(body?.refreshToken);
  }

  @Get('me')
  me() {
    return this.platformAuthService.me();
  }

  @UseGuards(PlatformAdminGuard)
  @Get('protected')
  protected(@Req() req: any) {
    return {
      ok: true,
      admin: req.platformAdmin ?? null,
    };
  }
}
