"use client";

// Step150-NO-FRONTEND-READ-MODEL-WIRING:
// This page consumes the guarded readonly imported Amazon orders read-model.
// It must not call Amazon directly, create ImportJob/SyncJob, or write DB.

import React from "react";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";
import { useParams } from "next/navigation";
import {
  getAmazonImportedOrderDetail,
  listAmazonImportedOrders,
  type AmazonImportedOrderDetailReadModelItemRow,
  type AmazonImportedOrderDetailReadModelResponse,
  type AmazonImportedOrdersReadModelListResponse,
  type AmazonImportedOrdersReadModelOrderRow,
  type AmazonImportedOrdersReadModelRangePreset,
} from "@/core/imports/api";

type AmazonImportedOrderDetailCompat = AmazonImportedOrderDetailReadModelResponse & {
  detail?: {
    order: AmazonImportedOrdersReadModelOrderRow;
    items: AmazonImportedOrderDetailReadModelItemRow[];
    taxFeeSummary: AmazonImportedOrderDetailReadModelResponse["taxFeeSummary"];
    inventoryReadiness: AmazonImportedOrderDetailReadModelResponse["inventoryReadiness"];
    importMetadata: AmazonImportedOrderDetailReadModelResponse["importMetadata"];
  } | null;
};

const EMPTY_SUMMARY: AmazonImportedOrdersReadModelListResponse["summary"] = {
  totalOrders: 0,
  totalItems: 0,
  unresolvedSkuCount: 0,
  linkedSkuCount: 0,
  aliasLinkedSkuCount: 0,
  currency: null,
  amountTotal: null,
};

