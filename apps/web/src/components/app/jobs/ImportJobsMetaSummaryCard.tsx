import React from "react";
import type { ImportMetaResponse } from "@/core/jobs";

export function ImportJobsMetaSummaryCard(props: {
  meta: ImportMetaResponse | null;
}) {
  return (
    <section className="ls-card-solid rounded-[28px] p-5 xl:col-span-4">
      <div className="text-sm font-semibold text-slate-900">Meta Summary</div>
      <div className="mt-1 text-[12px] text-slate-500">/api/import-jobs/meta</div>

      <div className="mt-5 space-y-5">
        <div>
          <div className="text-[11px] font-medium text-slate-500">Domains</div>
          <div className="mt-3 space-y-2">
            {(props.meta?.domains ?? []).filter((x) => x.value).length === 0 ? (
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                no data
              </div>
            ) : (
              (props.meta?.domains ?? [])
                .filter((x) => x.value)
                .map((item) => (
                  <div
                    key={item.value}
                    className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                  >
                    {item.label}
                  </div>
                ))
            )}
          </div>
        </div>

        <div className="rounded-[22px] border border-dashed border-[color:var(--ls-primary)]/35 bg-[color:var(--ls-primary)]/5 p-4">
          <div className="text-sm font-medium text-slate-900">Next Step</div>
          <div className="mt-2 text-sm text-slate-600">
            Step46-E2 で data/export を同样に real export-jobs baseline に揃えます。
          </div>
        </div>
      </div>
    </section>
  );
}
