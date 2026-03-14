"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createDrilldownContext,
  fetchExpensesDrilldown,
  normalizeExpenseCategoryParam,
  type ExpenseCategory,
  type ExpenseRow,
} from "@/core/drilldown/target-pages";
import {
  buildDrilldownHref,
  cloneSearchParams,
  isDashboardSource,
  readBaseDrilldownQuery,
  setOrDeleteQueryParam,
} from "@/core/drilldown/query-contract";

const CATEGORY_ITEMS: ExpenseCategory[] = ["all", "advertising", "logistics", "payroll", "other"];

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  all: "全カテゴリ",
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
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function Page() {
  const params = useParams<{ lang: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawFrom = searchParams.get("from");
  const rawStoreId = searchParams.get("storeId");
  const rawRange = searchParams.get("range");
  const { from, storeId, range } = readBaseDrilldownQuery(searchParams);
  void rawFrom;
  void rawStoreId;
  void rawRange;
  const category = normalizeExpenseCategoryParam(searchParams.get("category"));
  const isDashboard = isDashboardSource(from);

  const [rows, setRows] = useState<ExpenseRow[]>([]);
  const [adapterNote, setAdapterNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const ctx = createDrilldownContext({
      from,
      storeId,
      range,
      category,
    });

    fetchExpensesDrilldown(category, ctx)
      .then((res) => {
        if (!mounted) return;
        setRows(res.rows);
        setAdapterNote(res.meta.note ?? "");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [from, storeId, range, category]);

  const totalAmount = useMemo(
    () => rows.reduce((sum, row) => sum + row.amount, 0),
    [rows]
  );

  function updateCategory(next: ExpenseCategory) {
    const qs = cloneSearchParams(searchParams);
    setOrDeleteQueryParam(qs, "category", next, "all");
    router.replace(buildDrilldownHref(pathname, qs));
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold text-slate-900">{pageTitle(category)}</div>
            <div className="mt-2 text-sm text-slate-500">
              Step39E: base drilldown query 统一由 query-contract 解析。
            </div>
          </div>

          {isDashboard ? (
            <Link
              href={`/${params?.lang ?? "ja"}/app`}
              className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Dashboard に戻る
            </Link>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Store</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{storeId}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Range</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{range}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Current Category</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{CATEGORY_LABELS[category]}</div>
          </div>
        </div>

        <div className="mt-4 text-sm text-slate-500">{adapterNote}</div>
      </div>

      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="text-lg font-semibold text-slate-900">Category Filters</div>
        <div className="mt-4 flex flex-wrap gap-2">
          {CATEGORY_ITEMS.map((item) => {
            const active = category === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => updateCategory(item)}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {CATEGORY_LABELS[item]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-slate-900">Expense Rows</div>
            <div className="mt-1 text-sm text-slate-500">query → normalized base query → adapter → render</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-500">Total</div>
            <div className="mt-1 text-xl font-semibold text-slate-900">{fmtJPY(totalAmount)}</div>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid grid-cols-[120px_1fr_140px_140px] gap-4 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
            <div>Date</div>
            <div>Label</div>
            <div>Category</div>
            <div className="text-right">Amount</div>
          </div>

          {loading ? (
            <div className="px-4 py-8 text-sm text-slate-500">loading...</div>
          ) : rows.length === 0 ? (
            <div className="px-4 py-8 text-sm text-slate-500">no rows</div>
          ) : (
            rows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[120px_1fr_140px_140px] gap-4 border-t border-slate-100 px-4 py-3 text-sm"
              >
                <div className="text-slate-600">{row.date}</div>
                <div>
                  <div className="font-medium text-slate-900">{row.label}</div>
                  <div className="mt-1 text-xs text-slate-500">{row.account}</div>
                </div>
                <div className="text-slate-600">{CATEGORY_LABELS[row.category]}</div>
                <div className="text-right font-medium text-slate-900">{fmtJPY(row.amount)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
