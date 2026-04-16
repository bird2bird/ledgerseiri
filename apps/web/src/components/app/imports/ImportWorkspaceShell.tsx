"use client";

import React, { useMemo, useState } from "react";
import {
  detectMonthConflicts,
  loadImportHistorySkeleton,
  previewImportSkeleton,
  type DetectMonthConflictsResponse,
  type ImportHistoryResponse,
  type MonthConflictPolicy,
  type PreviewImportResponse,
} from "@/core/imports";
import { ImportHistoryList } from "./ImportHistoryList";
import { ImportMonthConflictDialog } from "./ImportMonthConflictDialog";
import { ImportPreviewSummary } from "./ImportPreviewSummary";
import { ImportPreviewTable } from "./ImportPreviewTable";

function formatPolicyLabel(value: MonthConflictPolicy) {
  return value === "replace_existing_months"
    ? "删除后重新导入"
    : "跳过已存在月份";
}

type ModuleMode = "store-orders" | "store-operation";

export function ImportWorkspaceShell(props: { moduleHint?: string | null }) {
  const { moduleHint } = props;

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

  const [dialogOpen, setDialogOpen] = useState(false);
  const [policy, setPolicy] =
    useState<MonthConflictPolicy>("skip_existing_months");

  const currentSourceType = "amazon-csv";

  const moduleLabel =
    moduleMode === "store-operation" ? "店舗運営費" : "店舗注文";

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

  async function runDetect() {
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
        setMessage("未检测到月份冲突，可以继续预览导入。");
      }
    } catch (err) {
      setDetectResult(null);
      setError(err instanceof Error ? err.message : "detect failed");
    } finally {
      setLoading(false);
    }
  }

  async function runPreview(policyOverride?: MonthConflictPolicy) {
    const nextPolicy = policyOverride || policy;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await previewImportSkeleton({
        filename,
        csvText,
        module: moduleMode,
        sourceType: currentSourceType,
        monthConflictPolicy: nextPolicy,
      });

      setPreviewResult(res);
      setDialogOpen(false);
      setMessage(`preview skeleton 已创建，策略：${formatPolicyLabel(nextPolicy)}`);
      await loadHistory(moduleMode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "preview failed");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void loadHistory(moduleMode);
  }, [moduleMode]);

  return (
    <section className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-2xl font-semibold text-slate-900">
            幂等导入工作台 Skeleton
          </div>
          <div className="mt-2 text-sm text-slate-500">
            Step105-EA-3：月份冲突弹窗 + preview shell。当前阶段先接 detect / preview skeleton，不影响现有 Amazon CSV foundation 卡片。
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
                placeholder="先粘贴 CSV 文本。EA-3 阶段主要验证 detect / preview skeleton。"
              />

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void runDetect()}
                  disabled={loading || !csvText.trim()}
                  className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {loading ? "检测中..." : "检测月份冲突"}
                </button>

                <button
                  type="button"
                  onClick={() => void runPreview()}
                  disabled={loading || !csvText.trim()}
                  className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  {loading ? "处理中..." : "直接预览 Skeleton"}
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

          <ImportPreviewSummary
            preview={previewResult}
            policyLabel={formatPolicyLabel(policy)}
          />
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
