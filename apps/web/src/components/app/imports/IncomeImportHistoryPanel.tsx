"use client";

import React from "react";
import {
  listImportHistory,
  type ImportJobHistoryItem,
  type IncomeImportHistoryModule,
} from "@/core/imports/api";
import {
  formatImportHistoryDate,
  formatImportHistoryRows,
  getBaseImportHistoryRowClass,
  getBaseImportHistoryStatusClass,
  getBaseImportHistoryStatusLabel,
  shortImportJobId,
} from "@/components/app/imports/importHistoryUi";

type IncomeImportHistoryPanelProps = {
  module: IncomeImportHistoryModule;
  title?: string;
  description?: string;
  limit?: number;
};

function getImportHistoryModuleLabel(module?: string | null) {
  if (module === "cash-income") return "現金収入";
  if (module === "other-income") return "その他収入";
  return module || "-";
}

// Step109-Z1-H10-2-INCOME-HISTORY-VISUAL-PARITY:
// Income history keeps its own panel but aligns visual states with ExpenseImportHistoryPanel.
function getIncomeImportHistoryTone(item: ImportJobHistoryItem) {
  const status = String(item.status || "").toUpperCase();
  const total = Number(item.totalRows || 0);
  const success = Number(item.successRows || 0);
  const failed = Number(item.failedRows || 0);

  if (status === "FAILED" || failed > 0) return "danger";
  if (status === "SUCCEEDED" && total > 0 && success === 0) return "warning";
  if (status === "PROCESSING" || status === "PENDING") return "info";
  if (status === "SUCCEEDED") return "success";
  return "neutral";
}

function getIncomeImportHistoryHint(item: ImportJobHistoryItem) {
  const tone = getIncomeImportHistoryTone(item);

  if (tone === "danger") {
    return item.errorMessage || "一部の行で取込エラーがあります。CSV形式・金額・日付・口座名を確認してください。";
  }

  if (tone === "warning") {
    return "登録対象がありません。重複済み、または全行がスキップされた可能性があります。";
  }

  if (tone === "info") {
    return "検証済み、または処理中の履歴です。必要に応じて履歴を更新してください。";
  }

  if (tone === "success") {
    return "Transaction への登録トレースが確認できます。";
  }

  return "ImportJob の状態を確認してください。";
}

function summarizeIncomeImportHistory(items: ImportJobHistoryItem[]) {
  return items.reduce(
    (summary, item) => {
      const tone = getIncomeImportHistoryTone(item);
      if (tone === "success") summary.success += 1;
      if (tone === "warning") summary.warning += 1;
      if (tone === "danger") summary.danger += 1;
      if (tone === "info") summary.processing += 1;
      return summary;
    },
    { success: 0, warning: 0, danger: 0, processing: 0 }
  );
}

function getIncomeImportHistorySummaryText(items: ImportJobHistoryItem[]) {
  if (!items.length) return "履歴なし";

  const summary = summarizeIncomeImportHistory(items);
  const parts = [
    summary.success ? `成功 ${summary.success}` : "",
    summary.warning ? `登録0件 ${summary.warning}` : "",
    summary.danger ? `失敗 ${summary.danger}` : "",
    summary.processing ? `処理中 ${summary.processing}` : "",
  ].filter(Boolean);

  return parts.length ? parts.join(" / ") : `${items.length}件`;
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
  const historySummary = React.useMemo(
    () => summarizeIncomeImportHistory(visibleItems),
    [visibleItems]
  );
  const hasAttention =
    historySummary.warning > 0 || historySummary.danger > 0 || historySummary.processing > 0;

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
    <section className="rounded-[2rem] border border-slate-200 bg-white/95 p-6 shadow-sm ring-1 ring-slate-100">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-slate-950">{title}</h2>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-500">
              {getImportHistoryModuleLabel(module)}
            </span>
            {latestItem ? (
              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-bold ${getBaseImportHistoryStatusClass(
                  latestItem
                )}`}
              >
                最新: {getBaseImportHistoryStatusLabel(latestItem)}
              </span>
            ) : null}
            {open && visibleItems.length > 0 ? (
              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                  hasAttention
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {getIncomeImportHistorySummaryText(visibleItems)}
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
        <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
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
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center">
              <div className="text-sm font-bold text-slate-600">取込履歴を読み込んでいます...</div>
              <div className="mt-1 text-xs font-semibold text-slate-400">
                ImportJob と登録トレースを確認しています。
              </div>
            </div>
          ) : null}

          {!error && !loading && visibleItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-lg font-black text-slate-400">
                0
              </div>
              <div className="mt-3 text-sm font-bold text-slate-700">
                まだ収入の取込履歴はありません。
              </div>
              <div className="mx-auto mt-1 max-w-xl text-xs font-semibold leading-5 text-slate-500">
                CSV / Excel 取込を実行すると、ImportJob・件数・成功/失敗状態がここに表示されます。
                まずは上の「CSV/Excel取込」から検証と正式登録を実行してください。
              </div>
            </div>
          ) : null}

          {!error && !loading && visibleItems.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="hidden grid-cols-[minmax(0,1.35fr)_0.85fr_0.7fr_0.9fr] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500 md:grid">
                <div>ファイル / ImportJob</div>
                <div>取込日時</div>
                <div>件数</div>
                <div>状態</div>
              </div>

              <div className="divide-y divide-slate-100">
                {visibleItems.map((item) => (
                  <div
                    key={item.id}
                    className={`grid gap-3 px-4 py-4 text-sm transition hover:bg-slate-50 md:grid-cols-[minmax(0,1.35fr)_0.85fr_0.7fr_0.9fr] md:gap-4 md:py-3 ${getBaseImportHistoryRowClass(
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
                      <div className="mb-1 text-[11px] font-bold text-slate-400 md:hidden">
                        取込日時
                      </div>
                      {formatImportHistoryDate(item.importedAt || item.createdAt)}
                    </div>

                    <div className="text-sm font-bold text-slate-700">
                      <div className="mb-1 text-[11px] font-bold text-slate-400 md:hidden">
                        件数
                      </div>
                      {formatImportHistoryRows(item)}
                    </div>

                    <div>
                      <div className="mb-1 text-[11px] font-bold text-slate-400 md:hidden">
                        状態
                      </div>
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${getBaseImportHistoryStatusClass(
                          item
                        )}`}
                      >
                        {getBaseImportHistoryStatusLabel(item)}
                      </span>

                      <div
                        className={`mt-1 line-clamp-2 text-xs font-semibold ${
                          getIncomeImportHistoryTone(item) === "danger"
                            ? "text-rose-600"
                            : getIncomeImportHistoryTone(item) === "warning"
                              ? "text-amber-700"
                              : getIncomeImportHistoryTone(item) === "info"
                                ? "text-sky-700"
                                : "text-slate-400"
                        }`}
                      >
                        {getIncomeImportHistoryHint(item)}
                      </div>
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
