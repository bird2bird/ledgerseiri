import React from "react";

export function AmazonReconciliationReadinessCard() {
  return (
    <section className="ls-card-solid rounded-[28px] p-5 xl:col-span-7">
      <div className="text-sm font-semibold text-slate-900">Reconciliation Readiness</div>
      <div className="mt-1 text-[12px] text-slate-500">
        Amazon settlement / order / fee file reconciliation preparation baseline
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-[22px] border border-black/5 bg-slate-50 p-4">
          <div className="text-[11px] font-medium text-slate-500">Import Baseline</div>
          <div className="mt-2 text-base font-semibold text-slate-900">Ready</div>
          <div className="mt-2 text-sm text-slate-600">
            Step46 import jobs page already connected.
          </div>
        </div>

        <div className="rounded-[22px] border border-black/5 bg-slate-50 p-4">
          <div className="text-[11px] font-medium text-slate-500">Export Baseline</div>
          <div className="mt-2 text-base font-semibold text-slate-900">Ready</div>
          <div className="mt-2 text-sm text-slate-600">
            Step46 export jobs page already connected.
          </div>
        </div>

        <div className="rounded-[22px] border border-black/5 bg-slate-50 p-4">
          <div className="text-[11px] font-medium text-slate-500">Amazon Matching Engine</div>
          <div className="mt-2 text-base font-semibold text-slate-900">Planned</div>
          <div className="mt-2 text-sm text-slate-600">
            next step will add settlement/order matching logic baseline.
          </div>
        </div>
      </div>
    </section>
  );
}