function valueOrDash(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function normalizeDetailResponse(
  response: AmazonImportedOrderDetailCompat
): AmazonImportedOrderDetailCompat["detail"] {
  if (response.detail !== undefined) {
    return response.detail;
  }

  if (response.order) {
    return {
      order: response.order,
      items: response.items || [],
      taxFeeSummary: response.taxFeeSummary,
      inventoryReadiness: response.inventoryReadiness,
      importMetadata: response.importMetadata,
    };
  }

  return null;
}

function AmazonOrderDetailDrawerShell({
  selectedOrder,
  detail,
  detailLoading,
  detailError,
  onClose,
}: {
  selectedOrder: AmazonImportedOrdersReadModelOrderRow | null;
  detail: AmazonImportedOrderDetailCompat["detail"];
  detailLoading: boolean;
  detailError: string;
  onClose: () => void;
}) {
  if (!selectedOrder) return null;

  const items = detail?.items || [];
  const taxFeeSummary = detail?.taxFeeSummary;
  const inventoryReadiness = detail?.inventoryReadiness;
  const importMetadata = detail?.importMetadata;

  return (
    <>
      <button
        data-testid="amazon-orders-detail-drawer-overlay"
        type="button"
        aria-label="注文詳細を閉じる"
        onClick={onClose}
        className="fixed inset-0 z-30 bg-slate-950/20"
      />
      <aside
        data-testid="amazon-orders-detail-drawer-shell"
        aria-modal="true"
        role="dialog"
        className="fixed inset-y-0 right-0 z-40 flex w-full max-w-2xl flex-col border-l border-slate-200 bg-white shadow-2xl"
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
              <span
                data-testid="amazon-orders-detail-drawer-status-pill"
                className="mt-3 inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700"
              >
                {selectedOrder.status}
              </span>
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
          {detailLoading ? (
            <div
              data-testid="amazon-orders-detail-drawer-loading"
              className="rounded-3xl border border-sky-200 bg-sky-50 p-4 text-sm font-black text-sky-800"
            >
              注文詳細を読み込み中です。
            </div>
          ) : null}

          {detailError ? (
            <div
              data-testid="amazon-orders-detail-drawer-error"
              className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm font-black text-rose-800"
            >
              {detailError}
            </div>
          ) : null}

          <section
            data-testid="amazon-orders-detail-drawer-overview-section"
            className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
          >
            <h3 className="text-sm font-black text-slate-900">注文概要</h3>
            <div
              data-testid="amazon-orders-detail-drawer-overview-grid"
              className="mt-3 grid grid-cols-2 gap-3 text-xs"
            >
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                <div className="font-black text-slate-400">Purchase Date</div>
                <div className="mt-1 font-bold text-slate-700">{valueOrDash(selectedOrder.purchaseDate)}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                <div className="font-black text-slate-400">Marketplace</div>
                <div data-testid="amazon-orders-detail-drawer-marketplace" className="mt-1 font-bold text-slate-700">
                  {valueOrDash(selectedOrder.marketplace)}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                <div className="font-black text-slate-400">Amount</div>
                <div className="mt-1 font-bold text-slate-700">{valueOrDash(selectedOrder.amount)}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
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
              readonly read-model から取得した商品明細を表示します。
            </p>
            <div
              data-testid="amazon-orders-detail-drawer-items-placeholder-grid"
              className="mt-3 overflow-hidden rounded-2xl border border-slate-200"
            >
              <div className="grid grid-cols-[1fr_70px_90px_90px] bg-slate-50 px-3 py-2 text-[11px] font-black text-slate-500">
                <div>SKU / ASIN</div>
                <div>数量</div>
                <div>商品税</div>
                <div>配送税</div>
              </div>
              {items.length > 0 ? (
                items.map((item, index) => (
                  <div
                    key={`${item.orderItemId || item.sellerSku || index}`}
                    data-testid="amazon-orders-detail-drawer-items-read-model-row"
                    className="grid grid-cols-[1fr_70px_90px_90px] border-t border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-600"
                  >
                    <div>
                      <div>{valueOrDash(item.sellerSku)}</div>
                      <div className="text-slate-400">{valueOrDash(item.asin)}</div>
                    </div>
                    <div>{valueOrDash(item.quantity)}</div>
                    <div>{valueOrDash(item.itemTax)}</div>
                    <div>{valueOrDash(item.shippingTax)}</div>
                  </div>
                ))
              ) : (
                <div
                  data-testid="amazon-orders-detail-drawer-items-placeholder-row"
                  className="grid grid-cols-[1fr_70px_90px_90px] border-t border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-600"
                >
                  <div>read-model明細なし</div>
                  <div>—</div>
                  <div>—</div>
                  <div>—</div>
                </div>
              )}
            </div>
          </section>

          <section
            data-testid="amazon-orders-detail-drawer-tax-fee-section"
            className="rounded-3xl border border-amber-200 bg-amber-50 p-4"
          >
            <h3 className="text-sm font-black text-amber-900">税金・手数料</h3>
            <p className="mt-2 text-xs font-bold leading-5 text-amber-800">
              注文 payload に存在する税金情報を表示します。Amazon手数料、FBA費用、決済金額は finance/read-model 接続後に表示します。
            </p>
            <div
              data-testid="amazon-orders-detail-drawer-tax-fee-placeholder-grid"
              className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-black text-amber-900"
            >
              <div className="rounded-2xl border border-amber-200 bg-white px-3 py-2">商品税：{valueOrDash(taxFeeSummary?.itemTaxTotal)}</div>
              <div className="rounded-2xl border border-amber-200 bg-white px-3 py-2">配送料税：{valueOrDash(taxFeeSummary?.shippingTaxTotal)}</div>
              <div className="rounded-2xl border border-amber-200 bg-white px-3 py-2">プロモーション：{valueOrDash(taxFeeSummary?.promotionDiscountTotal)}</div>
              <div className="rounded-2xl border border-amber-200 bg-white px-3 py-2">Amazon手数料：{valueOrDash(taxFeeSummary?.amazonFeeTotal)}</div>
            </div>
          </section>

          <section
            data-testid="amazon-orders-detail-drawer-inventory-readiness-section"
            className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4"
          >
            <h3 className="text-sm font-black text-emerald-900">在庫連携 readiness</h3>
            <p className="mt-2 text-xs font-bold leading-5 text-emerald-800">
              SKU link / alias / unresolved / inventory audit link を readonly read-model から表示します。
            </p>
            <div
              data-testid="amazon-orders-detail-drawer-inventory-readiness-grid"
              className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-black text-emerald-900"
            >
              <div className="rounded-2xl border border-emerald-200 bg-white px-3 py-2">SKU状態：{selectedOrder.skuStatus}</div>
              <div className="rounded-2xl border border-emerald-200 bg-white px-3 py-2">未解決：{valueOrDash(inventoryReadiness?.unresolvedRows)}</div>
              <div className="rounded-2xl border border-emerald-200 bg-white px-3 py-2">リンク済：{valueOrDash(inventoryReadiness?.linkedRows)}</div>
              <div className="rounded-2xl border border-emerald-200 bg-white px-3 py-2">Alias：{valueOrDash(inventoryReadiness?.aliasLinkedRows)}</div>
            </div>
          </section>

          <section
            data-testid="amazon-orders-detail-drawer-import-section"
            className="rounded-3xl border border-sky-200 bg-sky-50 p-4"
          >
            <h3 className="text-sm font-black text-sky-900">インポート情報</h3>
            <p className="mt-2 text-xs font-bold leading-5 text-sky-800">
              ImportJob ID、ImportStagingRow、取得日時を readonly read-model から表示します。
            </p>
            <div
              data-testid="amazon-orders-detail-drawer-import-status-card"
              className="mt-3 rounded-2xl border border-sky-200 bg-white px-3 py-2 text-[11px] font-black text-sky-900"
            >
              ImportJob: {valueOrDash(importMetadata?.importJobId || selectedOrder.importJobId)}
              <br />
              StagingRows: {importMetadata?.stagingRowIds?.length ?? selectedOrder.stagingRowIds.length}
            </div>
          </section>
        </div>
      </aside>
    </>
  );
}

export default function AmazonOrdersImportListPage() {
  const params = useParams<{ lang: string }>();
  const lang = normalizeLang(params?.lang) as Lang;

  const [rangePreset, setRangePreset] = React.useState<AmazonImportedOrdersReadModelRangePreset>("7D");
  const [orderIdFilter, setOrderIdFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [contentFilter, setContentFilter] = React.useState("");
  const [orders, setOrders] = React.useState<AmazonImportedOrdersReadModelOrderRow[]>([]);
  const [summary, setSummary] = React.useState<AmazonImportedOrdersReadModelListResponse["summary"]>(EMPTY_SUMMARY);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [selectedOrder, setSelectedOrder] = React.useState<AmazonImportedOrdersReadModelOrderRow | null>(null);
  const [selectedDetail, setSelectedDetail] = React.useState<AmazonImportedOrderDetailCompat["detail"]>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [detailError, setDetailError] = React.useState("");

  async function loadOrders() {
    setLoading(true);
    setError("");

    try {
      const response = await listAmazonImportedOrders({
        rangePreset,
        orderId: orderIdFilter || undefined,
        status: statusFilter || undefined,
        content: contentFilter || undefined,
        limit: 50,
      });

      setOrders(response.orders || []);
      setSummary(response.summary || EMPTY_SUMMARY);
    } catch (err) {
      setOrders([]);
      setSummary(EMPTY_SUMMARY);
      setError(err instanceof Error ? err.message : "Amazon注文 read-model の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangePreset]);

  async function handleSelectOrder(row: AmazonImportedOrdersReadModelOrderRow) {
    setSelectedOrder(row);
    setSelectedDetail(null);
    setDetailError("");
    setDetailLoading(true);

    try {
      const response = await getAmazonImportedOrderDetail(row.orderId);
      setSelectedDetail(normalizeDetailResponse(response as AmazonImportedOrderDetailCompat));
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "Amazon注文詳細 read-model の取得に失敗しました。");
    } finally {
      setDetailLoading(false);
    }
  }

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
            <p
              data-testid="amazon-orders-detail-list-read-model-status"
              className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500"
            >
              readonly read-model で既存の ImportJob / ImportStagingRow から取得済み注文を表示します。Amazon API 呼び出し、ImportJob作成、DB書き込みは行いません。
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
        data-testid="amazon-orders-detail-list-summary-read-model"
        className="grid gap-3 md:grid-cols-4"
      >
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-black text-slate-400">注文数</div>
          <div className="mt-1 text-2xl font-black text-slate-900">{summary.totalOrders}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-black text-slate-400">商品数</div>
          <div className="mt-1 text-2xl font-black text-slate-900">{summary.totalItems}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-black text-slate-400">未解決SKU</div>
          <div className="mt-1 text-2xl font-black text-slate-900">{summary.unresolvedSkuCount}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-black text-slate-400">合計金額</div>
          <div className="mt-1 text-2xl font-black text-slate-900">{valueOrDash(summary.amountTotal)}</div>
        </div>
      </section>

      <section
        data-testid="amazon-orders-detail-list-filter-shell"
        className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="grid gap-3 md:grid-cols-5">
          <label className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
            期間
            <select
              data-testid="amazon-orders-detail-list-range-summary"
              value={rangePreset}
              onChange={(event) => setRangePreset(event.target.value as AmazonImportedOrdersReadModelRangePreset)}
              className="mt-2 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs"
            >
              <option value="7D">最近7日</option>
              <option value="30D">最近30日</option>
              <option value="90D">最近90日</option>
              <option value="365D">最近365日</option>
            </select>
          </label>

          <label className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600">
            Order ID
            <input
              data-testid="amazon-orders-detail-list-order-id-filter"
              value={orderIdFilter}
              onChange={(event) => setOrderIdFilter(event.target.value)}
              placeholder="ORDER..."
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
            />
          </label>

          <label className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600">
            ステータス
            <input
              data-testid="amazon-orders-detail-list-status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              placeholder="Shipped"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
            />
          </label>

          <label className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600">
            内容
            <input
              data-testid="amazon-orders-detail-list-content-filter"
              value={contentFilter}
              onChange={(event) => setContentFilter(event.target.value)}
              placeholder="商品名 / SKU"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
            />
          </label>

          <div className="flex items-end">
            <button
              data-testid="amazon-orders-detail-list-refresh-button"
              type="button"
              onClick={() => void loadOrders()}
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-xs font-black text-white shadow-sm hover:bg-slate-800"
            >
              再読込
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <section
          data-testid="amazon-orders-detail-list-loading"
          className="rounded-[2rem] border border-sky-200 bg-sky-50 p-5 text-sm font-black text-sky-800"
        >
          Amazon注文 read-model を読み込み中です。
        </section>
      ) : null}

      {error ? (
        <section
          data-testid="amazon-orders-detail-list-error"
          className="rounded-[2rem] border border-rose-200 bg-rose-50 p-5 text-sm font-black text-rose-800"
        >
          {error}
        </section>
      ) : null}

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

        {orders.map((row) => (
          <div
            key={row.orderId}
            data-testid="amazon-orders-detail-list-row-shell"
            className="grid grid-cols-[150px_1.6fr_120px_160px_130px_180px_100px] border-t border-slate-200 text-sm"
          >
            <div className="border-r border-slate-200 px-4 py-4 font-bold text-slate-600">{valueOrDash(row.purchaseDate)}</div>
            <div className="border-r border-slate-200 px-4 py-4 font-bold text-slate-700">{row.content}</div>
            <div className="border-r border-slate-200 px-4 py-4 text-right font-bold text-slate-700">{valueOrDash(row.amount)}</div>
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
                onClick={() => void handleSelectOrder(row)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-sky-700 shadow-sm hover:bg-sky-50"
              >
                詳細
              </button>
            </div>
          </div>
        ))}
      </section>

      {!loading && orders.length === 0 ? (
        <section
          data-testid="amazon-orders-detail-list-empty-state"
          className="rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-bold leading-6 text-slate-600"
        >
          取得済み Amazon 注文はまだありません。Data Import の取得ボタンから ImportJob を作成後、readonly read-model に表示されます。
        </section>
      ) : null}

      <AmazonOrderDetailDrawerShell
        selectedOrder={selectedOrder}
        detail={selectedDetail}
        detailLoading={detailLoading}
        detailError={detailError}
        onClose={() => {
          setSelectedOrder(null);
          setSelectedDetail(null);
          setDetailError("");
        }}
      />
    </main>
  );
}
