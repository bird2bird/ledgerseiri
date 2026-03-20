import React from "react";
import type { ImportJobItem } from "@/core/jobs";
import { fmtDate, statusTone } from "./jobs-shared";

export function ImportJobsTableCard(props: {
  jobs: ImportJobItem[];
}) {
  return (
    <section className="ls-card-solid rounded-[28px] p-5 xl:col-span-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">Import Job List</div>
          <div className="mt-1 text-[12px] text-slate-500">
            /api/import-jobs の戻り値を安全に表示しています
          </div>
        </div>
      </div>

      {props.jobs.length === 0 ? (
        <div className="mt-5 rounded-[22px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          import job はまだありません。次ステップで create/upload 導線を追加できます。
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-[22px] border border-slate-200">
          <div className="grid grid-cols-[1.4fr_120px_120px_160px] gap-4 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
            <div>Filename / Domain</div>
            <div>Status</div>
            <div>Rows</div>
            <div>Updated</div>
          </div>

          {props.jobs.map((job) => (
            <div
              key={job.id}
              className="grid grid-cols-[1.4fr_120px_120px_160px] gap-4 border-t border-slate-100 px-4 py-3 text-sm"
            >
              <div>
                <div className="font-medium text-slate-900">{job.filename || "-"}</div>
                <div className="mt-1 text-xs text-slate-500">{job.domain || "-"}</div>
              </div>
              <div>
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusTone(job.status)}`}>
                  {job.status}
                </span>
              </div>
              <div className="text-slate-700">{job.totalRows ?? 0}</div>
              <div className="text-slate-700">{fmtDate(job.updatedAt)}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
