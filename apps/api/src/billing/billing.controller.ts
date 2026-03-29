import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import Stripe from 'stripe';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PrismaService } from '../prisma.service';
import { resolveWorkspaceLimits } from '../common/workspace-plan-limits';

type PlanCode = 'starter' | 'standard' | 'premium';
type PrismaPlanCode = 'STARTER' | 'STANDARD' | 'PREMIUM';
type PrismaSubscriptionStatus = 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED';

function getStripeClient(): Stripe {
  const key = String(process.env.STRIPE_SECRET_KEY || '').trim();
  if (!key) {
    throw new BadRequestException('STRIPE_NOT_CONFIGURED');
  }
  return new Stripe(key);
}

function normalizePlan(raw?: string | null): PlanCode | null {
  if (raw === 'starter' || raw === 'standard' || raw === 'premium') return raw;
  return null;
}

function normalizeLocale(raw?: string | null): string {
  const v = String(raw || 'ja').trim();
  return v || 'ja';
}

function getPriceId(plan: PlanCode): string {
  if (plan === 'starter') return process.env.STRIPE_PRICE_STARTER || '';
  if (plan === 'standard') return process.env.STRIPE_PRICE_STANDARD || '';
  return process.env.STRIPE_PRICE_PREMIUM || '';
}

function planToPrisma(plan: PlanCode): PrismaPlanCode {
  if (plan === 'starter') return 'STARTER';
  if (plan === 'standard') return 'STANDARD';
  return 'PREMIUM';
}

function priceIdToPlan(priceId?: string | null): PlanCode {
  const starter = process.env.STRIPE_PRICE_STARTER || '';
  const standard = process.env.STRIPE_PRICE_STANDARD || '';
  const premium = process.env.STRIPE_PRICE_PREMIUM || '';

  if (priceId && premium && priceId === premium) return 'premium';
  if (priceId && standard && priceId === standard) return 'standard';
  if (priceId && starter && priceId === starter) return 'starter';
  return 'starter';
}

function stripeStatusToPrisma(status?: string | null): PrismaSubscriptionStatus {
  const v = String(status || '').toLowerCase();
  if (v === 'trialing') return 'TRIALING';
  if (v === 'past_due' || v === 'unpaid') return 'PAST_DUE';
  if (v === 'canceled' || v === 'cancelled' || v === 'incomplete_expired') {
    return 'CANCELED';
  }
  return 'ACTIVE';
}

function planLimits(plan: PlanCode) {
  const resolved = resolveWorkspaceLimits(String(plan || 'starter').trim().toUpperCase() as any);

  return {
    maxStores: resolved.maxStores,
    invoiceStorageMb: resolved.invoiceStorageMb,
    aiChatMonthly: resolved.aiChatMonthly,
    aiInvoiceOcrMonthly: resolved.aiInvoiceOcrMonthly,
  };
}

type StripeSubLike = Stripe.Subscription | null;

function subscriptionRank(status?: string | null): number {
  const v = String(status || '').toLowerCase();
  if (v === 'active') return 100;
  if (v === 'trialing') return 95;
  if (v === 'past_due') return 80;
  if (v === 'unpaid') return 70;
  if (v === 'incomplete') return 60;
  if (v === 'canceled' || v === 'cancelled') return 20;
  if (v === 'incomplete_expired') return 10;
  return 0;
}

function sortSubscriptionsForCurrent(subs: Stripe.Subscription[]): Stripe.Subscription[] {
  return [...subs].sort((a, b) => {
    const rankDiff = subscriptionRank(b.status) - subscriptionRank(a.status);
    if (rankDiff !== 0) return rankDiff;
    return (b.created || 0) - (a.created || 0);
  });
}

async function resolveCurrentSubscriptionForCustomer(
  stripe: Stripe,
  customerId?: string | null,
  fallbackSubscriptionId?: string | null,
): Promise<StripeSubLike> {
  const cid = String(customerId || '').trim();
  const sid = String(fallbackSubscriptionId || '').trim();

  let candidates: Stripe.Subscription[] = [];

  if (cid) {
    const list = await stripe.subscriptions.list({
      customer: cid,
      status: 'all',
      limit: 20,
    });
    candidates = list.data || [];
  }

  if (!candidates.length && sid) {
    try {
      const sub = await stripe.subscriptions.retrieve(sid);
      return sub;
    } catch {
      return null;
    }
  }

  if (!candidates.length) {
    return null;
  }

  return sortSubscriptionsForCurrent(candidates)[0] ?? null;
}

@Controller('api/billing')
export class BillingController {
  constructor(private readonly prisma: PrismaService) {}

