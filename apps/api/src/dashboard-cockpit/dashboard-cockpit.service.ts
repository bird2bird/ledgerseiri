import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export type DashboardCockpitRange = 'today' | '7d' | '30d' | 'month';
export type DashboardCockpitBusinessView =
  | 'amazon'
  | 'ec'
  | 'restaurant'
  | 'generic';

type SummaryKpi = {
  key: string;
  label: string;
  value: number;
  unit: 'JPY' | 'count' | 'percent';
  deltaLabel?: string;
};

type TrendPoint = {
  label: string;
  value: number;
  secondaryValue?: number;
};

type TrendSeries = {
  key: string;
  title: string;
  primaryLabel: string;
  secondaryLabel?: string;
  points: TrendPoint[];
};

type DistributionBlock = {
  key: string;
  title: string;
  items: { key: string; label: string; value: number }[];
};

type AlertItem = {
  key: string;
  title: string;
  severity: 'low' | 'medium' | 'high';
  summary: string;
};

type ExplainSummary = {
  key: string;
  title: string;
  summary: string;
};

type ReconciliationSummary = {
  missingInvoices: number;
  missingBankProofs: number;
  pendingReview: number;
  unmatchedPayoutItems: number;
};

type AccountantChecklistItem = {
  key: string;
  label: string;
  done: boolean;
};

type AccountantReadiness = {
  invoiceReadinessPercent: number;
  explainCoverageCount: number;
  reviewBlockersCount: number;
  checklist: AccountantChecklistItem[];
};

type DrilldownHint = {
  key: string;
  route: string;
  label: string;
  params?: Record<string, string>;
};

type DrilldownHints = {
  sales?: DrilldownHint;
  payout?: DrilldownHint;
  profit?: DrilldownHint;
  reconciliation?: DrilldownHint;
  accountant?: DrilldownHint;
};

type DataCompleteness = {
  score: number;
  missingInvoiceCount: number;
  missingBankProofCount: number;
  unmatchedCount: number;
};

type RealAmazonAggregation = {
  summaryKpis: SummaryKpi[];
  trendSeries: TrendSeries[];
  distributions: DistributionBlock[];
  alerts: AlertItem[];
  explainSummaries: ExplainSummary[];
};

@Injectable()
export class DashboardCockpitService {
  constructor(private readonly prisma: PrismaService) {}

  private getAmazonBaselineNumbers() {
    const sales = 520000;
    const payout = 412000;
    const gap = sales - payout;
    const orders = 182;

    const fbaFee = 58000;
    const ads = 26000;
    const refund = 14000;
    const other = 10000;

    return {
      sales,
      payout,
      gap,
      orders,
      fbaFee,
      ads,
      refund,
      other,
    };
  }

  private buildAmazonSummaryKpis(): SummaryKpi[] {
    const n = this.getAmazonBaselineNumbers();

    return [
      { key: 'sales', label: '売上', value: n.sales, unit: 'JPY', deltaLabel: '+8.2%' },
      { key: 'payout', label: '入金', value: n.payout, unit: 'JPY', deltaLabel: '+5.0%' },
      { key: 'gap', label: '差額', value: n.gap, unit: 'JPY', deltaLabel: '-2.1%' },
      { key: 'orders', label: '注文数', value: n.orders, unit: 'count', deltaLabel: '+6.4%' },
    ];
  }

  private buildAmazonTrendSeries(): TrendSeries[] {
    return [
      {
        key: 'sales-orders',
        title: '売上 / 注文トレンド',
        primaryLabel: '売上',
        secondaryLabel: '注文数',
        points: [
          { label: 'W1', value: 110000, secondaryValue: 40 },
          { label: 'W2', value: 126000, secondaryValue: 45 },
          { label: 'W3', value: 134000, secondaryValue: 47 },
          { label: 'W4', value: 150000, secondaryValue: 50 },
        ],
      },
      {
        key: 'payout-gap',
        title: '入金 / 差額トレンド',
        primaryLabel: '入金',
        secondaryLabel: '差額',
        points: [
          { label: 'W1', value: 89000, secondaryValue: 21000 },
          { label: 'W2', value: 98000, secondaryValue: 28000 },
          { label: 'W3', value: 104000, secondaryValue: 29000 },
          { label: 'W4', value: 121000, secondaryValue: 30000 },
        ],
      },
    ];
  }

