import { AuthApiController } from './auth_api.controller';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { PasswordResetService } from './password-reset.service';
import { RefreshService } from './refresh.service';
import { UserLoginAuditService } from './user-login-audit.service';
import { RefreshController } from './refresh.controller';
import { RefreshApiController } from './refresh_api.controller';
import { PasswordResetController } from './password-reset.controller';
import { AuthController } from './auth.controller';
import { PrismaService } from '../prisma.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev_secret_change_me',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [AuthService, PrismaService, JwtStrategy, AuthService, RefreshService, UserLoginAuditService],
  controllers: [AuthApiController, RefreshController, RefreshApiController],
  exports: [AuthService, UserLoginAuditService],
})
export class AuthModule {}
