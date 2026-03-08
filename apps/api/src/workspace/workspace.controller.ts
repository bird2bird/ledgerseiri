import { Controller, Get, Query } from '@nestjs/common';

type PlanCode = 'starter' | 'standard' | 'premium';

function normalizePlanCode(raw?: string): PlanCode {
  if (raw === 'starter' || raw === 'standard' || raw === 'premium') return raw;
  return 'starter';
}

function prettifyWorkspaceName(input?: string): string {
  const raw = (input || '').trim();
  if (!raw) return 'Weiwei';

  return raw
    .replace(/[-_]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function limitsByPlan(planCode: PlanCode) {
  if (planCode === 'premium') {
    return {
      maxStores: 10,
      invoiceStorageMb: 5120,
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
    historyMonths: 6,
  };
}

@Controller('workspace')
export class WorkspaceController {
  @Get('context')
  getContext(
    @Query('slug') slug?: string,
    @Query('plan') plan?: string,
    @Query('locale') locale?: string,
  ) {
    const resolvedSlug = (slug || 'weiwei').trim() || 'weiwei';
    const displayName = prettifyWorkspaceName(resolvedSlug);
    const planCode = normalizePlanCode(plan);

    return {
      workspace: {
        slug: resolvedSlug,
        displayName,
        companyName: 'LedgerSeiri Demo Company',
        locale: locale || 'ja',
      },
      subscription: {
        planCode,
        status: 'active',
        source: plan ? 'mock-query' : 'db',
        limits: limitsByPlan(planCode),
      },
    };
  }
}
