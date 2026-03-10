"use client";

import React from "react";

export function DeleteConfirmDialog({
  open,
  title = "削除確認",
  description = "この操作は取り消せません。",
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title?: string;
  description?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-2xl">
        <div className="text-lg font-semibold text-slate-900">{title}</div>
        <div className="mt-2 text-sm text-slate-600">{description}</div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-[14px] border border-black/8 px-4 py-2 text-sm font-medium text-slate-700"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700"
          >
            削除する
          </button>
        </div>
      </div>
    </div>
  );
}
