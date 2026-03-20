import React from "react";
import Link from "next/link";

export function JobsErrorState(props: {
  title: string;
  error: string;
  onReload: () => void | Promise<void>;
  secondaryHref: string;
  secondaryLabel: string;
}) {
  return (
    <main className="space-y-6">
      <section className="rounded-[28px] border border-rose-200 bg-rose-50 p-6">
        <div className="text-sm font-semibold text-rose-700">{props.title}</div>
        <div className="mt-2 break-all text-sm text-rose-600">{props.error}</div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void props.onReload()}
            className="ls-btn ls-btn-primary inline-flex px-4 py-2 text-sm font-semibold"
          >
            再読み込み
          </button>
          <Link
            href={props.secondaryHref}
            className="ls-btn ls-btn-ghost inline-flex px-4 py-2 text-sm font-semibold"
          >
            {props.secondaryLabel}
          </Link>
        </div>
      </section>
    </main>
  );
}
