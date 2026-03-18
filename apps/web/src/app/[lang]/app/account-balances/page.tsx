"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { listAccountBalances, type AccountBalanceItem } from "@/core/accounts/balances-api";

function fmtJPY(value: number) {
  return `¥${Number(value || 0).toLocaleString("ja-JP")}`;
}

export default function AccountBalancesPage() {
  const [rows, setRows] = useState<AccountBalanceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedRowId, setSelectedRowId] = useState("");

  const selectedRow = useMemo(
    () => rows.find((row) => row.id === selectedRowId) ?? null,
    [rows, selectedRowId]
  );

  async function loadRows() {
    setLoading(true);
    setError("");
    try {
      const res = await listAccountBalances();
      setRows(res.items ?? []);
    } catch (e: unknown) {
      setRows([]);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRows();
  }, []);

  const totalCurrentBalance = useMemo(
    () => rows.reduce((sum, row) => sum + Number(row.currentBalance ?? 0), 0),
    [rows]
  );

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold text-slate-900">口座残高</div>
            <div className="mt-2 text-sm text-slate-500">
              opening balance・収入・支出・資金移動を集計し、現在残高を表示します。
            </div>
          </div>

          <Link
            href="/ja/app/accounts"
            className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            口座一覧へ
          </Link>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
            <div className="text-sm text-slate-500">Visible Balance Total</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">
              {fmtJPY(totalCurrentBalance)}
            </div>
            <div className="mt-4 text-sm text-slate-500">Accounts</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{rows.length}</div>
          </div>

          <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-900">Selected Account Balance</div>
            {selectedRow ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Name</div>
                  <div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.name}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Type</div>
                  <div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.type}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Currency</div>
                  <div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.currency}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Active</div>
                  <div className="mt-1 text-sm font-medium text-slate-900">
                    {selectedRow.isActive ? "YES" : "NO"}
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Opening</div>
                  <div className="mt-1 text-sm font-medium text-slate-900">
                    {fmtJPY(selectedRow.openingBalance)}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Income</div>
                  <div className="mt-1 text-sm font-medium text-emerald-700">
                    + {fmtJPY(selectedRow.incomeTotal)}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Expense</div>
                  <div className="mt-1 text-sm font-medium text-rose-700">
                    - {fmtJPY(selectedRow.expenseTotal)}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Inbound Transfer</div>
                  <div className="mt-1 text-sm font-medium text-emerald-700">
                    + {fmtJPY(selectedRow.inboundTransferTotal)}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Outbound Transfer</div>
                  <div className="mt-1 text-sm font-medium text-rose-700">
                    - {fmtJPY(selectedRow.outboundTransferTotal)}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Current</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {fmtJPY(selectedRow.currentBalance)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-2 text-sm text-slate-500">
                口座を選択すると、ここに残高構成の詳細が表示されます。
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold text-slate-900">Account Balance Rows</div>
          <div className="mt-1 text-sm text-slate-500">opening + income - expense ± transfer</div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-[1.1fr_110px_100px_130px_130px_100px] gap-4 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
              <div>Name</div>
              <div>Type</div>
              <div>Currency</div>
              <div className="text-right">Opening</div>
              <div className="text-right">Current</div>
              <div>Active</div>
            </div>

            {loading ? (
              <div className="px-4 py-8 text-sm text-slate-500">loading...</div>
            ) : error ? (
              <div className="px-4 py-8 text-sm text-rose-600">{error}</div>
            ) : rows.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-500">no balance rows</div>
            ) : (
              rows.map((row) => (
                <div
                  key={row.id}
                  onClick={() => setSelectedRowId(row.id)}
                  className={`grid cursor-pointer grid-cols-[1.1fr_110px_100px_130px_130px_100px] gap-4 border-t border-slate-100 px-4 py-3 text-sm ${
                    selectedRowId === row.id
                      ? "bg-slate-50 ring-1 ring-inset ring-slate-300"
                      : ""
                  }`}
                >
                  <div className="font-medium text-slate-900">{row.name}</div>
                  <div className="text-slate-600">{row.type}</div>
                  <div className="text-slate-600">{row.currency}</div>
                  <div className="text-right text-slate-600">{fmtJPY(row.openingBalance)}</div>
                  <div className="text-right font-semibold text-slate-900">
                    {fmtJPY(row.currentBalance)}
                  </div>
                  <div className="text-slate-600">{row.isActive ? "YES" : "NO"}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
