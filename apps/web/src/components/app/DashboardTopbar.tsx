"use client";

import React from "react";
import CommandPalette from "@/components/CommandPalette";
import LanguageMenu from "@/components/LanguageMenu";
import UserMenu from "@/components/UserMenu";

export function DashboardTopbar({
  appName,
  companyName,
  onLogout,
}: {
  appName: string;
  companyName: string;
  onLogout: () => void;
}) {
  return (
    <header className="ls-topbar">
      <div className="ls-topbar-inner">
        <div className="flex min-w-[220px] items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--ls-primary)] text-sm font-bold text-white shadow-sm">
            LS
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-semibold tracking-tight text-slate-900">
              {appName}
            </div>
            <div className="text-[12px] text-slate-500">{companyName}</div>
          </div>
        </div>

        <div className="hidden min-w-0 flex-1 px-3 lg:block">
          <div className="relative max-w-[420px]">
            <input
              className="ls-input h-[42px] pl-10 pr-14"
              placeholder="Search..."
              readOnly
            />
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              ⌕
            </div>
            <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 ls-kbd">
              ⌘K
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CommandPalette />
          <LanguageMenu />
          <UserMenu onLogout={onLogout} />
        </div>
      </div>
    </header>
  );
}
