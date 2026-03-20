import React from "react";
import type { ImportMetaResponse } from "@/core/jobs";
import { JobsMetaListSection } from "./JobsMetaListSection";

export function ImportJobsMetaSummaryCard(props: {
  meta: ImportMetaResponse | null;
}) {
  return (
    <section className="ls-card-solid rounded-[28px] p-5 xl:col-span-4">
      <div className="text-sm font-semibold text-slate-900">Meta Summary</div>
      <div className="mt-1 text-[12px] text-slate-500">/api/import-jobs/meta</div>

      <div className="mt-5 space-y-5">
        <JobsMetaListSection
          title="Domains"
          items={props.meta?.domains}
          emptyText="no data"
        />

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
