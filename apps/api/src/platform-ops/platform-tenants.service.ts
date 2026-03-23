import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PlatformTenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [
      totalTenants,
      tenantsWithUsers,
      tenantsWithStores,
      subscribedTenants,
      createdLast30Days,
    ] = await this.prisma.$transaction([
      this.prisma.company.count(),
      this.prisma.company.count({
        where: {
          users: {
            some: {},
          },
        },
      }),
      this.prisma.company.count({
        where: {
          stores: {
            some: {},
          },
        },
      }),
      this.prisma.workspaceSubscription.count(),
      this.prisma.company.count({
        where: {
          createdAt: {
            gte: since,
          },
        },
      }),
    ]);

    return {
      totalTenants,
      tenantsWithUsers,
      tenantsWithStores,
      subscribedTenants,
      createdLast30Days,
    };
  }
}
