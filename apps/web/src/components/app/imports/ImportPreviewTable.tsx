"use client";

import React, { useMemo, useState } from "react";
import type { PreviewImportResponse } from "@/core/imports";

type RowStatus = "all" | "new" | "duplicate" | "conflict" | "error";

function statusLabel(value: string) {
  switch (value) {
    case "new":
      return "新增";
    case "duplicate":
      return "重复";
    case "conflict":
      return "冲突";
    case "error":
      return "错误";
    default:
      return value || "-";
  }
}

function statusClassName(value: string) {
  switch (value) {
    case "new":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";
    case "duplicate":
      return "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200";
    case "conflict":
      return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";
    case "error":
      return "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200";
    default:
      return "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200";
  }
}

export function ImportPreviewTable(props: {
  preview: PreviewImportResponse | null;
}) {
  const { preview } = props;
  const [tab, setTab] = useState<RowStatus>("all");

  const rows = Array.isArray(preview?.rows) ? preview!.rows : [];

  const filteredRows = useMemo(() => {
    if (tab === "all") return rows;
    return rows.filter((row) => String(row.matchStatus || "") === tab);
  }, [rows, tab]);

  const tabs: Array<{ value: RowStatus; label: string }> = [
    { value: "all", label: "全部" },
    { value: "new", label: "新增" },
    { value: "duplicate", label: "重复" },
    { value: "conflict", label: "冲突" },
    { value: "error", label: "错误" },
  ];

  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-slate-900">Preview Rows</div>
          <div className="mt-1 text-xs text-slate-500">
            当前显示 preview skeleton 返回的 rows。EA-4 阶段先把 table 结构与 tabs 跑通。
          </div>
        </div>
        <div className="text-xs text-slate-500">rows: {filteredRows.length}</div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {tabs.map((item) => {
          const active = tab === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setTab(item.value)}
              className={
                active
                  ? "rounded-xl border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                  : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              }
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {preview ? (
        filteredRows.length ? (
          <div className="mt-4 overflow-auto rounded-[18px] border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2 text-left">状态</th>
                  <th className="px-3 py-2 text-left">Row</th>
                  <th className="px-3 py-2 text-left">Month</th>
                  <th className="px-3 py-2 text-left">Reason</th>
                  <th className="px-3 py-2 text-left">Payload</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, idx) => (
                  <tr key={`${row.rowNo}-${idx}`} className="border-t border-slate-100 align-top">
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClassName(String(row.matchStatus || ""))}`}
                      >
                        {statusLabel(String(row.matchStatus || ""))}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-700">{row.rowNo}</td>
                    <td className="px-3 py-2 text-slate-700">{row.businessMonth || "-"}</td>
                    <td className="px-3 py-2 text-slate-700">{row.matchReason || "-"}</td>
                    <td className="px-3 py-2 text-slate-700">
                      <pre className="whitespace-pre-wrap break-all text-[11px]">
                        {JSON.stringify(row.normalizedPayload || {}, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-4 rounded-[18px] border border-dashed border-slate-200 bg-white px-4 py-8 text-sm text-slate-500">
            preview skeleton 已返回，但 rows 为空。
          </div>
        )
      ) : (
        <div className="mt-4 rounded-[18px] border border-dashed border-slate-200 bg-white px-4 py-8 text-sm text-slate-500">
          还没有 preview skeleton。
        </div>
      )}
    </div>
  );
}
