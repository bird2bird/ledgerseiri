import { NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class TenantStatusMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const path = req.path || '';

    // public / platform routes bypass
    if (
      path === '/health' ||
      path.startsWith('/platform-auth') ||
      path.startsWith('/api/platform') ||
      path.startsWith('/api/platform-auth') ||
      path.startsWith('/api/auth') ||
      path.startsWith('/auth/')
    ) {
      return next();
    }

    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.slice(7);

    try {
      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET ||
          process.env.AUTH_JWT_SECRET ||
          'dev_jwt_secret_change_me',
      ) as { sub?: string };

      const userId = payload?.sub;
      if (!userId) {
        return next();
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true },
      });

      if (!user?.companyId) {
        return next();
      }

      const company = await prisma.company.findUnique({
        where: { id: user.companyId },
        select: { status: true },
      });

      if (company?.status === 'SUSPENDED') {
        return res.status(403).json({
          statusCode: 403,
          message: 'TENANT_SUSPENDED',
          error: 'Forbidden',
        });
      }

      return next();
    } catch {
      return next();
    }
  }
}
