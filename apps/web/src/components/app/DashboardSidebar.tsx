"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useParams, useSearchParams } from "next/navigation";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";
import { fetchWorkspaceContext } from "@/core/workspace/api";
import { useFeatures } from "@/hooks/useFeatures";
import type { PlanCode } from "@/components/app/dashboard-v2/types";

function cls(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function normalizePlanCode(raw?: string | null): PlanCode {
  if (raw === "starter" || raw === "standard" || raw === "premium") return raw;
  return "starter";
}

function Caret({ open }: { open: boolean }) {
  return (
    <span
      className={cls(
        "inline-flex h-5 w-5 items-center justify-center rounded-md border border-black/5 bg-white text-slate-500",
        "transition-transform",
        open && "rotate-180"
      )}
      aria-hidden="true"
    >
      ▾
    </span>
  );
}

function LockBadge({ level }: { level: "standard" | "premium" }) {
  const text = level === "standard" ? "🔒 Std+" : "🔒 Pro";
  const tone =
    level === "standard"
      ? "border-sky-200 bg-sky-50 text-sky-700"
      : "border-violet-200 bg-violet-50 text-violet-700";

  return (
    <span
      className={cls(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none",
        tone
      )}
    >
      {text}
    </span>
  );
}

function requiredPlanTooltip(
  lang: Lang,
  level?: "standard" | "premium"
): string | undefined {
  if (!level) return undefined;

  if (lang === "ja") {
    return level === "standard"
      ? "Standard 以上で利用できます"
      : "Premium プランで利用できます";
  }

  if (lang === "zh-CN") {
    return level === "standard"
      ? "Standard 及以上套餐可用"
      : "Premium 套餐可用";
  }

  if (lang === "zh-TW") {
    return level === "standard"
      ? "Standard 以上方案可用"
      : "Premium 方案可用";
  }

  return level === "standard"
    ? "Available on Standard and Premium"
    : "Available on Premium";
}

type MenuLeaf = {
  kind: "leaf";
  key: string;
  label: string;
  href?: string;
  locked?: boolean;
  requiredPlan?: "standard" | "premium";
};

type MenuGroup = {
  kind: "group";
  key: string;
  label: string;
  items: Array<MenuLeaf | MenuGroup>;
  locked?: boolean;
  requiredPlan?: "standard" | "premium";
};

type MenuNode = MenuLeaf | MenuGroup;

type Dict = {
  menu: string;
  cloudLedger: string;
  home: string;
  help: string;
  accountSettings: string;
  funds: string;
  transactions: string;
  inventory: string;
  invoices: string;
  reports: string;
  taxSummary: string;
  dataManagement: string;
  accountList: string;
  accountBalance: string;
  fundTransfer: string;
  income: string;
  expense: string;
  cashIncome: string;
  storeOrders: string;
  otherIncome: string;
  storeOpsExpense: string;
  companyOpsExpense: string;
  salary: string;
  otherExpense: string;
  productList: string;
  inventoryStatus: string;
  inventoryAlerts: string;
  invoiceList: string;
  unpaid: string;
  paymentHistory: string;
  incomeAnalysis: string;
  expenseAnalysis: string;
  profitAnalysis: string;
  cashflow: string;
  consumptionTaxEstimate: string;
  dataImport: string;
  dataExport: string;
  profile: string;
  companyInfo: string;
  userManagement: string;
  permissionManagement: string;
  accountConfig: string;
  categoryManagement: string;
  storeManagement: string;
  currencyTaxSettings: string;
  notificationSettings: string;
  security: string;
  planInfo: string;
  planChange: string;
};

const DICT: Record<Lang, Dict> = {
  ja: {
    menu: "メニュー",
    cloudLedger: "クラウド経営",
    home: "ホーム",
    help: "ヘルプ",
    accountSettings: "アカウント設定",
    funds: "資金管理",
    transactions: "取引データ",
    inventory: "在庫管理",
    invoices: "請求管理",
    reports: "レポート",
    taxSummary: "税金サマリー",
    dataManagement: "データ管理",
    accountList: "口座一覧",
    accountBalance: "口座残高",
    fundTransfer: "資金移動",
    income: "収入",
    expense: "支出",
    cashIncome: "現金収入",
    storeOrders: "店舗注文",
    otherIncome: "その他収入",
    storeOpsExpense: "店舗運営費",
    companyOpsExpense: "会社運営費",
    salary: "給与",
    otherExpense: "その他支出",
    productList: "商品一覧",
    inventoryStatus: "在庫状況",
    inventoryAlerts: "在庫アラート",
    invoiceList: "請求書",
    unpaid: "未入金",
    paymentHistory: "入金履歴",
    incomeAnalysis: "収入分析",
    expenseAnalysis: "支出分析",
    profitAnalysis: "利益分析",
    cashflow: "キャッシュフロー",
    consumptionTaxEstimate: "消費税（概算）",
    dataImport: "データインポート",
    dataExport: "データエクスポート",
    profile: "プロフィール",
    companyInfo: "会社情報",
    userManagement: "ユーザー管理",
    permissionManagement: "権限管理",
    accountConfig: "口座設定",
    categoryManagement: "カテゴリー管理",
    storeManagement: "店舗管理",
    currencyTaxSettings: "通貨・税率設定",
    notificationSettings: "通知設定",
    security: "セキュリティ",
    planInfo: "プラン情報",
    planChange: "プラン変更",
  },
  en: {
    menu: "Menu",
    cloudLedger: "Business Console",
    home: "Home",
    help: "Help",
    accountSettings: "Account Settings",
    funds: "Funds",
    transactions: "Transaction Data",
    inventory: "Inventory",
    invoices: "Invoices",
    reports: "Reports",
    taxSummary: "Tax Summary",
    dataManagement: "Data Management",
    accountList: "Accounts",
    accountBalance: "Account Balances",
    fundTransfer: "Fund Transfer",
    income: "Income",
    expense: "Expense",
    cashIncome: "Cash Income",
    storeOrders: "Store Orders",
    otherIncome: "Other Income",
    storeOpsExpense: "Store Operating",
    companyOpsExpense: "Company Operating",
    salary: "Salary",
    otherExpense: "Other Expense",
    productList: "Products",
    inventoryStatus: "Inventory Status",
    inventoryAlerts: "Inventory Alerts",
    invoiceList: "Invoices",
    unpaid: "Unpaid",
    paymentHistory: "Payment History",
    incomeAnalysis: "Income Analysis",
    expenseAnalysis: "Expense Analysis",
    profitAnalysis: "Profit Analysis",
    cashflow: "Cash Flow",
    consumptionTaxEstimate: "Consumption Tax",
    dataImport: "Data Import",
    dataExport: "Data Export",
    profile: "Profile",
    companyInfo: "Company Info",
    userManagement: "User Management",
    permissionManagement: "Permission Management",
    accountConfig: "Account Settings",
    categoryManagement: "Category Management",
    storeManagement: "Store Management",
    currencyTaxSettings: "Currency & Tax",
    notificationSettings: "Notifications",
    security: "Security",
    planInfo: "Plan Info",
    planChange: "Change Plan",
  },
  "zh-CN": {
    menu: "菜单",
    cloudLedger: "云记账",
    home: "首页",
    help: "帮助",
    accountSettings: "账户设置",
    funds: "资金管理",
    transactions: "交易数据",
    inventory: "库存管理",
    invoices: "请款管理",
    reports: "报表",
    taxSummary: "税务摘要",
    dataManagement: "数据管理",
    accountList: "账户列表",
    accountBalance: "账户余额",
    fundTransfer: "资金移动",
    income: "收入",
    expense: "支出",
    cashIncome: "现金收入",
    storeOrders: "店铺订单",
    otherIncome: "其他收入",
    storeOpsExpense: "店铺运营费",
    companyOpsExpense: "公司运营费",
    salary: "工资",
    otherExpense: "其他支出",
    productList: "商品列表",
    inventoryStatus: "库存状态",
    inventoryAlerts: "库存预警",
    invoiceList: "发票",
    unpaid: "未入金",
    paymentHistory: "入金记录",
    incomeAnalysis: "收入分析",
    expenseAnalysis: "支出分析",
    profitAnalysis: "利润分析",
    cashflow: "现金流",
    consumptionTaxEstimate: "消费税（估算）",
    dataImport: "数据导入",
    dataExport: "数据导出",
    profile: "个人资料",
    companyInfo: "公司信息",
    userManagement: "用户管理",
    permissionManagement: "权限管理",
    accountConfig: "账户设置",
    categoryManagement: "分类管理",
    storeManagement: "店铺管理",
    currencyTaxSettings: "货币/税率设置",
    notificationSettings: "通知设置",
    security: "安全",
    planInfo: "套餐信息",
    planChange: "套餐变更",
  },
  "zh-TW": {
    menu: "選單",
    cloudLedger: "雲記帳",
    home: "首頁",
    help: "幫助",
    accountSettings: "帳戶設定",
    funds: "資金管理",
    transactions: "交易資料",
    inventory: "庫存管理",
    invoices: "請款管理",
    reports: "報表",
    taxSummary: "稅務摘要",
    dataManagement: "資料管理",
    accountList: "帳戶列表",
    accountBalance: "帳戶餘額",
    fundTransfer: "資金移動",
    income: "收入",
    expense: "支出",
    cashIncome: "現金收入",
    storeOrders: "店鋪訂單",
    otherIncome: "其他收入",
    storeOpsExpense: "店鋪營運費",
    companyOpsExpense: "公司營運費",
    salary: "薪資",
    otherExpense: "其他支出",
    productList: "商品列表",
    inventoryStatus: "庫存狀態",
    inventoryAlerts: "庫存預警",
    invoiceList: "請求書",
    unpaid: "未入金",
    paymentHistory: "入金紀錄",
    incomeAnalysis: "收入分析",
    expenseAnalysis: "支出分析",
    profitAnalysis: "利潤分析",
    cashflow: "現金流",
    consumptionTaxEstimate: "消費稅（估算）",
    dataImport: "資料匯入",
    dataExport: "資料匯出",
    profile: "個人資料",
    companyInfo: "公司資訊",
    userManagement: "使用者管理",
    permissionManagement: "權限管理",
    accountConfig: "帳戶設定",
    categoryManagement: "分類管理",
    storeManagement: "店鋪管理",
    currencyTaxSettings: "貨幣/稅率設定",
    notificationSettings: "通知設定",
    security: "安全",
    planInfo: "方案資訊",
    planChange: "方案變更",
  },
};

function leaf(
  key: string,
  label: string,
  href?: string,
  locked = false,
  requiredPlan?: "standard" | "premium"
): MenuLeaf {
  return { kind: "leaf", key, label, href, locked, requiredPlan };
}

function group(
  key: string,
  label: string,
  items: Array<MenuLeaf | MenuGroup>
): MenuGroup {
  return { kind: "group", key, label, items };
}

export function DashboardSidebar() {
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();
  const params = useParams<{ lang: string; slug?: string }>();
  const lang = normalizeLang(params?.lang) as Lang;
  const debugPlan = searchParams?.get("plan") || undefined;
  const t = DICT[lang];

  const [planCode, setPlanCode] = useState<PlanCode>("starter");

  const currentSlug = useMemo(() => {
    const parts = (pathname || "").split("/").filter(Boolean);
    return parts.length >= 3 ? parts[2] : "weiwei";
  }, [pathname]);

  useEffect(() => {
    let alive = true;

    async function loadWorkspacePlan() {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("ls_token") : null;

        if (!token) return;

        const ctx = await fetchWorkspaceContext({
            token,
            slug: currentSlug,
            locale: lang,
            plan: debugPlan,
          });

        if (!alive) return;
        setPlanCode(ctx.subscription.planCode);
      } catch {
        // keep starter fallback
      }
    }

    loadWorkspacePlan();
    return () => {
      alive = false;
    };
  }, [currentSlug, lang, debugPlan]);

  const { features } = useFeatures(planCode);


  // repository-ready note:
  // server pages should use getWorkspaceContext()
  // client sidebar keeps lightweight local resolution for now.

  

  const withLang = (p: string) => `/${lang}${p}`;

  const isActive = (p?: string) => {
    if (!p) return false;
    const full = `/${lang}${p}`;
    return pathname === full || pathname.startsWith(full + "/");
  };

  const menu = useMemo<MenuNode[]>(() => {
    return [
      leaf("home", t.home, "/app"),

      group("funds", t.funds, [
        leaf("account-list", t.accountList, "/app/accounts"),
        leaf("account-balance", t.accountBalance, "/app/account-balances"),
        leaf(
          "fund-transfer",
          t.fundTransfer,
          "/app/fund-transfer",
          !features.fundTransfer,
          "standard"
        ),
      ]),

      group("transactions", t.transactions, [
        group("income", t.income, [
          leaf("cash-income", t.cashIncome, "/app/income/cash"),
          leaf("store-orders", t.storeOrders, "/app/income/store-orders"),
          leaf("other-income", t.otherIncome, "/app/income/other"),
        ]),
        group("expense", t.expense, [
          leaf("store-ops", t.storeOpsExpense, "/app/expense/store-ops"),
          leaf("company-ops", t.companyOpsExpense, "/app/expense/company-ops"),
          leaf("salary", t.salary, "/app/expense/salary"),
          leaf("other-expense", t.otherExpense, "/app/expense/other"),
        ]),
      ]),

      group("inventory", t.inventory, [
        leaf("product-list", t.productList, "/app/products"),
        leaf(
          "inventory-status",
          t.inventoryStatus,
          "/app/inventory/status",
          !features.multiStore,
          "standard"
        ),
        leaf("inventory-alerts", t.inventoryAlerts, "/app/inventory/alerts"),
      ]),

      group("invoices", t.invoices, [
        leaf(
          "invoice-list",
          t.invoiceList,
          "/app/invoices",
          !features.invoiceManagement,
          "standard"
        ),
        leaf(
          "unpaid",
          t.unpaid,
          "/app/invoices/unpaid",
          !features.invoiceManagement,
          "standard"
        ),
        leaf(
          "payment-history",
          t.paymentHistory,
          "/app/invoices/history",
          !features.invoiceManagement,
          "standard"
        ),
      ]),

      group("reports", t.reports, [
        leaf("income-analysis", t.incomeAnalysis, "/app/reports/income"),
        leaf("expense-analysis", t.expenseAnalysis, "/app/reports/expense"),
        leaf(
          "profit-analysis",
          t.profitAnalysis,
          "/app/reports/profit",
          !features.history24m,
          "standard"
        ),
        leaf("cashflow", t.cashflow, "/app/reports/cashflow"),
      ]),

      group("tax-summary", t.taxSummary, [
        leaf("consumption-tax", t.consumptionTaxEstimate, "/app/tax/summary"),
      ]),

      group("data-management", t.dataManagement, [
        leaf(
          "data-import",
          t.dataImport,
          "/app/data/import",
          !features.invoiceUpload,
          "standard"
        ),
        leaf(
          "data-export",
          t.dataExport,
          "/app/data/export",
          !features.advancedExport,
          "standard"
        ),
      ]),

      leaf("help", t.help, "/app/help"),

      group("account-settings", t.accountSettings, [
        leaf("profile", t.profile, "/app/settings/profile"),
        leaf("company-info", t.companyInfo, "/app/settings/company"),
        leaf("user-management", t.userManagement, "/app/settings/users"),
        leaf("permission-management", t.permissionManagement, "/app/settings/permissions"),
        leaf("account-config", t.accountConfig, "/app/settings/accounts"),
        leaf("category-management", t.categoryManagement, "/app/settings/categories"),
        leaf(
          "store-management",
          t.storeManagement,
          "/app/settings/stores",
          !features.multiStore,
          "standard"
        ),
        leaf("currency-tax-settings", t.currencyTaxSettings, "/app/settings/currency-tax"),
        leaf("notification-settings", t.notificationSettings, "/app/settings/notifications"),
        leaf("security", t.security, "/app/settings/security"),
        leaf("plan-info", t.planInfo, "/app/billing"),
        leaf("plan-change", t.planChange, "/app/billing/change"),
      ]),
    ];
  }, [t, features]);

  function LeafItem({ item, depth = 0 }: { item: MenuLeaf; depth?: number }) {
    const active = isActive(item.href);
    const tooltip = requiredPlanTooltip(lang, item.requiredPlan);

    const commonClass = cls(
      "flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm transition",
      depth > 0 ? "ml-3" : "",
      item.locked
        ? "cursor-not-allowed border border-dashed border-slate-200 bg-slate-50/70 text-slate-400"
        : active
        ? "ls-nav-item ls-nav-item-active"
        : "ls-nav-item"
    );

    const left = (
      <div className="min-w-0 truncate font-medium">
        {item.label}
      </div>
    );

    const right = item.locked ? <LockBadge level={item.requiredPlan || "premium"} /> : null;

    if (item.locked) {
      return (
        <div
          className={commonClass}
          title={tooltip}
          aria-disabled="true"
        >
          {left}
          {right}
        </div>
      );
    }

    return (
      <Link href={withLang(item.href || "/app")} className={commonClass} title={tooltip}>
        {left}
        {right}
      </Link>
    );
  }

  function GroupNode({ node, depth = 0 }: { node: MenuGroup; depth?: number }) {
    const childHasActive = node.items.some((it) => {
      if (it.kind === "leaf") return isActive(it.href);
      return it.items.some((x) => (x.kind === "leaf" ? isActive(x.href) : false));
    });

    return (
      <details className={cls("group", depth > 0 && "ml-3")} open={childHasActive || depth === 0}>
        <summary className="list-none cursor-pointer select-none rounded-xl px-3 py-2 hover:bg-black/[0.03]">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-slate-900">{node.label}</span>
            <span className="group-open:hidden">
              <Caret open={false} />
            </span>
            <span className="hidden group-open:inline">
              <Caret open={true} />
            </span>
          </div>
        </summary>

        <div className="mt-1 space-y-1">
          {node.items.map((it) =>
            it.kind === "leaf" ? (
              <LeafItem key={it.key} item={it} depth={depth + 1} />
            ) : (
              <GroupNode key={it.key} node={it} depth={depth + 1} />
            )
          )}
        </div>
      </details>
    );
  }

  return (
    <aside className="col-span-12 lg:col-span-3 self-stretch flex flex-col">
      <div className="sticky top-[78px]">
        <div className="ls-nav-card p-4 min-h-[360px]">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900">{t.menu}</div>
            <div className="text-[11px] text-slate-400/80">{planCode}</div>
          </div>

          <div className="mt-3 text-[12px] text-slate-500">{t.cloudLedger}</div>

          <nav className="mt-3 max-h-[calc(100vh-140px)] overflow-auto space-y-3 pr-1">
            {menu.map((node) =>
              node.kind === "leaf" ? (
                <LeafItem key={node.key} item={node} />
              ) : (
                <GroupNode key={node.key} node={node} />
              )
            )}
          </nav>
        </div>
      </div>
    </aside>
  );
}