  @UseGuards(JwtAuthGuard)
  @Post('checkout-session')
  async createCheckoutSession(
    @Req() req: any,
    @Body()
    body?: {
      targetPlan?: string;
      currentPlan?: string;
      locale?: string;
    },
  ) {
    const companyId = String(req?.user?.companyId || '').trim();
    if (!companyId) {
      throw new UnauthorizedException('COMPANY_CONTEXT_REQUIRED');
    }

    const targetPlan = normalizePlan(body?.targetPlan) ?? 'standard';
    const locale = normalizeLocale(body?.locale);
    const priceId = getPriceId(targetPlan);

    if (!priceId) {
      throw new BadRequestException('PRICE_ID_NOT_CONFIGURED');
    }

    const existing = await this.prisma.workspaceSubscription.findUnique({
      where: { companyId },
      select: {
        stripeCustomerId: true,
      },
    });

    const successUrl =
      `${process.env.APP_URL || 'http://localhost:3000'}` +
      `/${locale}/app/billing?checkout=success`;
    const cancelUrl =
      `${process.env.APP_URL || 'http://localhost:3000'}` +
      `/${locale}/app/billing/change?target=${targetPlan}`;

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer: existing?.stripeCustomerId || undefined,
      client_reference_id: companyId,
      metadata: {
        companyId,
        targetPlan,
      },
      subscription_data: {
        metadata: {
          companyId,
          targetPlan,
        },
      },
      allow_promotion_codes: true,
    });

    return {
      ok: true,
      url: session.url,
      action: 'checkout-session',
      targetPlan,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('portal-session')
  async createPortalSession(@Req() req: any, @Query('locale') locale?: string) {
    const companyId = String(req?.user?.companyId || '').trim();
    if (!companyId) {
      throw new UnauthorizedException('COMPANY_CONTEXT_REQUIRED');
    }

    const resolvedLocale = normalizeLocale(locale);

    const existing = await this.prisma.workspaceSubscription.findUnique({
      where: { companyId },
      select: {
        stripeCustomerId: true,
      },
    });

    if (!existing?.stripeCustomerId) {
      throw new BadRequestException('STRIPE_CUSTOMER_NOT_FOUND');
    }

    const stripe = getStripeClient();
    const portal = await stripe.billingPortal.sessions.create({
      customer: existing.stripeCustomerId,
      return_url:
        `${process.env.APP_URL || 'http://localhost:3000'}` +
        `/${resolvedLocale}/app/billing`,
    });

    return {
      ok: true,
      url: portal.url,
      action: 'portal-session',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('sync')
  async syncSubscription(@Req() req: any) {
    const companyId = String(req?.user?.companyId || '').trim();
    if (!companyId) {
      throw new UnauthorizedException('COMPANY_CONTEXT_REQUIRED');
    }

    const existing = await this.prisma.workspaceSubscription.findUnique({
      where: { companyId },
    });

    if (!existing?.stripeCustomerId && !existing?.stripeSubscriptionId) {
      throw new BadRequestException('STRIPE_SUBSCRIPTION_NOT_LINKED');
    }

    const stripe = getStripeClient();
    const sub = await resolveCurrentSubscriptionForCustomer(
      stripe,
      existing?.stripeCustomerId || null,
      existing?.stripeSubscriptionId || null,
    );

    if (!sub) {
      throw new BadRequestException('STRIPE_SUBSCRIPTION_NOT_FOUND');
    }

    const stripePriceId = sub.items.data[0]?.price?.id || null;
    const plan = priceIdToPlan(stripePriceId);
    const status = stripeStatusToPrisma(sub.status);
    const currentPeriodEnd = (sub as any).current_period_end
      ? new Date((sub as any).current_period_end * 1000)
      : null;
    const limits = planLimits(plan);

    const updated = await this.prisma.workspaceSubscription.update({
      where: { companyId },
      data: {
        planCode: planToPrisma(plan),
        status,
        currentPeriodEnd,
        maxStores: limits.maxStores,
        invoiceStorageMb: limits.invoiceStorageMb,
        aiChatMonthly: limits.aiChatMonthly,
        aiInvoiceOcrMonthly: limits.aiInvoiceOcrMonthly,
        stripeCustomerId:
          typeof sub.customer === 'string' ? sub.customer : sub.customer?.id || null,
        stripeSubscriptionId: sub.id,
        stripePriceId,
      },
    });

    console.log('[billing.sync] synced subscription', {
      companyId,
      stripeSubscriptionId: updated.stripeSubscriptionId,
      stripePriceId: updated.stripePriceId,
      planCode: updated.planCode,
      status: updated.status,
    });

    return {
      ok: true,
      companyId: updated.companyId,
      planCode: updated.planCode,
      status: updated.status,
      stripeCustomerId: updated.stripeCustomerId,
      stripeSubscriptionId: updated.stripeSubscriptionId,
      stripePriceId: updated.stripePriceId,
    };
  }

  @Post('webhook')
  async handleWebhook(
    @Req() req: any,
    @Headers('stripe-signature') signature?: string,
  ) {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    if (!endpointSecret) {
      throw new BadRequestException('STRIPE_WEBHOOK_SECRET_NOT_CONFIGURED');
    }
    if (!signature) {
      throw new BadRequestException('STRIPE_SIGNATURE_MISSING');
    }

    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException('RAW_BODY_MISSING');
    }

    const stripe = getStripeClient();
    const event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);

    console.log('[billing.webhook] received', {
      id: event.id,
      type: event.type,
    });

    const trackedEventTypes = new Set([
      'checkout.session.completed',
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'invoice.paid',
      'invoice.payment_failed',
    ]);

    const shouldTrackEvent = trackedEventTypes.has(event.type);

    if (!shouldTrackEvent) {
      console.log('[billing.webhook] ignored non-billing event', {
        id: event.id,
        type: event.type,
      });
      return { received: true, ignored: true };
    }

    const existingWebhookEvent = await this.prisma.billingWebhookEvent.findUnique({
      where: { id: event.id },
    });

    if (existingWebhookEvent?.processedAt) {
      console.log('[billing.webhook] duplicate event ignored', {
        id: event.id,
        type: event.type,
      });
      return { received: true, duplicate: true };
    }

    await this.prisma.billingWebhookEvent.upsert({
      where: { id: event.id },
      create: {
        id: event.id,
        type: event.type,
        source: 'stripe',
      },
      update: {
        type: event.type,
      },
    });

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        const companyId = String(
          session.metadata?.companyId || session.client_reference_id || '',
        ).trim();

        if (!companyId) {
          break;
        }

        const stripeCustomerId = String(session.customer || '').trim();
        const fallbackSubscriptionId = String(session.subscription || '').trim();

        const sub = await resolveCurrentSubscriptionForCustomer(
          stripe,
          stripeCustomerId || null,
          fallbackSubscriptionId || null,
        );

        let plan: PlanCode = normalizePlan(session.metadata?.targetPlan) || 'starter';
        let stripePriceId: string | null = null;
        let status: PrismaSubscriptionStatus = 'ACTIVE';
        let currentPeriodEnd: Date | null = null;
        let finalSubscriptionId: string | null = fallbackSubscriptionId || null;
        let finalCustomerId: string | null = stripeCustomerId || null;

        if (sub) {
          stripePriceId = sub.items.data[0]?.price?.id || null;
          plan = priceIdToPlan(stripePriceId);
          status = stripeStatusToPrisma(sub.status);
          currentPeriodEnd = (sub as any).current_period_end
            ? new Date((sub as any).current_period_end * 1000)
            : null;
          finalSubscriptionId = sub.id;
          finalCustomerId =
            typeof sub.customer === 'string' ? sub.customer : sub.customer?.id || null;
        }

        const limits = planLimits(plan);

        await this.prisma.workspaceSubscription.upsert({
          where: { companyId },
          create: {
            companyId,
            planCode: planToPrisma(plan),
            status,
            currentPeriodEnd,
            maxStores: limits.maxStores,
            invoiceStorageMb: limits.invoiceStorageMb,
            aiChatMonthly: limits.aiChatMonthly,
            aiInvoiceOcrMonthly: limits.aiInvoiceOcrMonthly,
            stripeCustomerId: finalCustomerId,
            stripeSubscriptionId: finalSubscriptionId,
            stripePriceId,
          },
          update: {
            planCode: planToPrisma(plan),
            status,
            currentPeriodEnd,
            maxStores: limits.maxStores,
            invoiceStorageMb: limits.invoiceStorageMb,
            aiChatMonthly: limits.aiChatMonthly,
            aiInvoiceOcrMonthly: limits.aiInvoiceOcrMonthly,
            stripeCustomerId: finalCustomerId,
            stripeSubscriptionId: finalSubscriptionId,
            stripePriceId,
          },
        });

        console.log('[billing.webhook] checkout.session.completed synced', {
          companyId,
          stripeCustomerId: finalCustomerId,
          stripeSubscriptionId: finalSubscriptionId,
          stripePriceId,
          plan,
          status,
        });

        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;

        const stripeSubscriptionId = String(sub.id || '').trim();
        const stripeCustomerId = String(sub.customer || '').trim();
        const stripePriceId = sub.items.data[0]?.price?.id || null;
        const plan = priceIdToPlan(stripePriceId);
        const status = stripeStatusToPrisma(sub.status);
        const currentPeriodEnd = (sub as any).current_period_end
          ? new Date((sub as any).current_period_end * 1000)
          : null;

        let existing = null as null | { companyId: string };

        if (stripeSubscriptionId) {
          existing = await this.prisma.workspaceSubscription.findFirst({
            where: { stripeSubscriptionId },
            select: { companyId: true },
          });
        }

        if (!existing && stripeCustomerId) {
          existing = await this.prisma.workspaceSubscription.findFirst({
            where: { stripeCustomerId },
            select: { companyId: true },
          });
        }

        const companyId = String(
          existing?.companyId || sub.metadata?.companyId || '',
        ).trim();

        if (!companyId) {
          break;
        }

        const limits = planLimits(plan);

        await this.prisma.workspaceSubscription.upsert({
          where: { companyId },
          create: {
            companyId,
            planCode: planToPrisma(plan),
            status,
            currentPeriodEnd,
            maxStores: limits.maxStores,
            invoiceStorageMb: limits.invoiceStorageMb,
            aiChatMonthly: limits.aiChatMonthly,
            aiInvoiceOcrMonthly: limits.aiInvoiceOcrMonthly,
            stripeCustomerId: stripeCustomerId || null,
            stripeSubscriptionId: stripeSubscriptionId || null,
            stripePriceId,
          },
          update: {
            planCode: planToPrisma(plan),
            status,
            currentPeriodEnd,
            maxStores: limits.maxStores,
            invoiceStorageMb: limits.invoiceStorageMb,
            aiChatMonthly: limits.aiChatMonthly,
            aiInvoiceOcrMonthly: limits.aiInvoiceOcrMonthly,
            stripeCustomerId: stripeCustomerId || null,
            stripeSubscriptionId: stripeSubscriptionId || null,
            stripePriceId,
          },
        });

        console.log('[billing.webhook] customer.subscription synced', {
          companyId,
          stripeCustomerId,
          stripeSubscriptionId,
          stripePriceId,
          plan,
          status,
          type: event.type,
        });

        break;
      }

      case 'invoice.paid':
      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;

        const stripeSubscriptionId =
          typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription?.id || '';

        const stripeCustomerId =
          typeof invoice.customer === 'string'
            ? invoice.customer
            : invoice.customer?.id || '';

        if (!stripeSubscriptionId && !stripeCustomerId) {
          break;
        }

        const sub = await resolveCurrentSubscriptionForCustomer(
          stripe,
          stripeCustomerId || null,
          stripeSubscriptionId || null,
        );

        if (!sub) {
          break;
        }

        let existing = null as null | { companyId: string };

        if (sub.id) {
          existing = await this.prisma.workspaceSubscription.findFirst({
            where: { stripeSubscriptionId: sub.id },
            select: { companyId: true },
          });
        }

        if (!existing && stripeCustomerId) {
          existing = await this.prisma.workspaceSubscription.findFirst({
            where: { stripeCustomerId },
            select: { companyId: true },
          });
        }

        const companyId = String(existing?.companyId || sub.metadata?.companyId || '').trim();
        if (!companyId) {
          break;
        }

        const stripePriceId = sub.items.data[0]?.price?.id || null;
        const plan = priceIdToPlan(stripePriceId);
        const status = stripeStatusToPrisma(sub.status);
        const currentPeriodEnd = (sub as any).current_period_end
          ? new Date((sub as any).current_period_end * 1000)
          : null;
        const limits = planLimits(plan);

        await this.prisma.workspaceSubscription.upsert({
          where: { companyId },
          create: {
            companyId,
            planCode: planToPrisma(plan),
            status,
            currentPeriodEnd,
            maxStores: limits.maxStores,
            invoiceStorageMb: limits.invoiceStorageMb,
            aiChatMonthly: limits.aiChatMonthly,
            aiInvoiceOcrMonthly: limits.aiInvoiceOcrMonthly,
            stripeCustomerId:
              typeof sub.customer === 'string' ? sub.customer : sub.customer?.id || null,
            stripeSubscriptionId: sub.id,
            stripePriceId,
          },
          update: {
            planCode: planToPrisma(plan),
            status,
            currentPeriodEnd,
            maxStores: limits.maxStores,
            invoiceStorageMb: limits.invoiceStorageMb,
            aiChatMonthly: limits.aiChatMonthly,
            aiInvoiceOcrMonthly: limits.aiInvoiceOcrMonthly,
            stripeCustomerId:
              typeof sub.customer === 'string' ? sub.customer : sub.customer?.id || null,
            stripeSubscriptionId: sub.id,
            stripePriceId,
          },
        });

        console.log('[billing.webhook] invoice synced', {
          companyId,
          stripeSubscriptionId: sub.id,
          stripePriceId,
          plan,
          status,
          type: event.type,
        });

        break;
      }

      default:
        break;
    }

    await this.prisma.billingWebhookEvent.update({
      where: { id: event.id },
      data: { processedAt: new Date() },
    });

    return { received: true };
  }
}
