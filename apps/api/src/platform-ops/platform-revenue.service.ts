import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PlatformRevenueService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [
      totalSubscriptions,
      activeSubscriptions,
      newSubscriptions30d,
    ] = await this.prisma.$transaction([
      this.prisma.workspaceSubscription.count(),
      this.prisma.workspaceSubscription.count({
        where: { status: 'ACTIVE' },
      }),
      this.prisma.workspaceSubscription.count({
        where: {
          createdAt: { gte: since },
        },
      }),
    ]);

    // 暂时用固定价格（后面Step63再做Plan表）
    const PRICE = 1980;

    const mrr = activeSubscriptions * PRICE;

    const arpu =
      activeSubscriptions > 0
        ? Math.round(mrr / activeSubscriptions)
        : 0;

    return {
      totalSubscriptions,
      activeSubscriptions,
      newSubscriptions30d,
      mrr,
      arpu,
    };
  }
}
