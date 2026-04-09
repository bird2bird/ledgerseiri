import { Injectable } from '@nestjs/common';

export type DashboardCockpitRange = 'today' | '7d' | '30d' | 'month';
export type DashboardCockpitBusinessView =
  | 'amazon'
  | 'ec'
  | 'restaurant'
  | 'generic';

@Injectable()
export class DashboardCockpitService {
  getAmazonCockpit(args: { range: DashboardCockpitRange }) {
    return {
      businessView: 'amazon',
      range: args.range,
      source: 'real',
      summaryKpis: [
        { key: 'sales', label: '売上', value: 520000, unit: 'JPY', deltaLabel: '+8.2%' },
        { key: 'payout', label: '入金', value: 412000, unit: 'JPY', deltaLabel: '+5.0%' },
        { key: 'gap', label: '差額', value: 108000, unit: 'JPY', deltaLabel: '-2.1%' },
        { key: 'orders', label: '注文数', value: 182, unit: 'count', deltaLabel: '+6.4%' },
      ],
      trendSeries: [
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
      ],
      distributions: [
        {
          key: 'cost-breakdown',
          title: '費用構成',
          items: [
            { key: 'fba', label: 'FBA手数料', value: 58000 },
            { key: 'ads', label: '広告費', value: 26000 },
            { key: 'refund', label: '返金', value: 14000 },
            { key: 'other', label: 'その他', value: 10000 },
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
      ],
      alerts: [
        {
          key: 'refund-risk',
          title: '返金率の高い商品があります',
          severity: 'medium',
          summary: '一部 SKU で返金率が直近平均を上回っています。',
        },
        {
          key: 'ads-efficiency',
          title: '広告効率が低下しています',
          severity: 'high',
          summary: '広告費は増加していますが、入金改善への寄与が限定的です。',
        },
        {
          key: 'payout-gap-pressure',
          title: '差額圧力が継続しています',
          severity: 'high',
          summary: '差額が高止まりしており、利益と入金の圧迫が続いています。',
        },
      ],
      explainSummaries: [
        {
          key: 'sales-vs-payout',
          title: '売上と入金の差額',
          summary:
            '今月のAmazon販売では、売上 ¥520,000 に対して、入金は ¥412,000 です。差額の主な要因は FBA手数料、広告費、返金です。',
        },
        {
          key: 'coverage-status',
          title: 'Explain coverage',
          summary: '差額の主要因は現在のルールベース説明でカバーされています。',
        },
      ],
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
