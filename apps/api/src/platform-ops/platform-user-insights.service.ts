import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

type PlanCode = 'free' | 'starter' | 'standard' | 'premium';

const PLAN_PRICE_MAP: Record<PlanCode, number> = {
  free: 0,
  starter: 1980,
  standard: 4980,
  premium: 9980,
};

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing', 'past_due', 'canceled']);

@Injectable()
export class PlatformUserInsightsService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizePlan(planCode?: string | null): PlanCode {
    if (planCode === 'starter' || planCode === 'standard' || planCode === 'premium') {
      return planCode;
    }
    return 'free';
  }

  private getBillingRiskLevel(status?: string | null) {
    const s = (status || 'free').toLowerCase();
    if (s === 'past_due') return 'high';
    if (s === 'canceled') return 'medium';
    if (s === 'trialing') return 'watch';
    if (s === 'active') return 'healthy';
    return 'free';
  }

  private async getSubscriptionHistoryMap(companyIds: string[]) {
    const subscriptions = await this.prisma.workspaceSubscription.findMany({
      where: {
        companyId: { in: companyIds.filter(Boolean) },
      },
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

    const latestMap = new Map<
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

    const historyMap = new Map<string, typeof subscriptions>();

    for (const sub of subscriptions) {
      if (!sub.companyId) continue;
      if (!latestMap.has(sub.companyId)) latestMap.set(sub.companyId, sub);
      if (!historyMap.has(sub.companyId)) historyMap.set(sub.companyId, []);
      historyMap.get(sub.companyId)!.push(sub);
    }

    return { latestMap, historyMap };
  }

  private buildBillingTimeline(sub: {
    planCode: string | null;
    status: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null) {
    if (!sub) {
      return [
        {
          type: 'free_state',
          label: 'No paid subscription',
          at: null,
          tone: 'free',
        },
      ];
    }

    const status = (sub.status || 'free').toLowerCase();
    const timeline = [
      {
        type: 'subscription_created',
        label: `Subscription created · ${sub.planCode || 'free'}`,
        at: sub.createdAt,
        tone: 'neutral',
      },
    ];

    if (status === 'trialing') {
      timeline.push({
        type: 'trialing',
        label: 'Trialing status detected',
        at: sub.updatedAt,
        tone: 'watch',
      });
    } else if (status === 'active') {
      timeline.push({
        type: 'active',
        label: 'Active recurring billing',
        at: sub.updatedAt,
        tone: 'healthy',
      });
    } else if (status === 'past_due') {
      timeline.push({
        type: 'past_due',
        label: 'Payment risk / past due',
        at: sub.updatedAt,
        tone: 'high',
      });
    } else if (status === 'canceled') {
      timeline.push({
        type: 'canceled',
        label: 'Subscription canceled',
        at: sub.updatedAt,
        tone: 'medium',
      });
    } else {
      timeline.push({
        type: 'status_update',
        label: `Status updated · ${status}`,
        at: sub.updatedAt,
        tone: 'neutral',
      });
    }

    if (sub.updatedAt.getTime() !== sub.createdAt.getTime()) {
      timeline.push({
        type: 'billing_updated',
        label: 'Latest billing status update',
        at: sub.updatedAt,
        tone: 'neutral',
      });
    }

    return timeline
      .sort((a, b) => {
        const av = a.at ? new Date(a.at).getTime() : 0;
        const bv = b.at ? new Date(b.at).getTime() : 0;
        return bv - av;
      })
      .slice(0, 8);
  }

  async list() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        companyId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const companyIds = Array.from(new Set(users.map((u) => u.companyId).filter(Boolean) as string[]));
    const { latestMap } = await this.getSubscriptionHistoryMap(companyIds);

    const rows = users.map((user) => {
      const sub = user.companyId ? latestMap.get(user.companyId) : null;
      const planCode = sub && ACTIVE_SUBSCRIPTION_STATUSES.has((sub.status || '').toLowerCase())
        ? this.normalizePlan(sub.planCode)
        : 'free';

      const planStatus = sub?.status || 'free';
      const estimatedMonthlyRevenue = PLAN_PRICE_MAP[planCode];
      const billingRiskLevel = this.getBillingRiskLevel(planStatus);

      return {
        id: user.id,
        email: user.email,
        companyId: user.companyId,
        joinedAt: user.createdAt,
        planCode,
        planStatus,
        billingStatus: planStatus,
        estimatedMonthlyRevenue,
        subscriptionUpdatedAt: sub?.updatedAt || null,
        billingRiskLevel,
      };
    });

    return {
      items: rows,
      summary: {
        totalUsers: rows.length,
        assignedUsers: rows.filter((x) => !!x.companyId).length,
        unassignedUsers: rows.filter((x) => !x.companyId).length,
        paidUsers: rows.filter((x) => x.planCode !== 'free').length,
        billingRiskUsers: rows.filter((x) => x.billingRiskLevel === 'high' || x.billingRiskLevel === 'medium').length,
      },
    };
  }

  async detail(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        companyId: true,
        createdAt: true,
        lastLoginAt: true,
        lastLoginIp: true,
      },
    });

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    const { latestMap } = await this.getSubscriptionHistoryMap(
      user.companyId ? [user.companyId] : [],
    );
    const sub = user.companyId ? latestMap.get(user.companyId) : null;
    const planCode =
      sub && ACTIVE_SUBSCRIPTION_STATUSES.has((sub.status || '').toLowerCase())
        ? this.normalizePlan(sub.planCode)
        : 'free';

    const recentOperations = await this.prisma.platformOperation.findMany({
      where: {
        candidateId: id,
      },
      select: {
        id: true,
        type: true,
        scope: true,
        status: true,
        note: true,
        requestedByAdminEmail: true,
        requestedAt: true,
        completedAt: true,
      },
      orderBy: { requestedAt: 'desc' },
      take: 8,
    });

    const recentAudits = await this.prisma.reconciliationDecisionAudit.findMany({
      where: {
        candidateId: id,
      },
      select: {
        id: true,
        actionType: true,
        source: true,
        previousValue: true,
        nextValue: true,
        createdAt: true,
        persistenceKey: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });

    const recentLoginEvents = await this.prisma.userLoginEvent.findMany({
      where: { userId: id },
      select: {
        loggedInAt: true,
        ipAddress: true,
        userAgent: true,
        loginMethod: true,
        success: true,
      },
      orderBy: { loggedInAt: 'desc' },
      take: 10,
    });

    const planStatus = sub?.status || 'free';
    const billingRiskLevel = this.getBillingRiskLevel(planStatus);

    return {
      profile: {
        id: user.id,
        email: user.email,
        companyId: user.companyId,
        joinedAt: user.createdAt,
        lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
        lastLoginIp: user.lastLoginIp || null,
      },
      subscription: {
        planCode,
        planStatus,
        billingStatus: planStatus,
        estimatedMonthlyRevenue: PLAN_PRICE_MAP[planCode],
        subscriptionUpdatedAt: sub?.updatedAt ? sub.updatedAt.toISOString() : null,
      },
      billingIntelligence: {
        billingRiskLevel,
        recoveryPriority:
          billingRiskLevel === 'high'
            ? 'immediate'
            : billingRiskLevel === 'medium'
            ? 'follow-up'
            : billingRiskLevel === 'watch'
            ? 'observe'
            : 'healthy',
        riskReason:
          planStatus === 'past_due'
            ? 'Payment collection risk'
            : planStatus === 'canceled'
            ? 'Churn / revenue loss risk'
            : planStatus === 'trialing'
            ? 'Conversion watch'
            : planStatus === 'active'
            ? 'Healthy recurring status'
            : 'No paid subscription',
      },
      billingTimeline: this.buildBillingTimeline(sub || null).map((row) => ({
        ...row,
        at: row.at ? new Date(row.at).toISOString() : null,
      })),
      paymentEventSummary: {
        latestStatus: planStatus,
        latestUpdatedAt: sub?.updatedAt ? sub.updatedAt.toISOString() : null,
        hasRevenue: PLAN_PRICE_MAP[planCode] > 0,
        timelineLength: this.buildBillingTimeline(sub || null).length,
      },
      recentOperations: recentOperations.map((row) => ({
        ...row,
        requestedAt: row.requestedAt.toISOString(),
        completedAt: row.completedAt ? row.completedAt.toISOString() : null,
      })),
      recentAudits: recentAudits.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
      })),
      loginHistory: recentLoginEvents.map((row) => ({
        loggedInAt: row.loggedInAt.toISOString(),
        ipAddress: row.ipAddress || null,
        userAgent: row.userAgent || null,
        loginMethod: row.loginMethod || 'password',
        success: !!row.success,
      })),
    };
  }
}
