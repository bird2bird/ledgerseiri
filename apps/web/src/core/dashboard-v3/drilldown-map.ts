import type {
  DashboardV3DrilldownHint,
  DashboardV3DrilldownHints,
} from "@/core/dashboard-v3/types";
import { normalizeDashboardLocale } from "@/core/dashboard-copy";

export function buildDashboardDrilldownHref(args: {
  lang: string;
  hint?: DashboardV3DrilldownHint;
}): string | null {
  const { hint } = args;
  if (!hint?.route) return null;

  const lang = normalizeDashboardLocale(args.lang);
  const routeLang =
    lang === "zh-CN" ? "zh-cn" :
    lang === "zh-TW" ? "zh-tw" :
    lang;

  const route = hint.route.startsWith("/")
    ? hint.route
    : `/${hint.route}`;

  const params = new URLSearchParams();

  if (hint.params) {
    for (const [key, value] of Object.entries(hint.params)) {
      if (value != null && String(value).trim()) {
        params.set(key, String(value));
      }
    }
  }

  const qs = params.toString();
  return `/${routeLang}${route}${qs ? `?${qs}` : ""}`;
}

export function getHintByKpiKey(
  hints: DashboardV3DrilldownHints | undefined,
  key: string
): DashboardV3DrilldownHint | undefined {
  if (!hints) return undefined;
  if (key === "sales") return hints.sales;
  if (key === "payout") return hints.payout;
  if (key === "gap") return hints.profit;
  if (key === "orders") return hints.sales;
  return undefined;
}

export function getDashboardActionLabel(args: {
  lang: string;
  fallback?: string;
  kind: "detail" | "queue" | "workspace";
}): string {
  const lang = normalizeDashboardLocale(args.lang);

  const table = {
    "zh-CN": {
      detail: "查看详情",
      queue: "查看队列",
      workspace: "打开工作台",
    },
    "zh-TW": {
      detail: "查看詳情",
      queue: "查看佇列",
      workspace: "開啟工作台",
    },
    en: {
      detail: "Open detail",
      queue: "Open queue",
      workspace: "Open workspace",
    },
    ja: {
      detail: "詳細を見る",
      queue: "キューを見る",
      workspace: "ワークスペースを開く",
    },
  } as const;

  return table[lang][args.kind];
}
