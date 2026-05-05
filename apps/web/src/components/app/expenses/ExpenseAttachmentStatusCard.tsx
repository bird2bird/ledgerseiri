type ExpenseAttachmentStatusCardProps = {
  status: string;
  latestLine: string;
  downloadHref: string;
};

export function ExpenseAttachmentStatusCard({
  status,
  latestLine,
  downloadHref,
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
    </div>
  );
}
