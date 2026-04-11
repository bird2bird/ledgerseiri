import type { BusinessViewType } from "@/core/business-view";

export type DashboardOnboardingBridge = {
  eyebrow: string;
  title: string;
  summary: string;
  focusItems: string[];
  actionHint: string;
};

export function getDashboardOnboardingBridge(
  businessView: BusinessViewType
): DashboardOnboardingBridge {
  if (businessView === "amazon") {
    return {
      eyebrow: "Onboarding continuation",
      title: "まずは 売上・入金・差額 を同時に見てください",
      summary:
        "Amazon onboarding で理解した差額の考え方を、そのまま dashboard 上の KPI・trend・alerts に繋げて確認できます。",
      focusItems: ["売上", "入金", "差額", "広告費・返金"],
      actionHint: "差額が広がっている場合は、distribution と explain preview を先に確認してください。",
    };
  }

  if (businessView === "ec") {
    return {
      eyebrow: "Onboarding continuation",
      title: "まずは 回収・費用・受注バランス を見てください",
      summary:
        "EC onboarding で見た cash conversion の考え方を、そのまま dashboard 上の KPI・distribution・alerts に繋げて確認できます。",
      focusItems: ["回収", "配送費", "返品", "広告費"],
      actionHint: "回収より費用の伸びが速い場合は、distribution と alerts を先に確認してください。",
    };
  }

  if (businessView === "restaurant") {
    return {
      eyebrow: "Onboarding continuation",
      title: "まずは 原価・人件費・利益圧力 を見てください",
      summary:
        "Restaurant onboarding で見た profit pressure の考え方を、そのまま dashboard 上の KPI・trend・alerts に繋げて確認できます。",
      focusItems: ["食材原価", "人件費", "利益圧力", "固定費"],
      actionHint: "利益圧力が高い場合は、cost-related distribution と explain preview を先に確認してください。",
    };
  }

  return {
    eyebrow: "Onboarding continuation",
    title: "まずは 売上・入金・費用の全体像 を見てください",
    summary:
      "Generic onboarding で見た business overview を、そのまま dashboard 上の KPI・trend・overview explain に繋げて確認できます。",
    focusItems: ["売上", "入金", "費用", "全体像"],
    actionHint: "全体像を掴んだあと、distribution と trend を見て深掘りしてください。",
  };
}