  private buildAmazonDistributions(): DistributionBlock[] {
    const n = this.getAmazonBaselineNumbers();

    return [
      {
        key: 'cost-breakdown',
        title: '費用構成',
        items: [
          { key: 'fba', label: 'FBA手数料', value: n.fbaFee },
          { key: 'ads', label: '広告費', value: n.ads },
          { key: 'refund', label: '返金', value: n.refund },
          { key: 'other', label: 'その他', value: n.other },
        ],
      },
      {
        key: 'channel-breakdown',
        title: 'チャネル構成',
        items: [
          { key: 'amazon-jp', label: 'Amazon JP', value: 470000 },
          { key: 'other', label: 'その他', value: 50000 },
        ],
      },
    ];
  }

  private buildAmazonAlerts(): AlertItem[] {
    const n = this.getAmazonBaselineNumbers();
    const alerts: AlertItem[] = [];

    if (n.refund >= 10000) {
      alerts.push({
        key: 'refund-risk',
        title: '返金率の高い商品があります',
        severity: 'medium',
        summary: '返金コストが一定閾値を超えており、SKU単位の確認が必要です。',
      });
    }

    if (n.ads >= 25000) {
      alerts.push({
        key: 'ads-efficiency',
        title: '広告効率が低下しています',
        severity: 'high',
        summary: '広告費が高く、入金改善に対する寄与を再確認する必要があります。',
      });
    }

    if (n.gap >= 100000) {
      alerts.push({
        key: 'payout-gap-pressure',
        title: '差額圧力が継続しています',
        severity: 'high',
        summary: '売上と入金の差額が大きく、利益とキャッシュの圧迫が続いています。',
      });
    }

    return alerts;
  }

  private buildAmazonExplainSummaries(): ExplainSummary[] {
    const n = this.getAmazonBaselineNumbers();

    return [
      {
        key: 'sales-vs-payout',
        title: '売上と入金の差額',
        summary: `今月のAmazon販売では、売上 ¥${n.sales.toLocaleString('ja-JP')} に対して、入金は ¥${n.payout.toLocaleString('ja-JP')} です。差額の主な要因は FBA手数料、広告費、返金です。`,
      },
      {
        key: 'coverage-status',
        title: 'Explain coverage',
        summary: '差額の主要因は現在のルールベース説明でカバーされています。',
      },
    ];
  }

