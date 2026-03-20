import Link from "next/link";
import React from "react";

export function AmazonReconciliationQuickActionsCard(props: {
  lang: string;
}) {
  return (
    <section className="ls-card-solid rounded-[28px] p-5 xl:col-span-5">
      <div className="text-sm font-semibold text-slate-900">Quick Actions</div>
      <div className="mt-1 text-[12px] text-slate-500">
        import/export center and related ledger pages
      </div>

      <div className="mt-5 flex flex-col gap-3">
        <Link
          href={`/${props.lang}/app/data/import`}
          className="ls-btn ls-btn-primary inline-flex justify-center px-4 py-2 text-sm font-semibold"
        >
          データインポートを開く
        </Link>

        <Link
          href={`/${props.lang}/app/data/export`}
          className="ls-btn ls-btn-ghost inline-flex justify-center px-4 py-2 text-sm font-semibold"
        >
          データエクスポートを開く
        </Link>

        <Link
          href={`/${props.lang}/app/journals`}
          className="ls-btn ls-btn-ghost inline-flex justify-center px-4 py-2 text-sm font-semibold"
        >
          仕訳一覧へ
        </Link>

        <Link
          href={`/${props.lang}/app/reports/detail`}
          className="ls-btn ls-btn-ghost inline-flex justify-center px-4 py-2 text-sm font-semibold"
        >
          詳細レポートへ
        </Link>
      </div>
    </section>
  );
}
