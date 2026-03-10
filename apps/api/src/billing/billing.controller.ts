import { Body, Controller, Get, Post, Query } from '@nestjs/common';

type PlanCode = 'starter' | 'standard' | 'premium';

function normalizePlan(raw?: string | null): PlanCode | null {
  if (raw === 'starter' || raw === 'standard' || raw === 'premium') return raw;
  return null;
}

function normalizeLocale(raw?: string | null): string {
  const v = String(raw || 'ja').trim();
  return v || 'ja';
}

@Controller('billing')
export class BillingController {
  @Post('checkout-session')
  createCheckoutSession(
    @Body()
    body?: {
      targetPlan?: string;
      currentPlan?: string;
      locale?: string;
    },
  ) {
    const targetPlan = normalizePlan(body?.targetPlan) ?? 'standard';
    const currentPlan = normalizePlan(body?.currentPlan) ?? 'starter';
    const locale = normalizeLocale(body?.locale);

    return {
      ok: true,
      mode: 'stub',
      action: 'checkout-session',
      targetPlan,
      currentPlan,
      redirectPath: `/${locale}/app/billing/checkout?target=${targetPlan}&current=${currentPlan}`,
      message: 'Stub checkout session created. Replace with Stripe/KOMOJU in Step 40.',
    };
  }

  @Get('portal-session')
  createPortalSession(@Query('locale') locale?: string) {
    const resolvedLocale = normalizeLocale(locale);

    return {
      ok: true,
      mode: 'stub',
      action: 'portal-session',
      redirectPath: `/${resolvedLocale}/app/billing/portal`,
      message: 'Stub billing portal session created. Replace with real billing portal in Step 40.',
    };
  }
}
