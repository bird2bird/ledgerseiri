export type PlatformAdminLang = "en" | "zh-CN" | "zh-TW" | "ja";

const dictionaries = {
  en: {
    shell: {
      workspace: "Investigation Workspace",
      dashboard: "Dashboard",
      reload: "Reload",
      language: "Language",
    },
    executive: {
      title: "Executive Summary",
      totalUsers: "Total Users",
      paidUsers: "Paid Users",
      newUsersThisMonth: "New This Month",
      churnedUsersThisMonth: "Reduced This Month",
      netGrowthThisMonth: "Net Growth",
      currentMrr: "Current MRR",
      planComposition: "Plan Composition",
      monthlyUserGrowth: "User Growth (12 Months)",
      plan: "Plan",
      userCount: "Users",
      tenantCount: "Tenants",
      ratio: "Ratio",
      revenue: "Revenue",
    },
    plans: {
      free: "Free",
      starter: "Starter",
      standard: "Standard",
      premium: "Premium",
    },
    dashboard: {
      userGrowthHint: "New users and cumulative total over the last 12 months.",
      barTotal: "Total",
      barNew: "New",
      openUsers: "Open Users",
      openTenants: "Open Tenants",
      openOperations: "Open Operations Center",
    },
  },
  "zh-CN": {
    shell: {
      workspace: "调查工作台",
      dashboard: "首页总览",
      reload: "刷新",
      language: "语言",
    },
    executive: {
      title: "经营摘要",
      totalUsers: "总用户数",
      paidUsers: "付费用户数",
      newUsersThisMonth: "本月新增",
      churnedUsersThisMonth: "本月减少",
      netGrowthThisMonth: "本月净增长",
      currentMrr: "当前月经常性收入",
      planComposition: "Plan 分布",
      monthlyUserGrowth: "用户增长（近 12 个月）",
      plan: "Plan",
      userCount: "用户数",
      tenantCount: "租户数",
      ratio: "占比",
      revenue: "收入贡献",
    },
    plans: {
      free: "免费版",
      starter: "入门版",
      standard: "标准版",
      premium: "高级版",
    },
    dashboard: {
      userGrowthHint: "展示最近 12 个月的新增用户与累计用户变化。",
      barTotal: "累计",
      barNew: "新增",
      openUsers: "打开用户页",
      openTenants: "打开租户页",
      openOperations: "打开运营中心",
    },
  },
} as const;

export function normalizePlatformAdminLang(lang: string): keyof typeof dictionaries {
  if (lang === "zh-CN") return "zh-CN";
  if (lang === "zh-TW") return "zh-CN";
  if (lang === "ja") return "en";
  return "en";
}

export function getPlatformAdminDictionary(lang: string) {
  return dictionaries[normalizePlatformAdminLang(lang)];
}
