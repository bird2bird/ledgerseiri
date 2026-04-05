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

  private buildLpVisitOverview(
    events: Array<{
      path: string;
      eventType: string;
      ctaName: string | null;
      visitorId: string | null;
      createdAt: Date;
      locale?: string | null;
      referrer?: string | null;
      utmSource?: string | null;
      utmCampaign?: string | null;
    }>,
  ) {
    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;
    const start7d = new Date(now.getTime() - 6 * dayMs);
    const start30d = new Date(now.getTime() - 29 * dayMs);

    const in7d = events.filter((e) => e.createdAt >= start7d);
    const in30d = events.filter((e) => e.createdAt >= start30d);

    const uniqueVisitors = (rows: Array<{ visitorId: string | null; createdAt: Date }>) =>
      new Set(rows.map((r) => r.visitorId || `anon:${r.createdAt.getTime()}`)).size;

    const pageViewRows7d = in7d.filter((e) => e.eventType === 'view' || e.eventType === 'redirect');
    const pageViewRows30d = in30d.filter((e) => e.eventType === 'view' || e.eventType === 'redirect');

    const pathMap = new Map<string, number>();
    for (const row of pageViewRows30d) {
      pathMap.set(row.path, (pathMap.get(row.path) || 0) + 1);
    }

    const ctaMap = new Map<string, number>();
    for (const row of in30d.filter((e) => e.eventType === 'cta_click')) {
      const key = row.ctaName || 'unknown';
      ctaMap.set(key, (ctaMap.get(key) || 0) + 1);
    }

    const localeMap = new Map<string, number>();
    for (const row of pageViewRows30d) {
      const key = (row.locale || 'unknown').trim() || 'unknown';
      localeMap.set(key, (localeMap.get(key) || 0) + 1);
    }

    const normalizeReferrer = (value?: string | null) => {
      const raw = (value || '').trim();
      if (!raw) return 'direct';
      try {
        return new URL(raw).hostname || 'direct';
      } catch {
        return raw;
      }
    };

    const referrerMap = new Map<string, number>();
    for (const row of pageViewRows30d) {
      const key = normalizeReferrer(row.referrer);
      referrerMap.set(key, (referrerMap.get(key) || 0) + 1);
    }

    const sourceMap = new Map<string, number>();
    for (const row of pageViewRows30d) {
      const key = (row.utmSource || 'organic').trim() || 'organic';
      sourceMap.set(key, (sourceMap.get(key) || 0) + 1);
    }

    const campaignMap = new Map<string, number>();
    for (const row of pageViewRows30d) {
      const key = (row.utmCampaign || 'none').trim() || 'none';
      campaignMap.set(key, (campaignMap.get(key) || 0) + 1);
    }

    const dailyMap = new Map<string, { pv: number; uvSeed: Set<string> }>();
    for (const row of pageViewRows7d) {
      const day = row.createdAt.toISOString().slice(0, 10);
      if (!dailyMap.has(day)) dailyMap.set(day, { pv: 0, uvSeed: new Set<string>() });
      const bucket = dailyMap.get(day)!;
      bucket.pv += 1;
      bucket.uvSeed.add(row.visitorId || `anon:${row.createdAt.getTime()}`);
    }

    const daily = Array.from(dailyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([day, row]) => ({
        day,
        pv: row.pv,
        uv: row.uvSeed.size,
      }));

    return {
      pv7d: pageViewRows7d.length,
      uv7d: uniqueVisitors(pageViewRows7d),
      pv30d: pageViewRows30d.length,
      uv30d: uniqueVisitors(pageViewRows30d),
      topPaths: Array.from(pathMap.entries())
        .map(([path, count]) => ({ path, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      ctaClicks: Array.from(ctaMap.entries())
        .map(([ctaName, count]) => ({ ctaName, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      topLocales: Array.from(localeMap.entries())
        .map(([locale, count]) => ({ locale, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      topReferrers: Array.from(referrerMap.entries())
        .map(([referrer, count]) => ({ referrer, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      topSources: Array.from(sourceMap.entries())
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      topCampaigns: Array.from(campaignMap.entries())
        .map(([campaign, count]) => ({ campaign, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      daily,
    };
  }

  private buildMrrDecomposition(args: {
    latestSubscriptionByCompany: Map<
      string,
      {
        id: string;
        companyId: string;
        planCode: string | null;
        status: string | null;
        createdAt: Date;
        updatedAt: Date;
      }
    >;
  }) {
    const byStatus = {
      active: 0,
      trialing: 0,
      pastDue: 0,
      canceled: 0,
      free: 0,
    };

    const byPlanSeed: Record<PlanCode, {
      currentMrr: number;
      atRiskMrr: number;
      trialingPipelineMrr: number;
    }> = {
      free: { currentMrr: 0, atRiskMrr: 0, trialingPipelineMrr: 0 },
      starter: { currentMrr: 0, atRiskMrr: 0, trialingPipelineMrr: 0 },
      standard: { currentMrr: 0, atRiskMrr: 0, trialingPipelineMrr: 0 },
      premium: { currentMrr: 0, atRiskMrr: 0, trialingPipelineMrr: 0 },
    };

    for (const sub of Array.from(args.latestSubscriptionByCompany.values())) {
      const planCode = this.normalizePlan(sub.planCode);
      const status = (sub.status || 'free').toLowerCase();
      const revenue = PLAN_PRICE_MAP[planCode];

      if (status === 'active') {
        byStatus.active += revenue;
        byPlanSeed[planCode].currentMrr += revenue;
      } else if (status === 'past_due') {
        byStatus.pastDue += revenue;
        byPlanSeed[planCode].currentMrr += revenue;
        byPlanSeed[planCode].atRiskMrr += revenue;
      } else if (status === 'trialing') {
        byStatus.trialing += revenue;
        byPlanSeed[planCode].trialingPipelineMrr += revenue;
      } else if (status === 'canceled') {
        byStatus.canceled += revenue;
        byPlanSeed[planCode].atRiskMrr += revenue;
      } else {
        byStatus.free += revenue;
      }
    }

    const totalMrr = byStatus.active + byStatus.pastDue;
    const atRiskMrr = byStatus.pastDue + byStatus.canceled;
    const trialingPipelineMrr = byStatus.trialing;

    const byPlan = (['free', 'starter', 'standard', 'premium'] as PlanCode[]).map((planCode) => {
      const row = byPlanSeed[planCode];
      return {
        planCode,
        currentMrr: row.currentMrr,
        atRiskMrr: row.atRiskMrr,
        trialingPipelineMrr: row.trialingPipelineMrr,
        currentSharePct: totalMrr > 0 ? Number(((row.currentMrr / totalMrr) * 100).toFixed(1)) : 0,
      };
    });

    return {
      totalMrr,
      activeMrr: byStatus.active,
      pastDueMrr: byStatus.pastDue,
      canceledMrr: byStatus.canceled,
      atRiskMrr,
      trialingPipelineMrr,
      freeMrr: byStatus.free,
      byStatus,
      byPlan,
    };
  }

  private buildPlanMovementInsights(args: {
    subscriptions: Array<{
      id: string;
      companyId: string | null;
      planCode: string | null;
      status: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>;
    startOfCurrentMonth: Date;
  }) {
    const planRank: Record<PlanCode, number> = {
      free: 0,
      starter: 1,
      standard: 2,
      premium: 3,
    };

    const groups = new Map<
      string,
      Array<{
        id: string;
        companyId: string | null;
        planCode: string | null;
        status: string | null;
        createdAt: Date;
        updatedAt: Date;
      }>
    >();

    for (const sub of args.subscriptions) {
      if (!sub.companyId) continue;
      if (!groups.has(sub.companyId)) groups.set(sub.companyId, []);
      groups.get(sub.companyId)!.push(sub);
    }

    const byPlanSeed: Record<PlanCode, { entered: number; exited: number; net: number }> = {
      free: { entered: 0, exited: 0, net: 0 },
      starter: { entered: 0, exited: 0, net: 0 },
      standard: { entered: 0, exited: 0, net: 0 },
      premium: { entered: 0, exited: 0, net: 0 },
    };

    let upgradesThisMonth = 0;
    let downgradesThisMonth = 0;
    let activationsThisMonth = 0;
    let cancellationsThisMonth = 0;
    let trialingStartsThisMonth = 0;

    for (const rows of Array.from(groups.values())) {
      const sorted = [...rows].sort((a, b) => {
        const bt = new Date(b.updatedAt).getTime();
        const at = new Date(a.updatedAt).getTime();
        if (bt !== at) return bt - at;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      const latest = sorted[0];
      if (!latest || latest.updatedAt < args.startOfCurrentMonth) continue;

      const previous = sorted[1] || null;

      const currentPlan = this.normalizePlan(latest.planCode);
      const previousPlan = previous ? this.normalizePlan(previous.planCode) : 'free';

      const currentStatus = (latest.status || 'free').toLowerCase();
      const previousStatus = (previous?.status || 'free').toLowerCase();

      if (planRank[currentPlan] > planRank[previousPlan]) {
        upgradesThisMonth += 1;
        byPlanSeed[currentPlan].entered += 1;
        byPlanSeed[previousPlan].exited += 1;
      } else if (planRank[currentPlan] < planRank[previousPlan]) {
        downgradesThisMonth += 1;
        byPlanSeed[currentPlan].entered += 1;
        byPlanSeed[previousPlan].exited += 1;
      }

      if (currentStatus === 'active' && previousStatus !== 'active') {
        activationsThisMonth += 1;
      }

      if (currentStatus === 'canceled' && previousStatus !== 'canceled') {
        cancellationsThisMonth += 1;
      }

      if (currentStatus === 'trialing' && previousStatus !== 'trialing') {
        trialingStartsThisMonth += 1;
      }
    }

    const byPlan = (['free', 'starter', 'standard', 'premium'] as PlanCode[]).map((planCode) => {
      const row = byPlanSeed[planCode];
      return {
        planCode,
        entered: row.entered,
        exited: row.exited,
        net: row.entered - row.exited,
      };
    });

    return {
      upgradesThisMonth,
      downgradesThisMonth,
      activationsThisMonth,
      cancellationsThisMonth,
      trialingStartsThisMonth,
      byPlan,
    };
  }

  private buildLifecycleFunnel(args: {
    subscriptions: Array<{
      id: string;
      companyId: string | null;
      planCode: string | null;
      status: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>;
    startOfCurrentMonth: Date;
  }) {
    const groups = new Map<
      string,
      Array<{
        id: string;
        companyId: string | null;
        planCode: string | null;
        status: string | null;
        createdAt: Date;
        updatedAt: Date;
      }>
    >();

    for (const sub of args.subscriptions) {
      if (!sub.companyId) continue;
      if (!groups.has(sub.companyId)) groups.set(sub.companyId, []);
      groups.get(sub.companyId)!.push(sub);
    }

    let trialingNow = 0;
    let activeNow = 0;
    let pastDueNow = 0;
    let canceledNow = 0;

    let trialToActiveThisMonth = 0;
    let trialToCanceledThisMonth = 0;
    let pastDueToActiveThisMonth = 0;
    let activeToCanceledThisMonth = 0;
    let trialStartsThisMonth = 0;
    let recoveryAttemptsThisMonth = 0;

    for (const rows of Array.from(groups.values())) {
      const sorted = [...rows].sort((a, b) => {
        const bt = new Date(b.updatedAt).getTime();
        const at = new Date(a.updatedAt).getTime();
        if (bt != at) return bt - at;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      const latest = sorted[0];
      if (!latest) continue;

      const latestStatus = (latest.status || 'free').toLowerCase();
      if (latestStatus === 'trialing') trialingNow += 1;
      if (latestStatus === 'active') activeNow += 1;
      if (latestStatus === 'past_due') pastDueNow += 1;
      if (latestStatus === 'canceled') canceledNow += 1;

      if (latest.updatedAt < args.startOfCurrentMonth) continue;

      const previous = sorted[1] || null;
      const previousStatus = (previous?.status || 'free').toLowerCase();

      if (latestStatus === 'trialing' && previousStatus !== 'trialing') {
        trialStartsThisMonth += 1;
      }
      if (previousStatus === 'trialing' && latestStatus === 'active') {
        trialToActiveThisMonth += 1;
      }
      if (previousStatus === 'trialing' && latestStatus === 'canceled') {
        trialToCanceledThisMonth += 1;
      }
      if (previousStatus === 'past_due' && latestStatus === 'active') {
        pastDueToActiveThisMonth += 1;
      }
      if (previousStatus === 'active' && latestStatus === 'canceled') {
        activeToCanceledThisMonth += 1;
      }
      if (previousStatus === 'past_due') {
        recoveryAttemptsThisMonth += 1;
      }
    }

    const trialConversionRatePct =
      trialStartsThisMonth > 0
        ? Number(((trialToActiveThisMonth / trialStartsThisMonth) * 100).toFixed(1))
        : 0;

    const recoverySuccessRatePct =
      recoveryAttemptsThisMonth > 0
        ? Number(((pastDueToActiveThisMonth / recoveryAttemptsThisMonth) * 100).toFixed(1))
        : 0;

    return {
      current: {
        trialingNow,
        activeNow,
        pastDueNow,
        canceledNow,
      },
      movements: {
        trialStartsThisMonth,
        trialToActiveThisMonth,
        trialToCanceledThisMonth,
        pastDueToActiveThisMonth,
        activeToCanceledThisMonth,
        recoveryAttemptsThisMonth,
      },
      rates: {
        trialConversionRatePct,
        recoverySuccessRatePct,
      },
    };
  }

  private buildRiskRevenueTrend(args: {
    subscriptions: Array<{
      id: string;
      companyId: string | null;
      planCode: string | null;
      status: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>;
    now: Date;
  }) {
    const rows: Array<{
      month: string;
      atRiskMrr: number;
      recoveredMrr: number;
      canceledMrr: number;
    }> = [];

    for (let i = 5; i >= 0; i -= 1) {
      const monthStart = new Date(args.now.getFullYear(), args.now.getMonth() - i, 1);
      const nextMonthStart = new Date(args.now.getFullYear(), args.now.getMonth() - i + 1, 1);

      let atRiskMrr = 0;
      let recoveredMrr = 0;
      let canceledMrr = 0;

      for (const sub of args.subscriptions) {
        const updatedAt = new Date(sub.updatedAt);
        if (updatedAt < monthStart || updatedAt >= nextMonthStart) continue;

        const planCode = this.normalizePlan(sub.planCode);
        const revenue = PLAN_PRICE_MAP[planCode];
        const status = (sub.status || 'free').toLowerCase();

        if (status === 'past_due') atRiskMrr += revenue;
        if (status === 'active') recoveredMrr += revenue;
        if (status === 'canceled') canceledMrr += revenue;
      }

      rows.push({
        month: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`,
        atRiskMrr,
        recoveredMrr,
        canceledMrr,
      });
    }

    return rows;
  }

  private buildChurnRecoveryTrend(args: {
    subscriptions: Array<{
      id: string;
      companyId: string | null;
      planCode: string | null;
      status: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>;
    now: Date;
  }) {
    const rows: Array<{
      month: string;
      cancellations: number;
      recoveries: number;
      trialConversions: number;
    }> = [];

    const groups = new Map<
      string,
      Array<{
        id: string;
        companyId: string | null;
        planCode: string | null;
        status: string | null;
        createdAt: Date;
        updatedAt: Date;
      }>
    >();

    for (const sub of args.subscriptions) {
      if (!sub.companyId) continue;
      if (!groups.has(sub.companyId)) groups.set(sub.companyId, []);
      groups.get(sub.companyId)!.push(sub);
    }

    for (let i = 5; i >= 0; i -= 1) {
      const monthStart = new Date(args.now.getFullYear(), args.now.getMonth() - i, 1);
      const nextMonthStart = new Date(args.now.getFullYear(), args.now.getMonth() - i + 1, 1);

      let cancellations = 0;
      let recoveries = 0;
      let trialConversions = 0;

      for (const rowsByCompany of Array.from(groups.values())) {
        const sorted = [...rowsByCompany].sort((a, b) => {
          const bt = new Date(b.updatedAt).getTime();
          const at = new Date(a.updatedAt).getTime();
          if (bt !== at) return bt - at;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        for (let idx = 0; idx < sorted.length; idx += 1) {
          const current = sorted[idx];
          const previous = sorted[idx + 1] || null;
          const updatedAt = new Date(current.updatedAt);
          if (updatedAt < monthStart || updatedAt >= nextMonthStart) continue;

          const currentStatus = (current.status || 'free').toLowerCase();
          const previousStatus = (previous?.status || 'free').toLowerCase();

          if (currentStatus === 'canceled' && previousStatus !== 'canceled') cancellations += 1;
          if (previousStatus === 'past_due' && currentStatus === 'active') recoveries += 1;
          if (previousStatus === 'trialing' && currentStatus === 'active') trialConversions += 1;
        }
      }

      rows.push({
        month: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`,
        cancellations,
        recoveries,
        trialConversions,
      });
    }

    return rows;
  }

  private buildCohortRetentionInsights(args: {
    users: Array<{
      id: string;
      email: string;
      companyId: string | null;
      createdAt: Date;
    }>;
    companies: Array<{
      id: string;
      createdAt: Date;
    }>;
    subscriptions: Array<{
      id: string;
      companyId: string | null;
      planCode: string | null;
      status: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>;
    latestSubscriptionByCompany: Map<
      string,
      {
        id: string;
        companyId: string;
        planCode: string | null;
        status: string | null;
        createdAt: Date;
        updatedAt: Date;
      }
    >;
    now: Date;
  }) {
    const monthKey = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    const cohortMap = new Map<string, {
      cohortMonth: string;
      newUsers: number;
      retainedPaidUsers: number;
      churnedUsers: number;
      currentMrr: number;
    }>();

    const companyCreatedMonth = new Map<string, string>();
    for (const company of args.companies) {
      companyCreatedMonth.set(company.id, monthKey(new Date(company.createdAt)));
    }

    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(args.now.getFullYear(), args.now.getMonth() - i, 1);
      const key = monthKey(d);
      cohortMap.set(key, {
        cohortMonth: key,
        newUsers: 0,
        retainedPaidUsers: 0,
        churnedUsers: 0,
        currentMrr: 0,
      });
    }

    for (const user of args.users) {
      const key = monthKey(new Date(user.createdAt));
      if (!cohortMap.has(key)) continue;
      cohortMap.get(key)!.newUsers += 1;

      const latest = user.companyId ? args.latestSubscriptionByCompany.get(user.companyId) : null;
      const status = (latest?.status || 'free').toLowerCase();
      const plan = this.normalizePlan(latest?.planCode);

      if (status === 'active' || status === 'past_due') {
        if (plan !== 'free') {
          cohortMap.get(key)!.retainedPaidUsers += 1;
          cohortMap.get(key)!.currentMrr += PLAN_PRICE_MAP[plan];
        }
      } else if (status === 'canceled') {
        cohortMap.get(key)!.churnedUsers += 1;
      }
    }

    const transitionSeed = {
      expansionMrr: 0,
      contractionMrr: 0,
      retainedPaidCompanies: 0,
      churnedPaidCompanies: 0,
    };

    const groups = new Map<
      string,
      Array<{
        id: string;
        companyId: string | null;
        planCode: string | null;
        status: string | null;
        createdAt: Date;
        updatedAt: Date;
      }>
    >();

    for (const sub of args.subscriptions) {
      if (!sub.companyId) continue;
      if (!groups.has(sub.companyId)) groups.set(sub.companyId, []);
      groups.get(sub.companyId)!.push(sub);
    }

    const planRank: Record<PlanCode, number> = {
      free: 0,
      starter: 1,
      standard: 2,
      premium: 3,
    };

    for (const rows of Array.from(groups.values())) {
      const sorted = [...rows].sort((a, b) => {
        const bt = new Date(b.updatedAt).getTime();
        const at = new Date(a.updatedAt).getTime();
        if (bt !== at) return bt - at;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      const latest = sorted[0];
      const previous = sorted[1] || null;
      if (!latest) continue;

      const latestPlan = this.normalizePlan(latest.planCode);
      const latestStatus = (latest.status || 'free').toLowerCase();

      if (latestPlan !== 'free' && (latestStatus === 'active' || latestStatus === 'past_due')) {
        transitionSeed.retainedPaidCompanies += 1;
      }
      if (latestStatus === 'canceled' && latestPlan !== 'free') {
        transitionSeed.churnedPaidCompanies += 1;
      }

      if (!previous) continue;

      const previousPlan = this.normalizePlan(previous.planCode);
      const previousStatus = (previous.status || 'free').toLowerCase();

      if (
        (latestStatus === 'active' || latestStatus === 'past_due') &&
        (previousStatus === 'active' || previousStatus === 'past_due')
      ) {
        if (planRank[latestPlan] > planRank[previousPlan]) {
          transitionSeed.expansionMrr += Math.max(0, PLAN_PRICE_MAP[latestPlan] - PLAN_PRICE_MAP[previousPlan]);
        } else if (planRank[latestPlan] < planRank[previousPlan]) {
          transitionSeed.contractionMrr += Math.max(0, PLAN_PRICE_MAP[previousPlan] - PLAN_PRICE_MAP[latestPlan]);
        }
      }
    }

    const cohorts = Array.from(cohortMap.values());

    return {
      cohorts,
      summary: {
        retainedPaidCompanies: transitionSeed.retainedPaidCompanies,
        churnedPaidCompanies: transitionSeed.churnedPaidCompanies,
        expansionMrr: transitionSeed.expansionMrr,
        contractionMrr: transitionSeed.contractionMrr,
      },
    };
  }

  private buildForecastInsights(args: {
    latestSubscriptionByCompany: Map<
      string,
      {
        id: string;
        companyId: string;
        planCode: string | null;
        status: string | null;
        createdAt: Date;
        updatedAt: Date;
      }
    >;
    riskRevenueTrend: Array<{
      month: string;
      atRiskMrr: number;
      recoveredMrr: number;
      canceledMrr: number;
    }>;
    churnRecoveryTrend: Array<{
      month: string;
      cancellations: number;
      recoveries: number;
      trialConversions: number;
    }>;
    mrrDecomposition: {
      totalMrr: number;
      activeMrr: number;
      pastDueMrr: number;
      canceledMrr: number;
      atRiskMrr: number;
      trialingPipelineMrr: number;
      freeMrr: number;
      byStatus: {
        active: number;
        trialing: number;
        pastDue: number;
        canceled: number;
        free: number;
      };
      byPlan: Array<{
        planCode: PlanCode;
        currentMrr: number;
        atRiskMrr: number;
        trialingPipelineMrr: number;
        currentSharePct: number;
      }>;
    };
  }) {
    const riskRows = args.riskRevenueTrend || [];
    const churnRows = args.churnRecoveryTrend || [];

    const avg = (nums: number[]) =>
      nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : 0;

    const recentRisk = riskRows.slice(-3);
    const recentChurn = churnRows.slice(-3);

    const avgAtRiskMrr = avg(recentRisk.map((r) => Number(r.atRiskMrr || 0)));
    const avgRecoveredMrr = avg(recentRisk.map((r) => Number(r.recoveredMrr || 0)));
    const avgCanceledMrr = avg(recentRisk.map((r) => Number(r.canceledMrr || 0)));

    const avgRecoveries = avg(recentChurn.map((r) => Number(r.recoveries || 0)));
    const avgCancellations = avg(recentChurn.map((r) => Number(r.cancellations || 0)));
    const avgTrialConversions = avg(recentChurn.map((r) => Number(r.trialConversions || 0)));

    const projectedNextMonthMrr =
      args.mrrDecomposition.activeMrr +
      args.mrrDecomposition.trialingPipelineMrr * 0.35 -
      args.mrrDecomposition.atRiskMrr * 0.45;

    const currentAtRiskMrr = Number(args.mrrDecomposition.atRiskMrr || 0);
    const currentRecoveredMrr = Number(args.mrrDecomposition.activeMrr || 0);

    const anomalyFlags = {
      riskSpike:
        avgAtRiskMrr > 0 && currentAtRiskMrr > avgAtRiskMrr * 1.3,
      recoveryDrop:
        avgRecoveredMrr > 0 && currentRecoveredMrr < avgRecoveredMrr * 0.7,
      cancellationSpike:
        avgCancellations > 0 &&
        Number((churnRows[churnRows.length - 1]?.cancellations || 0)) > avgCancellations * 1.4,
      trialConversionDrop:
        avgTrialConversions > 0 &&
        Number((churnRows[churnRows.length - 1]?.trialConversions || 0)) < avgTrialConversions * 0.6,
    };

    const alertLevel =
      anomalyFlags.riskSpike || anomalyFlags.cancellationSpike
        ? 'high'
        : anomalyFlags.recoveryDrop || anomalyFlags.trialConversionDrop
          ? 'medium'
          : 'healthy';

    let summary = 'Stable operating baseline';
    if (alertLevel === 'high') {
      summary = 'High-risk signal: at-risk MRR or cancellations are materially above recent baseline';
    } else if (alertLevel === 'medium') {
      summary = 'Watch signal: recovery or trial conversion is trending below recent baseline';
    }

    return {
      projectedNextMonthMrr: Math.max(0, Math.round(projectedNextMonthMrr)),
      baseline: {
        avgAtRiskMrr: Math.round(avgAtRiskMrr),
        avgRecoveredMrr: Math.round(avgRecoveredMrr),
        avgCanceledMrr: Math.round(avgCanceledMrr),
        avgRecoveries: Math.round(avgRecoveries * 10) / 10,
        avgCancellations: Math.round(avgCancellations * 10) / 10,
        avgTrialConversions: Math.round(avgTrialConversions * 10) / 10,
      },
      anomalyFlags,
      alertLevel,
      summary,
    };
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

      const lpVisitEvents = await this.prisma.lpVisitEvent.findMany({
        where: {
          createdAt: {
            gte: new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          path: true,
          eventType: true,
          ctaName: true,
          visitorId: true,
          createdAt: true,
          locale: true,
          referrer: true,
          utmSource: true,
          utmCampaign: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      const lpVisitOverview = this.buildLpVisitOverview(lpVisitEvents);

      const lpConversionEvents = await this.prisma.lpConversionEvent.findMany({
        where: {
          createdAt: {
            gte: new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          eventType: true,
          ctaName: true,
          source: true,
          locale: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      const conversionTypeCount = (eventType: string) =>
        lpConversionEvents.filter((row) => row.eventType === eventType).length;

      const aggregateCount = (keyName: 'ctaName' | 'source' | 'locale') => {
        const map = new Map<string, number>();
        for (const row of lpConversionEvents) {
          const key = String((row as any)[keyName] || 'unknown').trim() || 'unknown';
          map.set(key, (map.get(key) || 0) + 1);
        }
        return Array.from(map.entries())
          .map(([key, count]) => ({ key, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
      };

      const lpConversionIntelligence = {
        registerConversions30d: conversionTypeCount('register_completed'),
        loginConversions30d: conversionTypeCount('login_completed'),
        topConversionCtas: aggregateCount('ctaName').map((row) => ({ ctaName: row.key, count: row.count })),
        topConversionSources: aggregateCount('source').map((row) => ({ source: row.key, count: row.count })),
        conversionByLocale: aggregateCount('locale').map((row) => ({ locale: row.key, count: row.count })),
      };

      const visits30d = lpVisitEvents.filter(
        (row) => row.eventType === 'view' || row.eventType === 'redirect',
      ).length;

      const ctaClicks30d = lpVisitEvents.filter(
        (row) => row.eventType === 'cta_click',
      ).length;

      const registerCompleted30d = lpConversionEvents.filter(
        (row) => row.eventType === 'register_completed',
      ).length;

      const loginCompleted30d = lpConversionEvents.filter(
        (row) => row.eventType === 'login_completed',
      ).length;

      const percentage = (num: number, den: number) =>
        den > 0 ? Number(((num / den) * 100).toFixed(1)) : 0;

      const ctaClickMap = new Map<string, number>();
      for (const row of lpVisitEvents.filter((row) => row.eventType === 'cta_click')) {
        const key = String(row.ctaName || 'unknown').trim() || 'unknown';
        ctaClickMap.set(key, (ctaClickMap.get(key) || 0) + 1);
      }

      const registerMap = new Map<string, number>();
      for (const row of lpConversionEvents.filter((row) => row.eventType === 'register_completed')) {
        const key = String(row.ctaName || 'unknown').trim() || 'unknown';
        registerMap.set(key, (registerMap.get(key) || 0) + 1);
      }

      const loginMap = new Map<string, number>();
      for (const row of lpConversionEvents.filter((row) => row.eventType === 'login_completed')) {
        const key = String(row.ctaName || 'unknown').trim() || 'unknown';
        loginMap.set(key, (loginMap.get(key) || 0) + 1);
      }

      const funnelKeys = Array.from(
        new Set([
          ...Array.from(ctaClickMap.keys()),
          ...Array.from(registerMap.keys()),
          ...Array.from(loginMap.keys()),
        ]),
      );

      const topCtaFunnel = funnelKeys
        .map((ctaName) => {
          const clicks = ctaClickMap.get(ctaName) || 0;
          const registers = registerMap.get(ctaName) || 0;
          const logins = loginMap.get(ctaName) || 0;
          return {
            ctaName,
            clicks,
            registers,
            logins,
            clickToRegisterRate: percentage(registers, clicks),
            clickToLoginRate: percentage(logins, clicks),
          };
        })
        .sort((a, b) => {
          if (b.clickToRegisterRate !== a.clickToRegisterRate) {
            return b.clickToRegisterRate - a.clickToRegisterRate;
          }
          return b.clicks - a.clicks;
        })
        .slice(0, 5);

      const lpFunnelIntelligence = {
        visits30d,
        ctaClicks30d,
        registerCompleted30d,
        loginCompleted30d,
        visitToCtaRate: percentage(ctaClicks30d, visits30d),
        ctaToRegisterRate: percentage(registerCompleted30d, ctaClicks30d),
        ctaToLoginRate: percentage(loginCompleted30d, ctaClicks30d),
        topCtaFunnel,
      };

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

    const mrrDecomposition = this.buildMrrDecomposition({
      latestSubscriptionByCompany,
    });

    const planMovementInsights = this.buildPlanMovementInsights({
      subscriptions,
      startOfCurrentMonth,
    });

    const lifecycleFunnel = this.buildLifecycleFunnel({
      subscriptions,
      startOfCurrentMonth,
    });

    const riskRevenueTrend = this.buildRiskRevenueTrend({
      subscriptions,
      now,
    });

    const churnRecoveryTrend = this.buildChurnRecoveryTrend({
      subscriptions,
      now,
    });

    const cohortRetentionInsights = this.buildCohortRetentionInsights({
      users,
      companies,
      subscriptions,
      latestSubscriptionByCompany,
      now,
    });

    const forecastInsights = this.buildForecastInsights({
      latestSubscriptionByCompany,
      riskRevenueTrend,
      churnRecoveryTrend,
      mrrDecomposition,
    });

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
      mrrDecomposition,
      planMovementInsights,
      lifecycleFunnel,
      riskRevenueTrend,
      churnRecoveryTrend,
      cohortRetentionInsights,
      forecastInsights,
      lpVisitOverview,
      lpConversionIntelligence,
      lpFunnelIntelligence,
      monthlyUserGrowth,
    };
  }
}
