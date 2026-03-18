import React from "react";
import type { JournalRow, JournalTab } from "@/core/transactions/transactions";

export function renderJournalsMainContent(args: {
  rows: JournalRow[];
  selectedRowId: string;
  selectedRow: JournalRow | null;
  loading: boolean;
  error: string;
  totalAmount: string;
  onSelectRow: (id: string) => void;
  fmtJPY: (value: number) => string;
  tabLabels: Record<JournalTab, string>;
}) {
  const {
    rows,
    selectedRowId,
    selectedRow,
    loading,
    error,
    totalAmount,
    onSelectRow,
    fmtJPY,
    tabLabels,
  } = args;

  return (
    <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
      <div className="space-y-4">
        <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="text-sm text-slate-500">Visible Amount</div>
          <div className="mt-2 text-3xl font-semibold text-slate-900">{totalAmount}</div>
          <div className="mt-4 text-sm text-slate-500">Rows</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">{rows.length}</div>
        </div>
      </div>

      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="text-lg font-semibold text-slate-900">Journal Rows</div>
        <div className="mt-1 text-sm text-slate-500">query → state → context → adapter → render</div>

        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-medium text-slate-900">Selected Row</div>
          {selectedRow ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">ID</div>
                <div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.id}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">Date</div>
                <div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.date}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">Entry No</div>
                <div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.entryNo}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">Status</div>
                <div className="mt-1 text-sm font-medium text-slate-900">{tabLabels[selectedRow.status]}</div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs uppercase tracking-wide text-slate-500">Summary</div>
                <div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.summary}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">Amount</div>
                <div className="mt-1 text-sm font-medium text-slate-900">{fmtJPY(selectedRow.amount)}</div>
              </div>
            </div>
          ) : (
            <div className="mt-2 text-sm text-slate-500">行を選択すると、ここに仕訳の確認情報が表示されます。</div>
          )}
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid grid-cols-[120px_180px_1fr_120px_120px] gap-4 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
            <div>Date</div>
            <div>Entry No</div>
            <div>Summary</div>
            <div>Status</div>
            <div className="text-right">Amount</div>
          </div>

          {loading ? (
            <div className="px-4 py-8 text-sm text-slate-500">loading...</div>
          ) : error ? (
            <div className="px-4 py-8 text-sm text-rose-600">{error}</div>
          ) : rows.length === 0 ? (
            <div className="px-4 py-8 text-sm text-slate-500">no rows</div>
          ) : (
            rows.map((row) => (
              <div
                key={row.id}
                onClick={() => onSelectRow(row.id)}
                className={`grid grid-cols-[120px_180px_1fr_120px_120px] gap-4 border-t border-slate-100 px-4 py-3 text-sm ${
                  selectedRowId === row.id
                    ? "bg-slate-50 ring-1 ring-inset ring-slate-300"
                    : ""
                }`}
              >
                <div className="text-slate-600">{row.date}</div>
                <div className="text-slate-600">{row.entryNo}</div>
                <div className="font-medium text-slate-900">{row.summary}</div>
                <div className="text-slate-600">{tabLabels[row.status]}</div>
                <div className="text-right font-medium text-slate-900">{fmtJPY(row.amount)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
