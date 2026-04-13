import { normalizeDashboardLocale } from "@/core/dashboard-copy";
import type { DashboardV3Cockpit } from "@/core/dashboard-v3/types";

export type DashboardSourceStatus = {
  badge: string;
  tone: "emerald" | "amber" | "slate";
  summary: string;
  detail: string;
};

export function resolveDashboardSourceStatus(args: {
  lang: string;
  cockpit: DashboardV3Cockpit;
  companyId?: string;
}) : DashboardSourceStatus {
  const locale = normalizeDashboardLocale(args.lang);
  const hasCompany = Boolean(args.companyId && String(args.companyId).trim());
  const source = args.cockpit.source;

  const map = {
    "zh-CN": {
      real: {
        badge: "真实聚合",
        tone: "emerald",
        summary: hasCompany ? "当前为 company 级真实聚合。" : "当前为真实数据模式。",
        detail: hasCompany
          ? "该页面正在使用指定 companyId 的真实交易、入金与构成数据。"
          : "当前页面已切换到真实数据模式，但未指定 company 作用域。",
      },
      mock: {
        badge: "样例预览",
        tone: "slate",
        summary: "当前为样例预览数据。",
        detail: "由于未进入真实 company 聚合路径，当前显示的是基线示例值。",
      },
      "mock-fallback": {
        badge: "回退样例",
        tone: "amber",
        summary: "真实请求失败，当前为回退样例。",
        detail: "页面暂时未取到真实 cockpit 数据，因此回退到样例值。",
      },
    },
    "zh-TW": {
      real: {
        badge: "真實聚合",
        tone: "emerald",
        summary: hasCompany ? "目前為 company 層級真實聚合。" : "目前為真實資料模式。",
        detail: hasCompany
          ? "此頁面正在使用指定 companyId 的真實交易、入金與構成資料。"
          : "目前頁面已切換到真實資料模式，但未指定 company 範圍。",
      },
      mock: {
        badge: "樣例預覽",
        tone: "slate",
        summary: "目前為樣例預覽資料。",
        detail: "由於尚未進入真實 company 聚合路徑，目前顯示的是基線示例值。",
      },
      "mock-fallback": {
        badge: "回退樣例",
        tone: "amber",
        summary: "真實請求失敗，目前為回退樣例。",
        detail: "頁面暫時未取得真實 cockpit 資料，因此回退到樣例值。",
      },
    },
    en: {
      real: {
        badge: "Real aggregation",
        tone: "emerald",
        summary: hasCompany ? "Company-scoped aggregation is active." : "Real data mode is active.",
        detail: hasCompany
          ? "This page is using real transaction, payout, and composition data for the selected companyId."
          : "The page is in real data mode, but no company-scoped aggregation hint was provided.",
      },
      mock: {
        badge: "Baseline preview",
        tone: "slate",
        summary: "Baseline preview data is active.",
        detail: "The page is showing baseline preview values instead of company-scoped real aggregation.",
      },
      "mock-fallback": {
        badge: "Fallback preview",
        tone: "amber",
        summary: "Real request failed, fallback preview is active.",
        detail: "The page could not load real cockpit data and fell back to preview values.",
      },
    },
    ja: {
      real: {
        badge: "実データ集計",
        tone: "emerald",
        summary: hasCompany ? "現在は company 単位の実集計です。" : "現在は実データモードです。",
        detail: hasCompany
          ? "この画面は指定された companyId の取引・入金・構成データを使って集計しています。"
          : "この画面は実データモードですが、company 単位の指定はありません。",
      },
      mock: {
        badge: "サンプル表示",
        tone: "slate",
        summary: "現在はサンプルプレビューです。",
        detail: "まだ company 単位の実集計に入っていないため、基線のサンプル値を表示しています。",
      },
      "mock-fallback": {
        badge: "フォールバック表示",
        tone: "amber",
        summary: "実リクエスト失敗のため、フォールバック表示です。",
        detail: "cockpit の実データ取得に失敗したため、サンプル値へ回退しています。",
      },
    },
  } as const;

  return map[locale][source];
}
