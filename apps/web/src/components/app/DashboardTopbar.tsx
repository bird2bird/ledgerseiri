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
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--ls-primary)] text-white text-sm font-bold shadow-sm">
            LS
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">{appName}</div>
            <div className="text-[12px] text-slate-500">{companyName}</div>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <CommandPalette />

          {/* Search (opens palette via Cmd/Ctrl+K) */}
          <div className="hidden lg:flex items-center">
            <div className="relative">
              <input
                className="ls-input w-[320px]"
                placeholder="Search… (⌘K)"
                readOnly
              />
              <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 ls-kbd">
                ⌘K
              </div>
            </div>
          </div>

          <LanguageMenu />
          <UserMenu onLogout={onLogout} />
        </div>
      </div>
    </header>
  );
}
