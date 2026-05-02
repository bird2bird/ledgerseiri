"use client";

import React from "react";
import {
  listExpenseImportHistory,
  type ExpenseImportHistoryModule,
  type ImportJobHistoryItem,
} from "@/core/imports/api";

type ExpenseImportHistoryPanelProps = {
  module: ExpenseImportHistoryModule;
  title?: string;
  description?: string;
  limit?: number;
  // Step109-Z1-H9-6-EXPENSE-HISTORY-AUTO-REFRESH:
  // Parent increments refreshToken after ExpenseImportDialog commit.
  refreshToken?: number;
  highlightedImportJobId?: string | null;
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

function getExpenseImportHistoryModuleLabel(module?: string | null) {
  if (module === "company-operation-expense") return "会社運営費";
  if (module === "store-operation-expense") return "店舗運営費";
  if (module === "payroll-expense") return "給与";
  if (module === "other-expense") return "その他支出";
  return module || "-";
}

// Step109-Z1-H9-7B-PENDING-PREVIEW-SEMANTICS:
// PROCESSING with successful preview rows and no failed rows means "previewed but not committed".
// It should be shown as 未正式登録, not generic 処理中.
function isExpenseImportPendingPreview(item: ImportJobHistoryItem) {
  const status = String(item.status || "").toUpperCase();
  const success = Number(item.successRows || 0);
  const failed = Number(item.failedRows || 0);
  return status === "PROCESSING" && success > 0 && failed === 0;
}

function getExpenseImportHistoryStatusLabel(item: ImportJobHistoryItem) {
  const status = String(item.status || "").toUpperCase();
  const total = Number(item.totalRows || 0);
  const success = Number(item.successRows || 0);
  const failed = Number(item.failedRows || 0);

  if (status === "FAILED" || failed > 0) return "失敗";
  if (status === "SUCCEEDED" && total > 0 && success === 0) return "登録0件";
  if (status === "SUCCEEDED") return "成功";
  if (isExpenseImportPendingPreview(item)) return "未正式登録";
  if (status === "PROCESSING") return "処理中";
  if (status === "PENDING") return "待機中";
  if (status === "CANCELLED") return "取消";
  return item.status || "-";
}

function getExpenseImportHistoryStatusClass(item: ImportJobHistoryItem) {
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

  if (isExpenseImportPendingPreview(item)) {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  if (status === "PROCESSING" || status === "PENDING") {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

function getExpenseImportHistoryRowClass(item: ImportJobHistoryItem) {
  const status = String(item.status || "").toUpperCase();
  const success = Number(item.successRows || 0);
  const failed = Number(item.failedRows || 0);

  if (status === "FAILED" || failed > 0) {
    return "bg-rose-50/35";
  }

  if (status === "SUCCEEDED" && success === 0) {
    return "bg-amber-50/35";
  }

  if (isExpenseImportPendingPreview(item)) {
    return "bg-sky-50/25";
  }

  if (status === "PROCESSING" || status === "PENDING") {
    return "bg-violet-50/25";
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

// Step109-Z1-H9-5-EXPENSE-HISTORY-POLISH:
// Visual-only helpers for history health, empty state, and stale PROCESSING guidance.
function getExpenseImportHistoryTone(item: ImportJobHistoryItem) {
  const status = String(item.status || "").toUpperCase();
  const total = Number(item.totalRows || 0);
  const success = Number(item.successRows || 0);
  const failed = Number(item.failedRows || 0);

  if (status === "FAILED" || failed > 0) return "danger";
  if (status === "SUCCEEDED" && total > 0 && success === 0) return "warning";
  if (isExpenseImportPendingPreview(item)) return "pending-preview";
  if (status === "PROCESSING" || status === "PENDING") return "info";
  if (status === "SUCCEEDED") return "success";
  return "neutral";
}

function getExpenseImportHistoryHint(item: ImportJobHistoryItem) {
  const tone = getExpenseImportHistoryTone(item);

  if (tone === "danger") {
    return item.errorMessage || "一部の行で取込エラーがあります。CSV形式・金額・日付・証憑番号を確認してください。";
  }

  if (tone === "warning") {
    return "登録対象がありません。重複済み、または全行がスキップされた可能性があります。";
  }

  if (tone === "pending-preview") {
    return "検証済みですが、まだ正式登録されていません。登録する場合は同じCSVで再度検証後、正式登録してください。";
  }

  if (tone === "info") {
    return "処理中の履歴です。時間をおいて履歴を更新してください。長時間残る場合は管理者確認が必要です。";
  }

  if (tone === "success") {
    return "Transaction への登録トレースが確認できます。";
  }

  return "ImportJob の状態を確認してください。";
}

function summarizeExpenseImportHistory(items: ImportJobHistoryItem[]) {
  return items.reduce(
    (summary, item) => {
      const tone = getExpenseImportHistoryTone(item);
      if (tone === "success") summary.success += 1;
      if (tone === "warning") summary.warning += 1;
      if (tone === "danger") summary.danger += 1;
      if (tone === "info") summary.processing += 1;
      return summary;
    },
    { success: 0, warning: 0, danger: 0, processing: 0 }
  );
}

function getExpenseImportHistorySummaryText(items: ImportJobHistoryItem[]) {
  if (!items.length) return "履歴なし";
  const summary = summarizeExpenseImportHistory(items);
  const parts = [
    summary.success ? `成功 ${summary.success}` : "",
    summary.warning ? `登録0件 ${summary.warning}` : "",
    summary.danger ? `失敗 ${summary.danger}` : "",
    summary.processing ? `未正式登録/処理中 ${summary.processing}` : "",
  ].filter(Boolean);

  return parts.length ? parts.join(" / ") : `${items.length}件`;
}


export function ExpenseImportHistoryPanel(props: ExpenseImportHistoryPanelProps) {
  const {
    module,
    title = "支出 取込履歴",
    description = "最近の支出 CSV / Excel 取込結果を確認できます。",
    limit = 5,
    refreshToken = 0,
    highlightedImportJobId = null,
  } = props;

  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<ImportJobHistoryItem[]>([]);
  const [error, setError] = React.useState("");
  const [eventHighlightedImportJobId, setEventHighlightedImportJobId] = React.useState<string | null>(null);
  const autoRefreshMountedRef = React.useRef(false);

  const visibleItems = React.useMemo(() => items.slice(0, limit), [items, limit]);
  const latestItem = visibleItems[0] || null;
  const historySummary = React.useMemo(
    () => summarizeExpenseImportHistory(visibleItems),
    [visibleItems]
  );
  const hasAttention =
    historySummary.warning > 0 || historySummary.danger > 0 || historySummary.processing > 0;
  const effectiveHighlightedImportJobId =
    highlightedImportJobId || eventHighlightedImportJobId;

  const loadHistory = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await listExpenseImportHistory({ module });
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [module]);

  React.useEffect(() => {
    if (!autoRefreshMountedRef.current) {
      autoRefreshMountedRef.current = true;
      return;
    }

    if (refreshToken <= 0) return;

    setOpen(true);
    void loadHistory();
  }, [loadHistory, refreshToken]);

  // Step109-Z1-H9-6-FIX1-EXPENSE-HISTORY-EVENT-REFRESH:
  // Decoupled auto refresh after ExpenseImportDialog commits the same module.
  React.useEffect(() => {
    function handleExpenseImportCommitted(event: Event) {
      const detail = (event as CustomEvent<{
        importJobId?: string | null;
        module?: string | null;
      }>).detail;

      if (!detail || detail.module !== module) return;

      setEventHighlightedImportJobId(detail.importJobId || null);
      setOpen(true);
      void loadHistory();
    }

    window.addEventListener(
      "ledgerseiri:expense-import-committed",
      handleExpenseImportCommitted
    );

    return () => {
      window.removeEventListener(
        "ledgerseiri:expense-import-committed",
        handleExpenseImportCommitted
      );
    };
  }, [loadHistory, module]);


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
              {getExpenseImportHistoryModuleLabel(module)}
            </span>
            {latestItem ? (
              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-bold ${getExpenseImportHistoryStatusClass(
                  latestItem
                )}`}
              >
                最新: {getExpenseImportHistoryStatusLabel(latestItem)}
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
                {getExpenseImportHistorySummaryText(visibleItems)}
              </span>
            ) : null}
            {refreshToken > 0 ? (
              <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700">
                登録後自動更新
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
              ImportJob 履歴は支出登録トレース確認用です。処理中が残る場合は履歴更新で再確認してください。
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
                まだ支出の取込履歴はありません。
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
                {visibleItems.map((item) => {
                  const isHighlighted = effectiveHighlightedImportJobId === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`grid gap-3 px-4 py-4 text-sm transition hover:bg-slate-50 md:grid-cols-[minmax(0,1.35fr)_0.85fr_0.7fr_0.9fr] md:gap-4 md:py-3 ${getExpenseImportHistoryRowClass(
                        item
                      )} ${
                        isHighlighted
                          ? "ring-2 ring-violet-200 bg-violet-50/50"
                          : ""
                      }`}
                    >
                    <div className="min-w-0">
                      <div className="truncate font-bold text-slate-900">
                        {item.filename || "-"}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-500">
                          {getExpenseImportHistoryModuleLabel(item.module)}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-500">
                          {item.sourceType || "expense-csv"}
                        </span>
                        <span className="font-mono text-[11px] font-semibold text-slate-400">
                          {shortImportJobId(item.id)}
                        </span>
                        {isHighlighted ? (
                          <span className="rounded-full border border-violet-200 bg-white px-2 py-0.5 text-[11px] font-bold text-violet-700">
                            最新登録
                          </span>
                        ) : null}
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
                      {formatRows(item)}
                    </div>

                    <div>
                      <div className="mb-1 text-[11px] font-bold text-slate-400 md:hidden">
                        状態
                      </div>
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${getExpenseImportHistoryStatusClass(
                          item
                        )}`}
                      >
                        {getExpenseImportHistoryStatusLabel(item)}
                      </span>

                      <div
                        className={`mt-1 line-clamp-2 text-xs font-semibold ${
                          getExpenseImportHistoryTone(item) === "danger"
                            ? "text-rose-600"
                            : getExpenseImportHistoryTone(item) === "warning"
                              ? "text-amber-700"
                              : getExpenseImportHistoryTone(item) === "pending-preview"
                              ? "text-sky-700"
                              : getExpenseImportHistoryTone(item) === "info"
                                ? "text-violet-700"
                                : "text-slate-400"
                        }`}
                      >
                        {getExpenseImportHistoryHint(item)}
                      </div>
                    </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
