import type { DashboardHomeData } from "./types";

export const dashboardHomeMock: DashboardHomeData = {
  filters: {
    range: "30d",
    storeId: "all",
    refreshedAt: new Date().toISOString(),
  },

  kpiPrimary: [
    { key: "revenue", label: "今月収入", value: "¥1,250,000", deltaText: "+12.4% vs 前期", trend: "up", tone: "profit" },
    { key: "expense", label: "今月支出", value: "¥830,000", deltaText: "-5.2% vs 前期", trend: "down", tone: "warning" },
    { key: "profit", label: "今月利益", value: "¥420,000", deltaText: "+18.1% vs 前期", trend: "up", tone: "profit" },
    { key: "cash", label: "総資金", value: "¥2,950,000", deltaText: "+6.8%", trend: "up", tone: "info" },
    { key: "tax", label: "消費税概算", value: "¥85,000", subLabel: "今期見込み", tone: "default" },
  ],

  kpiSecondary: [
    { key: "invoice", label: "未入金", value: "¥320,000", subLabel: "3件", tone: "warning" },
    { key: "inventory", label: "在庫金額", value: "¥1,240,000", subLabel: "全店舗合計", tone: "default" },
    { key: "stockAlert", label: "在庫アラート", value: "5件", subLabel: "補充が必要", tone: "danger" },
    { key: "runway", label: "資金余力", value: "4.8ヶ月", subLabel: "現在の支出ペース", tone: "info" },
  ],

  revenueProfitTrend: [
    { label: "03-01", revenue: 38000, profit: 12000 },
    { label: "03-02", revenue: 52000, profit: 18000 },
    { label: "03-03", revenue: 47000, profit: 15000 },
    { label: "03-04", revenue: 61000, profit: 22000 },
    { label: "03-05", revenue: 56000, profit: 21000 },
    { label: "03-06", revenue: 72000, profit: 26000 },
    { label: "03-07", revenue: 68000, profit: 24000 },
  ],

  cashBalances: [
    { accountId: "a1", accountName: "三井住友銀行", accountType: "bank", balance: 1200000, currency: "JPY", sharePct: 41 },
    { accountId: "a2", accountName: "Amazon 売上金", accountType: "platform", balance: 850000, currency: "JPY", sharePct: 29 },
    { accountId: "a3", accountName: "Stripe", accountType: "payment", balance: 520000, currency: "JPY", sharePct: 18 },
    { accountId: "a4", accountName: "会社現金", accountType: "cash", balance: 380000, currency: "JPY", sharePct: 12 },
  ],

  expenseBreakdown: [
    { category: "広告費", amount: 220000, pct: 26 },
    { category: "仕入", amount: 280000, pct: 34 },
    { category: "物流", amount: 120000, pct: 14 },
    { category: "給与", amount: 90000, pct: 11 },
    { category: "その他", amount: 120000, pct: 15 },
  ],

  cashFlowTrend: [
    { label: "03-01", cashIn: 42000, cashOut: 22000, netCash: 20000 },
    { label: "03-02", cashIn: 51000, cashOut: 26000, netCash: 25000 },
    { label: "03-03", cashIn: 39000, cashOut: 32000, netCash: 7000 },
    { label: "03-04", cashIn: 58000, cashOut: 24000, netCash: 34000 },
    { label: "03-05", cashIn: 45000, cashOut: 30000, netCash: 15000 },
    { label: "03-06", cashIn: 65000, cashOut: 28000, netCash: 37000 },
  ],

  taxSummary: {
    outputTax: 125000,
    inputTax: 40000,
    estimatedTaxPayable: 85000,
    periodLabel: "2026年3月",
    note: "概算 / 参考値",
  },

  alerts: [
    {
      id: "al1",
      type: "inventory",
      severity: "warning",
      title: "在庫が少ない商品が 5 件あります",
      description: "補充タイミングの確認が必要です。",
      href: "/ja/app/inventory/alerts",
    },
    {
      id: "al2",
      type: "invoice",
      severity: "warning",
      title: "未入金の請求書が 3 件あります",
      description: "回収確認を推奨します。",
      href: "/ja/app/invoices/unpaid",
    },
    {
      id: "al3",
      type: "expense",
      severity: "critical",
      title: "広告費が先月比 22% 増加しました",
      description: "費用対効果の確認が必要です。",
      href: "/ja/app/reports/expense",
    },
    {
      id: "al4",
      type: "tax",
      severity: "info",
      title: "消費税見込みは ¥85,000 です",
      description: "正式申告前の参考値です。",
      href: "/ja/app/tax/summary",
    },
  ],

  businessHealth: {
    score: 82,
    status: "good",
    dimensions: [
      { label: "Revenue Growth", score: 84 },
      { label: "Profit Margin", score: 79 },
      { label: "Cash Runway", score: 81 },
      { label: "Inventory Health", score: 76 },
      { label: "Outstanding Payments", score: 70 },
    ],
    insights: [
      { id: "i1", title: "今月の利益率は先月より改善しています", tone: "good" },
      { id: "i2", title: "Amazon JP 店舗の広告費が高止まりしています", tone: "warning" },
      { id: "i3", title: "未入金が増加しているため、回収確認を推奨します", tone: "warning" },
    ],
  },

  recentTransactions: [
    { id: "t1", date: "2026-03-06", type: "収入", category: "店舗注文", amount: 125000, account: "Amazon 売上金", store: "Amazon JP", memo: "3月前半売上" },
    { id: "t2", date: "2026-03-06", type: "支出", category: "広告費", amount: -28000, account: "三井住友銀行", store: "Amazon JP", memo: "CPC 調整" },
    { id: "t3", date: "2026-03-05", type: "支出", category: "物流", amount: -14500, account: "三井住友銀行", store: "全店舗", memo: null },
    { id: "t4", date: "2026-03-04", type: "収入", category: "現金収入", amount: 18000, account: "会社現金", store: "実店舗", memo: "店頭販売" },
    { id: "t5", date: "2026-03-03", type: "支出", category: "会社運営費", amount: -22000, account: "Stripe", store: "全店舗", memo: "SaaS 利用料" },
  ],

  quickActions: [
    { key: "addIncome", label: "収入を追加", subLabel: "現金・売上", href: "/ja/app/income", icon: "plus" },
    { key: "addExpense", label: "支出を追加", subLabel: "経費・運営費", href: "/ja/app/expenses", icon: "minus" },
    { key: "transfer", label: "資金移動を記録", subLabel: "口座間移動", href: "/ja/app/fund-transfer", icon: "arrow" },
    { key: "invoice", label: "請求書を作成", subLabel: "新規請求", href: "/ja/app/invoices", icon: "file" },
    { key: "import", label: "データをインポート", subLabel: "CSV / 明細", href: "/ja/app/data/import", icon: "upload" },
    { key: "reports", label: "レポートを見る", subLabel: "利益 / CF", href: "/ja/app/reports/profit", icon: "chart" },
  ],
};
