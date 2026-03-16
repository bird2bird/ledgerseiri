"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createTransactionsContext,
  fetchJournalsPageData,
  normalizeJournalTabParam,
  type JournalRow,
  type JournalTab,
} from "@/core/transactions/transactions";
import { TransactionsPageSidebar } from "@/components/app/transactions/TransactionsPageSidebar";
import { TransactionsInlineActionPanel } from "@/components/app/transactions/TransactionsInlineActionPanel";
import {
  buildBulkPostWorkflowProps,
  buildFlaggedWorkflowProps,
} from "@/core/transactions/journals-action-workflow";
import {
  renderBulkPostActionPanel,
  renderFlaggedActionPanel,
} from "@/core/transactions/journals-action-render";
import {
  executeBulkPostShellAction,
  executeFlaggedReviewShellAction,
} from "@/core/transactions/journals-action-handlers";
import { useJournalsActionShellState } from "@/core/transactions/use-journals-action-shell-state";
import {
  buildTransactionsActionHref,
  clearTransactionsActionHref,
  readTransactionsActionMode,
} from "@/core/transactions/action-mode";
import {
  buildDrilldownHref,
  cloneSearchParams,
  isDashboardSource,
  readBaseDrilldownQuery,
  setOrDeleteQueryParam,
} from "@/core/drilldown/query-contract";

const TAB_ITEMS: JournalTab[] = ["all", "unposted", "posted", "flagged"];

const TAB_LABELS: Record<JournalTab, string> = {
  all: "すべて",
  unposted: "未転記",
  posted: "転記済み",
  flagged: "要確認",
};

function fmtJPY(value: number) {
  return `¥${value.toLocaleString("ja-JP")}`;
}

