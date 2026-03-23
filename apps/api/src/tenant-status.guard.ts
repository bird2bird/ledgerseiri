import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class TenantStatusGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const user = req.user;

    if (!user?.id) {
      return true;
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { companyId: true },
    });

    if (!dbUser?.companyId) return true;

    const company = await prisma.company.findUnique({
      where: { id: dbUser.companyId },
      select: { status: true },
    });

    if (company?.status === 'SUSPENDED') {
      throw new ForbiddenException('TENANT_SUSPENDED');
    }

    return true;
  }
}
