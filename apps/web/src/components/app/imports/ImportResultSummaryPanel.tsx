"use client";

import React from "react";
import type { ImportResultSummary } from "@/core/imports";

function formatDateTime(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "-";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString("ja-JP");
}

function formatNumber(value?: number | null) {
  return Number(value || 0).toLocaleString("ja-JP");
}

function renderTagList(values?: string[]) {
  const list = Array.isArray(values) ? values.filter(Boolean) : [];
  if (!list.length) {
    return <span className="text-sm text-slate-500">-</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {list.map((item) => (
        <span
          key={item}
          className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-inset ring-slate-200"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export function ImportResultSummaryPanel(props: {
  summary: ImportResultSummary | null | undefined;
  title?: string;
  subtitle?: string;
}) {
  const { summary, title, subtitle } = props;
  if (!summary) return null;

  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">
            {title || "Import Result Summary"}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {subtitle || "reconciliation-style summary / 导入结果总览"}
          </div>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600">
          integrity ={" "}
          {summary.integrity?.importedRowsMatchesCommittedCount ? "OK" : "CHECK"}
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[16px] bg-slate-50 p-3">
              <div className="text-[11px] text-slate-500">Filename</div>
              <div className="mt-1 break-all text-sm font-medium text-slate-900">
                {summary.filename || "-"}
              </div>
            </div>
            <div className="rounded-[16px] bg-slate-50 p-3">
              <div className="text-[11px] text-slate-500">Module</div>
              <div className="mt-1 text-sm font-medium text-slate-900">
                {summary.module || "-"}
              </div>
            </div>
            <div className="rounded-[16px] bg-slate-50 p-3">
              <div className="text-[11px] text-slate-500">Created At</div>
              <div className="mt-1 text-sm font-medium text-slate-900">
                {formatDateTime(summary.createdAt)}
              </div>
            </div>
            <div className="rounded-[16px] bg-slate-50 p-3">
              <div className="text-[11px] text-slate-500">Imported At</div>
              <div className="mt-1 text-sm font-medium text-slate-900">
                {formatDateTime(summary.importedAt)}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[16px] bg-slate-50 p-3">
              <div className="text-[11px] text-slate-500">File Months</div>
              <div className="mt-2">{renderTagList(summary.months?.fileMonths)}</div>
            </div>
            <div className="rounded-[16px] bg-slate-50 p-3">
              <div className="text-[11px] text-slate-500">Conflict Months</div>
              <div className="mt-2">{renderTagList(summary.months?.conflictMonths)}</div>
            </div>
            <div className="rounded-[16px] bg-slate-50 p-3">
              <div className="text-[11px] text-slate-500">Imported Months</div>
              <div className="mt-2">{renderTagList(summary.months?.importedMonths)}</div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[16px] bg-slate-50 p-3">
              <div className="text-[11px] text-slate-500">Staging Total</div>
              <div className="mt-1 text-base font-semibold text-slate-900">
                {formatNumber(summary.staging?.totalRows)}
              </div>
            </div>
            <div className="rounded-[16px] bg-slate-50 p-3">
              <div className="text-[11px] text-slate-500">Staging New</div>
              <div className="mt-1 text-base font-semibold text-slate-900">
                {formatNumber(summary.staging?.newRows)}
              </div>
            </div>
            <div className="rounded-[16px] bg-slate-50 p-3">
              <div className="text-[11px] text-slate-500">Staging Duplicate</div>
              <div className="mt-1 text-base font-semibold text-slate-900">
                {formatNumber(summary.staging?.duplicateRows)}
              </div>
            </div>
            <div className="rounded-[16px] bg-slate-50 p-3">
              <div className="text-[11px] text-slate-500">Staging Conflict/Error</div>
              <div className="mt-1 text-base font-semibold text-slate-900">
                {formatNumber(
                  Number(summary.staging?.conflictRows || 0) +
                    Number(summary.staging?.errorRows || 0)
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[16px] bg-slate-50 p-3">
              <div className="text-[11px] text-slate-500">Committed Count</div>
              <div className="mt-1 text-base font-semibold text-slate-900">
                {formatNumber(summary.transactions?.committedCount)}
              </div>
            </div>
            <div className="rounded-[16px] bg-slate-50 p-3">
              <div className="text-[11px] text-slate-500">Committed Amount</div>
              <div className="mt-1 text-base font-semibold text-slate-900">
                ¥{formatNumber(summary.transactions?.totalCommittedAmount)}
              </div>
            </div>
            <div className="rounded-[16px] bg-slate-50 p-3">
              <div className="text-[11px] text-slate-500">With Account</div>
              <div className="mt-1 text-base font-semibold text-slate-900">
                {formatNumber(summary.coverage?.withAccountCount)}
              </div>
            </div>
            <div className="rounded-[16px] bg-slate-50 p-3">
              <div className="text-[11px] text-slate-500">With Category</div>
              <div className="mt-1 text-base font-semibold text-slate-900">
                {formatNumber(summary.coverage?.withCategoryCount)}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[16px] bg-slate-50 p-3">
            <div className="text-[11px] text-slate-500">Direction Breakdown</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div>
                <div className="text-[11px] text-slate-500">Income</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {formatNumber(summary.transactions?.incomeCount)}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500">Expense</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {formatNumber(summary.transactions?.expenseCount)}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500">Transfer</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {formatNumber(summary.transactions?.transferCount)}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[16px] bg-slate-50 p-3">
            <div className="text-[11px] text-slate-500">Type Breakdown</div>
            <div className="mt-3 space-y-2">
              {Array.isArray(summary.transactions?.byType) &&
              summary.transactions?.byType?.length ? (
                summary.transactions.byType.map((item) => (
                  <div
                    key={item.type}
                    className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm"
                  >
                    <div className="font-medium text-slate-800">{item.type}</div>
                    <div className="text-slate-600">
                      {formatNumber(item.count)} / ¥{formatNumber(item.amount)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">-</div>
              )}
            </div>
          </div>

          <div className="rounded-[16px] bg-slate-50 p-3">
            <div className="text-[11px] text-slate-500">Month Breakdown</div>
            <div className="mt-3 space-y-2">
              {Array.isArray(summary.transactions?.byMonth) &&
              summary.transactions?.byMonth?.length ? (
                summary.transactions.byMonth.map((item) => (
                  <div
                    key={item.month}
                    className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm"
                  >
                    <div className="font-medium text-slate-800">{item.month}</div>
                    <div className="text-slate-600">
                      {formatNumber(item.count)} / ¥{formatNumber(item.amount)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">-</div>
              )}
            </div>
          </div>

          <div className="rounded-[16px] bg-slate-50 p-3">
            <div className="text-[11px] text-slate-500">Integrity Check</div>
            <div className="mt-2 text-sm font-medium text-slate-900">
              importedRowsMatchesCommittedCount ={" "}
              {summary.integrity?.importedRowsMatchesCommittedCount ? "true" : "false"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
