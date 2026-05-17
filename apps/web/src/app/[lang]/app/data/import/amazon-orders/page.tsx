"use client";

import React from "react";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";
import { useParams } from "next/navigation";

type AmazonOrderListShellRow = {
  orderId: string;
  purchaseDate: string;
  content: string;
  amount: string;
  service: string;
  status: string;
  itemCount: number;
};

const AMAZON_ORDER_LIST_SHELL_ROWS: AmazonOrderListShellRow[] = [
  {
    orderId: "SHELL-ORDER-0001",
    purchaseDate: "未取得",
    content: "Amazon注文データ取得後に表示",
    amount: "—",
    service: "Amazon.co.jp",
    status: "shell-only",
    itemCount: 0,
  },
];

function AmazonOrderDetailDrawerShell({
  selectedOrder,
  onClose,
}: {
  selectedOrder: AmazonOrderListShellRow | null;
  onClose: () => void;
}) {
  if (!selectedOrder) return null;

  return (
    <aside
      data-testid="amazon-orders-detail-drawer-shell"
      className="fixed inset-y-0 right-0 z-40 flex w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-2xl"
    >
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Order Detail Drawer
            </div>
            <h2 className="mt-1 text-xl font-black text-slate-950">
              注文詳細
            </h2>
            <p
              data-testid="amazon-orders-detail-drawer-order-id"
              className="mt-1 text-sm font-bold text-slate-500"
            >
              {selectedOrder.orderId}
            </p>
          </div>

          <button
            data-testid="amazon-orders-detail-drawer-close-button"
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50"
          >
            閉じる
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
        <section
          data-testid="amazon-orders-detail-drawer-overview-section"
          className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
        >
          <h3 className="text-sm font-black text-slate-900">注文概要</h3>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="font-black text-slate-400">Purchase Date</div>
              <div className="mt-1 font-bold text-slate-700">{selectedOrder.purchaseDate}</div>
            </div>
            <div>
              <div className="font-black text-slate-400">Status</div>
              <div className="mt-1 font-bold text-slate-700">{selectedOrder.status}</div>
            </div>
            <div>
              <div className="font-black text-slate-400">Amount</div>
              <div className="mt-1 font-bold text-slate-700">{selectedOrder.amount}</div>
            </div>
            <div>
              <div className="font-black text-slate-400">Items</div>
              <div className="mt-1 font-bold text-slate-700">{selectedOrder.itemCount}</div>
            </div>
          </div>
        </section>

        <section
          data-testid="amazon-orders-detail-drawer-items-section"
          className="rounded-3xl border border-slate-200 bg-white p-4"
        >
          <h3 className="text-sm font-black text-slate-900">商品明細</h3>
          <p className="mt-2 text-xs font-bold leading-5 text-slate-500">
            Step150-E は shell のみです。SKU / ASIN / quantity / item price / item tax / shipping tax は、後続の read-model 接続後に表示します。
          </p>
        </section>

        <section
          data-testid="amazon-orders-detail-drawer-tax-fee-section"
          className="rounded-3xl border border-amber-200 bg-amber-50 p-4"
        >
          <h3 className="text-sm font-black text-amber-900">税金・手数料</h3>
          <p className="mt-2 text-xs font-bold leading-5 text-amber-800">
            商品税、配送料税、プロモーション、Amazon手数料、FBA費用、返金、決済金額は、権限承認と finance/read-model 接続後に表示します。
          </p>
        </section>

        <section
          data-testid="amazon-orders-detail-drawer-inventory-readiness-section"
          className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4"
        >
          <h3 className="text-sm font-black text-emerald-900">在庫連携 readiness</h3>
          <p className="mt-2 text-xs font-bold leading-5 text-emerald-800">
            SKU link / alias / unresolved / inventory audit link は、既存の ImportJob / StagingRow read-model 接続後に表示します。
          </p>
        </section>

        <section
          data-testid="amazon-orders-detail-drawer-import-section"
          className="rounded-3xl border border-sky-200 bg-sky-50 p-4"
        >
          <h3 className="text-sm font-black text-sky-900">インポート情報</h3>
          <p className="mt-2 text-xs font-bold leading-5 text-sky-800">
            ImportJob ID、ImportStagingRow、取得日時、監査リンクは後続ステップで接続します。
          </p>
        </section>
      </div>
    </aside>
  );
}

