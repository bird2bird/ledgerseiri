export type ReportDetailKind = "cashflow" | "income" | "expense" | "profit";

export type ReportDetailMetric =
  | "cashIn"
  | "cashOut"
  | "netCash"
  | "inboundTransfers"
  | "outboundTransfers"
  | "totalIncome"
  | "totalExpense"
  | "rowsCount"
  | "averagePerRow"
  | "activeDays"
  | "grossProfit"
  | "marginPct";

export type ReportDetailVm = {
  kind: ReportDetailKind;
  metric: string;
  title: string;
  description: string;
  summaryLabel: string;
  summaryValue: string;
  badges: Array<{ label: string; value: string }>;
  columns: Array<{ key: string; label: string; align?: "left" | "right" }>;
  rows: Array<Record<string, string>>;
  backHref: string;
  emptyMessage: string;
  warning?: string;
};

const KNOWN_METRICS: ReportDetailMetric[] = [
  "cashIn",
  "cashOut",
  "netCash",
  "inboundTransfers",
  "outboundTransfers",
  "totalIncome",
  "totalExpense",
  "rowsCount",
  "averagePerRow",
  "activeDays",
  "grossProfit",
  "marginPct",
];

function isKnownMetric(metric: string): metric is ReportDetailMetric {
  return KNOWN_METRICS.includes(metric as ReportDetailMetric);
}

function metricLabel(metric: string) {
  switch (metric) {
    case "cashIn":
      return "入金";
    case "cashOut":
      return "出金";
    case "netCash":
      return "純キャッシュ";
    case "inboundTransfers":
      return "振替入金";
    case "outboundTransfers":
      return "振替出金";
    case "totalIncome":
      return "総収入";
    case "totalExpense":
      return "総支出";
    case "rowsCount":
      return "件数";
    case "averagePerRow":
      return "平均金額";
    case "activeDays":
      return "稼働日数";
    case "grossProfit":
      return "粗利";
    case "marginPct":
      return "利益率";
    default:
      return metric || "指標";
  }
}

function kindLabel(kind: ReportDetailKind) {
  switch (kind) {
    case "cashflow":
      return "キャッシュフロー";
    case "income":
      return "収入分析";
    case "expense":
      return "支出分析";
    case "profit":
      return "利益分析";
    default:
      return kind;
  }
}

function buildBackHref(args: {
  lang: string;
  kind: ReportDetailKind;
  range: string;
  storeId: string;
}) {
  const qs = new URLSearchParams();
  if (args.range) qs.set("range", args.range);
  if (args.storeId) qs.set("storeId", args.storeId);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return `/${args.lang}/app/reports/${args.kind}${suffix}`;
}

function buildCommonBadges(args: {
  kind: ReportDetailKind;
  range: string;
  storeId: string;
}) {
  return [
    { label: "Report", value: kindLabel(args.kind) },
    { label: "Range", value: args.range || "thisMonth" },
    { label: "Store", value: args.storeId || "all" },
  ];
}

export function buildReportDetailVm(args: {
  lang: string;
  kind: ReportDetailKind;
  metric: string;
  range: string;
  storeId: string;
}): ReportDetailVm {
  const { lang, kind, metric, range, storeId } = args;

  const known = isKnownMetric(metric);
  const label = metricLabel(metric);

  const base: ReportDetailVm = {
    kind,
    metric,
    title: `${kindLabel(kind)} / ${label}`,
    description:
      "この画面は detail query contract の基線です。次段階で real detail rows / drill-down API に接続します。",
    summaryLabel: "選択中指標",
    summaryValue: label,
    badges: buildCommonBadges({ kind, range, storeId }),
    columns: [
      { key: "dimension", label: "Dimension", align: "left" },
      { key: "value", label: "Value", align: "right" },
      { key: "note", label: "Note", align: "left" },
    ],
    rows: [
      {
        dimension: "kind",
        value: kind,
        note: "report family",
      },
      {
        dimension: "metric",
        value: metric,
        note: known ? "known metric" : "unknown metric fallback",
      },
      {
        dimension: "range",
        value: range || "thisMonth",
        note: "query contract",
      },
      {
        dimension: "storeId",
        value: storeId || "all",
        note: "query contract",
      },
    ],
    backHref: buildBackHref({ lang, kind, range, storeId }),
    emptyMessage: "明細データは次段階で接続します。",
  };

  if (!known) {
    base.warning =
      "未定義の metric を受信しました。detail query contract は維持しつつ fallback 表示を行っています。";
  }

  if (kind === "cashflow") {
    base.rows = [
      {
        dimension: "cashIn",
        value: metric === "cashIn" ? "selected" : "-",
        note: "transactions direction=INCOME",
      },
      {
        dimension: "cashOut",
        value: metric === "cashOut" ? "selected" : "-",
        note: "transactions direction=EXPENSE",
      },
      {
        dimension: "netCash",
        value: metric === "netCash" ? "selected" : "-",
        note: "cashIn - cashOut",
      },
      {
        dimension: "inboundTransfers",
        value: metric === "inboundTransfers" ? "selected" : "-",
        note: "fund transfer inbound baseline",
      },
      {
        dimension: "outboundTransfers",
        value: metric === "outboundTransfers" ? "selected" : "-",
        note: "fund transfer outbound baseline",
      },
    ];
  }

  if (kind === "income") {
    base.rows = [
      {
        dimension: "totalIncome",
        value: metric === "totalIncome" ? "selected" : "-",
        note: "sum(INCOME transactions)",
      },
      {
        dimension: "rowsCount",
        value: metric === "rowsCount" ? "selected" : "-",
        note: "count(INCOME transactions)",
      },
      {
        dimension: "averagePerRow",
        value: metric === "averagePerRow" ? "selected" : "-",
        note: "totalIncome / rowsCount",
      },
      {
        dimension: "activeDays",
        value: metric === "activeDays" ? "selected" : "-",
        note: "days with income rows",
      },
    ];
  }

  if (kind === "expense") {
    base.rows = [
      {
        dimension: "totalExpense",
        value: metric === "totalExpense" ? "selected" : "-",
        note: "sum(EXPENSE transactions)",
      },
      {
        dimension: "rowsCount",
        value: metric === "rowsCount" ? "selected" : "-",
        note: "count(EXPENSE transactions)",
      },
      {
        dimension: "averagePerRow",
        value: metric === "averagePerRow" ? "selected" : "-",
        note: "totalExpense / rowsCount",
      },
      {
        dimension: "activeDays",
        value: metric === "activeDays" ? "selected" : "-",
        note: "days with expense rows",
      },
    ];
  }

  if (kind === "profit") {
    base.rows = [
      {
        dimension: "totalIncome",
        value: metric === "totalIncome" ? "selected" : "-",
        note: "income side baseline",
      },
      {
        dimension: "totalExpense",
        value: metric === "totalExpense" ? "selected" : "-",
        note: "expense side baseline",
      },
      {
        dimension: "grossProfit",
        value: metric === "grossProfit" ? "selected" : "-",
        note: "totalIncome - totalExpense",
      },
      {
        dimension: "marginPct",
        value: metric === "marginPct" ? "selected" : "-",
        note: "grossProfit / totalIncome",
      },
    ];
  }

  return base;
}
