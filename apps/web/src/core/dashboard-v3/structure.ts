import type { BusinessViewType } from "@/core/business-view";

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
  businessView: BusinessViewType
): DashboardSectionStructure {
  if (businessView === "amazon") {
    return {
      kpiTitle: "Key metrics for Amazon operations",
      kpiSummary: "売上・入金・差額・注文数を起点に、Amazon運営の状態を最初に把握します。",
      trendTitle: "Trend view for Amazon operations",
      trendSummary: "売上・入金・差額・注文推移を時系列で確認します。",
      distributionTitle: "Distribution view for Amazon operations",
      distributionSummary: "差額の構成、費用の内訳、売上構成を把握します。",
      anomalyTitle: "Alerts for Amazon operations",
      anomalySummary: "差額拡大、広告費上昇、返金増加などを優先度付きで確認します。",
      explainTitle: "Explain preview for Amazon operations",
      explainSummary: "差額や費用の主要な説明サマリーを簡潔に確認します。",
    };
  }

  if (businessView === "ec") {
    return {
      kpiTitle: "Key metrics for cash conversion",
      kpiSummary: "売上・回収・未回収・受注のバランスを最初に把握します。",
      trendTitle: "Trend view for cash conversion",
      trendSummary: "売上・回収・費用・受注バランスの推移を時系列で確認します。",
      distributionTitle: "Distribution view for EC operations",
      distributionSummary: "費用構成、配送費、返品、広告費の比率を把握します。",
      anomalyTitle: "Alerts for EC operations",
      anomalySummary: "回収遅れ、返品増加、配送費上昇などを優先度付きで確認します。",
      explainTitle: "Explain preview for EC operations",
      explainSummary: "回収と費用構造に関する主要な説明サマリーを確認します。",
    };
  }

  if (businessView === "restaurant") {
    return {
      kpiTitle: "Key metrics for restaurant pressure",
      kpiSummary: "売上・入金・利益圧力・来店/注文数を最初に把握します。",
      trendTitle: "Trend view for restaurant pressure",
      trendSummary: "売上・入金・利益圧力・来店推移を時系列で確認します。",
      distributionTitle: "Distribution view for restaurant costs",
      distributionSummary: "原価・人件費・固定費の構成を把握します。",
      anomalyTitle: "Alerts for restaurant operations",
      anomalySummary: "原価率上昇、人件費圧力、利益圧力の悪化を優先度付きで確認します。",
      explainTitle: "Explain preview for restaurant operations",
      explainSummary: "原価・人件費・利益圧力に関する主要な説明サマリーを確認します。",
    };
  }

  return {
    kpiTitle: "Key metrics for business overview",
    kpiSummary: "売上・入金・差額・案件数の全体像を最初に把握します。",
    trendTitle: "Trend view for business overview",
    trendSummary: "売上・入金・費用・差額推移を時系列で確認します。",
    distributionTitle: "Distribution view for business overview",
    distributionSummary: "費用構成、案件構成、収益構成を把握します。",
    anomalyTitle: "Alerts for business overview",
    anomalySummary: "入金遅れ、費用増加、案件減少などを優先度付きで確認します。",
    explainTitle: "Explain preview for business overview",
    explainSummary: "全体像を理解するための主要な説明サマリーを確認します。",
  };
}
