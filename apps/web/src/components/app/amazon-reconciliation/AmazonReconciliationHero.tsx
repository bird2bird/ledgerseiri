import Link from "next/link";
import React from "react";

export function AmazonReconciliationHero(props: {
  lang: string;
  onReload: () => void | Promise<void>;
}) {
  return (
    <section className="overflow-hidden rounded-[32px] border border-white/60 bg-[linear-gradient(135deg,#111827_0%,#1f2937_52%,#334155_100%)] p-7 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
      <div className="inline-flex rounded-full bg-white/12 px-3 py-1 text-[11px] font-medium text-white/90">
        Amazon Reconciliation
      </div>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[34px] font-semibold tracking-tight">Amazon照合</h1>
          <div className="mt-3 max-w-3xl text-sm text-white/80">
            Step47-C: import/export job baseline と接続し、照合準備状況・履歴・失敗件数を
            ひとつの画面で確認できる reconciliation hub にします。
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void props.onReload()}
            className="ls-btn ls-btn-ghost inline-flex border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
          >
            再読み込み
          </button>

          <Link
            href={`/${props.lang}/app/data/import`}
            className="ls-btn ls-btn-ghost inline-flex border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
          >
            データインポート
          </Link>

          <Link
            href={`/${props.lang}/app/data/export`}
            className="ls-btn ls-btn-ghost inline-flex border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
          >
            データエクスポート
          </Link>
        </div>
      </div>
    </section>
  );
}
