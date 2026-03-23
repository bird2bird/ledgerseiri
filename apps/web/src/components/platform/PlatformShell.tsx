"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearPlatformAccessToken } from "@/core/platform-auth/client";
import type { ReactNode } from "react";

const NAV_ITEMS = [
  { href: "/platform/dashboard", label: "Dashboard" },
  { href: "/platform/tenants", label: "Tenants" },
  { href: "/platform/users", label: "Users" },
  { href: "/platform/reconciliation", label: "Reconciliation" },
  { href: "/platform/audit", label: "Audit" },
];

export function PlatformShell({
  lang,
  title,
  children,
}: {
  lang: string;
  title: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="grid min-h-screen grid-cols-[260px_1fr]">
        <aside className="border-r border-slate-800 bg-slate-900/95 p-5">
          <div className="mb-8">
            <div className="text-xs uppercase tracking-[0.25em] text-cyan-400">
              Hidden Entry
            </div>
            <div className="mt-2 text-2xl font-semibold">Platform Admin</div>
            <div className="mt-2 text-sm text-slate-400">
              Secure operations console
            </div>
          </div>

          <nav className="space-y-2">
            {NAV_ITEMS.map((item) => {
              const href = `/${lang}${item.href}`;
              const active = pathname === href;
              return (
                <Link
                  key={item.href}
                  href={href}
                  className={[
                    "block rounded-xl px-4 py-3 text-sm transition",
                    active
                      ? "bg-cyan-500/15 text-cyan-300"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            className="mt-8 w-full rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-200 hover:bg-slate-800"
            onClick={() => {
              clearPlatformAccessToken();
              router.push(`/${lang}/platform-auth/login`);
            }}
          >
            Logout
          </button>
        </aside>

        <main className="min-h-screen">
          <header className="border-b border-slate-800 bg-slate-950/80 px-8 py-5 backdrop-blur">
            <div className="text-xs uppercase tracking-[0.25em] text-slate-400">
              LedgerSeiri Platform
            </div>
            <div className="mt-1 text-2xl font-semibold">{title}</div>
          </header>

          <div className="p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
