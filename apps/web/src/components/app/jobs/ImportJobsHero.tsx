import React from "react";
import Link from "next/link";

export function ImportJobsHero(props: {
  lang: string;
  onReload: () => void | Promise<void>;
  total: number;
  pending: number;
  succeeded: number;
  latestUpdatedAt: string;
}) {
  return (
    <section className="overflow-hidden rounded-[32px] border border-white/60 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_55%,#334155_100%)] p-7 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
      <div className="inline-flex rounded-full bg-white/12 px-3 py-1 text-[11px] font-medium text-white/90">
        Data Import
      </div>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[34px] font-semibold tracking-tight">データインポート</h1>
          <div className="mt-3 text-sm text-white/80">
            import job の一覧と状態を表示する production baseline です。実ファイルアップロードは後続ステップで接続します。
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
            href={`/${props.lang}/app/data/export`}
            className="ls-btn ls-btn-ghost inline-flex border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
          >
            データエクスポートへ
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-[22px] bg-white/92 p-5 text-slate-900 shadow-sm">
          <div className="text-[11px] font-medium text-slate-500">Total Jobs</div>
          <div className="mt-2 text-xl font-semibold">{props.total}</div>
        </div>
        <div className="rounded-[22px] bg-white/92 p-5 text-slate-900 shadow-sm">
          <div className="text-[11px] font-medium text-slate-500">Pending</div>
          <div className="mt-2 text-xl font-semibold">{props.pending}</div>
        </div>
        <div className="rounded-[22px] bg-white/92 p-5 text-slate-900 shadow-sm">
          <div className="text-[11px] font-medium text-slate-500">Succeeded</div>
          <div className="mt-2 text-xl font-semibold">{props.succeeded}</div>
        </div>
        <div className="rounded-[22px] bg-white/92 p-5 text-slate-900 shadow-sm">
          <div className="text-[11px] font-medium text-slate-500">Latest Update</div>
          <div className="mt-2 text-xl font-semibold">{props.latestUpdatedAt}</div>
        </div>
      </div>
    </section>
  );
}
