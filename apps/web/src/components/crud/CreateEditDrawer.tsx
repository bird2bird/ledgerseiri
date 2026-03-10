"use client";

import React from "react";

export function CreateEditDrawer({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children?: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/30">
      <div className="h-full w-full max-w-[520px] overflow-y-auto bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-black/6 px-5 py-4">
          <div className="text-base font-semibold text-slate-900">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[12px] border border-black/8 px-3 py-1.5 text-sm text-slate-700"
          >
            閉じる
          </button>
        </div>
        <div className="p-5">{children ?? <div className="text-sm text-slate-500">フォームは Step 32 で実装します。</div>}</div>
      </div>
    </div>
  );
}
