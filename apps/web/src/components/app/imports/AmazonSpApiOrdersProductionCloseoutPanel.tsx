"use client";

import React from "react";

type FlowItem = {
  step: string;
  title: string;
  status: "done" | "readonly" | "blocked";
  helper: string;
};

const FLOW: FlowItem[] = [
  {
    step: "Step140-P",
    title: "Amazon Orders real preview",
    status: "done",
    helper: "Orders API response → normalized preview. Backend only.",
  },
  {
    step: "Step140-Q",
    title: "ImportJob / StagingRow persistence",
    status: "done",
    helper: "Preview data can be persisted to Import Center staging.",
  },
  {
    step: "Step140-R",
    title: "Income Transaction commit",
    status: "done",
    helper: "READY_FOR_REVIEW rows can create income Transactions.",
  },
  {
    step: "Step140-S",
    title: "SKU alias resolution audit",
    status: "done",
    helper: "ProductSku / ProductSkuAlias / ASIN resolution audit.",
  },
  {
    step: "Step140-T",
    title: "Inventory deduction",
    status: "done",
    helper: "Committed income rows can deduct inventory with movement links.",
  },
  {
    step: "Step140-U",
    title: "Import Center UX closeout",
    status: "readonly",
    helper: "This panel is read-only. No commit, no Amazon call, no write action.",
  },
];

function statusClass(status: FlowItem["status"]) {
  if (status === "done") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "readonly") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-500";
}

function GuardPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-600">
      {children}
    </span>
  );
}

export function AmazonSpApiOrdersProductionCloseoutPanel() {
  return (
    <section
      data-testid="amazon-sp-api-orders-production-closeout-panel"
      className="rounded-[2rem] border border-slate-200 bg-white/95 p-6 shadow-sm ring-1 ring-slate-100"
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-black text-slate-950">
              Amazon注文API 本番導入クロージング
            </h2>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
              backend closed loop ready
            </span>
            <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-black text-sky-700">
              read-only UX
            </span>
          </div>

          <p className="mt-2 max-w-4xl text-sm font-medium leading-6 text-slate-500">
            Step140-P〜T により、Amazon Orders API response から normalized preview、
            ImportJob / StagingRow、income Transaction、SKU解決、InventoryMovement / InventoryBalance
            までの backend 閉ループが揃いました。このパネルは導入状況と安全境界を表示するだけで、
            実Amazon通信・DB書込・Commit・在庫扣減を実行しません。
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <GuardPill>no frontend write action</GuardPill>
            <GuardPill>no Amazon call from this panel</GuardPill>
            <GuardPill>no transaction commit button</GuardPill>
            <GuardPill>no inventory deduction button</GuardPill>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 xl:w-[320px]">
          <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">
            Frontend UI readiness
          </div>
          <div className="mt-1 text-base font-black text-slate-900">
            Dry-run UI: available
          </div>
          <div className="mt-2 leading-6">
            Real Amazon UI read requires a future controller + frontend wiring step.
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 xl:grid-cols-3">
        {FLOW.map((item) => (
          <div
            key={item.step}
            data-testid={`amazon-sp-api-orders-closeout-${item.step.toLowerCase()}`}
            className="rounded-3xl border border-slate-200 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                  {item.step}
                </div>
                <div className="mt-1 text-sm font-black text-slate-900">
                  {item.title}
                </div>
              </div>
              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black ${statusClass(item.status)}`}>
                {item.status}
              </span>
            </div>
            <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">
              {item.helper}
            </p>
          </div>
        ))}
      </div>

      <div
        data-testid="amazon-sp-api-orders-production-closeout-links"
        className="mt-6 grid gap-3 lg:grid-cols-4"
      >
        <a
          href="/ja/app/income/store-orders"
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-white"
        >
          Store Orders を確認
        </a>
        <a
          href="/ja/app/inventory/audit"
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-white"
        >
          Inventory Audit を確認
        </a>
        <a
          href="/ja/app/inventory/status"
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-white"
        >
          Inventory Status を確認
        </a>
        <a
          href="/ja/app/income"
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-white"
        >
          Income を確認
        </a>
      </div>

      <div
        data-testid="amazon-sp-api-orders-production-closeout-boundary"
        className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-800"
      >
        本番Amazonデータを前端UIから読み込むには、次ステップで real preview controller route と frontend
        real-preview button を追加します。この Step140-U では dry-run UI と backend closed-loop 状態の
        production UX closeout だけを行います。
      </div>
    </section>
  );
}
