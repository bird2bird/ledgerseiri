"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";

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

export function DashboardSidebar({ t }: { t: (k: string) => string }) {
  const pathname = usePathname() || "";
  const params = useParams<{ lang: string }>();
  const lang = (params?.lang || "ja") as string;

  const withLang = (p: string) => `/${lang}${p}`;

  const isActive = (p: string) => {
    const full = withLang(p);
    return pathname === full || pathname.startsWith(full + "/");
  };

  const openLedger = useMemo(
    () =>
      isActive("/app/ledgers") ||
      isActive("/app/journals") ||
      isActive("/app/purchases") ||
      isActive("/app/payments") ||
      isActive("/app/expenses") ||
      isActive("/app/other-income") ||
      isActive("/app/other-expense"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pathname, lang]
  );

  const openReport = useMemo(
    () => isActive("/app/reports/profit") || isActive("/app/reports/cashflow") || isActive("/app/reports/detail"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pathname, lang]
  );

  const openTax = useMemo(
    () =>
      isActive("/app/tax/vat") ||
      isActive("/app/tax/income") ||
      isActive("/app/tax/annual-deduction") ||
      isActive("/app/tax/annual-settlement"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pathname, lang]
  );

  const Item = ({ href, label }: { href: string; label: string }) => {
    const active = isActive(href);
    return (
      <Link
        href={withLang(href)}
        className={cls(
          "ls-nav-item", active ? "ls-nav-item-active" : ""
        )}
      >
        {label}
      </Link>
    );
  };

  const Group = ({
    title,
    defaultOpen,
    children,
  }: {
    title: string;
    defaultOpen: boolean;
    children: React.ReactNode;
  }) => {
    return (
      <details className="group" {...(defaultOpen ? { open: true } : {})}>
        <summary className="list-none cursor-pointer select-none rounded-xl px-3 py-2 hover:bg-black/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-900">{title}</span>
            <span className="group-open:hidden">
              <Caret open={false} />
            </span>
            <span className="hidden group-open:inline">
              <Caret open={true} />
            </span>
          </div>
        </summary>
        <div className="mt-1 space-y-1 pl-3">{children}</div>
      </details>
    );
  };

  return (
    <aside className="col-span-12 lg:col-span-3 self-stretch flex flex-col">
      <div className="sticky top-[78px]">{/* LS_SIDEBAR_WRAP_V2 */}

        <div className="ls-nav-card p-4 top-[78px]">
<div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">{t("menu")}</div>
          <div className="text-[11px] text-slate-400/80">Block 5</div>
        </div>

        <div className="mt-3 text-[12px] text-slate-500">{t("cloudLedger")}</div>

        <nav className="mt-2 space-y-1 flex-1 min-h-0 overflow-auto pr-1">
          <Item href="/app" label={t("home")} />

          <div className="my-3 ls-soft-divider" />

          <Group title={t("ledgerList")} defaultOpen={openLedger}>
            <Item href="/app/journals" label={t("journalList")} />
            <Item href="/app/purchases" label={t("purchase")} />
            <Item href="/app/payments" label={t("payment")} />
            <Item href="/app/expenses" label={t("expense")} />
            <Item href="/app/other-income" label={t("otherIncome")} />
            <Item href="/app/other-expense" label={t("otherExpense")} />
          </Group>

          <div className="my-3 ls-soft-divider" />

          <Group title={t("financeReport")} defaultOpen={openReport}>
            <Item href="/app/reports/profit" label={t("profitReport")} />
            <Item href="/app/reports/cashflow" label={t("cashflow")} />
            <Item href="/app/reports/detail" label={t("detail")} />
          </Group>

          <div className="my-3 ls-soft-divider" />

          <Group title={t("tax")} defaultOpen={openTax}>
            <Item href="/app/tax/vat" label={t("vat")} />
            <Item href="/app/tax/income" label={t("incomeTax")} />
            <Item href="/app/tax/annual-deduction" label={t("annualDeduction")} />
            <Item href="/app/tax/annual-settlement" label={t("annualSettlement")} />
          </Group>
        </nav>
      
        </div>

      </div>
    </aside>
  );
}
