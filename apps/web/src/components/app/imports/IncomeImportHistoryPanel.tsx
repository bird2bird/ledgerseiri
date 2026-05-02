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

function getImportHistoryModuleLabel(module?: string | null) {
  if (module === "cash-income") return "現金収入";
  if (module === "other-income") return "その他収入";
  return module || "-";
}

function getImportHistoryStatusLabel(item: ImportJobHistoryItem) {
  const status = String(item.status || "").toUpperCase();
  const total = Number(item.totalRows || 0);
  const success = Number(item.successRows || 0);
  const failed = Number(item.failedRows || 0);

  if (status === "FAILED" || failed > 0) return "失敗";
  if (status === "SUCCEEDED" && total > 0 && success === 0) return "登録0件";
  if (status === "SUCCEEDED") return "成功";
  if (status === "PROCESSING") return "処理中";
  if (status === "PENDING") return "待機中";
  if (status === "CANCELLED") return "取消";
  return item.status || "-";
}

function getImportHistoryStatusClass(item: ImportJobHistoryItem) {
  const status = String(item.status || "").toUpperCase();
  const total = Number(item.totalRows || 0);
  const success = Number(item.successRows || 0);
  const failed = Number(item.failedRows || 0);

  if (status === "FAILED" || failed > 0) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (status === "SUCCEEDED" && total > 0 && success === 0) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "SUCCEEDED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "PROCESSING" || status === "PENDING") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

function getImportHistoryRowClass(item: ImportJobHistoryItem) {
  const status = String(item.status || "").toUpperCase();
  const success = Number(item.successRows || 0);
  const failed = Number(item.failedRows || 0);

  if (status === "FAILED" || failed > 0) {
    return "bg-rose-50/35";
  }

  if (status === "SUCCEEDED" && success === 0) {
    return "bg-amber-50/35";
  }

  return "bg-white";
}

function shortImportJobId(id?: string | null) {
  const raw = String(id || "").trim();
  if (raw.length <= 14) return raw || "-";
  return `${raw.slice(0, 8)}…${raw.slice(-6)}`;
}

function formatRows(item: ImportJobHistoryItem) {
  const total = Number(item.totalRows || 0);
  const success = Number(item.successRows || 0);
  const failed = Number(item.failedRows || 0);

  if (failed > 0) return `${success}/${total} 件・エラー ${failed}`;
  if (total > 0 && success === 0) return `0/${total} 件・登録なし`;
  return `${success}/${total} 件`;
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
  const latestItem = visibleItems[0] || null;

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
    <section className="rounded-[2rem] border border-slate-200 bg-white/95 p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-slate-950">{title}</h2>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-500">
              {getImportHistoryModuleLabel(module)}
            </span>
            {latestItem ? (
              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-bold ${getImportHistoryStatusClass(
                  latestItem
                )}`}
              >
                最新: {getImportHistoryStatusLabel(latestItem)}
              </span>
            ) : null}
          </div>
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
        <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-bold text-slate-500">
              最新 {Math.min(visibleItems.length, limit)} 件を表示
              {items.length > 0 ? ` / 全 ${items.length} 件` : ""}
            </div>
            <div className="text-xs font-semibold text-slate-400">
              ImportJob 履歴は登録トレース確認用です
            </div>
          </div>

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
              <div className="grid grid-cols-[minmax(0,1.35fr)_0.85fr_0.7fr_0.9fr] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500">
                <div>ファイル / ImportJob</div>
                <div>取込日時</div>
                <div>件数</div>
                <div>状態</div>
              </div>

              <div className="divide-y divide-slate-100">
                {visibleItems.map((item) => (
                  <div
                    key={item.id}
                    className={`grid grid-cols-[minmax(0,1.35fr)_0.85fr_0.7fr_0.9fr] gap-4 px-4 py-3 text-sm transition hover:bg-slate-50 ${getImportHistoryRowClass(
                      item
                    )}`}
                  >
                    <div className="min-w-0">
                      <div className="truncate font-bold text-slate-900">
                        {item.filename || "-"}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-500">
                          {getImportHistoryModuleLabel(item.module)}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-500">
                          {item.sourceType || "CSV"}
                        </span>
                        <span className="font-mono text-[11px] font-semibold text-slate-400">
                          {shortImportJobId(item.id)}
                        </span>
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
                          item
                        )}`}
                      >
                        {getImportHistoryStatusLabel(item)}
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
        </div>
      ) : null}
    </section>
  );
}
