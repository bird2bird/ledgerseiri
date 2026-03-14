"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { fetchInvoicesDrilldown, type InvoiceRow, type InvoiceTab } from "@/core/drilldown/target-pages";

const TAB_LABELS: Record<InvoiceTab, string> = {
  unpaid: "未入金",
  issued: "発行済み",
  history: "履歴",
};

function fmtJPY(value: number) {
  return `¥${value.toLocaleString("ja-JP")}`;
}

export default function Page() {
  const params = useParams<{ lang: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const from = searchParams.get("from");
  const rawTab = searchParams.get("tab") ?? "unpaid";
  const tab = (["unpaid", "issued", "history"].includes(rawTab) ? rawTab : "unpaid") as InvoiceTab;
  const isDashboard = from === "dashboard";

  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchInvoicesDrilldown(tab)
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
  }, [tab]);

  const total = useMemo(() => rows.reduce((sum, x) => sum + x.amount, 0), [rows]);

  function updateTab(next: InvoiceTab) {
    const qs = new URLSearchParams(searchParams.toString());
    qs.set("tab", next);
    router.replace(`${pathname}?${qs.toString()}`);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-black/5 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold text-slate-900">請求管理 · {TAB_LABELS[tab]}</div>
            <div className="mt-2 text-sm text-slate-500">
              Step39C: tab 状态已绑定 adapter 数据加载层。
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
          {(["unpaid", "issued", "history"] as InvoiceTab[]).map((item) => {
            const active = tab === item;
            return (
              <button
                key={item}
                onClick={() => updateTab(item)}
                className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-black/10 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {TAB_LABELS[item]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-black/5 bg-white p-6">
          <div className="text-sm text-slate-500">Current Tab</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">{TAB_LABELS[tab]}</div>
          <div className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">{fmtJPY(total)}</div>
          <div className="mt-2 text-sm text-slate-500">rows: {rows.length}</div>
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-6">
          <div className="text-lg font-semibold text-slate-900">Invoice Rows</div>
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
                      <div className="text-sm font-medium text-slate-900">{row.invoiceNo}</div>
                      <div className="mt-1 text-xs text-slate-500">{row.customer}</div>
                      <div className="mt-1 text-xs text-slate-500">due: {row.dueDate}</div>
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
