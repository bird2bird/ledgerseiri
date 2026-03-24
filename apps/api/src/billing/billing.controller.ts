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

type PlanCode = 'starter' | 'standard' | 'premium';
type PrismaPlanCode = 'STARTER' | 'STANDARD' | 'PREMIUM';
type PrismaSubscriptionStatus = 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

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
  return 'starter';
}

function stripeStatusToPrisma(status?: string | null): PrismaSubscriptionStatus {
  const v = String(status || '').toLowerCase();
  if (v === 'trialing') return 'TRIALING';
  if (v === 'past_due' || v === 'unpaid') return 'PAST_DUE';
  if (
    v === 'canceled' ||
    v === 'cancelled' ||
    v === 'incomplete_expired'
  ) {
    return 'CANCELED';
  }
  return 'ACTIVE';
}

function planLimits(plan: PlanCode) {
  if (plan === 'premium') {
    return {
      maxStores: 10,
      invoiceStorageMb: 5 * 1024,
      aiChatMonthly: 50,
      aiInvoiceOcrMonthly: 100,
    };
  }

  if (plan === 'standard') {
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

@Controller('billing')
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

    const event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const companyId =
          String(session.metadata?.companyId || session.client_reference_id || '').trim();
        const stripeCustomerId = String(session.customer || '').trim();
        const stripeSubscriptionId = String(session.subscription || '').trim();

        if (!companyId) {
          break;
        }

        let plan: PlanCode = normalizePlan(session.metadata?.targetPlan) || 'starter';
        let currentPeriodEnd: Date | null = null;
        let stripePriceId: string | null = null;
        let status: PrismaSubscriptionStatus = 'ACTIVE';

        if (stripeSubscriptionId) {
          const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
          const item = sub.items.data[0];
          stripePriceId = item?.price?.id || null;
          plan = priceIdToPlan(stripePriceId);
          status = stripeStatusToPrisma(sub.status);
          currentPeriodEnd = (sub as any).current_period_end
            ? new Date((sub as any).current_period_end * 1000)
            : null;
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

        let existing = null;

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
          existing?.companyId || sub.metadata?.companyId || ''
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

        break;
      }

      default:
        break;
    }

    return { received: true };
  }
}
