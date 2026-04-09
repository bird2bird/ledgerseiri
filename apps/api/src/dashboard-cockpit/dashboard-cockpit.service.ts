import { Injectable } from '@nestjs/common';

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

@Injectable()
export class DashboardCockpitService {
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

  getAmazonCockpit(args: { range: DashboardCockpitRange }) {
    return {
      businessView: 'amazon',
      range: args.range,
      source: 'real',
      summaryKpis: this.buildAmazonSummaryKpis(),
      trendSeries: this.buildAmazonTrendSeries(),
      distributions: this.buildAmazonDistributions(),
      alerts: this.buildAmazonAlerts(),
      explainSummaries: this.buildAmazonExplainSummaries(),
    };
  }

  getCockpit(args: {
    businessView: DashboardCockpitBusinessView;
    range: DashboardCockpitRange;
  }) {
    if (args.businessView === 'amazon') {
      return this.getAmazonCockpit({ range: args.range });
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
    };
  }
}
