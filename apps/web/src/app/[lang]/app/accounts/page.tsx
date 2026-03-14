"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createAccountsContext,
  fetchAccountsPageData,
  normalizeAccountViewParam,
  normalizeBalanceSortParam,
  type AccountRow,
  type AccountView,
  type BalanceSort,
} from "@/core/accounts/accounts";
import {
  buildDrilldownHref,
  cloneSearchParams,
  isDashboardSource,
  readBaseDrilldownQuery,
  setOrDeleteQueryParam,
} from "@/core/drilldown/query-contract";

const VIEW_ITEMS: AccountView[] = ["all", "bank", "cash", "platform", "payment"];
const SORT_ITEMS: BalanceSort[] = ["balance_desc", "balance_asc", "name_asc"];

const VIEW_LABELS: Record<AccountView, string> = {
  all: "すべて",
  bank: "銀行",
  cash: "現金",
  platform: "プラットフォーム",
  payment: "決済",
};

const SORT_LABELS: Record<BalanceSort, string> = {
  balance_desc: "残高↓",
  balance_asc: "残高↑",
  name_asc: "名称A-Z",
};

function fmtJPY(v: number) {
  return `¥${Number(v || 0).toLocaleString("ja-JP")}`;
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

  const view = normalizeAccountViewParam(searchParams.get("view"));
  const sort = normalizeBalanceSortParam(searchParams.get("sort"));
  const isDashboard = isDashboardSource(from);

  const [rows, setRows] = useState<AccountRow[]>([]);
  const [adapterNote, setAdapterNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const ctx = createAccountsContext({
      from,
      storeId,
      range,
      view,
      sort,
    });

    fetchAccountsPageData(view, sort, ctx)
      .then((res) => {
        if (!mounted) return;
        setRows(res.rows);
        setAdapterNote(res.meta.note);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [from, storeId, range, view, sort]);

  const totalBalance = useMemo(
    () => rows.reduce((sum, row) => sum + row.balance, 0),
    [rows]
  );

  function updateView(next: AccountView) {
    const qs = cloneSearchParams(searchParams);
    setOrDeleteQueryParam(qs, "view", next, "all");
    router.replace(buildDrilldownHref(pathname, qs));
  }

  function updateSort(next: BalanceSort) {
    const qs = cloneSearchParams(searchParams);
    setOrDeleteQueryParam(qs, "sort", next, "balance_desc");
    router.replace(buildDrilldownHref(pathname, qs));
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold text-slate-900">口座一覧</div>
            <div className="mt-2 text-sm text-slate-500">
              Step40B: accounts 页面与 dashboard cash drill-down round-trip contract 对齐。
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isDashboard ? (
              <Link
                href={`/${params?.lang ?? "ja"}/app`}
                className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Dashboard に戻る
              </Link>
            ) : null}

            <Link
              href={`/${params?.lang ?? "ja"}/app/account-balances?from=${from}&storeId=${storeId}&range=${range}&view=${view}&sort=${sort}`}
              className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              口座残高へ
            </Link>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-5">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Source</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{rawFrom ?? from}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Store</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{rawStoreId ?? storeId}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Range</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{rawRange ?? range}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">View</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{VIEW_LABELS[view]}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Sort</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{SORT_LABELS[sort]}</div>
          </div>
        </div>

        <div className="mt-4 text-sm text-slate-500">{adapterNote}</div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold text-slate-900">Filters</div>

          <div className="mt-4">
            <div className="text-sm font-medium text-slate-700">View</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {VIEW_ITEMS.map((item) => {
                const active = view === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => updateView(item)}
                    className={
                      active
                        ? "rounded-xl border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                        : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    }
                  >
                    {VIEW_LABELS[item]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm font-medium text-slate-700">Sort</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {SORT_ITEMS.map((item) => {
                const active = sort === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => updateSort(item)}
                    className={
                      active
                        ? "rounded-xl border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                        : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    }
                  >
                    {SORT_LABELS[item]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Visible Accounts</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">{rows.length}</div>
            <div className="mt-4 text-sm text-slate-500">Total Balance</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{fmtJPY(totalBalance)}</div>
          </div>
        </div>

        <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold text-slate-900">Accounts</div>
          <div className="mt-1 text-sm text-slate-500">query → state → context → accounts adapter → rows</div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-[1.2fr_120px_140px_120px_150px] gap-4 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
              <div>Name</div>
              <div>Type</div>
              <div className="text-right">Balance</div>
              <div>Status</div>
              <div>Updated</div>
            </div>

            {loading ? (
              <div className="px-4 py-8 text-sm text-slate-500">loading...</div>
            ) : rows.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-500">no rows</div>
            ) : (
              rows.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[1.2fr_120px_140px_120px_150px] gap-4 border-t border-slate-100 px-4 py-3 text-sm"
                >
                  <div>
                    <div className="font-medium text-slate-900">{row.name}</div>
                    <div className="mt-1 text-xs text-slate-500">{row.institution ?? "-"}</div>
                  </div>
                  <div className="text-slate-600">{VIEW_LABELS[row.type]}</div>
                  <div className="text-right font-medium text-slate-900">{fmtJPY(row.balance)}</div>
                  <div className="text-slate-600">{row.status}</div>
                  <div className="text-slate-600">{row.lastUpdated}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
