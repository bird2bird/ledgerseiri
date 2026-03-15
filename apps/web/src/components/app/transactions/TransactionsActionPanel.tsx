"use client";

import React from "react";

export type TransactionsActionMode = "create" | "edit" | "import" | "review" | "idle";

export function normalizeTransactionsActionMode(v?: string | null): TransactionsActionMode {
  if (v === "create") return "create";
  if (v === "edit") return "edit";
  if (v === "import") return "import";
  if (v === "review") return "review";
  return "idle";
}

export type TransactionsActionPanelProps = {
  mode: TransactionsActionMode;
  moduleLabel: string;
  description?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
};

function modeTitle(mode: TransactionsActionMode, moduleLabel: string): string {
  if (mode === "create") return `${moduleLabel}を新規作成`;
  if (mode === "edit") return `${moduleLabel}を編集`;
  if (mode === "import") return `${moduleLabel}をインポート`;
  if (mode === "review") return `${moduleLabel}を確認`;
  return `${moduleLabel}アクション`;
}

function modeNote(mode: TransactionsActionMode): string {
  if (mode === "create") return "Step41F: action=create を検知し、次段で実フォームへ接続します。";
  if (mode === "edit") return "Step41F: action=edit を検知し、次段で編集フォームへ接続します。";
  if (mode === "import") return "Step41F: action=import を検知し、次段で取込導線へ接続します。";
  if (mode === "review") return "Step41F: action=review を検知し、次段で詳細確認導線へ接続します。";
  return "Step41F: action mode panel standby.";
}

export function TransactionsActionPanel({
  mode,
  moduleLabel,
  description,
  primaryLabel = "次へ",
  secondaryLabel = "閉じる",
  onPrimaryClick,
  onSecondaryClick,
}: TransactionsActionPanelProps) {
  if (mode === "idle") return null;

  return (
    <div className="rounded-3xl border border-indigo-200 bg-indigo-50/60 p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="inline-flex rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-semibold text-indigo-700">
            Action Mode
          </div>
          <div className="mt-3 text-xl font-semibold text-slate-900">{modeTitle(mode, moduleLabel)}</div>
          <div className="mt-2 text-sm text-slate-600">
            {description ?? `${moduleLabel}ページ内で action mode を明示し、次の処理へつなげます。`}
          </div>
          <div className="mt-3 text-xs text-slate-500">{modeNote(mode)}</div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onPrimaryClick}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            {primaryLabel}
          </button>
          <button
            type="button"
            onClick={onSecondaryClick}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {secondaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TransactionsActionPanel;
