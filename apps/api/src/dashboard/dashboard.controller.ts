import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Controller()
export class DashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('dashboard')
  async legacyDashboard() {
    return this.summary();
  }

  @Get('dashboard/summary')
  async summary() {
    const company = await this.prisma.company.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    if (!company) {
      return {
        ok: true,
        revenue: 0,
        expense: 0,
        profit: 0,
        cash: 0,
        message: 'no company',
      };
    }

    const [incomeAgg, expenseAgg, balances] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: {
          companyId: company.id,
          direction: 'INCOME',
        },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          companyId: company.id,
          direction: 'EXPENSE',
        },
        _sum: { amount: true },
      }),
      this.prisma.account.findMany({
        where: { companyId: company.id },
        include: {
          transfersOut: { select: { amount: true } },
          transfersIn: { select: { amount: true } },
        },
      }),
    ]);

    const revenue = incomeAgg._sum.amount ?? 0;
    const expense = expenseAgg._sum.amount ?? 0;
    const profit = revenue - expense;

    const cash = balances.reduce((sum, a) => {
      const transferOut = a.transfersOut.reduce((x, t) => x + t.amount, 0);
      const transferIn = a.transfersIn.reduce((x, t) => x + t.amount, 0);
      return sum + a.openingBalance - transferOut + transferIn;
    }, 0);

    return {
      ok: true,
      revenue,
      expense,
      profit,
      cash,
      message: 'dashboard summary loaded',
    };
  }
}
