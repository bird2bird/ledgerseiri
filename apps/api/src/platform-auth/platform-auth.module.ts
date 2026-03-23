import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { PlatformAuthController } from './platform-auth.controller';
import { PlatformAuthService } from './platform-auth.service';
import { PlatformAdminGuard } from './platform-admin.guard';
import { PlatformAuthApiController } from './platform-auth-api.controller';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.PLATFORM_JWT_SECRET || 'platform_dev_secret_change_me',
      signOptions: { expiresIn: '30m' },
    }),
  ],
  controllers: [PlatformAuthController, PlatformAuthApiController],
  providers: [PlatformAuthService, PlatformAdminGuard, PrismaService],
  exports: [PlatformAuthService, PlatformAdminGuard],
})
export class PlatformAuthModule {}
