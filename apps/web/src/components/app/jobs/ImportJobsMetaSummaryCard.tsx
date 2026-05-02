import React from "react";
import type { ImportMetaResponse } from "@/core/jobs";
import { JobsMetaListSection } from "./JobsMetaListSection";

// Step109-Z1-H11-B-IMPORT-CENTER-META-COPY:
// Replace old export-step placeholder with Import Center product guidance.

export function ImportJobsMetaSummaryCard(props: {
  meta: ImportMetaResponse | null;
}) {
  return (
    <section className="ls-card-solid rounded-[28px] p-5 xl:col-span-4">
      <div className="text-sm font-semibold text-slate-900">Import Center Summary</div>
      <div className="mt-1 text-[12px] text-slate-500">/api/import-jobs/meta</div>

      <div className="mt-5 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
            <div className="text-[11px] font-bold text-slate-500">Total</div>
            <div className="mt-2 text-xl font-black text-slate-900">
              {props.meta?.summary?.total ?? 0}
            </div>
          </div>
          <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 p-4">
            <div className="text-[11px] font-bold text-emerald-700">Succeeded</div>
            <div className="mt-2 text-xl font-black text-emerald-900">
              {props.meta?.summary?.succeeded ?? 0}
            </div>
          </div>
          <div className="rounded-[22px] border border-violet-200 bg-violet-50 p-4">
            <div className="text-[11px] font-bold text-violet-700">Processing</div>
            <div className="mt-2 text-xl font-black text-violet-900">
              {props.meta?.summary?.processing ?? 0}
            </div>
          </div>
          <div className="rounded-[22px] border border-rose-200 bg-rose-50 p-4">
            <div className="text-[11px] font-bold text-rose-700">Failed</div>
            <div className="mt-2 text-xl font-black text-rose-900">
              {props.meta?.summary?.failed ?? 0}
            </div>
          </div>
        </div>

        <JobsMetaListSection
          title="Domains"
          items={props.meta?.domains}
          emptyText="no import domains"
        />

        <JobsMetaListSection
          title="Statuses"
          items={props.meta?.statuses}
          emptyText="no import statuses"
        />

        <div className="rounded-[22px] border border-sky-200 bg-sky-50 p-4">
          <div className="text-sm font-bold text-slate-900">運用ガイド</div>
          <div className="mt-2 space-y-2 text-sm font-semibold leading-6 text-slate-600">
            <p>
              「未正式登録」は、検証済みの preview が存在するものの、正式登録がまだ完了していない状態です。
            </p>
            <p>
              失敗または登録0件の ImportJob は、元ファイル・行数・エラー内容を確認してから再実行してください。
            </p>
          </div>
        </div>

        <div className="rounded-[22px] border border-dashed border-slate-300 bg-white p-4">
          <div className="text-sm font-bold text-slate-900">Next Step</div>
          <div className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            次の H11-C では、ImportJob の module / sourceType / importedAt を API から返し、
            H11-D 以降で詳細 drawer と staging row 確認へ進みます。
          </div>
        </div>
      </div>
    </section>
  );
}
