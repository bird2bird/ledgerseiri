import React from "react";
import type { ExportJobItem } from "@/core/jobs";
import { fmtDate, formatLabel, statusTone } from "./jobs-shared";

export function ExportJobsTableCard(props: {
  jobs: ExportJobItem[];
}) {
  return (
    <section className="ls-card-solid rounded-[28px] p-5 xl:col-span-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">Export Job List</div>
          <div className="mt-1 text-[12px] text-slate-500">
            /api/export-jobs の戻り値を安全に表示しています
          </div>
        </div>
      </div>

      {props.jobs.length === 0 ? (
        <div className="mt-5 rounded-[22px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          export job はまだありません。次ステップで create/generate 導線を追加できます。
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-[22px] border border-slate-200">
          <div className="grid grid-cols-[1.3fr_120px_120px_160px_100px] gap-4 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
            <div>Domain</div>
            <div>Format</div>
            <div>Status</div>
            <div>Updated</div>
            <div>File</div>
          </div>

          {props.jobs.map((job) => (
            <div
              key={job.id}
              className="grid grid-cols-[1.3fr_120px_120px_160px_100px] gap-4 border-t border-slate-100 px-4 py-3 text-sm"
            >
              <div>
                <div className="font-medium text-slate-900">{job.domain || "-"}</div>
                <div className="mt-1 text-xs text-slate-500 break-all">{job.id}</div>
              </div>
              <div className="text-slate-700">{formatLabel(job.format)}</div>
              <div>
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusTone(job.status)}`}>
                  {job.status}
                </span>
              </div>
              <div className="text-slate-700">{fmtDate(job.updatedAt)}</div>
              <div className="text-slate-700">{job.fileUrl ? "ready" : "-"}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
