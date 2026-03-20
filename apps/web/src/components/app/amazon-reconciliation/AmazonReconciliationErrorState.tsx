import Link from "next/link";
import React from "react";

export function AmazonReconciliationErrorState(props: {
  lang: string;
  error: string;
  onReload: () => void | Promise<void>;
}) {
  return (
    <main className="space-y-6">
      <section className="rounded-[28px] border border-rose-200 bg-rose-50 p-6">
        <div className="text-sm font-semibold text-rose-700">
          Amazon reconciliation の読込に失敗しました
        </div>
        <div className="mt-2 break-all text-sm text-rose-600">{props.error}</div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void props.onReload()}
            className="ls-btn ls-btn-primary inline-flex px-4 py-2 text-sm font-semibold"
          >
            再読み込み
          </button>

          <Link
            href={`/${props.lang}/app/data/import`}
            className="ls-btn ls-btn-ghost inline-flex px-4 py-2 text-sm font-semibold"
          >
            Import へ
          </Link>

          <Link
            href={`/${props.lang}/app/data/export`}
            className="ls-btn ls-btn-ghost inline-flex px-4 py-2 text-sm font-semibold"
          >
            Export へ
          </Link>
        </div>
      </section>
    </main>
  );
}
