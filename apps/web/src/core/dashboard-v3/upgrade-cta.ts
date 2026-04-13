import { normalizeDashboardLocale } from "@/core/dashboard-copy";

export type DashboardLockKind =
  | "readonly"
  | "premium"
  | "standard";

export function getDashboardUpgradeCta(args: {
  lang: string;
  kind: DashboardLockKind;
}) {
  const locale = normalizeDashboardLocale(args.lang);

  const table = {
    "zh-CN": {
      readonly: {
        badge: "只读模式",
        title: "当前为只读模式",
        summary: "你可以查看历史经营数据，但不能继续进入处理页面或执行后续动作。",
        action: "恢复付费套餐",
      },
      premium: {
        badge: "Premium 功能",
        title: "此功能需 Premium",
        summary: "升级到 Premium 后可继续使用 AI explain 和高级经营解读。",
        action: "升级到 Premium",
      },
      standard: {
        badge: "Standard 起可用",
        title: "此功能需 Standard 或以上",
        summary: "升级到 Standard 后可打开工作台并继续处理对账与税理士协作。",
        action: "升级到 Standard",
      },
    },
    "zh-TW": {
      readonly: {
        badge: "唯讀模式",
        title: "目前為唯讀模式",
        summary: "你可以查看歷史經營資料，但不能繼續進入處理頁面或執行後續動作。",
        action: "恢復付費方案",
      },
      premium: {
        badge: "Premium 功能",
        title: "此功能需 Premium",
        summary: "升級到 Premium 後可繼續使用 AI explain 與高階經營解讀。",
        action: "升級到 Premium",
      },
      standard: {
        badge: "Standard 起可用",
        title: "此功能需 Standard 或以上",
        summary: "升級到 Standard 後可開啟工作台並繼續處理對帳與稅理士協作。",
        action: "升級到 Standard",
      },
    },
    en: {
      readonly: {
        badge: "Readonly mode",
        title: "This workspace is readonly",
        summary: "You can review historical business data, but action pages and follow-up workflows are locked.",
        action: "Restore paid access",
      },
      premium: {
        badge: "Premium feature",
        title: "This feature requires Premium",
        summary: "Upgrade to Premium to continue using AI explain and advanced business interpretation.",
        action: "Upgrade to Premium",
      },
      standard: {
        badge: "Standard required",
        title: "This feature requires Standard or above",
        summary: "Upgrade to Standard to open action workspaces for reconciliation and accountant handoff.",
        action: "Upgrade to Standard",
      },
    },
    ja: {
      readonly: {
        badge: "readonly mode",
        title: "現在は readonly mode です",
        summary: "過去データの閲覧はできますが、処理画面や後続アクションには入れません。",
        action: "有料プランを再開",
      },
      premium: {
        badge: "Premium 機能",
        title: "この機能は Premium が必要です",
        summary: "Premium にアップグレードすると AI explain と高度な経営解説を利用できます。",
        action: "Premium にアップグレード",
      },
      standard: {
        badge: "Standard 以上",
        title: "この機能は Standard 以上が必要です",
        summary: "Standard にアップグレードすると照合と税理士連携のワークスペースを開けます。",
        action: "Standard にアップグレード",
      },
    },
  } as const;

  return table[locale][args.kind];
}
