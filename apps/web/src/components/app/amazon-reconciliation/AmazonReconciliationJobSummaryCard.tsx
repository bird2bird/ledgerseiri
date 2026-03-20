import Link from "next/link";
import React from "react";
import type { ExportJobItem, ImportJobItem, MetaSummary } from "@/core/jobs";
import {
  cls,
  fmtDate,
  statusTone,
  text,
} from "./amazon-reconciliation-shared";
import { JobsStatusSummaryGrid } from "@/components/app/jobs/JobsStatusSummaryGrid";

type Mode = "import" | "export";

export function AmazonReconciliationJobSummaryCard(props: {
  mode: Mode;
  lang: string;
  summary: MetaSummary | null;
  items: ImportJobItem[] | ExportJobItem[];
}) {
  const isImport = props.mode === "import";

  const title = isImport ? "Import Job Summary" : "Export Job Summary";
  const endpoint = isImport
    ? "/api/import-jobs + /api/import-jobs/meta"
    : "/api/export-jobs + /api/export-jobs/meta";
  const ctaHref = isImport ? `/${props.lang}/app/data/import` : `/${props.lang}/app/data/export`;
  const ctaLabel = isImport ? "Import Page" : "Export Page";
  const emptyText = isImport ? "import jobs はまだありません" : "export jobs はまだありません";
  const firstColHeader = isImport ? "Filename / Domain" : "Format / Domain";

  return (
    <section className="ls-card-solid rounded-[28px] p-5 xl:col-span-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-[12px] text-slate-500">{endpoint}</div>
        </div>

        <Link
          href={ctaHref}
          className="ls-btn ls-btn-ghost inline-flex px-4 py-2 text-sm font-semibold"
        >
          {ctaLabel}
        </Link>
      </div>

      <JobsStatusSummaryGrid summary={props.summary} />

      <div className="mt-5 overflow-hidden rounded-[22px] border border-slate-200">
        <div className="grid grid-cols-[1.1fr_120px_140px] gap-4 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
          <div>{firstColHeader}</div>
          <div>Status</div>
          <div>Created</div>
        </div>

        {props.items.length === 0 ? (
          <div className="px-4 py-8 text-sm text-slate-500">{emptyText}</div>
        ) : (
          props.items.map((item) => {
            const primary = isImport
              ? text((item as ImportJobItem).filename)
              : text((item as ExportJobItem).format, "unknown");

            return (
              <div
                key={item.id}
                className="grid grid-cols-[1.1fr_120px_140px] gap-4 border-t border-slate-100 px-4 py-3 text-sm"
              >
                <div>
                  <div className="font-medium text-slate-900">{primary}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    domain: {text(item.domain, "unknown")}
                  </div>
                </div>
                <div>
                  <span
                    className={cls(
                      "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium",
                      statusTone(item.status)
                    )}
                  >
                    {text(item.status)}
                  </span>
                </div>
                <div className="text-slate-600">{fmtDate(item.createdAt)}</div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
