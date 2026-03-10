import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

type PlanCodeLower = 'starter' | 'standard' | 'premium';
type SubscriptionStatusLower = 'active' | 'trialing' | 'past_due' | 'canceled';

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
    source: 'db' | 'db+query-override' | 'mock-default' | 'mock-query';
    entitlements: WorkspaceEntitlements;
    limits: {
      maxStores: number;
      invoiceStorageMb: number;
      aiChatMonthly: number;
      aiInvoiceOcrMonthly: number;
      historyMonths: number;
    };
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

  private getDefaultLimits(planCode: PlanCodeLower) {
    if (planCode === 'premium') {
      return {
        maxStores: 10,
        invoiceStorageMb: 5 * 1024,
        aiChatMonthly: 50,
        aiInvoiceOcrMonthly: 100,
        historyMonths: 24,
      };
    }

    if (planCode === 'standard') {
      return {
        maxStores: 3,
        invoiceStorageMb: 1024,
        aiChatMonthly: 0,
        aiInvoiceOcrMonthly: 0,
        historyMonths: 24,
      };
    }

    return {
      maxStores: 1,
      invoiceStorageMb: 200,
      aiChatMonthly: 0,
      aiInvoiceOcrMonthly: 0,
      historyMonths: 12,
    };
  }

  private buildContext(args: {
    slug: string;
    locale: string;
    companyName: string;
    planCode: PlanCodeLower;
    status: SubscriptionStatusLower;
    source: 'db' | 'db+query-override' | 'mock-default' | 'mock-query';
    entitlements: WorkspaceEntitlements;
    limits: {
      maxStores: number;
      invoiceStorageMb: number;
      aiChatMonthly: number;
      aiInvoiceOcrMonthly: number;
      historyMonths: number;
    };
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

    // Temporary production-safe resolution:
    // use the first company as workspace source of truth.
    // Later this will be replaced by real workspace-slug -> company mapping.
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

    const source: WorkspaceContextValue['subscription']['source'] = queryPlan
      ? 'db+query-override'
      : 'db';

    const defaultLimits = this.getDefaultLimits(effectivePlan);

    const limits = {
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

  async resolveContext(
    input?: { slug?: string; plan?: string; locale?: string } | string,
    maybePlan?: string,
    maybeLocale?: string,
  ): Promise<WorkspaceContextValue> {
    return this.getContext(input as any, maybePlan, maybeLocale);
  }
}
