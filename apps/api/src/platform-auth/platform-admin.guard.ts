import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers?.authorization || '';
    const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : '';

    if (!token) {
      throw new UnauthorizedException('PLATFORM_ACCESS_TOKEN_REQUIRED');
    }

    try {
      const payload = this.jwt.verify(token, {
        secret: process.env.PLATFORM_JWT_SECRET || 'platform_dev_secret_change_me',
      });

      if (!payload?.sub || payload?.typ !== 'platform_access') {
        throw new Error('bad payload');
      }

      req.platformAdmin = payload;
      return true;
    } catch {
      throw new UnauthorizedException('PLATFORM_ACCESS_INVALID');
    }
  }
}
