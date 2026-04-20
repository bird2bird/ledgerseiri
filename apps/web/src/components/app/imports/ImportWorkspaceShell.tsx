"use client";

import Link from "next/link";
import React, { useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  commitImportSkeleton,
  detectMonthConflicts,
  loadImportHistorySkeleton,
  previewImportSkeleton,
  type CommitImportResponse,
  type DetectMonthConflictsResponse,
  type ImportHistoryResponse,
  type MonthConflictPolicy,
  type PreviewImportResponse,
} from "@/core/imports";
import { buildImportCommitWorkspaceHref } from "@/core/income-store-orders/cross-workspace-query";
import { ImportHistoryList } from "./ImportHistoryList";
import { ImportMonthConflictDialog } from "./ImportMonthConflictDialog";
import { ImportPreviewSummary } from "./ImportPreviewSummary";
import { ImportPreviewTable } from "./ImportPreviewTable";

function formatPolicyLabel(value: MonthConflictPolicy) {
  return value === "replace_existing_months"
    ? "删除后重新导入"
    : "跳过已存在月份";
}

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

type ModuleMode = "store-orders" | "store-operation";

export function ImportWorkspaceShell(props: { moduleHint?: string | null }) {
  const { moduleHint } = props;
  const params = useParams<{ lang: string }>();
  const lang = params?.lang ?? "ja";
  const router = useRouter();

  const [moduleMode, setModuleMode] = useState<ModuleMode>(
    moduleHint === "income" ? "store-orders" : "store-orders"
  );
  const [filename, setFilename] = useState("amazon-store-orders.csv");
  const [csvText, setCsvText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [detectResult, setDetectResult] =
    useState<DetectMonthConflictsResponse | null>(null);
  const [previewResult, setPreviewResult] =
    useState<PreviewImportResponse | null>(null);
  const [historyResult, setHistoryResult] =
    useState<ImportHistoryResponse | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [commitResult, setCommitResult] =
    useState<CommitImportResponse | null>(null);
  const [commitLoading, setCommitLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [policy, setPolicy] =
    useState<MonthConflictPolicy>("skip_existing_months");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const currentSourceType = "amazon-csv";

  const moduleLabel =
    moduleMode === "store-operation" ? "店舗運営費" : "店舗注文";

  const rowCount = Array.isArray(previewResult?.rows) ? previewResult!.rows.length : 0;

  const draftLineCount = useMemo(() => {
    if (!csvText.trim()) return 0;
    return csvText.split(/\r?\n/).filter((line) => line.trim().length > 0).length;
  }, [csvText]);

  const historyItems = Array.isArray(historyResult?.items) ? historyResult.items : [];
  const latestHistoryItem = historyItems[0] ?? null;

  const bridgeImportJobId = String(previewResult?.importJobId || "").trim();
  const bridgeMonths = Array.isArray(detectResult?.fileMonths)
    ? detectResult.fileMonths.filter(Boolean)
    : [];

  const previewOrdersHref = bridgeImportJobId
    ? buildImportCommitWorkspaceHref({
        lang,
        moduleMode: "store-orders",
        importJobId: bridgeImportJobId,
        months: bridgeMonths,
      })
    : `/${lang}/app/income/store-orders`;

  const previewOperationHref = bridgeImportJobId
    ? buildImportCommitWorkspaceHref({
        lang,
        moduleMode: "store-operation",
        importJobId: bridgeImportJobId,
        months: bridgeMonths,
      })
    : `/${lang}/app/expenses/store-operation`;

  const latestHistoryMonths = Array.isArray(latestHistoryItem?.fileMonthsJson)
    ? latestHistoryItem.fileMonthsJson.filter(Boolean)
    : [];

  const latestHistoryOrdersHref = latestHistoryItem
    ? buildImportCommitWorkspaceHref({
        lang,
        moduleMode: "store-orders",
        importJobId: latestHistoryItem.id,
        months: latestHistoryMonths,
      })
    : `/${lang}/app/income/store-orders`;

  const latestHistoryOperationHref = latestHistoryItem
    ? buildImportCommitWorkspaceHref({
        lang,
        moduleMode: "store-operation",
        importJobId: latestHistoryItem.id,
        months: latestHistoryMonths,
      })
    : `/${lang}/app/expenses/store-operation`;

  const canRun = useMemo(() => {
    return !!csvText.trim() && !!filename.trim();
  }, [csvText, filename]);

  async function loadHistory(moduleOverride?: ModuleMode) {
    setHistoryLoading(true);

    try {
      const res = await loadImportHistorySkeleton({
        module: moduleOverride || moduleMode,
      });
      setHistoryResult(res);
    } catch (err) {
      setHistoryResult(null);
      setError(err instanceof Error ? err.message : "history failed");
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleFileChange(file: File | null) {
    if (!file) return;

    try {
      const text = await file.text();
      setFilename(file.name || "amazon-store-orders.csv");
      setCsvText(text);
      setError("");
      setMessage(`已读取文件: ${file.name}`);
      setDetectResult(null);
      setPreviewResult(null);
      setCommitResult(null);
      setCommitResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "file read failed");
    }
  }

  async function runDetect() {
    if (!canRun) return;

    setLoading(true);
    setError("");
    setMessage("");
    setPreviewResult(null);

    try {
      const res = await detectMonthConflicts({
        filename,
        csvText,
        module: moduleMode,
        sourceType: currentSourceType,
      });

      setDetectResult(res);

      if (res.hasConflict) {
        setDialogOpen(true);
        setMessage("检测到相同月份的数据，请先选择处理策略。");
      } else {
        setDialogOpen(false);
        setMessage("未检测到月份冲突，可以继续预览导入。");
        await runPreview(policy, false);
      }
    } catch (err) {
      setDetectResult(null);
      setError(err instanceof Error ? err.message : "detect failed");
    } finally {
      setLoading(false);
    }
  }

  async function runPreview(
    policyOverride?: MonthConflictPolicy,
    keepDialogOpen = false
  ) {
    const nextPolicy = policyOverride || policy;

    setLoading(true);
    setError("");
    if (!keepDialogOpen) {
      setMessage("");
    }

    try {
      const res = await previewImportSkeleton({
        filename,
        csvText,
        module: moduleMode,
        sourceType: currentSourceType,
        monthConflictPolicy: nextPolicy,
      });

      setPreviewResult(res);
      setCommitResult(null);
      setDialogOpen(false);
      setMessage(
        `preview 已生成，策略：${formatPolicyLabel(nextPolicy)} / rows: ${
          Array.isArray(res.rows) ? res.rows.length : 0
        } / importJobId: ${res.importJobId || "-"}`
      );
      await loadHistory(moduleMode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "preview failed");
    } finally {
      setLoading(false);
    }
  }

  async function runCommit() {
    if (!previewResult?.importJobId) return;

    setCommitLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await commitImportSkeleton(previewResult.importJobId, {
        monthConflictPolicy: policy,
      });

      setCommitResult(res);
      setMessage(
        `正式导入完成: imported=${res.importedRows}, duplicate=${res.duplicateRows}, conflict=${res.conflictRows}, error=${res.errorRows}, deleted=${res.deletedRows}`
      );
      await loadHistory(moduleMode);
    } catch (err) {
      setCommitResult(null);
      setError(err instanceof Error ? err.message : "commit failed");
    } finally {
      setCommitLoading(false);
    }
  }

  function buildPostCommitHref(args: {
    moduleMode: ModuleMode;
    importJobId: string;
    months: string[];
  }) {
    const params = new URLSearchParams();
    params.set("from", "import-commit");
    params.set("importJobId", args.importJobId);
    if (args.months.length > 0) {
      params.set("months", args.months.join(","));
    }
    params.set("module", args.moduleMode);

    const base =
      args.moduleMode === "store-operation"
        ? "/app/expenses/store-operation"
        : "/app/income/store-orders";

    return `${base}?${params.toString()}`;
  }

  React.useEffect(() => {
    void loadHistory(moduleMode);
  }, [moduleMode]);

  return (
    <section className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-2xl font-semibold text-slate-900">
            幂等导入工作台
          </div>
          <div className="mt-2 text-sm text-slate-500">
            Step105-EC：文件上传 -&gt; detect -&gt; 月份冲突弹窗 -&gt; preview -&gt; history 刷新。当前仍与既有 Amazon CSV foundation 卡片并行，不替换旧入口。
          </div>
        </div>

        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
          module = {moduleMode}
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-medium text-slate-900">Import Source</div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setModuleMode("store-orders")}
                className={
                  moduleMode === "store-orders"
                    ? "rounded-xl border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                    : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                }
              >
                店舗注文
              </button>

              <button
                type="button"
                onClick={() => setModuleMode("store-operation")}
                className={
                  moduleMode === "store-operation"
                    ? "rounded-xl border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                    : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                }
              >
                店舗運営費
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.tsv,text/csv,text/plain"
                onChange={(e) => {
                  void handleFileChange(e.target.files?.[0] ?? null);
                }}
                className="hidden"
              />

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  选择文件
                </button>

                <div className="text-sm text-slate-500">
                  {filename ? `当前文件: ${filename}` : "尚未选择文件"}
                </div>
              </div>

              <input
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="h-11 w-full rounded-[14px] border border-black/8 bg-white px-3 text-sm"
                placeholder="filename.csv"
              />

              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={10}
                className="w-full rounded-[14px] border border-black/8 bg-white px-3 py-3 text-sm"
                placeholder="可直接粘贴 CSV 文本，或通过上方文件选择读取。"
              />

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void runDetect()}
                  disabled={loading || !canRun}
                  className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {loading ? "处理中..." : "开始导入检测"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCsvText("");
                    setDetectResult(null);
                    setPreviewResult(null);
                    setCommitResult(null);
                    setError("");
                    setMessage("已清空当前导入草稿。");
                  }}
                  className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  清空
                </button>
              </div>
            </div>
          </div>

          {error ? (
            <div className="rounded-[22px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {message ? (
            <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              {message}
            </div>
          ) : null}

          <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-slate-900">Current Draft Summary</div>
                <div className="mt-1 text-xs text-slate-500">
                  当前 import 草稿、detect 结果与 preview 状态总览
                </div>
              </div>
              <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-600">
                ready = {canRun ? "YES" : "NO"}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[16px] bg-white p-3">
                <div className="text-[11px] text-slate-500">Filename</div>
                <div className="mt-1 break-all text-sm font-medium text-slate-900">
                  {filename || "-"}
                </div>
              </div>
              <div className="rounded-[16px] bg-white p-3">
                <div className="text-[11px] text-slate-500">Draft Lines</div>
                <div className="mt-1 text-base font-semibold text-slate-900">
                  {formatNumber(draftLineCount)}
                </div>
              </div>
              <div className="rounded-[16px] bg-white p-3">
                <div className="text-[11px] text-slate-500">Detect Months</div>
                <div className="mt-2">
                  {renderTagList(detectResult?.fileMonths)}
                </div>
              </div>
              <div className="rounded-[16px] bg-white p-3">
                <div className="text-[11px] text-slate-500">Conflict Months</div>
                <div className="mt-2">
                  {renderTagList(detectResult?.conflictMonths)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-medium text-slate-900">
              Month Detection Result
            </div>

            {detectResult ? (
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <div>
                  <span className="font-medium text-slate-900">文件月份：</span>
                  {detectResult.fileMonths.length
                    ? detectResult.fileMonths.join(", ")
                    : "-"}
                </div>
                <div>
                  <span className="font-medium text-slate-900">系统已有月份：</span>
                  {detectResult.existingMonths.length
                    ? detectResult.existingMonths.join(", ")
                    : "-"}
                </div>
                <div>
                  <span className="font-medium text-slate-900">冲突月份：</span>
                  {detectResult.conflictMonths.length
                    ? detectResult.conflictMonths.join(", ")
                    : "-"}
                </div>
                <div>
                  <span className="font-medium text-slate-900">hasConflict：</span>
                  {String(detectResult.hasConflict)}
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-[18px] border border-dashed border-slate-200 bg-white px-4 py-8 text-sm text-slate-500">
                还没有 detect 结果。
              </div>
            )}
          </div>

          <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-slate-900">Latest History Snapshot</div>
                <div className="mt-1 text-xs text-slate-500">
                  最近一条 import history 的快速入口
                </div>
              </div>
              <div className="text-xs text-slate-500">
                {historyLoading ? "loading..." : `items: ${historyItems.length}`}
              </div>
            </div>

            {latestHistoryItem ? (
              <div className="mt-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[16px] bg-white p-3">
                    <div className="text-[11px] text-slate-500">Latest Filename</div>
                    <div className="mt-1 break-all text-sm font-medium text-slate-900">
                      {latestHistoryItem.filename || "-"}
                    </div>
                  </div>
                  <div className="rounded-[16px] bg-white p-3">
                    <div className="text-[11px] text-slate-500">Latest Status</div>
                    <div className="mt-1 text-sm font-medium text-slate-900">
                      {latestHistoryItem.status || "-"}
                    </div>
                  </div>
                  <div className="rounded-[16px] bg-white p-3">
                    <div className="text-[11px] text-slate-500">Imported At</div>
                    <div className="mt-1 text-sm font-medium text-slate-900">
                      {formatDateTime(latestHistoryItem.importedAt)}
                    </div>
                  </div>
                  <div className="rounded-[16px] bg-white p-3">
                    <div className="text-[11px] text-slate-500">File Months</div>
                    <div className="mt-2">
                      {renderTagList(latestHistoryMonths)}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Link
                    href={latestHistoryOrdersHref}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    打开最近一次 店舗注文 结果
                  </Link>
                  <Link
                    href={latestHistoryOperationHref}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    打开最近一次 店舗運営費 结果
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-[18px] border border-dashed border-slate-200 bg-white px-4 py-8 text-sm text-slate-500">
                还没有可展示的 import history。
              </div>
            )}
          </div>

          <ImportPreviewSummary
            preview={previewResult}
            policyLabel={formatPolicyLabel(policy)}
          />

          <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="text-sm font-medium text-slate-900">Preview Status</div>
              <button
                type="button"
                onClick={() => void runCommit()}
                disabled={!previewResult?.importJobId || commitLoading}
                className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {commitLoading ? "正式导入中..." : "正式导入"}
              </button>
            </div>

            <div className="mt-2 space-y-2 text-sm text-slate-700">
              <div>
                <span className="font-medium text-slate-900">Rows：</span>
                {rowCount}
              </div>
              <div>
                <span className="font-medium text-slate-900">Import Job：</span>
                {previewResult?.importJobId || "-"}
              </div>
              <div>
                <span className="font-medium text-slate-900">策略：</span>
                {formatPolicyLabel(policy)}
              </div>
            </div>

            <div className="mt-4 rounded-[16px] border border-slate-200 bg-white p-4">
              <div className="text-[11px] text-slate-500">Workspace Bridge</div>
              <div className="mt-3 flex flex-col gap-2">
                <Link
                  href={previewOrdersHref}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  打开当前 preview 的 店舗注文 结果
                </Link>
                <Link
                  href={previewOperationHref}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  打开当前 preview 的 店舗運営費 结果
                </Link>
              </div>
            </div>

            {commitResult ? (
              <div className="mt-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="rounded-[18px] bg-white p-3">
                    <div className="text-[11px] text-slate-500">Imported</div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">
                      {commitResult.importedRows ?? 0}
                    </div>
                  </div>
                  <div className="rounded-[18px] bg-white p-3">
                    <div className="text-[11px] text-slate-500">Duplicate</div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">
                      {commitResult.duplicateRows ?? 0}
                    </div>
                  </div>
                  <div className="rounded-[18px] bg-white p-3">
                    <div className="text-[11px] text-slate-500">Conflict</div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">
                      {commitResult.conflictRows ?? 0}
                    </div>
                  </div>
                  <div className="rounded-[18px] bg-white p-3">
                    <div className="text-[11px] text-slate-500">Error</div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">
                      {commitResult.errorRows ?? 0}
                    </div>
                  </div>
                  <div className="rounded-[18px] bg-white p-3">
                    <div className="text-[11px] text-slate-500">Deleted</div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">
                      {commitResult.deletedRows ?? 0}
                    </div>
                  </div>
                </div>

                {commitResult.summary ? (
                  <div className="rounded-[20px] border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          Import Result Summary
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          reconciliation-style summary / commit 后导入结果总览
                        </div>
                      </div>
                      <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600">
                        integrity ={" "}
                        {commitResult.summary.integrity?.importedRowsMatchesCommittedCount
                          ? "OK"
                          : "CHECK"}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                      <div className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-[16px] bg-slate-50 p-3">
                            <div className="text-[11px] text-slate-500">Filename</div>
                            <div className="mt-1 break-all text-sm font-medium text-slate-900">
                              {commitResult.summary.filename || "-"}
                            </div>
                          </div>
                          <div className="rounded-[16px] bg-slate-50 p-3">
                            <div className="text-[11px] text-slate-500">Module</div>
                            <div className="mt-1 text-sm font-medium text-slate-900">
                              {commitResult.summary.module || "-"}
                            </div>
                          </div>
                          <div className="rounded-[16px] bg-slate-50 p-3">
                            <div className="text-[11px] text-slate-500">Created At</div>
                            <div className="mt-1 text-sm font-medium text-slate-900">
                              {formatDateTime(commitResult.summary.createdAt)}
                            </div>
                          </div>
                          <div className="rounded-[16px] bg-slate-50 p-3">
                            <div className="text-[11px] text-slate-500">Imported At</div>
                            <div className="mt-1 text-sm font-medium text-slate-900">
                              {formatDateTime(commitResult.summary.importedAt)}
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="rounded-[16px] bg-slate-50 p-3">
                            <div className="text-[11px] text-slate-500">File Months</div>
                            <div className="mt-2">
                              {renderTagList(commitResult.summary.months?.fileMonths)}
                            </div>
                          </div>
                          <div className="rounded-[16px] bg-slate-50 p-3">
                            <div className="text-[11px] text-slate-500">Conflict Months</div>
                            <div className="mt-2">
                              {renderTagList(commitResult.summary.months?.conflictMonths)}
                            </div>
                          </div>
                          <div className="rounded-[16px] bg-slate-50 p-3">
                            <div className="text-[11px] text-slate-500">Imported Months</div>
                            <div className="mt-2">
                              {renderTagList(commitResult.summary.months?.importedMonths)}
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-[16px] bg-slate-50 p-3">
                            <div className="text-[11px] text-slate-500">Staging Total</div>
                            <div className="mt-1 text-base font-semibold text-slate-900">
                              {formatNumber(commitResult.summary.staging?.totalRows)}
                            </div>
                          </div>
                          <div className="rounded-[16px] bg-slate-50 p-3">
                            <div className="text-[11px] text-slate-500">Staging New</div>
                            <div className="mt-1 text-base font-semibold text-slate-900">
                              {formatNumber(commitResult.summary.staging?.newRows)}
                            </div>
                          </div>
                          <div className="rounded-[16px] bg-slate-50 p-3">
                            <div className="text-[11px] text-slate-500">Staging Duplicate</div>
                            <div className="mt-1 text-base font-semibold text-slate-900">
                              {formatNumber(commitResult.summary.staging?.duplicateRows)}
                            </div>
                          </div>
                          <div className="rounded-[16px] bg-slate-50 p-3">
                            <div className="text-[11px] text-slate-500">Staging Conflict/Error</div>
                            <div className="mt-1 text-base font-semibold text-slate-900">
                              {formatNumber(
                                Number(commitResult.summary.staging?.conflictRows || 0) +
                                  Number(commitResult.summary.staging?.errorRows || 0)
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-[16px] bg-slate-50 p-3">
                            <div className="text-[11px] text-slate-500">Committed Count</div>
                            <div className="mt-1 text-base font-semibold text-slate-900">
                              {formatNumber(commitResult.summary.transactions?.committedCount)}
                            </div>
                          </div>
                          <div className="rounded-[16px] bg-slate-50 p-3">
                            <div className="text-[11px] text-slate-500">Committed Amount</div>
                            <div className="mt-1 text-base font-semibold text-slate-900">
                              ¥{formatNumber(commitResult.summary.transactions?.totalCommittedAmount)}
                            </div>
                          </div>
                          <div className="rounded-[16px] bg-slate-50 p-3">
                            <div className="text-[11px] text-slate-500">With Account</div>
                            <div className="mt-1 text-base font-semibold text-slate-900">
                              {formatNumber(commitResult.summary.coverage?.withAccountCount)}
                            </div>
                          </div>
                          <div className="rounded-[16px] bg-slate-50 p-3">
                            <div className="text-[11px] text-slate-500">With Category</div>
                            <div className="mt-1 text-base font-semibold text-slate-900">
                              {formatNumber(commitResult.summary.coverage?.withCategoryCount)}
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
                                {formatNumber(commitResult.summary.transactions?.incomeCount)}
                              </div>
                            </div>
                            <div>
                              <div className="text-[11px] text-slate-500">Expense</div>
                              <div className="mt-1 text-sm font-semibold text-slate-900">
                                {formatNumber(commitResult.summary.transactions?.expenseCount)}
                              </div>
                            </div>
                            <div>
                              <div className="text-[11px] text-slate-500">Transfer</div>
                              <div className="mt-1 text-sm font-semibold text-slate-900">
                                {formatNumber(commitResult.summary.transactions?.transferCount)}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[16px] bg-slate-50 p-3">
                          <div className="text-[11px] text-slate-500">Type Breakdown</div>
                          <div className="mt-3 space-y-2">
                            {Array.isArray(commitResult.summary.transactions?.byType) &&
                            commitResult.summary.transactions?.byType?.length ? (
                              commitResult.summary.transactions.byType.map((item) => (
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
                            {Array.isArray(commitResult.summary.transactions?.byMonth) &&
                            commitResult.summary.transactions?.byMonth?.length ? (
                              commitResult.summary.transactions.byMonth.map((item) => (
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
                            {commitResult.summary.integrity?.importedRowsMatchesCommittedCount
                              ? "true"
                              : "false"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <ImportPreviewTable preview={previewResult} />
        <ImportHistoryList
          history={historyResult}
          loading={historyLoading}
          moduleLabel={moduleLabel}
        />
      </div>

      <ImportMonthConflictDialog
        open={dialogOpen}
        monthStats={detectResult?.monthStats ?? []}
        selectedPolicy={policy}
        onSelectPolicy={setPolicy}
        onCancel={() => setDialogOpen(false)}
        onContinue={() => {
          void runPreview(policy);
        }}
        loading={loading}
      />
    </section>
  );
}
