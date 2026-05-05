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
  return (
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
                className="rounded-xl border border-emerald-100 bg-white px-3 py-2"
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
                        onDeleteAttachment(item.id);
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
  );
}
