import type { BusinessViewType } from "@/core/business-view";
import { normalizeDashboardLocale } from "@/core/dashboard-copy";

export type DashboardSectionStructure = {
  kpiTitle: string;
  kpiSummary: string;
  trendTitle: string;
  trendSummary: string;
  distributionTitle: string;
  distributionSummary: string;
  anomalyTitle: string;
  anomalySummary: string;
  explainTitle: string;
  explainSummary: string;
};

export function getDashboardSectionStructure(
  businessView: BusinessViewType,
  lang: string = "ja"
): DashboardSectionStructure {
  const locale = normalizeDashboardLocale(lang);

  const map = {
    "zh-CN": {
      amazon: {
        kpiTitle: "Amazon 经营关键指标",
        kpiSummary: "以销售、入金、差额、订单数为核心，快速把握 Amazon 运营状态。",
        trendTitle: "Amazon 经营趋势",
        trendSummary: "按时间序列查看销售、入金、差额与订单趋势。",
        distributionTitle: "Amazon 构成分布",
        distributionSummary: "查看费用结构、渠道构成与当前经营分布。",
        anomalyTitle: "Amazon 异常与风险",
        anomalySummary: "快速识别高优先级异常、成本压力与跟进方向。",
        explainTitle: "Amazon 经营解读",
        explainSummary: "用解释摘要快速理解利润、差额与变化原因。",
      },
      ec: {
        kpiTitle: "EC 经营关键指标",
        kpiSummary: "以销售、回收、未回收差额和受注数为核心，快速把握 EC 运营状态。",
        trendTitle: "EC 经营趋势",
        trendSummary: "按时间序列查看销售、回收、未回收与费用趋势。",
        distributionTitle: "EC 构成分布",
        distributionSummary: "查看费用结构、渠道构成与当前经营分布。",
        anomalyTitle: "EC 异常与风险",
        anomalySummary: "快速识别回收风险、费用压力与跟进方向。",
        explainTitle: "EC 经营解读",
        explainSummary: "用解释摘要快速理解收益变化与经营信号。",
      },
      restaurant: {
        kpiTitle: "餐饮经营关键指标",
        kpiSummary: "以销售、入金、利润压力和来店/订单数为核心，快速把握经营状态。",
        trendTitle: "餐饮经营趋势",
        trendSummary: "按时间序列查看销售、入金、利润压力和来店趋势。",
        distributionTitle: "餐饮构成分布",
        distributionSummary: "查看成本结构、销售构成与当前经营分布。",
        anomalyTitle: "餐饮异常与风险",
        anomalySummary: "快速识别原价率、人件费与经营压力。",
        explainTitle: "餐饮经营解读",
        explainSummary: "用解释摘要快速理解利润变化与经营信号。",
      },
      generic: {
        kpiTitle: "经营关键指标",
        kpiSummary: "快速把握销售、入金、差额与案件/订单数。",
        trendTitle: "经营趋势",
        trendSummary: "按时间序列查看核心经营指标变化。",
        distributionTitle: "构成分布",
        distributionSummary: "查看费用结构与当前经营构成。",
        anomalyTitle: "异常与风险",
        anomalySummary: "快速识别当前最值得关注的经营异常。",
        explainTitle: "经营解读",
        explainSummary: "用解释摘要快速理解当前经营变化。",
      },
    },
    "zh-TW": {
      amazon: {
        kpiTitle: "Amazon 經營關鍵指標",
        kpiSummary: "以銷售、入金、差額、訂單數為核心，快速掌握 Amazon 營運狀態。",
        trendTitle: "Amazon 經營趨勢",
        trendSummary: "依時間序列查看銷售、入金、差額與訂單趨勢。",
        distributionTitle: "Amazon 構成分布",
        distributionSummary: "查看費用結構、渠道構成與目前經營分布。",
        anomalyTitle: "Amazon 異常與風險",
        anomalySummary: "快速識別高優先級異常、成本壓力與後續方向。",
        explainTitle: "Amazon 經營解讀",
        explainSummary: "用解釋摘要快速理解利潤、差額與變化原因。",
      },
      ec: {
        kpiTitle: "EC 經營關鍵指標",
        kpiSummary: "以銷售、回收、未回收差額與受注數為核心，快速掌握 EC 營運狀態。",
        trendTitle: "EC 經營趨勢",
        trendSummary: "依時間序列查看銷售、回收、未回收與費用趨勢。",
        distributionTitle: "EC 構成分布",
        distributionSummary: "查看費用結構、渠道構成與目前經營分布。",
        anomalyTitle: "EC 異常與風險",
        anomalySummary: "快速識別回收風險、費用壓力與後續方向。",
        explainTitle: "EC 經營解讀",
        explainSummary: "用解釋摘要快速理解收益變化與經營訊號。",
      },
      restaurant: {
        kpiTitle: "餐飲經營關鍵指標",
        kpiSummary: "以銷售、入金、利潤壓力與來店/訂單數為核心，快速掌握經營狀態。",
        trendTitle: "餐飲經營趨勢",
        trendSummary: "依時間序列查看銷售、入金、利潤壓力與來店趨勢。",
        distributionTitle: "餐飲構成分布",
        distributionSummary: "查看成本結構、銷售構成與目前經營分布。",
        anomalyTitle: "餐飲異常與風險",
        anomalySummary: "快速識別原價率、人事成本與經營壓力。",
        explainTitle: "餐飲經營解讀",
        explainSummary: "用解釋摘要快速理解利潤變化與經營訊號。",
      },
      generic: {
        kpiTitle: "經營關鍵指標",
        kpiSummary: "快速掌握銷售、入金、差額與案件/訂單數。",
        trendTitle: "經營趨勢",
        trendSummary: "依時間序列查看核心經營指標變化。",
        distributionTitle: "構成分布",
        distributionSummary: "查看費用結構與目前經營構成。",
        anomalyTitle: "異常與風險",
        anomalySummary: "快速識別目前最值得關注的經營異常。",
        explainTitle: "經營解讀",
        explainSummary: "用解釋摘要快速理解目前經營變化。",
      },
    },
    en: {
      amazon: {
        kpiTitle: "Key metrics for Amazon operations",
        kpiSummary: "Review sales, payout, gap, and order volume to understand Amazon operating performance at a glance.",
        trendTitle: "Trend view for Amazon operations",
        trendSummary: "Track sales, payout, gap, and order movement over time.",
        distributionTitle: "Distribution view for Amazon operations",
        distributionSummary: "Understand cost structure, channel mix, and current operating composition.",
        anomalyTitle: "Alerts and operating risks",
        anomalySummary: "Highlight high-priority issues, cost pressure, and the next actions to review.",
        explainTitle: "Business explain",
        explainSummary: "Use short explanations to understand profit pressure, payout gaps, and business changes.",
      },
      ec: {
        kpiTitle: "Key metrics for ecommerce operations",
        kpiSummary: "Review sales, recovery, unrecovered balance, and order volume at a glance.",
        trendTitle: "Trend view for ecommerce operations",
        trendSummary: "Track sales, recovery, unrecovered balance, and expense movement over time.",
        distributionTitle: "Distribution view for ecommerce operations",
        distributionSummary: "Understand cost structure, channel mix, and current operating composition.",
        anomalyTitle: "Alerts and operating risks",
        anomalySummary: "Highlight recovery risks, cost pressure, and the next actions to review.",
        explainTitle: "Business explain",
        explainSummary: "Use short explanations to understand profitability changes and business signals.",
      },
      restaurant: {
        kpiTitle: "Key metrics for restaurant operations",
        kpiSummary: "Review sales, payout, profit pressure, and customer/order volume at a glance.",
        trendTitle: "Trend view for restaurant operations",
        trendSummary: "Track sales, payout, profit pressure, and customer flow over time.",
        distributionTitle: "Distribution view for restaurant operations",
        distributionSummary: "Understand cost structure, sales mix, and current operating composition.",
        anomalyTitle: "Alerts and operating risks",
        anomalySummary: "Highlight cost spikes, labor pressure, and the next actions to review.",
        explainTitle: "Business explain",
        explainSummary: "Use short explanations to understand profit changes and business signals.",
      },
      generic: {
        kpiTitle: "Key business metrics",
        kpiSummary: "Review sales, payout, gap, and order/case volume at a glance.",
        trendTitle: "Business trend view",
        trendSummary: "Track core business metrics over time.",
        distributionTitle: "Business distribution view",
        distributionSummary: "Understand cost structure and current operating composition.",
        anomalyTitle: "Alerts and business risks",
        anomalySummary: "Highlight the most important business anomalies to review.",
        explainTitle: "Business explain",
        explainSummary: "Use short explanations to understand current business changes.",
      },
    },
    ja: {
      amazon: {
        kpiTitle: "Amazon 運営の主要指標",
        kpiSummary: "売上・入金・差額・注文数を起点に、Amazon運営の状態を素早く把握します。",
        trendTitle: "Amazon 運営トレンド",
        trendSummary: "売上・入金・差額・注文推移を時系列で確認します。",
        distributionTitle: "Amazon 構成分布",
        distributionSummary: "費用構成、チャネル構成、現在の運営分布を確認します。",
        anomalyTitle: "異常と運営リスク",
        anomalySummary: "優先度の高い異常、コスト圧力、次に確認すべき項目を整理します。",
        explainTitle: "経営解説",
        explainSummary: "利益圧力、差額、変化要因を短い説明で把握します。",
      },
      ec: {
        kpiTitle: "EC 運営の主要指標",
        kpiSummary: "売上・回収・未回収差額・受注数を起点に、EC運営の状態を素早く把握します。",
        trendTitle: "EC 運営トレンド",
        trendSummary: "売上・回収・未回収・費用推移を時系列で確認します。",
        distributionTitle: "EC 構成分布",
        distributionSummary: "費用構成、チャネル構成、現在の運営分布を確認します。",
        anomalyTitle: "異常と運営リスク",
        anomalySummary: "回収リスク、費用圧力、次に確認すべき項目を整理します。",
        explainTitle: "経営解説",
        explainSummary: "収益変化と運営シグナルを短い説明で把握します。",
      },
      restaurant: {
        kpiTitle: "飲食店運営の主要指標",
        kpiSummary: "売上・入金・利益圧力・来店/注文数を起点に、運営状態を素早く把握します。",
        trendTitle: "飲食店運営トレンド",
        trendSummary: "売上・入金・利益圧力・来店推移を時系列で確認します。",
        distributionTitle: "飲食店構成分布",
        distributionSummary: "原価構成、売上構成、現在の運営分布を確認します。",
        anomalyTitle: "異常と運営リスク",
        anomalySummary: "原価率、人件費、運営圧力など重要な異常を整理します。",
        explainTitle: "経営解説",
        explainSummary: "利益変化と経営シグナルを短い説明で把握します。",
      },
      generic: {
        kpiTitle: "経営の主要指標",
        kpiSummary: "売上・入金・差額・案件/注文数を起点に、経営状態を素早く把握します。",
        trendTitle: "経営トレンド",
        trendSummary: "主要な経営指標の推移を時系列で確認します。",
        distributionTitle: "構成分布",
        distributionSummary: "費用構成と現在の経営分布を確認します。",
        anomalyTitle: "異常と経営リスク",
        anomalySummary: "現在優先して確認すべき異常を整理します。",
        explainTitle: "経営解説",
        explainSummary: "現在の経営変化を短い説明で把握します。",
      },
    },
  } as const;

  return map[locale][businessView];
}
