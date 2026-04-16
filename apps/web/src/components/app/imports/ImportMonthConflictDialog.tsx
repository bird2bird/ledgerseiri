"use client";

import React from "react";
import type {
  DetectMonthStat,
  MonthConflictPolicy,
} from "@/core/imports";

type Props = {
  open: boolean;
  monthStats: DetectMonthStat[];
  selectedPolicy: MonthConflictPolicy;
  onSelectPolicy: (value: MonthConflictPolicy) => void;
  onCancel: () => void;
  onContinue: () => void;
  loading?: boolean;
};

export function ImportMonthConflictDialog(props: Props) {
  const {
    open,
    monthStats,
    selectedPolicy,
    onSelectPolicy,
    onCancel,
    onContinue,
    loading,
  } = props;

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="close month conflict dialog"
        onClick={onCancel}
        className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[1px]"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-[720px] rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
          <div className="text-2xl font-semibold text-slate-900">
            检测到相同月份的数据
          </div>

          <div className="mt-2 text-sm text-slate-500">
            系统中已存在以下月份的数据。请选择本次导入方式。
          </div>

          <div className="mt-5 space-y-3">
            {monthStats.map((item) => (
              <div
                key={item.month}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-slate-900">{item.month}</div>
                  <div className="text-sm text-slate-500">
                    已有 {item.existingCount} 条
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4">
              <input
                type="radio"
                name="month-conflict-policy"
                className="mt-1"
                checked={selectedPolicy === "skip_existing_months"}
                onChange={() => onSelectPolicy("skip_existing_months")}
              />
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  跳过已存在月份的数据，仅导入其他月份
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  这是推荐的安全默认选项，不会改动系统中当前月份的已有数据。
                </div>
              </div>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
              <input
                type="radio"
                name="month-conflict-policy"
                className="mt-1"
                checked={selectedPolicy === "replace_existing_months"}
                onChange={() => onSelectPolicy("replace_existing_months")}
              />
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  删除这些月份的已有数据，再重新导入
                </div>
                <div className="mt-1 text-sm text-amber-700">
                  该操作会影响当前报表与统计结果。后续正式接入 commit 时将通过事务执行。
                </div>
              </div>
            </label>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              取消
            </button>

            <button
              type="button"
              onClick={onContinue}
              disabled={loading}
              className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? "处理中..." : "继续"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
