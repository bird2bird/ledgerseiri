"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { fetchExpensesDrilldown, type ExpenseCategory, type ExpenseRow } from "@/core/drilldown/target-pages";

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  all: "すべて",
  advertising: "広告費",
  logistics: "物流費",
  payroll: "給与",
  other: "その他",
};

function pageTitle(category: ExpenseCategory) {
  if (category === "all") return "支出管理";
  return `支出管理 · ${CATEGORY_LABELS[category]}`;
}

function fmtJPY(value: number) {
  return `¥${value.toLocaleString("ja-JP")}`;
}

export default function Page() {
  const params = useParams<{ lang: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const from = searchParams.get("from");
  const rawCategory = searchParams.get("category") ?? "all";
  const category = (["all", "advertising", "logistics", "payroll", "other"].includes(rawCategory)
    ? rawCategory
    : "all") as ExpenseCategory;
  const isDashboard = from === "dashboard";

  const [rows, setRows] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchExpensesDrilldown(category)
      .then((res) => {
        if (!active) return;
        setRows(res.rows);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [category]);

  const total = useMemo(() => rows.reduce((sum, x) => sum + x.amount, 0), [rows]);

  function updateCategory(next: ExpenseCategory) {
    const qs = new URLSearchParams(searchParams.toString());
    if (next === "all") qs.delete("category");
    else qs.set("category", next);
    router.replace(`${pathname}?${qs.toString()}`);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-black/5 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold text-slate-900">{pageTitle(category)}</div>
            <div className="mt-2 text-sm text-slate-500">
              Step39C: page state 已切换到 adapter fetch 层，下一步可替换为真实 API。
            </div>
          </div>

          {isDashboard ? (
            <Link
              href={`/${params?.lang ?? "ja"}/app`}
              className="inline-flex rounded-xl border border-black/10 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Dashboard に戻る
            </Link>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(["all", "advertising", "logistics", "payroll", "other"] as ExpenseCategory[]).map((item) => {
            const active = category === item;
            return (
              <button
                key={item}
                onClick={() => updateCategory(item)}
                className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-black/10 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {CATEGORY_LABELS[item]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-black/5 bg-white p-6">
          <div className="text-sm text-slate-500">Current Filter</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">{CATEGORY_LABELS[category]}</div>
          <div className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">{fmtJPY(total)}</div>
          <div className="mt-2 text-sm text-slate-500">
            data source: target-pages adapter mock
          </div>
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-6">
          <div className="text-lg font-semibold text-slate-900">Expense Rows</div>
          <div className="mt-1 text-sm text-slate-500">query → state → adapter fetch → rendered rows</div>

          <div className="mt-4 space-y-3">
            {loading ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                loading...
              </div>
            ) : rows.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                no rows
              </div>
            ) : (
              rows.map((row) => (
                <div key={row.id} className="rounded-xl border border-black/5 bg-white px-4 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium text-slate-900">{row.label}</div>
                      <div className="mt-1 text-xs text-slate-500">{CATEGORY_LABELS[row.category]}</div>
                      <div className="mt-1 text-xs text-slate-500">{row.date} · {row.account}</div>
                    </div>
                    <div className="text-sm font-semibold tabular-nums text-slate-900">
                      {fmtJPY(row.amount)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
