import type { Lang } from "@/lib/i18n/lang";

export type FooterDict = {
  company: { name: string; addr: string };
  links: {
    support: string;
    commerce: string; // 特商法
    terms: string;
    privacy: string;
  };
  social: { x: string; youtube: string; facebook: string };
  copyright: (year: number) => string;
};

export const footerDict: Record<Lang, FooterDict> = {
  ja: {
    company: {
      name: "Kimoca Co., Ltd.（株式会社キモカ）",
      addr: "〒220-0004 神奈川県横浜市西区北幸2丁目10番48号むつみビル3F",
    },
    links: {
      support: "サポート",
      commerce: "特商法に基づく表示",
      terms: "利用規約",
      privacy: "プライバシーポリシー",
    },
    social: { x: "X", youtube: "YouTube", facebook: "Facebook" },
    copyright: (year) => `Copyright © ${year} LedgerSeiri.`,
  },
  en: {
    company: {
      name: "Kimoca Co., Ltd.",
      addr: "Mutsumi Bldg 3F, 2-10-48 Kitasaiwai, Nishi-ku, Yokohama, Kanagawa 220-0004, Japan",
    },
    links: {
      support: "Support",
      commerce: "Commerce disclosure",
      terms: "Terms",
      privacy: "Privacy",
    },
    social: { x: "X", youtube: "YouTube", facebook: "Facebook" },
    copyright: (year) => `Copyright © ${year} LedgerSeiri.`,
  },
  "zh-CN": {
    company: {
      name: "Kimoca Co., Ltd.（株式会社キモカ）",
      addr: "〒220-0004 神奈川県横浜市西区北幸2丁目10番48号むつみビル3F",
    },
    links: {
      support: "支持",
      commerce: "特商法信息披露",
      terms: "服务条款",
      privacy: "隐私政策",
    },
    social: { x: "X", youtube: "YouTube", facebook: "Facebook" },
    copyright: (year) => `Copyright © ${year} LedgerSeiri.`,
  },
  "zh-TW": {
    company: {
      name: "Kimoca Co., Ltd.（株式会社キモカ）",
      addr: "〒220-0004 神奈川県横浜市西区北幸2丁目10番48号むつみビル3F",
    },
    links: {
      support: "支援",
      commerce: "特商法資訊揭露",
      terms: "服務條款",
      privacy: "隱私政策",
    },
    social: { x: "X", youtube: "YouTube", facebook: "Facebook" },
    copyright: (year) => `Copyright © ${year} LedgerSeiri.`,
  },
};
