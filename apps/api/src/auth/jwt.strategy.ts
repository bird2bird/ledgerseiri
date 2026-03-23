import { ForbiddenException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: any) => req?.cookies?.access_token || null,
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev_secret_change_me',
    });
  }

  async validate(payload: any) {
    const userId = payload?.sub;
    if (!userId) {
      return null;
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, companyId: true, email: true },
    });

    if (!dbUser) {
      return null;
    }

    if (dbUser.companyId) {
      const company = await prisma.company.findUnique({
        where: { id: dbUser.companyId },
        select: { status: true },
      });

      if (company?.status === 'SUSPENDED') {
        throw new ForbiddenException('TENANT_SUSPENDED');
      }
    }

    return {
      id: dbUser.id,
      userId: dbUser.id,
      companyId: dbUser.companyId,
      email: dbUser.email,
    };
  }
}
