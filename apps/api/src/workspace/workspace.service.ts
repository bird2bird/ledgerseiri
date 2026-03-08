import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

type PlanCodeLower = 'starter' | 'standard' | 'premium';
type SubscriptionSource = 'db' | 'mock-default' | 'mock-query';

@Injectable()
export class WorkspaceService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizePlanCode(raw?: string | null): PlanCodeLower {
    if (!raw) return 'starter';
    const v = String(raw).toLowerCase();
    if (v === 'starter' || v === 'standard' || v === 'premium') return v;
    return 'starter';
  }

  private prettifyWorkspaceName(input?: string | null): string {
    const raw = (input || '').trim();
    if (!raw) return 'Weiwei';

    return raw
      .replace(/[-_]+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private getPlanLimits(planCode: PlanCodeLower) {
    if (planCode === 'premium') {
      return {
        maxStores: 10,
        invoiceStorageMb: 5120,
        aiChatMonthly: 50,
        aiInvoiceOcrMonthly: 100,
      };
    }

    if (planCode === 'standard') {
      return {
        maxStores: 3,
        invoiceStorageMb: 1024,
        aiChatMonthly: 0,
        aiInvoiceOcrMonthly: 0,
      };
    }

    return {
      maxStores: 1,
      invoiceStorageMb: 200,
      aiChatMonthly: 0,
      aiInvoiceOcrMonthly: 0,
    };
  }

  async getContext(args: {
    userId: string;
    slug?: string | null;
    plan?: string | null;
    locale?: string | null;
  }) {
    const user = await this.prisma.user.findUnique({
      where: { id: args.userId },
      include: {
        company: {
          include: {
            subscription: true,
          },
        },
      },
    });

    const fallbackSlug = (args.slug || 'weiwei').trim() || 'weiwei';
    const locale = args.locale || 'ja';

    let planCode: PlanCodeLower = 'starter';
    let source: SubscriptionSource = 'mock-default';

    if (user?.company?.subscription) {
      const dbPlan = String(user.company.subscription.planCode || 'STARTER').toLowerCase();
      planCode = this.normalizePlanCode(dbPlan);
      source = 'db';
    } else if (args.plan) {
      planCode = this.normalizePlanCode(args.plan);
      source = 'mock-query';
    }

    const limits = this.getPlanLimits(planCode);

    const slug = fallbackSlug;
    const displayName =
      this.prettifyWorkspaceName(slug) ||
      this.prettifyWorkspaceName(user?.email?.split('@')[0]) ||
      'Weiwei';

    return {
      workspace: {
        slug,
        displayName,
        companyName: user?.company?.name || 'LedgerSeiri Demo Company',
        locale,
      },
      subscription: {
        planCode,
        status: 'active',
        source,
        limits,
      },
    };
  }
}
