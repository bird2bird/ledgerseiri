"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { MenuPopover } from "@/components/ui/MenuPopover";

type LangCode = "ja" | "en" | "zh-CN" | "zh-TW";

const I18N: Record<LangCode, { user: string; profile: string; billing: string; upgrade: string; settings: string; logout: string }> =
  {
    ja: { user: "ユーザー", profile: "プロフィール", billing: "請求", upgrade: "アップグレード", settings: "設定", logout: "ログアウト" },
    en: { user: "User", profile: "Profile", billing: "Billing", upgrade: "Upgrade", settings: "Settings", logout: "Logout" },
    "zh-CN": { user: "用户", profile: "个人资料", billing: "账单", upgrade: "账户升级", settings: "设置", logout: "退出登录" },
    "zh-TW": { user: "用戶", profile: "個人資料", billing: "帳單", upgrade: "帳戶升級", settings: "設定", logout: "退出登入" },
  };

function getLangFromPath(pathname: string): LangCode {
  const seg = (pathname.split("/")[1] || "ja") as LangCode;
  return seg === "ja" || seg === "en" || seg === "zh-CN" || seg === "zh-TW" ? seg : "ja";
}
function withLang(pathname: string, target: string): string {
  const lang = getLangFromPath(pathname);
  return `/${lang}${target}`;
}

export default function UserMenu({ onLogout }: { onLogout?: () => void }) {
  const pathname = usePathname() || "/ja";
  const lang = useMemo(() => getLangFromPath(pathname), [pathname]);
  const t = I18N[lang];

  return (
    <MenuPopover
      width="match-button"
      withCheck={false}
      button={({ toggle }) => (
        <button
          type="button"
          onClick={toggle}
          className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm shadow-sm hover:bg-black/[0.03]"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#eaf1ff] text-[#2b5cff] font-bold text-xs">
            U
          </span>
          <span className="font-medium">{t.user}</span>
          <span className="text-slate-400">▾</span>
        </button>
      )}
      items={[
        { key: "profile", label: t.profile, href: withLang(pathname, "/app/profile") },
        { key: "billing", label: t.billing, href: withLang(pathname, "/app/billing") },
        { key: "upgrade", label: t.upgrade, href: withLang(pathname, "/app/upgrade") },
        { key: "settings", label: t.settings, href: withLang(pathname, "/app/settings") },
        { key: "sep", label: <div className="my-1 h-px bg-black/10" />, onSelect: () => {} },
        { key: "logout", label: t.logout, danger: true, onSelect: () => onLogout?.() },
      ]}
    />
  );
}
