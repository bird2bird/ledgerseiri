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
    <div className="sticky top-0 z-20 border-b border-black/5 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
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
                className="w-[280px] rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[color:rgba(var(--ls-ring)/0.25)]"
                placeholder="Search… (⌘K)"
                readOnly
              />
              <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-black/10 bg-white px-2 py-0.5 text-[11px] text-slate-500 shadow-sm">
                ⌘K
              </div>
            </div>
          </div>

          <LanguageMenu />
          <UserMenu onLogout={onLogout} />
        </div>
      </div>
    </div>
  );
}
