"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CrudPageShell } from "@/components/crud/CrudPageShell";
import { DataTable, type DataTableColumn } from "@/components/crud/DataTable";
import { ErrorState } from "@/components/crud/ErrorState";
import { EmptyState } from "@/components/crud/EmptyState";
import { listAccountBalances, type AccountBalanceItem } from "@/core/funds/api";

function yen(v: number) {
  return `¥${v.toLocaleString("ja-JP")}`;
}

export default function Page() {
  const [rows, setRows] = useState<AccountBalanceItem[]>([]);
  const [summary, setSummary] = useState<{ accountCount: number; totalBalance: number; currency: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await listAccountBalances();
      setRows(data.items);
      setSummary(data.summary);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const columns: DataTableColumn<AccountBalanceItem>[] = useMemo(
    () => [
      { key: "name", title: "口座名", render: (r) => <div className="font-medium text-slate-900">{r.name}</div> },
      { key: "type", title: "種別", render: (r) => r.type },
      { key: "openingBalance", title: "開始残高", render: (r) => yen(r.openingBalance) },
      { key: "income", title: "入金", render: (r) => yen(r.income) },
      { key: "expense", title: "出金", render: (r) => yen(r.expense) },
      { key: "transferOut", title: "振替出", render: (r) => yen(r.transferOut) },
      { key: "transferIn", title: "振替入", render: (r) => yen(r.transferIn) },
      {
        key: "currentBalance",
        title: "現在残高",
        render: (r) => <div className="font-semibold text-slate-900">{yen(r.currentBalance)}</div>,
        className: "whitespace-nowrap",
      },
    ],
    []
  );

  return (
    <CrudPageShell title="口座残高" description="口座ごとの現在残高と構成を確認します。">
      {summary ? (
        <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-[22px] border border-black/5 bg-slate-50 p-4">
            <div className="text-[11px] font-medium text-slate-500">口座数</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">{summary.accountCount}</div>
          </div>
          <div className="rounded-[22px] border border-black/5 bg-slate-50 p-4">
            <div className="text-[11px] font-medium text-slate-500">総残高</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">{yen(summary.totalBalance)}</div>
          </div>
        </div>
      ) : null}

      {error ? (
        <ErrorState description={error} />
      ) : loading ? (
        <div className="text-sm text-slate-500">読み込み中...</div>
      ) : rows.length === 0 ? (
        <EmptyState title="表示できる残高データがありません" description="先に口座を作成してください。" />
      ) : (
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />
      )}
    </CrudPageShell>
  );
}