export default function AmazonOrdersImportListPage() {
  const params = useParams<{ lang: string }>();
  const lang = normalizeLang(params?.lang) as Lang;
  const [selectedOrder, setSelectedOrder] = React.useState<AmazonOrderListShellRow | null>(null);

  return (
    <main
      data-testid="amazon-orders-detail-list-page-shell"
      className="space-y-6"
    >
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Amazon Orders
            </div>
            <h1 className="mt-1 text-2xl font-black text-slate-950">
              Amazon注文 明細一覧
            </h1>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
              MoneyForward-style の注文一覧 shell です。Step150-E では read-model 接続・Amazon取得・ImportJob作成・DB書き込みは行いません。
            </p>
          </div>

          <a
            data-testid="amazon-orders-detail-list-back-link"
            href={`/${lang}/app/data/import`}
            className="inline-flex rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
          >
            データ連携に戻る
          </a>
        </div>
      </section>

      <section
        data-testid="amazon-orders-detail-list-filter-shell"
        className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="grid gap-3 md:grid-cols-5">
          <div
            data-testid="amazon-orders-detail-list-range-summary"
            className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-800"
          >
            期間：最近7日 / 30日 / 90日 / 365日 / カスタム
          </div>

          <label className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600">
            Order ID
            <input
              data-testid="amazon-orders-detail-list-order-id-filter"
              disabled
              placeholder="read-model接続後に有効化"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
            />
          </label>

          <label className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600">
            ステータス
            <select
              data-testid="amazon-orders-detail-list-status-filter"
              disabled
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
            >
              <option>すべて</option>
            </select>
          </label>

          <label className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600">
            内容
            <input
              data-testid="amazon-orders-detail-list-content-filter"
              disabled
              placeholder="商品名 / SKU"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
            />
          </label>

          <label className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600">
            金額
            <input
              data-testid="amazon-orders-detail-list-amount-filter"
              disabled
              placeholder="金額"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
            />
          </label>
        </div>
      </section>

      <section
        data-testid="amazon-orders-detail-list-table-shell"
        className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm"
      >
        <div className="grid grid-cols-[150px_1.6fr_120px_160px_130px_180px_100px] bg-slate-50 text-xs font-black text-slate-500">
          <div className="border-r border-slate-200 px-4 py-3">日付</div>
          <div className="border-r border-slate-200 px-4 py-3">内容</div>
          <div className="border-r border-slate-200 px-4 py-3 text-right">金額</div>
          <div className="border-r border-slate-200 px-4 py-3">連携サービス</div>
          <div className="border-r border-slate-200 px-4 py-3">ステータス</div>
          <div className="border-r border-slate-200 px-4 py-3">Order ID</div>
          <div className="px-4 py-3 text-center">詳細</div>
        </div>

        {AMAZON_ORDER_LIST_SHELL_ROWS.map((row) => (
          <div
            key={row.orderId}
            data-testid="amazon-orders-detail-list-row-shell"
            className="grid grid-cols-[150px_1.6fr_120px_160px_130px_180px_100px] border-t border-slate-200 text-sm"
          >
            <div className="border-r border-slate-200 px-4 py-4 font-bold text-slate-600">{row.purchaseDate}</div>
            <div className="border-r border-slate-200 px-4 py-4 font-bold text-slate-700">{row.content}</div>
            <div className="border-r border-slate-200 px-4 py-4 text-right font-bold text-slate-700">{row.amount}</div>
            <div className="border-r border-slate-200 px-4 py-4 font-bold text-slate-600">{row.service}</div>
            <div className="border-r border-slate-200 px-4 py-4">
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700">
                {row.status}
              </span>
            </div>
            <div className="border-r border-slate-200 px-4 py-4 font-mono text-xs font-bold text-slate-600">{row.orderId}</div>
            <div className="px-4 py-4 text-center">
              <button
                data-testid="amazon-orders-detail-list-row-detail-button"
                type="button"
                onClick={() => setSelectedOrder(row)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-sky-700 shadow-sm hover:bg-sky-50"
              >
                詳細
              </button>
            </div>
          </div>
        ))}
      </section>

      <section
        data-testid="amazon-orders-detail-list-empty-state"
        className="rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-bold leading-6 text-slate-600"
      >
        Step150-E はページ shell のみです。後続ステップで ImportJob / ImportStagingRow read-model を接続して、取得済み注文を表示します。
      </section>

      <AmazonOrderDetailDrawerShell
        selectedOrder={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </main>
  );
}
