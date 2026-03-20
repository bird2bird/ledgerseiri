import React from "react";
import type { MetaSummary } from "@/core/jobs";

export function JobsStatusSummaryGrid(props: {
  summary: MetaSummary | null | undefined;
}) {
  return (
    <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
      <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
        <div className="text-[11px] font-medium text-slate-500">PENDING</div>
        <div className="mt-2 text-lg font-semibold text-slate-900">
          {Number(props.summary?.pending ?? 0)}
        </div>
      </div>
      <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
        <div className="text-[11px] font-medium text-slate-500">PROCESSING</div>
        <div className="mt-2 text-lg font-semibold text-slate-900">
          {Number(props.summary?.processing ?? 0)}
        </div>
      </div>
      <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
        <div className="text-[11px] font-medium text-slate-500">SUCCEEDED</div>
        <div className="mt-2 text-lg font-semibold text-slate-900">
          {Number(props.summary?.succeeded ?? 0)}
        </div>
      </div>
      <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
        <div className="text-[11px] font-medium text-slate-500">FAILED</div>
        <div className="mt-2 text-lg font-semibold text-slate-900">
          {Number(props.summary?.failed ?? 0)}
        </div>
      </div>
    </div>
  );
}
