import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PlatformTenantsListService {
  constructor(private readonly prisma: PrismaService) {}

  async getList() {
    const rows = await this.prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        subscription: {
          select: {
            planCode: true,
            status: true,
            currentPeriodEnd: true,
          },
        },
        _count: {
          select: {
            users: true,
            stores: true,
          },
        },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      companyStatus: row.status,
      createdAt: row.createdAt,
      userCount: row._count.users,
      storeCount: row._count.stores,
      subscriptionPlan: row.subscription?.planCode ?? null,
      subscriptionStatus: row.subscription?.status ?? null,
      currentPeriodEnd: row.subscription?.currentPeriodEnd ?? null,
    }));
  }
}