export default function Page() {
  const params = useParams<{ lang: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const lang = params?.lang ?? "ja";
  const action = readTransactionsActionMode(searchParams);

  const rawFrom = searchParams.get("from");
  const rawStoreId = searchParams.get("storeId");
  const rawRange = searchParams.get("range");
  const { from, storeId, range } = readBaseDrilldownQuery(searchParams);

  const tab = normalizeJournalTabParam(searchParams.get("tab"));
  const isDashboard = isDashboardSource(from);

  const [rows, setRows] = useState<JournalRow[]>([]);
  const [selectedRowId, setSelectedRowId] = useState("");
  const selectedRow = useMemo(
    () => rows.find((row) => row.id === selectedRowId) ?? null,
    [rows, selectedRowId]
  );
  const [adapterNote, setAdapterNote] = useState("");
  const {
    bulkPostUiMessage,
    setBulkPostUiMessage,
    bulkPostUiTone,
    setBulkPostUiTone,
    bulkPostLoading,
    setBulkPostLoading,
    flaggedUiMessage,
    setFlaggedUiMessage,
    flaggedUiTone,
    setFlaggedUiTone,
    flaggedLoading,
    setFlaggedLoading,
    resetAllActionShellState,
  } = useJournalsActionShellState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadRows() {
    setLoading(true);
    setError("");

    try {
      const ctx = createTransactionsContext({
        from,
        storeId,
        range,
        tab,
      });

      const res = await fetchJournalsPageData(tab, ctx);
      setRows(res.rows);
      setAdapterNote(res.meta.note ?? "");
    } catch (e: unknown) {
      setRows([]);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRows();
  }, [from, storeId, range, tab]);

  const totalAmount = useMemo(() => rows.reduce((sum, row) => sum + row.amount, 0), [rows]);

  function updateTab(next: JournalTab) {
    const qs = cloneSearchParams(searchParams);
    setOrDeleteQueryParam(qs, "tab", next, "all");
    router.replace(buildDrilldownHref(pathname, qs));
  }

  function buildCurrentPageActionHref(nextAction: string) {
    return buildTransactionsActionHref(pathname, searchParams, nextAction);
  }

  function clearActionMode() {
    resetAllActionShellState();
    router.replace(clearTransactionsActionHref(pathname, searchParams));
  }

  async function handleBulkPostExecute() {
    await executeBulkPostShellAction({
      hasSelection: !!selectedRow,
      setMessage: setBulkPostUiMessage,
      setTone: setBulkPostUiTone,
      setLoading: setBulkPostLoading,
    });
  }
  async function handleFlaggedReviewExecute() {
    await executeFlaggedReviewShellAction({
      setMessage: setFlaggedUiMessage,
      setTone: setFlaggedUiTone,
      setLoading: setFlaggedLoading,
    });
  }

  function buildFlaggedHref() {
    const qs = cloneSearchParams(searchParams);
    qs.set("tab", "flagged");
    qs.set("action", "flagged");
    return buildDrilldownHref(pathname, qs);
  }

  const sidebarActions = [
    { label: "新規仕訳", href: buildCurrentPageActionHref("create") },
    { label: "CSV取込", href: buildCurrentPageActionHref("import") },
    { label: "一括転記", href: buildCurrentPageActionHref("bulk-post"), disabled: !selectedRowId },
    { label: "要確認一覧", href: buildFlaggedHref() },
  ];

  const bulkPostWorkflowProps = selectedRow
    ? buildBulkPostWorkflowProps({
        row: selectedRow,
        tabLabels: TAB_LABELS,
        fmtJPY,
        bulkPostUiMessage,
        bulkPostUiTone,
        bulkPostLoading,
        onExecute: () => {
          void handleBulkPostExecute();
        },
        onSecondary: clearActionMode,
      })
    : null;

  const flaggedWorkflowProps = buildFlaggedWorkflowProps({
    tab,
    rowsCount: rows.length,
    selectedEntryNo: selectedRow ? selectedRow.entryNo : null,
    rangeLabel: rawRange ?? range,
    tabLabels: TAB_LABELS,
    flaggedUiMessage,
    flaggedUiTone,
    flaggedLoading,
    onExecute: () => {
      void handleFlaggedReviewExecute();
    },
    onSecondary: clearActionMode,
  });


  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold text-slate-900">仕訳帳</div>
            <div className="mt-2 text-sm text-slate-500">
              仕訳データの確認、状態別チェック、次アクションを一つの画面で管理します。
            </div>
          </div>

          {isDashboard ? (
            <Link href={`/${lang}/app`} className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
              Dashboard に戻る
            </Link>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Source</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{rawFrom ?? from}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Store</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{rawStoreId ?? storeId}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Range</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{rawRange ?? range}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Tab</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{TAB_LABELS[tab]}</div>
          </div>
        </div>

        <div className="mt-4 text-sm text-slate-500">{adapterNote}</div>
      </div>

      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="text-lg font-semibold text-slate-900">Journal Tabs</div>
        <div className="mt-4 flex flex-wrap gap-2">
          {TAB_ITEMS.map((item) => {
            const active = tab === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => updateTab(item)}
                className={
                  active
                    ? "rounded-xl border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                    : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                }
              >
                {TAB_LABELS[item]}
              </button>
            );
          })}
        </div>
      </div>

      {action === "create" ? (
        <TransactionsInlineActionPanel title="新規仕訳" description="journal API 導入前のため、ここでは operation mode の固定化のみを行います。" onClose={clearActionMode}>
          <div className="text-sm text-slate-600">
            Step41G では journals を page-internal action mode に統合しました。次段階で real journal contract を追加後、この領域を form 化します。
          </div>
        </TransactionsInlineActionPanel>
      ) : null}

      {action === "import" ? (
        <TransactionsInlineActionPanel title="仕訳CSV取込" description="取込導線は page-internal action mode に接続済みです。" onClose={clearActionMode}>
          <Link href={`/${lang}/app/data/import?module=journals`} className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
            import center を開く
          </Link>
        </TransactionsInlineActionPanel>
      ) : null}

      {action === "bulk-post" ? (
          <TransactionsInlineActionPanel title="一括転記" description="選択中の仕訳を対象に、次段階で実際の bulk post action へ接続します。" onClose={clearActionMode}>
            {renderBulkPostActionPanel({
              selectedRow,
              bulkPostWorkflowProps: bulkPostWorkflowProps!,
            })}
          </TransactionsInlineActionPanel>
        ) : null}

        {action === "flagged" ? (
          <TransactionsInlineActionPanel title="要確認仕訳" description="flagged 絞り込み一覧を対象に、review action shell を標準化します。" onClose={clearActionMode}>
            {renderFlaggedActionPanel({
              flaggedWorkflowProps,
            })}
          </TransactionsInlineActionPanel>
        ) : null}

      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <TransactionsPageSidebar metricLabel="Visible Amount" metricValue={fmtJPY(totalAmount)} rowsCount={rows.length} actionItems={sidebarActions} />

        <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold text-slate-900">Journal Rows</div>
          <div className="mt-1 text-sm text-slate-500">query → state → context → adapter → render</div>

            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-medium text-slate-900">Selected Row</div>
              {selectedRow ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div><div className="text-xs uppercase tracking-wide text-slate-500">ID</div><div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.id}</div></div>
                  <div><div className="text-xs uppercase tracking-wide text-slate-500">Date</div><div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.date}</div></div>
                  <div><div className="text-xs uppercase tracking-wide text-slate-500">Entry No</div><div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.entryNo}</div></div>
                  <div><div className="text-xs uppercase tracking-wide text-slate-500">Status</div><div className="mt-1 text-sm font-medium text-slate-900">{TAB_LABELS[selectedRow.status]}</div></div>
                  <div className="sm:col-span-2"><div className="text-xs uppercase tracking-wide text-slate-500">Summary</div><div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.summary}</div></div>
                  <div><div className="text-xs uppercase tracking-wide text-slate-500">Amount</div><div className="mt-1 text-sm font-medium text-slate-900">{fmtJPY(selectedRow.amount)}</div></div>
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
                    onClick={() => setSelectedRowId(row.id)}
                     className={`grid grid-cols-[120px_180px_1fr_120px_120px] gap-4 border-t border-slate-100 px-4 py-3 text-sm ${
                      selectedRowId === row.id
                        ? "bg-slate-50 ring-1 ring-inset ring-slate-300"
                        : ""
                    }`}
>
                  <div className="text-slate-600">{row.date}</div>
                  <div className="text-slate-600">{row.entryNo}</div>
                  <div className="font-medium text-slate-900">{row.summary}</div>
                  <div className="text-slate-600">{TAB_LABELS[row.status]}</div>
                  <div className="text-right font-medium text-slate-900">{fmtJPY(row.amount)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
