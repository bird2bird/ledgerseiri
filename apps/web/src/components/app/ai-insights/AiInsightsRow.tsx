import Link from "next/link";
import React from "react";

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export function AiInsightsRow(props: {
  title: string;
  detail: string;
  tone?: "default" | "good" | "watch";
  href?: string;
}) {
  const tone =
    props.tone === "good"
      ? "border-emerald-200 bg-emerald-50"
      : props.tone === "watch"
      ? "border-amber-200 bg-amber-50"
      : "border-slate-200 bg-white";

  if (props.href) {
    return (
      <Link
        href={props.href}
        className={cls(
          "block rounded-[22px] border p-4 transition hover:-translate-y-[1px] hover:shadow-[var(--sh-sm)]",
          tone
        )}
      >
        <div className="text-sm font-semibold text-slate-900">{props.title}</div>
        <div className="mt-2 text-sm leading-6 text-slate-600">{props.detail}</div>
      </Link>
    );
  }

  return (
    <div className={cls("rounded-[22px] border p-4", tone)}>
      <div className="text-sm font-semibold text-slate-900">{props.title}</div>
      <div className="mt-2 text-sm leading-6 text-slate-600">{props.detail}</div>
    </div>
  );
}
