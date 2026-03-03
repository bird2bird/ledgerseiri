"use client";

import React from "react";

export function DashboardSidebar({
  t,
}: {
  t: (k: string) => string;
}) {
  return (
    <aside className="col-span-12 lg:col-span-3">
      <div className="ls-card-solid p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">{t("menu")}</div>
          <div className="text-[11px] text-slate-400">Block 5</div>
        </div>

        <div className="mt-3 text-[12px] text-slate-500">{t("cloudLedger")}</div>

        <nav className="mt-2 space-y-1 text-sm">
          <a
            className="block rounded-xl bg-[color:rgba(43,92,255,0.10)] px-3 py-2 font-medium text-[color:var(--ls-primary)]"
            href="#"
          >
            {t("home")}
          </a>
          <a className="block rounded-xl px-3 py-2 hover:bg-slate-50" href="#">
            {t("ledgerList")}
          </a>
          <a className="block rounded-xl px-3 py-2 hover:bg-slate-50" href="#">
            {t("journalList")}
          </a>
          <div className="my-2 border-t" />
          <a className="block rounded-xl px-3 py-2 hover:bg-slate-50" href="#">
            {t("purchase")}
          </a>
          <a className="block rounded-xl px-3 py-2 hover:bg-slate-50" href="#">
            {t("payment")}
          </a>
          <a className="block rounded-xl px-3 py-2 hover:bg-slate-50" href="#">
            {t("expense")}
          </a>
          <a className="block rounded-xl px-3 py-2 hover:bg-slate-50" href="#">
            {t("otherIncome")}
          </a>
          <a className="block rounded-xl px-3 py-2 hover:bg-slate-50" href="#">
            {t("otherExpense")}
          </a>
          <div className="my-2 border-t" />
          <div className="text-[12px] text-slate-500 px-3">{t("financeReport")}</div>
          <a className="block rounded-xl px-3 py-2 hover:bg-slate-50" href="#">
            {t("profitReport")}
          </a>
          <a className="block rounded-xl px-3 py-2 hover:bg-slate-50" href="#">
            {t("cashflow")}
          </a>
          <a className="block rounded-xl px-3 py-2 hover:bg-slate-50" href="#">
            {t("detail")}
          </a>
          <div className="my-2 border-t" />
          <div className="text-[12px] text-slate-500 px-3">{t("tax")}</div>
          <a className="block rounded-xl px-3 py-2 hover:bg-slate-50" href="#">
            {t("vat")}
          </a>
          <a className="block rounded-xl px-3 py-2 hover:bg-slate-50" href="#">
            {t("incomeTax")}
          </a>
          <a className="block rounded-xl px-3 py-2 hover:bg-slate-50" href="#">
            {t("annual")}
          </a>
        </nav>
      </div>
    </aside>
  );
}
