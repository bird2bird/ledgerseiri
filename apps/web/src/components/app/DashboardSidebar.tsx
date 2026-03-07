"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";

function cls(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
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

type MenuLeaf = {
  kind: "leaf";
  key: string;
  label: string;
  href?: string; // no href = visual-only item for now
};

type MenuGroup = {
  kind: "group";
  key: string;
  label: string;
  items: Array<MenuLeaf | MenuGroup>;
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
    home: "首页",
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
    home: "首頁",
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
    home: "Home",
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

export function DashboardSidebar() {
  const pathname = usePathname() || "";
  const params = useParams<{ lang: string }>();
  const lang = normalizeLang(params?.lang) as Lang;
  const t = DICT[lang];

  const withLang = (p: string) => `/${lang}${p}`;

  const isActive = (p?: string) => {
    if (!p) return false;
    const full = withLang(p);
    return pathname === full || pathname.startsWith(full + "/");
  };

  const menu = useMemo<MenuNode[]>(() => {
    return [
      { kind: "leaf", key: "home", label: t.home, href: "/app" },

      {
        kind: "group",
        key: "funds",
        label: t.funds,
        items: [
          { kind: "leaf", key: "accountList", label: t.accountList },
          { kind: "leaf", key: "accountBalance", label: t.accountBalance },
          { kind: "leaf", key: "fundTransfer", label: t.fundTransfer },
        ],
      },

      {
        kind: "group",
        key: "transactions",
        label: t.transactions,
        items: [
          {
            kind: "group",
            key: "income",
            label: t.income,
            items: [
              { kind: "leaf", key: "cashIncome", label: t.cashIncome },
              { kind: "leaf", key: "storeOrders", label: t.storeOrders },
              { kind: "leaf", key: "otherIncome", label: t.otherIncome },
            ],
          },
          {
            kind: "group",
            key: "expense",
            label: t.expense,
            items: [
              { kind: "leaf", key: "storeOpsExpense", label: t.storeOpsExpense },
              { kind: "leaf", key: "companyOpsExpense", label: t.companyOpsExpense },
              { kind: "leaf", key: "salary", label: t.salary },
              { kind: "leaf", key: "otherExpense", label: t.otherExpense },
            ],
          },
        ],
      },

      {
        kind: "group",
        key: "inventory",
        label: t.inventory,
        items: [
          { kind: "leaf", key: "productList", label: t.productList },
          { kind: "leaf", key: "inventoryStatus", label: t.inventoryStatus },
          { kind: "leaf", key: "inventoryAlerts", label: t.inventoryAlerts },
        ],
      },

      {
        kind: "group",
        key: "invoices",
        label: t.invoices,
        items: [
          { kind: "leaf", key: "invoiceList", label: t.invoiceList },
          { kind: "leaf", key: "unpaid", label: t.unpaid },
          { kind: "leaf", key: "paymentHistory", label: t.paymentHistory },
        ],
      },

      {
        kind: "group",
        key: "reports",
        label: t.reports,
        items: [
          { kind: "leaf", key: "incomeAnalysis", label: t.incomeAnalysis },
          { kind: "leaf", key: "expenseAnalysis", label: t.expenseAnalysis },
          { kind: "leaf", key: "profitAnalysis", label: t.profitAnalysis, href: "/app/reports/profit" },
          { kind: "leaf", key: "cashflow", label: t.cashflow, href: "/app/reports/cashflow" },
        ],
      },

      {
        kind: "group",
        key: "taxSummary",
        label: t.taxSummary,
        items: [
          { kind: "leaf", key: "consumptionTaxEstimate", label: t.consumptionTaxEstimate },
        ],
      },

      {
        kind: "group",
        key: "dataManagement",
        label: t.dataManagement,
        items: [
          { kind: "leaf", key: "dataImport", label: t.dataImport },
          { kind: "leaf", key: "dataExport", label: t.dataExport },
        ],
      },

      { kind: "leaf", key: "help", label: t.help },

      {
        kind: "group",
        key: "accountSettings",
        label: t.accountSettings,
        items: [
          { kind: "leaf", key: "profile", label: t.profile },
          { kind: "leaf", key: "companyInfo", label: t.companyInfo },
          { kind: "leaf", key: "userManagement", label: t.userManagement },
          { kind: "leaf", key: "permissionManagement", label: t.permissionManagement },
          { kind: "leaf", key: "accountConfig", label: t.accountConfig },
          { kind: "leaf", key: "categoryManagement", label: t.categoryManagement },
          { kind: "leaf", key: "storeManagement", label: t.storeManagement },
          { kind: "leaf", key: "currencyTaxSettings", label: t.currencyTaxSettings },
          { kind: "leaf", key: "notificationSettings", label: t.notificationSettings },
          { kind: "leaf", key: "security", label: t.security },
          { kind: "leaf", key: "planInfo", label: t.planInfo },
          { kind: "leaf", key: "planChange", label: t.planChange },
        ],
      },
    ];
  }, [t]);

  const nodeHasActive = (node: MenuNode): boolean => {
    if (node.kind === "leaf") return isActive(node.href);
    return node.items.some(nodeHasActive);
  };

  const Leaf = ({ node, depth = 0 }: { node: MenuLeaf; depth?: number }) => {
    const active = isActive(node.href);
    const baseClass = cls(
      "block rounded-xl px-3 py-2 text-sm transition",
      depth === 0 ? "font-medium" : "text-slate-700",
      active ? "ls-nav-item ls-nav-item-active" : depth === 0 ? "ls-nav-item" : "hover:bg-black/[0.03]"
    );

    if (node.href) {
      return (
        <Link href={withLang(node.href)} className={baseClass}>
          {node.label}
        </Link>
      );
    }

    return (
      <div className={cls(baseClass, "cursor-default text-slate-700/90")}>
        {node.label}
      </div>
    );
  };

  const Group = ({ node, depth = 0 }: { node: MenuGroup; depth?: number }) => {
    const open = nodeHasActive(node) || depth === 0;

    return (
      <details className="group" {...(open ? { open: true } : {})}>
        <summary className={cls(
          "list-none cursor-pointer select-none rounded-xl px-3 py-2 hover:bg-black/[0.03]",
          depth === 0 ? "text-sm font-semibold text-slate-900" : "text-sm font-medium text-slate-800"
        )}>
          <div className="flex items-center justify-between">
            <span>{node.label}</span>
            <span className="group-open:hidden">
              <Caret open={false} />
            </span>
            <span className="hidden group-open:inline">
              <Caret open={true} />
            </span>
          </div>
        </summary>

        <div className={cls("mt-1 space-y-1", depth === 0 ? "pl-3" : "pl-4")}>
          {node.items.map((child) =>
            child.kind === "leaf" ? (
              <Leaf key={child.key} node={child} depth={depth + 1} />
            ) : (
              <Group key={child.key} node={child} depth={depth + 1} />
            )
          )}
        </div>
      </details>
    );
  };

  return (
    <aside className="col-span-12 lg:col-span-3 self-stretch flex flex-col">
      <div className="sticky top-[78px]">
        <div className="ls-nav-card p-4 h-[calc(100vh-78px-28px)] flex flex-col">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900">{t.menu}</div>
            <div className="text-[11px] text-slate-400/80">Block 5</div>
          </div>

          <div className="mt-3 text-[12px] text-slate-500">{t.cloudLedger}</div>

          <nav className="mt-3 flex-1 min-h-0 overflow-auto space-y-3 pr-1">
            {menu.map((node) =>
              node.kind === "leaf" ? (
                <Leaf key={node.key} node={node} />
              ) : (
                <Group key={node.key} node={node} />
              )
            )}
          </nav>
        </div>
      </div>
    </aside>
  );
}
