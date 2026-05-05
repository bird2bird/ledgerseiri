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
  items = [],
  deletingAttachmentId = "",
  onDeleteAttachment,
}: ExpenseAttachmentStatusCardProps) {
  const [pendingDeleteItem, setPendingDeleteItem] =
    React.useState<ExpenseAttachmentStatusCardItem | null>(null);

  const isDeletingPendingItem =
    Boolean(pendingDeleteItem?.id) && deletingAttachmentId === pendingDeleteItem?.id;

  const hasFiles = items.length > 0;

  return (
    <>
      <section className="mt-2 rounded-[22px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white px-3 py-3 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              添付済み
            </div>
            <p className="mt-2 text-xs font-black leading-5 text-emerald-800">
              {status}
            </p>
            {latestLine ? (
              <p className="mt-1 text-[11px] font-semibold leading-5 text-emerald-700">
                最新: {latestLine}
              </p>
            ) : null}
          </div>

        </div>

        {hasFiles ? (
          <div className="mt-3 border-t border-emerald-100 pt-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-[11px] font-black text-slate-700">保存済みファイル</p>
              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-slate-400 ring-1 ring-slate-200">
                {items.length}件
              </span>
            </div>

            <div className="space-y-2">
              {items.map((item) => {
                const isDeleting = deletingAttachmentId === item.id;

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm transition hover:border-emerald-100 hover:shadow-md"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[12px] font-black leading-5 text-slate-800">
                        {item.fileName}
                      </div>
                      {item.metaLine ? (
                        <div className="mt-0.5 text-[10px] font-semibold leading-4 text-slate-400">
                          {item.metaLine}
                        </div>
                      ) : null}
                    </div>

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
          </div>
        ) : null}
      </section>

      {pendingDeleteItem ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-md">
          <div className="w-full max-w-[460px] rounded-[30px] border border-white/70 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-xl font-black text-rose-600">
                !
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-lg font-black text-slate-950">
                  証憑ファイルを削除しますか？
                </div>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                  保存済みファイルを削除します。削除後はこの画面からダウンロードできません。
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
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
                className="inline-flex h-11 items-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
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
                className="inline-flex h-11 items-center rounded-2xl bg-rose-600 px-5 text-sm font-black text-white shadow-lg shadow-rose-600/20 transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
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
