import React from "react";

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export function AmazonReconciliationStatCard(props: {
  title: string;
  value: string | number;
  helper?: string;
  tone?: "default" | "primary" | "success" | "warning";
}) {
  const tone =
    props.tone === "primary"
      ? "border-sky-200 bg-sky-50"
      : props.tone === "success"
      ? "border-emerald-200 bg-emerald-50"
      : props.tone === "warning"
      ? "border-amber-200 bg-amber-50"
      : "border-slate-200 bg-slate-50";

  return (
    <section className={cls("rounded-[24px] border p-5", tone)}>
      <div className="text-xs font-medium text-slate-500">{props.title}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{props.value}</div>
      {props.helper ? <div className="mt-2 text-sm text-slate-600">{props.helper}</div> : null}
    </section>
  );
}
