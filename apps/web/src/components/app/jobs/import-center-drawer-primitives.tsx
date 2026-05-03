import React from "react";
import { formatJsonPreview } from "./import-center-display";

// Step109-Z1-H15-E-IMPORT-CENTER-DRAWER-PRIMITIVES:
// Extract small drawer primitive components from ImportJobsTableCard.tsx.
// Keep drawer layout, labels, classes, and behavior unchanged.

export function CopyFriendlyId(props: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-2.5 py-2">
      <div className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">
        {props.label}
      </div>
      <div className="mt-1 font-mono text-[11px] font-bold text-slate-700 break-all">
        {props.value || "-"}
      </div>
    </div>
  );
}

export function JsonPayloadDetails(props: {
  title: string;
  value: unknown;
  tone?: "dark" | "light";
}) {
  const dark = props.tone !== "light";

  return (
    <details className="group rounded-2xl border border-slate-200 bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-xs font-black text-slate-700">
        <span>{props.title}</span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-black text-slate-500 group-open:hidden">
          展開
        </span>
        <span className="hidden rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-black text-slate-500 group-open:inline-flex">
          閉じる
        </span>
      </summary>
      <pre
        className={`mx-3 mb-3 max-h-56 overflow-auto rounded-xl p-3 text-xs font-semibold leading-5 ${
          dark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-700"
        }`}
      >
        {formatJsonPreview(props.value)}
      </pre>
    </details>
  );
}

export function DetailDataStateCard(props: {
  title: string;
  loading: boolean;
  error: string | null;
  empty: boolean;
  children: React.ReactNode;
}) {
  if (props.loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-sm font-black text-slate-900">{props.title}</div>
        <div className="mt-3 animate-pulse rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-500">
          読み込み中...
        </div>
      </div>
    );
  }

  if (props.error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
        <div className="text-sm font-black text-rose-900">{props.title}</div>
        <div className="mt-2 text-sm font-semibold leading-6 text-rose-700">
          {props.error}
        </div>
      </div>
    );
  }

  if (props.empty) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-sm font-black text-slate-900">{props.title}</div>
        <div className="mt-2 text-sm font-semibold leading-6 text-slate-500">
          表示できるデータはありません。
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-sm font-black text-slate-900">{props.title}</div>
      <div className="mt-3">{props.children}</div>
    </div>
  );
}

export function FutureApiContractCard(props: {
  title: string;
  endpoint: string;
  description: string;
  fields: string[];
  status?: "planned" | "blocked" | "ready";
}) {
  const status = props.status || "planned";

  const statusClass =
    status === "ready"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "blocked"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-sky-200 bg-sky-50 text-sky-700";

  const statusLabel =
    status === "ready" ? "READY" : status === "blocked" ? "WAITING API" : "PLANNED";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-sm font-black text-slate-900">{props.title}</div>
          <div className="mt-1 font-mono text-[11px] font-bold text-slate-500">
            {props.endpoint}
          </div>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${statusClass}`}>
          {statusLabel}
        </span>
      </div>

      <div className="mt-3 text-sm font-semibold leading-6 text-slate-600">
        {props.description}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {props.fields.map((field) => (
          <span
            key={field}
            className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-500"
          >
            {field}
          </span>
        ))}
      </div>
    </div>
  );
}

export function DetailField(props: {
  label: string;
  value?: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="text-[11px] font-bold text-slate-500">{props.label}</div>
      <div
        className={`mt-1 break-words text-sm font-bold text-slate-900 ${
          props.mono ? "font-mono text-xs" : ""
        }`}
      >
        {props.value || "-"}
      </div>
    </div>
  );
}
