"use client";

import React from "react";

type ExpenseAttachmentStatusCardItem = {
  id: string;
  fileName: string;
  metaLine: string;
  downloadHref: string;
};

type ExpenseAttachmentStatusCardProps = {
  status: string;
  latestLine: string;
  downloadHref: string;
  items?: ExpenseAttachmentStatusCardItem[];
  deletingAttachmentId?: string;
  onDeleteAttachment?: (attachmentId: string) => void;
};

export function ExpenseAttachmentStatusCard({
  status,
  latestLine,
  downloadHref,
  items = [],
  deletingAttachmentId = "",
  onDeleteAttachment,
}: ExpenseAttachmentStatusCardProps) {
  const [pendingDeleteItem, setPendingDeleteItem] =
    React.useState<ExpenseAttachmentStatusCardItem | null>(null);

  const isDeletingPendingItem =
    Boolean(pendingDeleteItem?.id) && deletingAttachmentId === pendingDeleteItem?.id;

  return (
    <>
      <div className="mt-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2">
        <p className="text-xs font-semibold text-emerald-700">{status}</p>
        {latestLine ? (
          <p className="mt-1 text-[11px] font-medium leading-5 text-emerald-700">
            最新: {latestLine}
          </p>
        ) : null}
        {downloadHref ? (
          <a
            href={downloadHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex h-8 items-center rounded-xl border border-emerald-200 bg-white px-3 text-[11px] font-black text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
            aria-label="download最新ファイル"
          >
            ダウンロード
          </a>
        ) : null}

        {items.length ? (
          <div className="mt-3 space-y-2 border-t border-emerald-100 pt-3">
            <p className="text-[11px] font-black text-emerald-800">保存済みファイル</p>
            {items.map((item) => {
              const isDeleting = deletingAttachmentId === item.id;

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-emerald-100 bg-white px-3 py-2 shadow-sm"
                >
                  <div className="text-[11px] font-black leading-5 text-slate-700">
                    {item.fileName}
                  </div>
                  {item.metaLine ? (
                    <div className="mt-0.5 text-[10px] font-semibold leading-4 text-slate-400">
                      {item.metaLine}
                    </div>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.downloadHref ? (
                      <a
                        href={item.downloadHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-7 items-center rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-[10px] font-black text-emerald-700 transition hover:bg-emerald-100"
                        aria-label="download保存済みファイル"
                      >
                        ダウンロード
                      </a>
                    ) : null}
                    {onDeleteAttachment ? (
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => {
                          if (isDeleting) return;
                          setPendingDeleteItem(item);
                        }}
                        className="inline-flex h-7 items-center rounded-lg border border-rose-200 bg-rose-50 px-2.5 text-[10px] font-black text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="delete保存済みファイル"
                      >
                        {isDeleting ? "削除中..." : "削除"}
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      {pendingDeleteItem ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-[440px] rounded-[28px] border border-white/70 bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-lg font-black text-rose-600">
                !
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-base font-black text-slate-950">
                  証憑ファイルを削除しますか？
                </div>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                  この操作を実行すると、保存済みファイルを削除します。削除後はこの画面からダウンロードできなくなります。
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-[11px] font-black text-slate-400">削除対象</div>
              <div className="mt-1 truncate text-sm font-black text-slate-800">
                {pendingDeleteItem.fileName}
              </div>
              {pendingDeleteItem.metaLine ? (
                <div className="mt-1 text-xs font-semibold text-slate-400">
                  {pendingDeleteItem.metaLine}
                </div>
              ) : null}
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                disabled={isDeletingPendingItem}
                onClick={() => setPendingDeleteItem(null)}
                className="inline-flex h-10 items-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                キャンセル
              </button>
              <button
                type="button"
                disabled={isDeletingPendingItem}
                onClick={() => {
                  const attachmentId = pendingDeleteItem.id;
                  void Promise.resolve(onDeleteAttachment?.(attachmentId)).finally(() => {
                    setPendingDeleteItem(null);
                  });
                }}
                className="inline-flex h-10 items-center rounded-2xl bg-rose-600 px-5 text-sm font-black text-white shadow-lg shadow-rose-600/20 transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeletingPendingItem ? "削除中..." : "削除する"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
