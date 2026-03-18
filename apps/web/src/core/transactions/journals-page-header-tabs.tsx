import React from "react";
import Link from "next/link";
import type { JournalTab } from "@/core/transactions/transactions";

export function renderJournalsHeaderTabs(args: {
  lang: string;
  isDashboard: boolean;
  rawFrom: string | null;
  from: string;
  rawStoreId: string | null;
  storeId: string;
  rawRange: string | null;
  range: string;
  tab: JournalTab;
  adapterNote: string;
  tabItems: JournalTab[];
  tabLabels: Record<JournalTab, string>;
  onUpdateTab: (next: JournalTab) => void;
}) {
  const {
    lang,
    isDashboard,
    rawFrom,
    from,
    rawStoreId,
    storeId,
    rawRange,
    range,
    tab,
    adapterNote,
    tabItems,
    tabLabels,
    onUpdateTab,
  } = args;

  return (
    <>
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold text-slate-900">仕訳帳</div>
            <div className="mt-2 text-sm text-slate-500">
              仕訳データの確認、状態別チェック、次アクションを一つの画面で管理します。
            </div>
          </div>

          {isDashboard ? (
            <Link
              href={`/${lang}/app`}
              className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Dashboard に戻る
            </Link>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Source</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">
              {rawFrom ?? from}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Store</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">
              {rawStoreId ?? storeId}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Range</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">
              {rawRange ?? range}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Tab</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">
              {tabLabels[tab]}
            </div>
          </div>
        </div>

        <div className="mt-4 text-sm text-slate-500">{adapterNote}</div>
      </div>

      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="text-lg font-semibold text-slate-900">Journal Tabs</div>
        <div className="mt-4 flex flex-wrap gap-2">
          {tabItems.map((item) => {
            const active = tab === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => onUpdateTab(item)}
                className={
                  active
                    ? "rounded-xl border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                    : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                }
              >
                {tabLabels[item]}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
