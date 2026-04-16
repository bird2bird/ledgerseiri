"use client";

import React from "react";
import type { ImportHistoryResponse } from "@/core/imports";

export function ImportHistoryList(props: {
  history: ImportHistoryResponse | null;
  loading?: boolean;
  moduleLabel: string;
}) {
  const { history, loading, moduleLabel } = props;
  const items = Array.isArray(history?.items) ? history!.items : [];

  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-slate-900">Import History</div>
          <div className="mt-1 text-xs text-slate-500">
            当前模块: {moduleLabel}。EA-4 阶段先接 history skeleton。
          </div>
        </div>
        <div className="text-xs text-slate-500">{loading ? "loading..." : `items: ${items.length}`}</div>
      </div>

      {loading ? (
        <div className="mt-4 rounded-[18px] border border-dashed border-slate-200 bg-white px-4 py-8 text-sm text-slate-500">
          正在加载 history skeleton...
        </div>
      ) : items.length ? (
        <div className="mt-4 overflow-auto rounded-[18px] border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 text-left">Filename</th>
                <th className="px-3 py-2 text-left">Module</th>
                <th className="px-3 py-2 text-left">Policy</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-right">Rows</th>
                <th className="px-3 py-2 text-right">Deleted</th>
                <th className="px-3 py-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-slate-700">{item.filename || "-"}</td>
                  <td className="px-3 py-2 text-slate-700">{item.module || "-"}</td>
                  <td className="px-3 py-2 text-slate-700">{item.monthConflictPolicy || "-"}</td>
                  <td className="px-3 py-2 text-slate-700">{item.status || "-"}</td>
                  <td className="px-3 py-2 text-right text-slate-700">{item.totalRows ?? 0}</td>
                  <td className="px-3 py-2 text-right text-slate-700">{item.deletedRowCount ?? 0}</td>
                  <td className="px-3 py-2 text-slate-700">{item.createdAt || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-4 rounded-[18px] border border-dashed border-slate-200 bg-white px-4 py-8 text-sm text-slate-500">
          还没有 history skeleton 数据。
        </div>
      )}
    </div>
  );
}
