"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  loadImportSummary,
  type ImportHistoryResponse,
  type ImportResultSummary,
} from "@/core/imports";
import { buildImportCommitWorkspaceHref } from "@/core/income-store-orders/cross-workspace-query";
import { ImportResultSummaryPanel } from "./ImportResultSummaryPanel";

function formatDateTime(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "-";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString("ja-JP");
}

function statusClassName(value?: string | null) {
  switch (String(value || "").toUpperCase()) {
    case "SUCCEEDED":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";
    case "PENDING":
      return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";
    case "FAILED":
      return "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200";
    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200";
  }
}

function normalizeStringArray(input?: string[] | null) {
  return Array.isArray(input)
    ? input.map((x) => String(x || "").trim()).filter(Boolean)
    : [];
}

export function ImportHistoryList(props: {
  history: ImportHistoryResponse | null;
  loading?: boolean;
  moduleLabel: string;
}) {
  const { history, loading, moduleLabel } = props;
  const params = useParams<{ lang: string }>();
  const lang = params?.lang ?? "ja";

  const items = Array.isArray(history?.items) ? history!.items : [];
  const [expandedId, setExpandedId] = React.useState("");
  const [summaryLoadingId, setSummaryLoadingId] = React.useState("");
  const [summaryMap, setSummaryMap] = React.useState<Record<string, ImportResultSummary | null>>(
    {}
  );

  async function ensureSummary(importJobId: string) {
    if (!importJobId || Object.prototype.hasOwnProperty.call(summaryMap, importJobId)) {
      return;
    }

    setSummaryLoadingId(importJobId);
    try {
      const res = await loadImportSummary(importJobId);
      setSummaryMap((prev) => ({
        ...prev,
        [importJobId]: res.summary || null,
      }));
    } catch {
      setSummaryMap((prev) => ({
        ...prev,
        [importJobId]: null,
      }));
    } finally {
      setSummaryLoadingId("");
    }
  }

  async function handleToggle(importJobId: string) {
    const next = expandedId === importJobId ? "" : importJobId;
    setExpandedId(next);
    if (next) {
      await ensureSummary(importJobId);
    }
  }

  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-slate-900">Import History</div>
          <div className="mt-1 text-xs text-slate-500">
            当前模块: {moduleLabel}。Step105-EP 已支持从 history 查看同款 summary。
          </div>
        </div>
        <div className="text-xs text-slate-500">
          {loading ? "loading..." : `items: ${items.length}`}
        </div>
      </div>

      {loading ? (
        <div className="mt-4 rounded-[18px] border border-dashed border-slate-200 bg-white px-4 py-8 text-sm text-slate-500">
          正在加载 import history...
        </div>
      ) : items.length ? (
        <div className="mt-4 space-y-3">
          {items.map((item) => {
            const expanded = expandedId === item.id;
            const fileMonths = normalizeStringArray(item.fileMonthsJson);
            const conflictMonths = normalizeStringArray(item.conflictMonthsJson);

            const ordersHref = buildImportCommitWorkspaceHref({
              lang,
              moduleMode: "store-orders",
              importJobId: item.id,
              months: fileMonths,
            });

            const operationHref = buildImportCommitWorkspaceHref({
              lang,
              moduleMode: "store-operation",
              importJobId: item.id,
              months: fileMonths,
            });

            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-[18px] border border-slate-200 bg-white"
              >
                <button
                  type="button"
                  onClick={() => void handleToggle(item.id)}
                  className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-4 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-900">
                      {item.filename || "-"}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>{item.module || "-"}</span>
                      <span>•</span>
                      <span>{item.sourceType || "-"}</span>
                      <span>•</span>
                      <span>{formatDateTime(item.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClassName(
                        item.status
                      )}`}
                    >
                      {item.status || "-"}
                    </span>
                    <span className="text-xs text-slate-500">
                      {expanded ? "收起" : "展开"}
                    </span>
                  </div>
                </button>

                <div className="grid gap-3 border-t border-slate-100 px-4 py-3 sm:grid-cols-4">
                  <div>
                    <div className="text-[11px] text-slate-500">Rows</div>
                    <div className="mt-1 text-sm font-medium text-slate-900">
                      {item.totalRows ?? 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Imported</div>
                    <div className="mt-1 text-sm font-medium text-slate-900">
                      {item.successRows ?? 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Failed</div>
                    <div className="mt-1 text-sm font-medium text-slate-900">
                      {item.failedRows ?? 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Deleted</div>
                    <div className="mt-1 text-sm font-medium text-slate-900">
                      {item.deletedRowCount ?? 0}
                    </div>
                  </div>
                </div>

                {expanded ? (
                  <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-4">
                    <div className="grid gap-4">
                      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="space-y-4">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-[16px] bg-white p-3">
                              <div className="text-[11px] text-slate-500">Policy</div>
                              <div className="mt-1 text-sm font-medium text-slate-900">
                                {item.monthConflictPolicy || "-"}
                              </div>
                            </div>
                            <div className="rounded-[16px] bg-white p-3">
                              <div className="text-[11px] text-slate-500">Imported At</div>
                              <div className="mt-1 text-sm font-medium text-slate-900">
                                {formatDateTime(item.importedAt)}
                              </div>
                            </div>
                            <div className="rounded-[16px] bg-white p-3">
                              <div className="text-[11px] text-slate-500">Updated At</div>
                              <div className="mt-1 text-sm font-medium text-slate-900">
                                {formatDateTime(item.updatedAt)}
                              </div>
                            </div>
                            <div className="rounded-[16px] bg-white p-3">
                              <div className="text-[11px] text-slate-500">Import Job ID</div>
                              <div className="mt-1 break-all text-sm font-medium text-slate-900">
                                {item.id}
                              </div>
                            </div>
                          </div>

                          <div className="rounded-[16px] bg-white p-3">
                            <div className="text-[11px] text-slate-500">File Months</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {fileMonths.length ? (
                                fileMonths.map((month) => (
                                  <span
                                    key={month}
                                    className="inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 ring-1 ring-inset ring-sky-200"
                                  >
                                    {month}
                                  </span>
                                ))
                              ) : (
                                <span className="text-sm text-slate-500">-</span>
                              )}
                            </div>
                          </div>

                          <div className="rounded-[16px] bg-white p-3">
                            <div className="text-[11px] text-slate-500">Conflict Months</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {conflictMonths.length ? (
                                conflictMonths.map((month) => (
                                  <span
                                    key={month}
                                    className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200"
                                  >
                                    {month}
                                  </span>
                                ))
                              ) : (
                                <span className="text-sm text-slate-500">-</span>
                              )}
                            </div>
                          </div>

                          {item.errorMessage ? (
                            <div className="rounded-[16px] border border-rose-200 bg-rose-50 p-3">
                              <div className="text-[11px] text-rose-600">Error Message</div>
                              <div className="mt-1 whitespace-pre-wrap break-all text-sm text-rose-700">
                                {item.errorMessage}
                              </div>
                            </div>
                          ) : null}
                        </div>

                        <div className="space-y-3">
                          <div className="rounded-[16px] bg-white p-3">
                            <div className="text-[11px] text-slate-500">查看导入结果</div>
                            <div className="mt-3 flex flex-col gap-2">
                              <Link
                                href={ordersHref}
                                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                              >
                                打开 店舗注文 结果
                              </Link>
                              <Link
                                href={operationHref}
                                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                              >
                                打开 店舗運営費 结果
                              </Link>
                            </div>
                          </div>

                          <div className="rounded-[16px] bg-white p-3">
                            <div className="text-[11px] text-slate-500">Quick Summary</div>
                            <div className="mt-2 space-y-2 text-sm text-slate-700">
                              <div>module: {item.module || "-"}</div>
                              <div>sourceType: {item.sourceType || "-"}</div>
                              <div>status: {item.status || "-"}</div>
                              <div>policy: {item.monthConflictPolicy || "-"}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {summaryLoadingId === item.id ? (
                        <div className="rounded-[16px] border border-dashed border-slate-200 bg-white px-4 py-8 text-sm text-slate-500">
                          正在加载 summary...
                        </div>
                      ) : Object.prototype.hasOwnProperty.call(summaryMap, item.id) &&
                        summaryMap[item.id] ? (
                        <ImportResultSummaryPanel
                          summary={summaryMap[item.id]}
                          title="History Summary"
                          subtitle="从 Import History 直接查看同款 commit summary"
                        />
                      ) : (
                        <div className="rounded-[16px] border border-dashed border-slate-200 bg-white px-4 py-8 text-sm text-slate-500">
                          该记录暂无可展示的 summary。
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-[18px] border border-dashed border-slate-200 bg-white px-4 py-8 text-sm text-slate-500">
          还没有 import history 数据。
        </div>
      )}
    </div>
  );
}
