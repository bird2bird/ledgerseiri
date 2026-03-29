import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { resolveWorkspaceLimits } from '../common/workspace-plan-limits';

type PlanCodeLower = 'starter' | 'standard' | 'premium';
type SubscriptionStatusLower = 'active' | 'trialing' | 'past_due' | 'canceled';
type SubscriptionSource = 'db' | 'db+query-override' | 'mock-default' | 'mock-query';

type WorkspaceEntitlements = {
  aiInsights: boolean;
  aiChat: boolean;
  invoiceUpload: boolean;
  invoiceOcr: boolean;
  multiStore: boolean;
  fundTransfer: boolean;
  invoiceManagement: boolean;
  advancedExport: boolean;
  skuLevelExport: boolean;
  history24m: boolean;
};

type WorkspaceLimits = {
  maxStores: number;
  invoiceStorageMb: number;
  aiChatMonthly: number;
  aiInvoiceOcrMonthly: number;
  historyMonths: number;
};

type WorkspaceContextValue = {
  workspace: {
    slug: string;
    displayName: string;
    companyName: string;
    locale: string;
  };
  subscription: {
    planCode: PlanCodeLower;
    status: SubscriptionStatusLower;
    source: SubscriptionSource;
    entitlements: WorkspaceEntitlements;
    limits: WorkspaceLimits;
  };
};

type WorkspaceUsage = {
  storesUsed: number;
  invoiceStorageMbUsed: number;
  aiChatUsedMonthly: number;
  aiInvoiceOcrUsedMonthly: number;
};

type WorkspaceUsageResponse = {
  workspace: WorkspaceContextValue['workspace'];
  subscription: WorkspaceContextValue['subscription'];
  effectiveLimits: WorkspaceLimits;
  usage: WorkspaceUsage;
  utilization: {
    storesPct: number;
    invoiceStoragePct: number;
    aiChatPct: number;
    aiInvoiceOcrPct: number;
  };
  overLimit: {
    stores: boolean;
    invoiceStorage: boolean;
    aiChat: boolean;
    aiInvoiceOcr: boolean;
  };
  period: {
    monthKey: string;
  };
};

