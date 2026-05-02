"use client";

import React from "react";
import {
  listImportHistory,
  type ImportJobHistoryItem,
  type IncomeImportHistoryModule,
} from "@/core/imports/api";

type IncomeImportHistoryPanelProps = {
  module: IncomeImportHistoryModule;
  title?: string;
  description?: string;
  limit?: number;
};

function formatImportHistoryDate(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "-";

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getImportHistoryStatusLabel(status?: string | null) {
  const value = String(status || "").toUpperCase();
  if (value === "SUCCEEDED") return "成功";
  if (value === "FAILED") return "失敗";
  if (value === "PROCESSING") return "処理中";
  if (value === "PENDING") return "待機中";
  if (value === "CANCELLED") return "取消";
  return status || "-";
}

function getImportHistoryStatusClass(status?: string | null) {
  const value = String(status || "").toUpperCase();
  if (value === "SUCCEEDED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (value === "FAILED") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  if (value === "PROCESSING" || value === "PENDING") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function shortImportJobId(id?: string | null) {
  const raw = String(id || "").trim();
  if (raw.length <= 12) return raw || "-";
  return `${raw.slice(0, 8)}…${raw.slice(-4)}`;
}

function formatRows(item: ImportJobHistoryItem) {
  const total = Number(item.totalRows || 0);
  const success = Number(item.successRows || 0);
  const failed = Number(item.failedRows || 0);

  return `${success}/${total} 件${failed > 0 ? `・エラー ${failed}` : ""}`;
}

export function IncomeImportHistoryPanel(props: IncomeImportHistoryPanelProps) {
  const {
    module,
    title = "取込履歴",
    description = "最近の ImportJob を確認できます。",
    limit = 5,
  } = props;

  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<ImportJobHistoryItem[]>([]);
  const [error, setError] = React.useState("");

  const visibleItems = React.useMemo(() => items.slice(0, limit), [items, limit]);

  const loadHistory = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await listImportHistory({ module });
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [module]);

  async function toggleOpen() {
    const nextOpen = !open;
    setOpen(nextOpen);

    if (nextOpen) {
      await loadHistory();
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-lg font-bold text-slate-950">{title}</div>
          <p className="mt-1 text-sm font-medium text-slate-500">{description}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {open ? (
            <button
              type="button"
              onClick={loadHistory}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "更新中..." : "履歴を更新"}
            </button>
          ) : null}

          <button
            type="button"
            onClick={toggleOpen}
            className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
          >
            {open ? "履歴を閉じる" : "取込履歴を表示"}
          </button>
        </div>
      </div>

      {open ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
              {error}
            </div>
          ) : null}

          {!error && loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center text-sm font-bold text-slate-500">
              取込履歴を読み込んでいます...
            </div>
          ) : null}

          {!error && !loading && visibleItems.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center text-sm font-bold text-slate-500">
              まだ取込履歴はありません。
            </div>
          ) : null}

          {!error && !loading && visibleItems.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="grid grid-cols-[1.2fr_1fr_0.8fr_0.8fr] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500">
                <div>ファイル</div>
                <div>取込日時</div>
                <div>件数</div>
                <div>状態</div>
              </div>

              <div className="divide-y divide-slate-100">
                {visibleItems.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1.2fr_1fr_0.8fr_0.8fr] gap-3 px-4 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-bold text-slate-900">
                        {item.filename || "-"}
                      </div>
                      <div className="mt-1 font-mono text-[11px] font-semibold text-slate-400">
                        {shortImportJobId(item.id)}
                      </div>
                    </div>

                    <div className="text-sm font-semibold text-slate-600">
                      {formatImportHistoryDate(item.importedAt || item.createdAt)}
                    </div>

                    <div className="text-sm font-bold text-slate-700">
                      {formatRows(item)}
                    </div>

                    <div>
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${getImportHistoryStatusClass(
                          item.status
                        )}`}
                      >
                        {getImportHistoryStatusLabel(item.status)}
                      </span>

                      {item.errorMessage ? (
                        <div className="mt-1 line-clamp-2 text-xs font-semibold text-rose-600">
                          {item.errorMessage}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {!error && !loading && items.length > limit ? (
            <div className="mt-3 text-xs font-semibold text-slate-400">
              最新 {limit} 件を表示しています。全 {items.length} 件。
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
