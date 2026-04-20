"use client";

import React from "react";
import type { PreviewImportResponse } from "@/core/imports";

export function ImportPreviewSummary(props: {
  preview: PreviewImportResponse | null;
  policyLabel: string;
}) {
  const { preview, policyLabel } = props;

  const items = [
    { label: "总行数", value: preview?.summary?.totalRows ?? 0 },
    { label: "有效行", value: preview?.summary?.validRows ?? 0 },
    { label: "新增", value: preview?.summary?.newRows ?? 0 },
    { label: "重复", value: preview?.summary?.duplicateRows ?? 0 },
    { label: "冲突", value: preview?.summary?.conflictRows ?? 0 },
    { label: "错误", value: preview?.summary?.errorRows ?? 0 },
  ];

  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-slate-900">Preview Summary</div>
          <div className="mt-1 text-xs text-slate-500">当前仅接 skeleton 数据，后续接真实 preview rows。</div>
        </div>
        <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
          策略: {policyLabel}
        </div>
      </div>

      {preview ? (
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.label} className="rounded-[18px] bg-white p-3">
              <div className="text-[11px] text-slate-500">{item.label}</div>
              <div className="mt-1 text-lg font-semibold text-slate-900">{item.value}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-[18px] border border-dashed border-slate-200 bg-white px-4 py-8 text-sm text-slate-500">
          还没有 preview skeleton。
        </div>
      )}

      {preview ? (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[18px] bg-white p-3">
              <div className="text-[11px] text-slate-500">文件月份</div>
              <div className="mt-1 text-sm font-medium text-slate-900">
                {preview.fileMonths?.length ? preview.fileMonths.join(", ") : "-"}
              </div>
            </div>
            <div className="rounded-[18px] bg-white p-3">
              <div className="text-[11px] text-slate-500">系统已有月份</div>
              <div className="mt-1 text-sm font-medium text-slate-900">
                {preview.existingMonths?.length ? preview.existingMonths.join(", ") : "-"}
              </div>
            </div>
            <div className="rounded-[18px] bg-white p-3">
              <div className="text-[11px] text-slate-500">冲突月份</div>
              <div className="mt-1 text-sm font-medium text-slate-900">
                {preview.conflictMonths?.length ? preview.conflictMonths.join(", ") : "-"}
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[18px] border border-slate-200 bg-white p-3">
              <div className="text-[11px] text-slate-500">Policy Interpretation</div>
              <div className="mt-1 text-sm font-medium text-slate-900">
                {policyLabel}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {policyLabel.includes("删除后重新导入")
                  ? "本次 preview 按 replace 口径解释，commit 时将先删除冲突月份旧数据。"
                  : "本次 preview 按 skip 口径解释，commit 时会保留冲突月份现有数据。"}
              </div>
            </div>
            <div className="rounded-[18px] border border-slate-200 bg-white p-3">
              <div className="text-[11px] text-slate-500">Replace Impact</div>
              <div className="mt-1 text-sm font-medium text-slate-900">
                {preview.conflictMonths?.length ?? 0} 个月份存在覆盖风险
              </div>
              <div className="mt-1 text-xs text-slate-500">
                replace 只影响冲突月份；非冲突月份依然按正常新增导入。
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
