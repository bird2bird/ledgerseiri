import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

type PlanCode = 'free' | 'starter' | 'standard' | 'premium';

const PLAN_PRICE_MAP: Record<PlanCode, number> = {
  free: 0,
  starter: 1980,
  standard: 4980,
  premium: 9980,
};

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing', 'past_due']);

@Injectable()
export class PlatformExecutiveSummaryService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizePlan(planCode?: string | null): PlanCode {
    if (planCode === 'starter' || planCode === 'standard' || planCode === 'premium') {
      return planCode;
    }
    return 'free';
  }

  private startOfMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private getBillingRiskLevel(status?: string | null) {
    const s = (status || 'free').toLowerCase();
    if (s === 'past_due') return 'high';
    if (s === 'canceled') return 'medium';
    if (s === 'trialing') return 'watch';
    if (s === 'active') return 'healthy';
    return 'free';
  }

  private getRecoveryPriority(status?: string | null) {
    const s = (status || 'free').toLowerCase();
    if (s === 'past_due') return 'immediate';
    if (s === 'canceled') return 'follow-up';
    if (s === 'trialing') return 'observe';
    return 'healthy';
  }

  async getSummary() {
    const now = new Date();
    const startOfCurrentMonth = this.startOfMonth(now);

    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        companyId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const companies = await this.prisma.company.findMany({
      select: {
        id: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const subscriptions = await this.prisma.workspaceSubscription.findMany({
      select: {
        id: true,
        companyId: true,
        planCode: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    });

    const latestSubscriptionByCompany = new Map<
      string,
      {
        id: string;
        companyId: string;
        planCode: string | null;
        status: string | null;
        createdAt: Date;
        updatedAt: Date;
      }
    >();

    for (const sub of subscriptions) {
      if (!sub.companyId) continue;
      if (!latestSubscriptionByCompany.has(sub.companyId)) {
        latestSubscriptionByCompany.set(sub.companyId, sub);
      }
    }

    const totalUsers = users.length;
    const totalTenants = companies.length;

    const planRows: Record<
      PlanCode,
      {
        planCode: PlanCode;
        userCount: number;
        tenantCount: number;
        userRatio: number;
        mrrContribution: number;
        arpuEstimate: number;
      }
    > = {
      free: { planCode: 'free', userCount: 0, tenantCount: 0, userRatio: 0, mrrContribution: 0, arpuEstimate: 0 },
      starter: { planCode: 'starter', userCount: 0, tenantCount: 0, userRatio: 0, mrrContribution: 0, arpuEstimate: 0 },
      standard: { planCode: 'standard', userCount: 0, tenantCount: 0, userRatio: 0, mrrContribution: 0, arpuEstimate: 0 },
      premium: { planCode: 'premium', userCount: 0, tenantCount: 0, userRatio: 0, mrrContribution: 0, arpuEstimate: 0 },
    };

    const companyPlanMap = new Map<string, PlanCode>();
    const companyStatusMap = new Map<string, string>();
    const companyUpdatedAtMap = new Map<string, Date | null>();

    const billingOverview = {
      freeTenants: 0,
      activeTenants: 0,
      trialingTenants: 0,
      pastDueTenants: 0,
      canceledTenants: 0,
      billingRiskTenants: 0,
    };

    for (const company of companies) {
      const sub = latestSubscriptionByCompany.get(company.id);
      const status = (sub?.status || '').toLowerCase();

      const normalizedPlan =
        sub && ACTIVE_SUBSCRIPTION_STATUSES.has(status)
          ? this.normalizePlan(sub.planCode)
          : 'free';

      companyPlanMap.set(company.id, normalizedPlan);
      companyStatusMap.set(company.id, status || 'free');
        companyUpdatedAtMap.set(company.id, sub?.updatedAt || null);

      planRows[normalizedPlan].tenantCount += 1;
      planRows[normalizedPlan].mrrContribution += PLAN_PRICE_MAP[normalizedPlan];

      if (!sub) {
        billingOverview.freeTenants += 1;
      } else if (status === 'active') {
        billingOverview.activeTenants += 1;
      } else if (status === 'trialing') {
        billingOverview.trialingTenants += 1;
      } else if (status === 'past_due') {
        billingOverview.pastDueTenants += 1;
        billingOverview.billingRiskTenants += 1;
      } else if (status === 'canceled') {
        billingOverview.canceledTenants += 1;
        billingOverview.billingRiskTenants += 1;
      } else {
        billingOverview.freeTenants += 1;
      }
    }

    for (const user of users) {
      const plan = user.companyId ? companyPlanMap.get(user.companyId) || 'free' : 'free';
      planRows[plan].userCount += 1;
    }

    for (const key of Object.keys(planRows) as PlanCode[]) {
      planRows[key].userRatio =
        totalUsers > 0 ? Number(((planRows[key].userCount / totalUsers) * 100).toFixed(1)) : 0;
      planRows[key].arpuEstimate =
        planRows[key].userCount > 0
          ? Math.round(planRows[key].mrrContribution / planRows[key].userCount)
          : 0;
    }

    const activePaidUsers = users.filter((user) => {
      const plan = user.companyId ? companyPlanMap.get(user.companyId) || 'free' : 'free';
      return plan !== 'free';
    }).length;

    const newUsersThisMonth = users.filter((user) => user.createdAt >= startOfCurrentMonth).length;

    const churnedUsersThisMonth = Array.from(latestSubscriptionByCompany.values())
      .filter((sub) => (sub.status || '').toLowerCase() === 'canceled' && sub.updatedAt >= startOfCurrentMonth)
      .reduce((sum, sub) => {
        const affectedUsers = users.filter((u) => u.companyId === sub.companyId).length;
        return sum + affectedUsers;
      }, 0);

    const netGrowthThisMonth = newUsersThisMonth - churnedUsersThisMonth;

    const currentMrr = (Object.keys(planRows) as PlanCode[]).reduce(
      (sum, key) => sum + planRows[key].mrrContribution,
      0,
    );

    const monthlyUserGrowth = [];
    let cumulativeUsers = 0;

    for (let i = 11; i >= 0; i -= 1) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const newUsers = users.filter(
        (user) => user.createdAt >= monthStart && user.createdAt < nextMonthStart,
      ).length;

      cumulativeUsers += newUsers;

      monthlyUserGrowth.push({
        month: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`,
        newUsers,
        totalUsers: cumulativeUsers,
      });
    }

    const paymentEventIntelligence = {
      newRiskThisMonth: Array.from(latestSubscriptionByCompany.values()).filter(
        (sub) => (sub.status || '').toLowerCase() === 'past_due' && sub.updatedAt >= startOfCurrentMonth,
      ).length,
      canceledThisMonth: Array.from(latestSubscriptionByCompany.values()).filter(
        (sub) => (sub.status || '').toLowerCase() === 'canceled' && sub.updatedAt >= startOfCurrentMonth,
      ).length,
      recoveredThisMonth: Array.from(latestSubscriptionByCompany.values()).filter(
        (sub) => (sub.status || '').toLowerCase() === 'active' && sub.updatedAt >= startOfCurrentMonth,
      ).length,
      trialingUsers: users.filter((u) => (u.companyId ? companyStatusMap.get(u.companyId) : '') === 'trialing').length,
      pastDueUsers: users.filter((u) => (u.companyId ? companyStatusMap.get(u.companyId) : '') === 'past_due').length,
      canceledUsers: users.filter((u) => (u.companyId ? companyStatusMap.get(u.companyId) : '') === 'canceled').length,
      activeUsers: users.filter((u) => (u.companyId ? companyStatusMap.get(u.companyId) : '') === 'active').length,
    };

    const atRiskUsersPreview = users
      .map((user) => {
        const planCode = user.companyId ? companyPlanMap.get(user.companyId) || 'free' : 'free';
        const planStatus = user.companyId ? companyStatusMap.get(user.companyId) || 'free' : 'free';
        const billingRiskLevel = this.getBillingRiskLevel(planStatus);
        const recoveryPriority = this.getRecoveryPriority(planStatus);

        return {
          id: user.id,
          email: user.email,
          companyId: user.companyId,
          planCode,
          planStatus,
          billingRiskLevel,
          recoveryPriority,
          subscriptionUpdatedAt: user.companyId ? companyUpdatedAtMap.get(user.companyId) || null : null,
          estimatedMonthlyRevenue: PLAN_PRICE_MAP[planCode],
        };
      })
      .filter((row) => row.billingRiskLevel === 'high' || row.billingRiskLevel === 'medium' || row.billingRiskLevel === 'watch')
      .sort((a, b) => {
        const weight = (p: string) => (p === 'immediate' ? 0 : p === 'follow-up' ? 1 : p === 'observe' ? 2 : 9);
        const aw = weight(a.recoveryPriority);
        const bw = weight(b.recoveryPriority);
        if (aw !== bw) return aw - bw;
        const at = a.subscriptionUpdatedAt ? new Date(a.subscriptionUpdatedAt).getTime() : 0;
        const bt = b.subscriptionUpdatedAt ? new Date(b.subscriptionUpdatedAt).getTime() : 0;
        return bt - at;
      })
      .slice(0, 8);

    const billingRecoveryWorkspace = {
      immediateQueueCount: atRiskUsersPreview.filter((x) => x.recoveryPriority === 'immediate').length,
      followUpQueueCount: atRiskUsersPreview.filter((x) => x.recoveryPriority === 'follow-up').length,
      observeQueueCount: atRiskUsersPreview.filter((x) => x.recoveryPriority === 'observe').length,
      totalAtRiskPreview: atRiskUsersPreview.length,
    };

    return {
      totals: {
        totalUsers,
        activePaidUsers,
        totalTenants,
        newUsersThisMonth,
        churnedUsersThisMonth,
        netGrowthThisMonth,
        currentMrr,
      },
      planBreakdown: [
        planRows.free,
        planRows.starter,
        planRows.standard,
        planRows.premium,
      ],
      billingOverview,
      paymentEventIntelligence,
        atRiskUsersPreview,
        billingRecoveryWorkspace,
      monthlyUserGrowth,
    };
  }
}
