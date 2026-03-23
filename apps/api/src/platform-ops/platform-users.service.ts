import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PlatformUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [totalUsers, assignedUsers, unassignedUsers, newUsers30d] =
      await this.prisma.$transaction([
        this.prisma.user.count(),
        this.prisma.user.count({
          where: {
            companyId: {
              not: null,
            },
          },
        }),
        this.prisma.user.count({
          where: {
            companyId: null,
          },
        }),
        this.prisma.user.count({
          where: {
            createdAt: {
              gte: since,
            },
          },
        }),
      ]);

    return {
      totalUsers,
      assignedUsers,
      unassignedUsers,
      newUsers30d,
    };
  }
}