@Injectable()
export class WorkspaceService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizePlanCode(raw?: string | null): PlanCodeLower {
    const v = String(raw || '').trim().toLowerCase();
    if (v === 'starter' || v === 'standard' || v === 'premium') return v;
    return 'starter';
  }

  private normalizeStatus(raw?: string | null): SubscriptionStatusLower {
    const v = String(raw || '').trim().toLowerCase();
    if (v === 'active' || v === 'trialing' || v === 'past_due' || v === 'canceled') return v;
    return 'active';
  }

  private prettifyWorkspaceName(input?: string | null): string {
    const raw = String(input || '').trim();
    if (!raw) return 'Weiwei';

    return raw
      .replace(/[-_]+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private getPlanEntitlements(planCode: PlanCodeLower): WorkspaceEntitlements {
    if (planCode === 'premium') {
      return {
        aiInsights: true,
        aiChat: true,
        invoiceUpload: true,
        invoiceOcr: true,
        multiStore: true,
        fundTransfer: true,
        invoiceManagement: true,
        advancedExport: true,
        skuLevelExport: true,
        history24m: true,
      };
    }

    if (planCode === 'standard') {
      return {
        aiInsights: false,
        aiChat: false,
        invoiceUpload: true,
        invoiceOcr: false,
        multiStore: true,
        fundTransfer: true,
        invoiceManagement: true,
        advancedExport: true,
        skuLevelExport: true,
        history24m: true,
      };
    }

    return {
      aiInsights: false,
      aiChat: false,
      invoiceUpload: true,
      invoiceOcr: false,
      multiStore: false,
      fundTransfer: false,
      invoiceManagement: false,
      advancedExport: false,
      skuLevelExport: false,
      history24m: false,
    };
  }

  private getDefaultLimits(planCode: PlanCodeLower): WorkspaceLimits {
    const resolved = resolveWorkspaceLimits(String(planCode || 'starter').trim().toUpperCase() as any);

    return {
      maxStores: resolved.maxStores,
      invoiceStorageMb: resolved.invoiceStorageMb,
      aiChatMonthly: resolved.aiChatMonthly,
      aiInvoiceOcrMonthly: resolved.aiInvoiceOcrMonthly,
      historyMonths: resolved.historyMonths,
    };
  }

  private buildContext(args: {
    slug: string;
    locale: string;
    companyName: string;
    planCode: PlanCodeLower;
    status: SubscriptionStatusLower;
    source: SubscriptionSource;
    entitlements: WorkspaceEntitlements;
    limits: WorkspaceLimits;
  }): WorkspaceContextValue {
    return {
      workspace: {
        slug: args.slug,
        displayName: this.prettifyWorkspaceName(args.slug),
        companyName: args.companyName,
        locale: args.locale,
      },
      subscription: {
        planCode: args.planCode,
        status: args.status,
        source: args.source,
        entitlements: args.entitlements,
        limits: args.limits,
      },
    };
  }

  private buildEffectiveLimits(ctx: WorkspaceContextValue): WorkspaceLimits {
    const planDefaults = this.getDefaultLimits(ctx.subscription.planCode);
    const raw = ctx.subscription.limits;

    if (
      ctx.subscription.source === 'db+query-override' ||
      ctx.subscription.source === 'mock-query'
    ) {
      return planDefaults;
    }

    return {
      maxStores: typeof raw?.maxStores === 'number' ? raw.maxStores : planDefaults.maxStores,
      invoiceStorageMb:
        typeof raw?.invoiceStorageMb === 'number'
          ? raw.invoiceStorageMb
          : planDefaults.invoiceStorageMb,
      aiChatMonthly:
        typeof raw?.aiChatMonthly === 'number'
          ? raw.aiChatMonthly
          : planDefaults.aiChatMonthly,
      aiInvoiceOcrMonthly:
        typeof raw?.aiInvoiceOcrMonthly === 'number'
          ? raw.aiInvoiceOcrMonthly
          : planDefaults.aiInvoiceOcrMonthly,
      historyMonths:
        typeof raw?.historyMonths === 'number'
          ? raw.historyMonths
          : planDefaults.historyMonths,
    };
  }

  private pct(used: number, limit: number): number {
    if (!limit || limit <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((used / limit) * 100)));
  }

  private currentMonthKey(): string {
    const d = new Date();
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  async getContext(
    input?: { slug?: string; plan?: string; locale?: string } | string,
    maybePlan?: string,
    maybeLocale?: string,
  ): Promise<WorkspaceContextValue> {
    const query =
      typeof input === 'string'
        ? { slug: input, plan: maybePlan, locale: maybeLocale }
        : (input || {});

    const slug = String(query.slug || 'weiwei').trim() || 'weiwei';
    const locale = String(query.locale || 'ja').trim() || 'ja';
    const queryPlan = String(query.plan || '').trim();

    const company = await this.prisma.company.findFirst({
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (!company) {
      const fallbackPlan = queryPlan
        ? this.normalizePlanCode(queryPlan)
        : 'starter';

      return this.buildContext({
        slug,
        locale,
        companyName: 'LedgerSeiri Demo Company',
        planCode: fallbackPlan,
        status: 'active',
        source: queryPlan ? 'mock-query' : 'mock-default',
        entitlements: this.getPlanEntitlements(fallbackPlan),
        limits: this.getDefaultLimits(fallbackPlan),
      });
    }

    const subscriptionRow = await this.prisma.workspaceSubscription.findUnique({
      where: {
        companyId: company.id,
      },
    });

    const dbPlan = subscriptionRow?.planCode
      ? this.normalizePlanCode(String(subscriptionRow.planCode))
      : 'starter';

    const dbStatus = subscriptionRow?.status
      ? this.normalizeStatus(String(subscriptionRow.status))
      : 'active';

    const effectivePlan = queryPlan
      ? this.normalizePlanCode(queryPlan)
      : dbPlan;

    const source: SubscriptionSource = queryPlan
      ? 'db+query-override'
      : 'db';

    const defaultLimits = this.getDefaultLimits(effectivePlan);

    const limits: WorkspaceLimits = {
      maxStores:
        typeof subscriptionRow?.maxStores === 'number'
          ? subscriptionRow.maxStores
          : defaultLimits.maxStores,
      invoiceStorageMb:
        typeof subscriptionRow?.invoiceStorageMb === 'number'
          ? subscriptionRow.invoiceStorageMb
          : defaultLimits.invoiceStorageMb,
      aiChatMonthly:
        typeof subscriptionRow?.aiChatMonthly === 'number'
          ? subscriptionRow.aiChatMonthly
          : defaultLimits.aiChatMonthly,
      aiInvoiceOcrMonthly:
        typeof subscriptionRow?.aiInvoiceOcrMonthly === 'number'
          ? subscriptionRow.aiInvoiceOcrMonthly
          : defaultLimits.aiInvoiceOcrMonthly,
      historyMonths:
        effectivePlan === 'starter' ? 12 : 24,
    };

    return this.buildContext({
      slug,
      locale,
      companyName: company.name || 'LedgerSeiri Demo Company',
      planCode: effectivePlan,
      status: dbStatus,
      source,
      entitlements: this.getPlanEntitlements(effectivePlan),
      limits,
    });
  }

  async getUsage(
    input?: { slug?: string; plan?: string; locale?: string } | string,
    maybePlan?: string,
    maybeLocale?: string,
  ): Promise<WorkspaceUsageResponse> {
    const ctx = await this.getContext(input as any, maybePlan, maybeLocale);
    const effectiveLimits = this.buildEffectiveLimits(ctx);

    const company = await this.prisma.company.findFirst({
      orderBy: {
        createdAt: 'asc',
      },
    });

    let storesUsed = 0;

    if (company) {
      storesUsed = await this.prisma.store.count({
        where: {
          companyId: company.id,
        },
      });
    }

    const usage: WorkspaceUsage = {
      storesUsed,
      invoiceStorageMbUsed: 0,
      aiChatUsedMonthly: 0,
      aiInvoiceOcrUsedMonthly: 0,
    };

    return {
      workspace: ctx.workspace,
      subscription: ctx.subscription,
      effectiveLimits,
      usage,
      utilization: {
        storesPct: this.pct(usage.storesUsed, effectiveLimits.maxStores),
        invoiceStoragePct: this.pct(usage.invoiceStorageMbUsed, effectiveLimits.invoiceStorageMb),
        aiChatPct: this.pct(usage.aiChatUsedMonthly, effectiveLimits.aiChatMonthly),
        aiInvoiceOcrPct: this.pct(
          usage.aiInvoiceOcrUsedMonthly,
          effectiveLimits.aiInvoiceOcrMonthly,
        ),
      },
      overLimit: {
        stores: usage.storesUsed > effectiveLimits.maxStores,
        invoiceStorage: usage.invoiceStorageMbUsed > effectiveLimits.invoiceStorageMb,
        aiChat: usage.aiChatUsedMonthly > effectiveLimits.aiChatMonthly,
        aiInvoiceOcr: usage.aiInvoiceOcrUsedMonthly > effectiveLimits.aiInvoiceOcrMonthly,
      },
      period: {
        monthKey: this.currentMonthKey(),
      },
    };
  }

  async resolveContext(
    input?: { slug?: string; plan?: string; locale?: string } | string,
    maybePlan?: string,
    maybeLocale?: string,
  ): Promise<WorkspaceContextValue> {
    return this.getContext(input as any, maybePlan, maybeLocale);
  }
}
