import React from "react";
import { TransactionsEditFeedback } from "@/components/app/transactions/TransactionsEditFeedback";
import { TransactionsEditActions } from "@/components/app/transactions/TransactionsEditActions";
import { TransactionsEditAmountField } from "@/components/app/transactions/TransactionsEditAmountField";
import { TransactionsEditMemoField } from "@/components/app/transactions/TransactionsEditMemoField";
import { TransactionsEditInfoStack } from "@/components/app/transactions/TransactionsEditInfoStack";
import { TransactionsStandardEditBodyShell } from "@/components/app/transactions/TransactionsStandardEditBodyShell";
import { TransactionsEditPreviewCard } from "@/components/app/transactions/TransactionsEditPreviewCard";
import { TransactionsReadonlyMetaGrid } from "@/components/app/transactions/TransactionsReadonlyMetaGrid";

export type SharedTransactionEditSummaryItem = {
  label: string;
  value: React.ReactNode;
};

export type RenderSharedTransactionEditFormArgs = {
  previewItems: SharedTransactionEditSummaryItem[];
  metaItems: SharedTransactionEditSummaryItem[];
  readonlyLabelValue: string;

  editAmount: string;
  onEditAmountChange: (value: string) => void;
  editAmountInvalid: boolean;

  editMemo: string;
  onEditMemoChange: (value: string) => void;
  editMemoTooLong: boolean;
  memoMaxLength?: number;

  dirty: boolean;
  error?: string;
  message?: string;
  banner: string;

  onReset: () => void;
  onSave: () => void;
  resetDisabled?: boolean;
  saveDisabled?: boolean;
  saveLoading?: boolean;
};

export function renderSharedTransactionEditForm(
  args: RenderSharedTransactionEditFormArgs
) {
  const {
    previewItems,
    metaItems,
    readonlyLabelValue,

    editAmount,
    onEditAmountChange,
    editAmountInvalid,

    editMemo,
    onEditMemoChange,
    editMemoTooLong,
    memoMaxLength = 500,

    dirty,
    error = "",
    message = "",
    banner,

    onReset,
    onSave,
    resetDisabled = false,
    saveDisabled = false,
    saveLoading = false,
  } = args;

  return (
    <TransactionsStandardEditBodyShell
      info={
        <TransactionsEditInfoStack
          preview={
            <TransactionsEditPreviewCard
              title="編集対象プレビュー"
              items={previewItems}
            />
          }
          meta={
            <TransactionsReadonlyMetaGrid
              items={metaItems}
            />
          }
        />
      }
      primaryFields={
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <TransactionsEditAmountField
              value={editAmount}
              onChange={onEditAmountChange}
              invalid={editAmountInvalid}
            />
          </div>

          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">ラベル</div>
            <input
              value={readonlyLabelValue}
              readOnly
              className="h-11 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600"
            />
          </div>
        </div>
      }
      memoField={
        <div>
          <TransactionsEditMemoField
            value={editMemo}
            onChange={onEditMemoChange}
            tooLong={editMemoTooLong}
            maxLength={memoMaxLength}
          />
        </div>
      }
      feedback={
        <TransactionsEditFeedback
          dirty={dirty}
          error={error}
          message={message}
          banner={banner}
        />
      }
      actions={
        <TransactionsEditActions
          onReset={onReset}
          onSave={onSave}
          resetDisabled={resetDisabled}
          saveDisabled={saveDisabled}
          saveLoading={saveLoading}
        />
      }
    />
  );
}