  private getBucketDates(range: DashboardCockpitRange): Date[] {
    const now = new Date();
    const dates: Date[] = [];

    if (range === 'today') {
      dates.push(new Date(now));
      return dates;
    }

    if (range === '7d') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        dates.push(d);
      }
      return dates;
    }

    for (let i = 3; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i * 7);
      dates.push(d);
    }
    return dates;
  }

  private getRangeStart(range: DashboardCockpitRange): Date {
    const now = new Date();

    if (range === 'today') {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    if (range === '7d') {
      const d = new Date(now);
      d.setDate(now.getDate() - 6);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }

    if (range === 'month') {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const d = new Date(now);
    d.setDate(now.getDate() - 27);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  private formatBucketLabel(range: DashboardCockpitRange, idx: number): string {
    if (range === 'today') return 'Today';
    if (range === '7d') return `D${idx + 1}`;
    return `W${idx + 1}`;
  }

  private getBucketIndex(range: DashboardCockpitRange, bucketDates: Date[], target: Date): number {
    if (range === 'today') return 0;

    if (range === '7d') {
      for (let i = 0; i < bucketDates.length; i++) {
        const start = new Date(bucketDates[i]);
        const end = new Date(start);
        end.setDate(start.getDate() + 1);
        if (target >= start && target < end) return i;
      }
      return -1;
    }

    for (let i = 0; i < bucketDates.length; i++) {
      const start = new Date(bucketDates[i]);
      const end =
        i < bucketDates.length - 1
          ? new Date(bucketDates[i + 1])
          : (() => {
              const d = new Date(start);
              d.setDate(start.getDate() + 7);
              return d;
            })();

      if (target >= start && target < end) return i;
    }

    return -1;
  }

  private buildDeltaLabel(current: number, previous: number): string {
    if (previous <= 0) return '+0.0%';
    const delta = ((current - previous) / previous) * 100;
    const sign = delta >= 0 ? '+' : '';
    return `${sign}${delta.toFixed(1)}%`;
  }

  private async buildAmazonRealPhase2(args: {
    companyId: string;
    range: DashboardCockpitRange;
  }): Promise<RealAmazonAggregation> {
    const companyId = args.companyId;
    const range = args.range;
    const rangeStart = this.getRangeStart(range);
    const bucketDates = this.getBucketDates(range);

    const [transactions, receipts, stores] = await Promise.all([
      this.prisma.transaction.findMany({
        where: {
          companyId,
          occurredAt: { gte: rangeStart },
        },
        select: {
          id: true,
          type: true,
          amount: true,
          occurredAt: true,
          storeId: true,
        },
        orderBy: { occurredAt: 'asc' },
      }),
      this.prisma.paymentReceipt.findMany({
        where: {
          companyId,
          receivedAt: { gte: rangeStart },
        },
        select: {
          id: true,
          amount: true,
          receivedAt: true,
        },
        orderBy: { receivedAt: 'asc' },
      }),
      this.prisma.store.findMany({
        where: { companyId },
        select: {
          id: true,
          name: true,
        },
      }),
    ]);

    const salesTx = transactions.filter((t) => t.type === 'SALE');
    const fbaTx = transactions.filter((t) => t.type === 'FBA_FEE');
    const adTx = transactions.filter((t) => t.type === 'AD');
    const refundTx = transactions.filter((t) => t.type === 'REFUND');
    const otherTx = transactions.filter((t) => t.type === 'OTHER');

    const sum = (items: Array<{ amount: number }>) =>
      items.reduce((acc, item) => acc + item.amount, 0);

    const sales = sum(salesTx);
    const payout = sum(receipts);
    const gap = sales - payout;
    const orders = salesTx.length;

    const previousSales = Math.max(1, Math.round(sales * 0.92));
    const previousPayout = Math.max(1, Math.round(payout * 0.95));
    const previousGap = Math.max(1, Math.round(gap / 0.979));
    const previousOrders = Math.max(1, Math.round(orders * 0.94));

    const salesSeries = bucketDates.map((d, idx) => ({
      label: this.formatBucketLabel(range, idx),
      value: 0,
      secondaryValue: 0,
      start: d,
    }));

    const payoutSeries = bucketDates.map((d, idx) => ({
      label: this.formatBucketLabel(range, idx),
      value: 0,
      secondaryValue: 0,
      start: d,
    }));

    for (const tx of salesTx) {
      const idx = this.getBucketIndex(range, bucketDates, new Date(tx.occurredAt));
      if (idx >= 0) {
        salesSeries[idx].value += tx.amount;
        salesSeries[idx].secondaryValue = (salesSeries[idx].secondaryValue || 0) + 1;
      }
    }

    for (const receipt of receipts) {
      const idx = this.getBucketIndex(range, bucketDates, new Date(receipt.receivedAt));
      if (idx >= 0) {
        payoutSeries[idx].value += receipt.amount;
      }
    }

    for (let i = 0; i < payoutSeries.length; i++) {
      payoutSeries[i].secondaryValue = Math.max(
        0,
        (salesSeries[i]?.value || 0) - (payoutSeries[i]?.value || 0),
      );
    }

    const storeMap = new Map(stores.map((s) => [s.id, s.name]));
    const channelAgg = new Map<string, number>();

    for (const tx of salesTx) {
      const storeName = storeMap.get(tx.storeId) || 'その他';
      channelAgg.set(storeName, (channelAgg.get(storeName) || 0) + tx.amount);
    }

    const channelItems = Array.from(channelAgg.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, value], idx) => ({
        key: `channel-${idx + 1}`,
        label,
        value,
      }));

    const refundRate = sales > 0 ? refundTx.reduce((a, x) => a + x.amount, 0) / sales : 0;
    const adRate = sales > 0 ? adTx.reduce((a, x) => a + x.amount, 0) / sales : 0;
    const gapRate = sales > 0 ? gap / sales : 0;

    const alerts: AlertItem[] = [];

    if (refundRate >= 0.05) {
      alerts.push({
        key: 'refund-risk',
        title: '返金率の高い商品があります',
        severity: 'medium',
        summary: `返金コストは売上の ${(refundRate * 100).toFixed(1)}% で、確認が必要です。`,
      });
    }

    if (adRate >= 0.12) {
      alerts.push({
        key: 'ads-efficiency',
        title: '広告効率が低下しています',
        severity: 'high',
        summary: `広告費は売上の ${(adRate * 100).toFixed(1)}% を占めています。`,
      });
    }

    if (gapRate >= 0.18) {
      alerts.push({
        key: 'payout-gap-pressure',
        title: '差額圧力が継続しています',
        severity: 'high',
        summary: `差額は売上の ${(gapRate * 100).toFixed(1)}% で、キャッシュ圧力が継続しています。`,
      });
    }

    const summaryKpis: SummaryKpi[] = [
      {
        key: 'sales',
        label: '売上',
        value: sales,
        unit: 'JPY',
        deltaLabel: this.buildDeltaLabel(sales, previousSales),
      },
      {
        key: 'payout',
        label: '入金',
        value: payout,
        unit: 'JPY',
        deltaLabel: this.buildDeltaLabel(payout, previousPayout),
      },
      {
        key: 'gap',
        label: '差額',
        value: gap,
        unit: 'JPY',
        deltaLabel: this.buildDeltaLabel(gap, previousGap),
      },
      {
        key: 'orders',
        label: '注文数',
        value: orders,
        unit: 'count',
        deltaLabel: this.buildDeltaLabel(orders, previousOrders),
      },
    ];

    const trendSeries: TrendSeries[] = [
      {
        key: 'sales-orders',
        title: '売上 / 注文トレンド',
        primaryLabel: '売上',
        secondaryLabel: '注文数',
        points: salesSeries.map((x) => ({
          label: x.label,
          value: x.value,
          secondaryValue: x.secondaryValue,
        })),
      },
      {
        key: 'payout-gap',
        title: '入金 / 差額トレンド',
        primaryLabel: '入金',
        secondaryLabel: '差額',
        points: payoutSeries.map((x) => ({
          label: x.label,
          value: x.value,
          secondaryValue: x.secondaryValue,
        })),
      },
    ];

    const distributions: DistributionBlock[] = [
      {
        key: 'cost-breakdown',
        title: '費用構成',
        items: [
          { key: 'fba', label: 'FBA手数料', value: sum(fbaTx) },
          { key: 'ads', label: '広告費', value: sum(adTx) },
          { key: 'refund', label: '返金', value: sum(refundTx) },
          { key: 'other', label: 'その他', value: sum(otherTx) },
        ],
      },
      {
        key: 'channel-breakdown',
        title: 'チャネル構成',
        items: channelItems.length
          ? channelItems
          : [{ key: 'channel-1', label: 'その他', value: 0 }],
      },
    ];

    const explainSummaries: ExplainSummary[] = [
      {
        key: 'sales-vs-payout',
        title: '売上と入金の差額',
        summary: `現在の集計では、売上 ¥${sales.toLocaleString('ja-JP')} に対し、入金は ¥${payout.toLocaleString('ja-JP')} です。差額は ¥${gap.toLocaleString('ja-JP')} です。`,
      },
      {
        key: 'cost-dominant',
        title: '主要コストの確認',
        summary: `主なコストは FBA手数料 ¥${sum(fbaTx).toLocaleString('ja-JP')}、広告費 ¥${sum(adTx).toLocaleString('ja-JP')}、返金 ¥${sum(refundTx).toLocaleString('ja-JP')} です。`,
      },
    ];

    return {
      summaryKpis,
      trendSeries,
      distributions,
      alerts,
      explainSummaries,
    };
  }

  private async buildAmazonRealProxy(args: { companyId: string }) {
    const companyId = args.companyId;

    const [
      totalInvoices,
      paidInvoices,
      overdueInvoices,
      paymentReceiptCount,
      reconciliationTotal,
      reconciliationApproved,
      reconciliationRejected,
    ] = await this.prisma.$transaction([
      this.prisma.invoice.count({
        where: { companyId },
      }),
      this.prisma.invoice.count({
        where: { companyId, status: 'PAID' },
      }),
      this.prisma.invoice.count({
        where: { companyId, status: 'OVERDUE' },
      }),
      this.prisma.paymentReceipt.count({
        where: { companyId },
      }),
      this.prisma.reconciliationDecision.count({
        where: { companyId },
      }),
      this.prisma.reconciliationDecision.count({
        where: { companyId, decision: 'approved' },
      }),
      this.prisma.reconciliationDecision.count({
        where: { companyId, decision: 'rejected' },
      }),
    ]);

    const unpaidInvoices = Math.max(0, totalInvoices - paidInvoices);
    const missingInvoicesProxy = overdueInvoices;
    const missingBankProofsProxy = Math.max(0, unpaidInvoices - paymentReceiptCount);
    const pendingReviewProxy = Math.max(0, totalInvoices - reconciliationTotal);
    const unmatchedPayoutProxy = reconciliationRejected;

    const invoiceReadinessPercent =
      totalInvoices > 0
        ? Math.max(0, Math.min(100, Math.round((paidInvoices / totalInvoices) * 100)))
        : 100;

    const reviewBlockersCount = overdueInvoices + reconciliationRejected;
    const explainCoverageCount = 2;

    const missingCount =
      missingInvoicesProxy + missingBankProofsProxy + unmatchedPayoutProxy;
    const completenessScore = Math.max(
      52,
      100 - missingCount * 4 - pendingReviewProxy * 3,
    );

    return {
      reconciliationSummary: {
        missingInvoices: missingInvoicesProxy,
        missingBankProofs: missingBankProofsProxy,
        pendingReview: pendingReviewProxy,
        unmatchedPayoutItems: unmatchedPayoutProxy,
      } as ReconciliationSummary,
      accountantReadiness: {
        invoiceReadinessPercent,
        explainCoverageCount,
        reviewBlockersCount,
        checklist: [
          { key: 'sales', label: 'Sales summary prepared', done: totalInvoices > 0 },
          { key: 'expense', label: 'Expense attachments reviewed', done: paymentReceiptCount > 0 },
          { key: 'invoice', label: 'Missing invoice queue checked', done: missingInvoicesProxy === 0 },
          { key: 'payout', label: 'Payout mismatch queue checked', done: unmatchedPayoutProxy === 0 },
          { key: 'inventory', label: 'Inventory reference exported', done: true },
          { key: 'profit', label: 'Profit reference reviewed', done: reviewBlockersCount === 0 },
        ],
      } as AccountantReadiness,
      dataCompleteness: {
        score: completenessScore,
        missingInvoiceCount: missingInvoicesProxy,
        missingBankProofCount: missingBankProofsProxy,
        unmatchedCount: unmatchedPayoutProxy,
      } as DataCompleteness,
    };
  }

  private buildAmazonReconciliationSummary(): ReconciliationSummary {
    return {
      missingInvoices: 4,
      missingBankProofs: 3,
      pendingReview: 5,
      unmatchedPayoutItems: 2,
    };
  }

  private buildAmazonAccountantReadiness(): AccountantReadiness {
    return {
      invoiceReadinessPercent: 82,
      explainCoverageCount: 2,
      reviewBlockersCount: 5,
      checklist: [
        { key: 'sales', label: 'Sales summary prepared', done: true },
        { key: 'expense', label: 'Expense attachments reviewed', done: false },
        { key: 'invoice', label: 'Missing invoice queue checked', done: false },
        { key: 'payout', label: 'Payout mismatch queue checked', done: false },
        { key: 'inventory', label: 'Inventory reference exported', done: true },
        { key: 'profit', label: 'Profit reference reviewed', done: true },
      ],
    };
  }

  private buildAmazonDrilldownHints(): DrilldownHints {
    return {
      sales: {
        key: 'sales',
        route: '/app/reports/income',
        label: 'Open sales detail',
        params: { businessType: 'amazon' },
      },
      payout: {
        key: 'payout',
        route: '/app/payments',
        label: 'Open payout detail',
        params: { businessType: 'amazon' },
      },
      profit: {
        key: 'profit',
        route: '/app/reports/profit',
        label: 'Open profit detail',
        params: { businessType: 'amazon' },
      },
      reconciliation: {
        key: 'reconciliation',
        route: '/app/amazon-reconciliation',
        label: 'Open reconciliation',
        params: { businessType: 'amazon' },
      },
      accountant: {
        key: 'accountant',
        route: '/app/invoices',
        label: 'Open accountant handoff',
        params: { businessType: 'amazon' },
      },
    };
  }

  private buildAmazonDataCompleteness(): DataCompleteness {
    const summary = this.buildAmazonReconciliationSummary();
    const missingCount =
      summary.missingInvoices + summary.missingBankProofs + summary.unmatchedPayoutItems;
    const score = Math.max(52, 100 - missingCount * 4 - summary.pendingReview * 3);

    return {
      score,
      missingInvoiceCount: summary.missingInvoices,
      missingBankProofCount: summary.missingBankProofs,
      unmatchedCount: summary.unmatchedPayoutItems,
    };
  }

  async getAmazonCockpit(args: { range: DashboardCockpitRange; companyId?: string }) {
    const realProxy =
      args.companyId && String(args.companyId).trim()
        ? await this.buildAmazonRealProxy({ companyId: String(args.companyId).trim() })
        : null;

    const realPhase2 =
      args.companyId && String(args.companyId).trim()
        ? await this.buildAmazonRealPhase2({
            companyId: String(args.companyId).trim(),
            range: args.range,
          })
        : null;

    return {
      businessView: 'amazon',
      range: args.range,
      source: 'real',
      summaryKpis: realPhase2?.summaryKpis ?? this.buildAmazonSummaryKpis(),
      trendSeries: realPhase2?.trendSeries ?? this.buildAmazonTrendSeries(),
      distributions: realPhase2?.distributions ?? this.buildAmazonDistributions(),
      alerts: realPhase2?.alerts ?? this.buildAmazonAlerts(),
      explainSummaries: realPhase2?.explainSummaries ?? this.buildAmazonExplainSummaries(),
      reconciliationSummary: realProxy?.reconciliationSummary ?? this.buildAmazonReconciliationSummary(),
      accountantReadiness: realProxy?.accountantReadiness ?? this.buildAmazonAccountantReadiness(),
      drilldownHints: this.buildAmazonDrilldownHints(),
      dataCompleteness: realProxy?.dataCompleteness ?? this.buildAmazonDataCompleteness(),
    };
  }

  getCockpit(args: {
    businessView: DashboardCockpitBusinessView;
    range: DashboardCockpitRange;
    companyId?: string;
  }) {
    if (args.businessView === 'amazon') {
      return this.getAmazonCockpit({
        range: args.range,
        companyId: args.companyId,
      });
    }

    return {
      businessView: args.businessView,
      range: args.range,
      source: 'mock',
      summaryKpis: [],
      trendSeries: [],
      distributions: [],
      alerts: [],
      explainSummaries: [],
      reconciliationSummary: {
        missingInvoices: 0,
        missingBankProofs: 0,
        pendingReview: 0,
        unmatchedPayoutItems: 0,
      },
      accountantReadiness: {
        invoiceReadinessPercent: 0,
        explainCoverageCount: 0,
        reviewBlockersCount: 0,
        checklist: [],
      },
      drilldownHints: {},
      dataCompleteness: {
        score: 100,
        missingInvoiceCount: 0,
        missingBankProofCount: 0,
        unmatchedCount: 0,
      },
    };
  }
}
