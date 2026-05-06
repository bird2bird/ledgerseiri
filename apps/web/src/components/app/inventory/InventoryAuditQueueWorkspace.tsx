"use client";

import { useEffect, useMemo, useState } from "react";

type AuditIssueItem = {
  id: string;
  importJobId: string;
  module: string;
  rowNo: number;
  businessMonth: string | null;
  matchStatus: string;
  matchReason: string | null;
  targetEntityType: string | null;
  targetEntityId: string | null;
  createdAt: string;
  importJob: {
    filename: string | null;
    sourceType: string | null;
    importedAt: string | null;
  };
  audit: {
    scope: unknown;
    status: unknown;
    severity: unknown;
    code: unknown;
    reason: unknown;
    sku: unknown;
    sourceType: unknown;
    sourceId: unknown;
    quantity: unknown;
    message: unknown;
    createdAt: unknown;
    previousStatus?: unknown;
    resolvedAt?: unknown;
    resolvedBy?: unknown;
    resolutionAction?: unknown;
    resolutionNote?: unknown;
    linkedSkuId?: unknown;
    linkedSkuCode?: unknown;
    linkedProductName?: unknown;
    resolutionMovementId?: unknown;
    closedReason?: unknown;
  };
  source: {
    orderId: unknown;
    sku: unknown;
    productName: unknown;
    quantity: unknown;
    amount: unknown;
  };
};

type AuditIssuesResponse = {
  ok: boolean;
  domain: string;
  action: string;
  filters: {
    status: string;
    reason: string | null;
    sku: string | null;
    importJobId: string | null;
    businessMonth: string | null;
  };
  items: AuditIssueItem[];
  total: number;
  page: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  summary: {
    totalIssues: number;
    openIssues: number;
    byStatus: Array<{ status: string; count: number }>;
  };
  message: string;
};

type ProductSkuItem = {
  id: string;
  name: string;
  sku: string;
  store: string;
  status: string;
  productId: string | null;
  storeId: string | null;
  brand: string | null;
  category: string | null;
};

type ProductsResponse = {
  ok: boolean;
  domain: string;
  action: string;
  items: ProductSkuItem[];
  total: number;
  message: string;
};

type ResolveResponse = {
  ok: boolean;
  domain: string;
  action: string;
  item: {
    auditIssueId: string;
    audit: {
      status: string;
      resolutionAction: string;
      linkedSkuId: string;
      linkedSkuCode: string;
      resolutionMovementId: string;
      resolvedAt: string;
      closedReason: string;
    };
    sku: {
      id: string;
      skuCode: string;
      name: string | null;
      productName: string | null;
    };
    movement: {
      id: string;
      type: string;
      quantity: number;
      occurredAt: string;
      sourceType: string;
      sourceId: string;
    };
    balance: {
      id: string;
      quantity: number;
      reservedQty: number;
      availableQty: number;
      alertLevel: number;
      stockStatus: string;
      stockStatusLabel: string;
      updatedAt: string;
    };
  };
  message: string;
};

function asText(value: unknown, fallback = "-") {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value);
}

function isOpenIssue(item: AuditIssueItem | null) {
  return String(item?.audit?.status ?? "").toUpperCase() === "OPEN";
}

function isClosedIssue(item: AuditIssueItem | null) {
  return String(item?.audit?.status ?? "").toUpperCase() === "CLOSED";
}

function statusLabel(status: string) {
  if (status === "OPEN") return "未解決";
  if (status === "CLOSED") return "解決済み";
  return "すべて";
}

function statusTone(status: unknown) {
  const normalized = String(status ?? "").toUpperCase();
  if (normalized === "CLOSED") {
    return "rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800";
  }
  if (normalized === "OPEN") {
    return "rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800";
  }
  return "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700";
}

function shortId(value: unknown) {
  const text = asText(value);
  if (text === "-") return text;
  return text.length > 14 ? `${text.slice(0, 8)}…${text.slice(-4)}` : text;
}

function countByStatus(data: AuditIssuesResponse | null, targetStatus: string) {
  return (
    data?.summary?.byStatus?.find((item) => item.status === targetStatus)?.count ?? 0
  );
}

function formatDateTime(value: unknown) {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatNumber(value: unknown) {
  if (value === undefined || value === null || value === "") return "-";
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return new Intl.NumberFormat("ja-JP").format(n);
}

function buildQuery(params: Record<string, string>) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    const normalized = value.trim();
    if (normalized) q.set(key, normalized);
  });
  const raw = q.toString();
  return raw ? `?${raw}` : "";
}

export default function InventoryAuditQueueWorkspace() {
  const [status, setStatus] = useState("OPEN");
  const [reason, setReason] = useState("");
  const [skuDraft, setSkuDraft] = useState("");
  const [sku, setSku] = useState("");
  const [data, setData] = useState<AuditIssuesResponse | null>(null);
  const [selected, setSelected] = useState<AuditIssueItem | null>(null);
  const [products, setProducts] = useState<ProductSkuItem[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [selectedSkuId, setSelectedSkuId] = useState("");
  const [resolveNote, setResolveNote] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [resolveSuccess, setResolveSuccess] = useState<string | null>(null);
  const [lastResolve, setLastResolve] = useState<ResolveResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(
    () =>
      buildQuery({
        status,
        reason,
        sku,
        limit: "50",
        offset: "0",
      }),
    [status, reason, sku],
  );

  async function load(options: { refresh?: boolean } = {}) {
    if (options.refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const response = await fetch(`/api/inventory/audit-issues${query}`, {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const nextData = (await response.json()) as AuditIssuesResponse;
      setData(nextData);

      setSelected((current) => {
        if (!current) return current;
        return nextData.items.find((item) => item.id === current.id) ?? current;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "監査キューの取得に失敗しました。");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadProducts() {
    setProductsLoading(true);
    setProductsError(null);

    try {
      const response = await fetch("/api/products", {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const nextProducts = (await response.json()) as ProductsResponse;
      const items = nextProducts.items ?? [];
      setProducts(items);

      if (!selectedSkuId && items[0]?.id) {
        setSelectedSkuId(items[0].id);
      }
    } catch (err) {
      setProductsError(err instanceof Error ? err.message : "商品SKU一覧の取得に失敗しました。");
    } finally {
      setProductsLoading(false);
    }
  }

  async function resolveSelectedIssue() {
    if (!selected) return;

    if (!selectedSkuId) {
      setResolveError("紐づける既存SKUを選択してください。");
      return;
    }

    setResolving(true);
    setResolveError(null);
    setResolveSuccess(null);
    setLastResolve(null);

    try {
      const response = await fetch(`/api/inventory/audit-issues/${selected.id}/resolve`, {
        method: "POST",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          skuId: selectedSkuId,
          note: resolveNote.trim() || "Resolved from inventory audit drawer",
        }),
      });

      const responseText = await response.text();
      const parsed = responseText ? (JSON.parse(responseText) as ResolveResponse) : null;

      if (!response.ok || !parsed?.ok) {
        throw new Error(parsed?.message || `HTTP ${response.status}`);
      }

      setLastResolve(parsed);
      setResolveSuccess(
        `解決しました。${parsed.item.sku.skuCode} に紐づけ、在庫移動 ${parsed.item.movement.id} を作成しました。`,
      );

      setStatus("ALL");
      await load({ refresh: true });
    } catch (err) {
      setResolveError(err instanceof Error ? err.message : "監査明細の解決に失敗しました。");
    } finally {
      setResolving(false);
    }
  }

  function openDrawer(item: AuditIssueItem) {
    setSelected(item);
    setResolveError(null);
    setResolveSuccess(null);
    setLastResolve(null);
    setResolveNote("");
    setSelectedSkuId("");
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    if (selected) {
      void loadProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  const items = data?.items ?? [];
  const openIssues = data?.summary?.openIssues ?? 0;
  const totalIssues = data?.summary?.totalIssues ?? 0;
  const closedIssues = countByStatus(data, "CLOSED");
  const selectedProduct = products.find((item) => item.id === selectedSkuId) ?? null;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-6 text-slate-900">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-semibold text-amber-700">Inventory Audit Queue</div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                未解決の在庫監査
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Amazon注文取込時にSKUが商品マスタへ紐づかず、在庫引当・減算がスキップされた明細を確認します。
                既存SKUに紐づけると、在庫OUT移動を作成し監査明細をCLOSEDにします。
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center xl:grid-cols-4">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                <div className="text-xs font-semibold text-amber-700">未解決</div>
                <div className="mt-1 text-2xl font-bold text-amber-900">{formatNumber(openIssues)}</div>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <div className="text-xs font-semibold text-emerald-700">解決済み</div>
                <div className="mt-1 text-2xl font-bold text-emerald-900">{formatNumber(closedIssues)}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-xs font-semibold text-slate-500">TOTAL</div>
                <div className="mt-1 text-2xl font-bold text-slate-900">{formatNumber(totalIssues)}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-xs font-semibold text-slate-500">表示中</div>
                <div className="mt-1 text-2xl font-bold text-slate-900">{formatNumber(items.length)}</div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap gap-2">
              {["OPEN", "CLOSED", "ALL"].map((nextStatus) => (
                <button
                  key={nextStatus}
                  type="button"
                  onClick={() => setStatus(nextStatus)}
                  className={
                    status === nextStatus
                      ? "rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm"
                      : "rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-100"
                  }
                >
                  {statusLabel(nextStatus)}
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-500">理由</span>
                <select
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="h-10 min-w-56 rounded-xl border border-slate-300 bg-white px-3 text-sm shadow-sm outline-none focus:border-slate-500"
                >
                  <option value="">すべて</option>
                  <option value="PRODUCT_SKU_NOT_FOUND">PRODUCT_SKU_NOT_FOUND</option>
                </select>
              </label>

              <label className="flex flex-1 flex-col gap-1">
                <span className="text-xs font-semibold text-slate-500">SKU検索</span>
                <input
                  value={skuDraft}
                  onChange={(event) => setSkuDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") setSku(skuDraft);
                  }}
                  placeholder="SKU / seller-sku"
                  className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm shadow-sm outline-none focus:border-slate-500"
                />
              </label>

              <button
                type="button"
                onClick={() => setSku(skuDraft)}
                className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm hover:bg-slate-700"
              >
                検索
              </button>

              <button
                type="button"
                onClick={() => {
                  setSkuDraft("");
                  setSku("");
                  setReason("");
                }}
                className="h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-100"
              >
                解除
              </button>

              <button
                type="button"
                onClick={() => void load({ refresh: true })}
                className="h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-100"
              >
                {refreshing ? "更新中..." : "再取得"}
              </button>
            </div>
          </div>

          {resolveSuccess ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {resolveSuccess}
            </div>
          ) : null}
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-base font-bold text-slate-950">監査対象明細</h2>
              <p className="mt-1 text-xs text-slate-500">
                SKUマッピング未解決・解決済みの取込行を確認できます。
              </p>
            </div>
            {data?.page?.hasMore ? (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                続きあり
              </span>
            ) : null}
          </div>

          {loading ? (
            <div className="p-8 text-sm text-slate-500">読み込み中...</div>
          ) : error ? (
            <div className="m-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-sm text-slate-500">
              条件に一致する在庫監査明細はありません。
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">SKU</th>
                    <th className="px-5 py-3">状態</th>
                    <th className="px-5 py-3">理由</th>
                    <th className="px-5 py-3">紐づけ先</th>
                    <th className="px-5 py-3">注文ID</th>
                    <th className="px-5 py-3 text-right">数量</th>
                    <th className="px-5 py-3">取込ファイル</th>
                    <th className="px-5 py-3">解決日時</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      title="クリックして詳細を開く"
                      onClick={() => openDrawer(item)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openDrawer(item);
                        }
                      }}
                      className="cursor-pointer hover:bg-amber-50/60 focus:bg-amber-50 focus:outline-none"
                    >
                      <td className="max-w-xs px-5 py-4">
                        <div className="font-semibold text-slate-950">{asText(item.audit.sku)}</div>
                        <div className="mt-1 truncate text-xs text-slate-500">
                          {asText(item.source.productName)}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={statusTone(item.audit.status)}>
                          {isClosedIssue(item) ? "解決済み" : "未解決"}
                        </span>
                        <div className="mt-2 text-xs text-slate-500">
                          {isClosedIssue(item) ? "在庫移動作成済み" : "在庫減算が未反映です"}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {asText(item.audit.reason)}
                        </span>
                      </td>
                      <td className="max-w-xs px-5 py-4">
                        {isClosedIssue(item) ? (
                          <>
                            <div className="font-semibold text-slate-900">
                              {asText(item.audit.linkedSkuCode)}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              movement: {shortId(item.audit.resolutionMovementId)}
                            </div>
                          </>
                        ) : (
                          <span className="text-xs font-semibold text-amber-700">未紐づけ</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-700">{asText(item.source.orderId)}</td>
                      <td className="px-5 py-4 text-right font-semibold text-slate-900">
                        {formatNumber(item.audit.quantity ?? item.source.quantity)}
                      </td>
                      <td className="max-w-xs px-5 py-4">
                        <div className="truncate text-slate-700">{asText(item.importJob.filename)}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          row {item.rowNo} / {asText(item.businessMonth)}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {isClosedIssue(item) ? (
                          <>
                            <div>{formatDateTime(item.audit.resolvedAt)}</div>
                            <div className="mt-1 text-xs text-slate-400">
                              imported: {formatDateTime(item.importJob.importedAt)}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-amber-700">未解決</div>
                            <div className="mt-1 text-xs text-slate-400">
                              imported: {formatDateTime(item.importJob.importedAt)}
                            </div>
                          </>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openDrawer(item);
                          }}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-100"
                        >
                          詳細
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40">
          <button
            type="button"
            aria-label="close drawer backdrop"
            className="absolute inset-0 cursor-default"
            onClick={() => setSelected(null)}
          />
          <aside className="relative z-10 h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-amber-700">Inventory Audit Detail</div>
                  <h3 className="mt-1 text-xl font-bold text-slate-950">{asText(selected.audit.sku)}</h3>
                  <p className="mt-1 text-sm text-slate-500">{asText(selected.audit.message)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  閉じる
                </button>
              </div>
            </div>

            <div className="space-y-5 p-6">
              <section
                className={
                  isClosedIssue(selected)
                    ? "rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
                    : "rounded-2xl border border-amber-200 bg-amber-50 p-4"
                }
              >
                <h4 className={isClosedIssue(selected) ? "text-sm font-bold text-emerald-900" : "text-sm font-bold text-amber-900"}>
                  監査ステータス
                </h4>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">status</dt>
                    <dd className="mt-1 font-semibold text-slate-950">{asText(selected.audit.status)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">severity</dt>
                    <dd className="mt-1 font-semibold text-slate-950">{asText(selected.audit.severity)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">reason</dt>
                    <dd className="mt-1 font-semibold text-slate-950">{asText(selected.audit.reason)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">code</dt>
                    <dd className="mt-1 font-semibold text-slate-950">{asText(selected.audit.code)}</dd>
                  </div>
                </dl>
              </section>

              {isOpenIssue(selected) ? (
                <section className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                    この明細はまだ在庫減算が未反映です。既存SKUへ紐づけると、
                    注文数量 {formatNumber(selected.audit.quantity ?? selected.source.quantity)} 点を在庫OUTとして反映します。
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-950">既存SKUに紐づけて解決</h4>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        選択したSKUに注文数量をOUT移動として反映し、この監査明細をCLOSEDにします。
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void loadProducts()}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      SKU再取得
                    </button>
                  </div>

                  <label className="mt-4 flex flex-col gap-1">
                    <span className="text-xs font-semibold text-slate-500">紐づけ先SKU</span>
                    <select
                      value={selectedSkuId}
                      onChange={(event) => setSelectedSkuId(event.target.value)}
                      disabled={productsLoading || resolving}
                      className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm shadow-sm outline-none focus:border-slate-500 disabled:bg-slate-100"
                    >
                      <option value="">
                        {productsLoading ? "SKUを読み込み中..." : "SKUを選択してください"}
                      </option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.sku} / {product.name} / {product.store}
                        </option>
                      ))}
                    </select>
                  </label>

                  {selectedProduct ? (
                    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                      <div className="font-semibold text-slate-900">{selectedProduct.sku}</div>
                      <div className="mt-1">{selectedProduct.name}</div>
                      <div className="mt-1">
                        店舗: {selectedProduct.store} / 状態: {selectedProduct.status}
                      </div>
                    </div>
                  ) : null}

                  <label className="mt-4 flex flex-col gap-1">
                    <span className="text-xs font-semibold text-slate-500">メモ</span>
                    <textarea
                      value={resolveNote}
                      onChange={(event) => setResolveNote(event.target.value)}
                      disabled={resolving}
                      placeholder="任意: 解決理由や確認メモ"
                      className="min-h-20 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-500 disabled:bg-slate-100"
                    />
                  </label>

                  {productsError ? (
                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      {productsError}
                    </div>
                  ) : null}

                  {resolveError ? (
                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      {resolveError}
                    </div>
                  ) : null}

                  {resolveSuccess ? (
                    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                      {resolveSuccess}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => void resolveSelectedIssue()}
                    disabled={!selectedSkuId || resolving || productsLoading}
                    className="mt-4 w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {resolving ? "解決処理中..." : "既存SKUに紐づけて解決"}
                  </button>

                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    実行後、在庫OUT移動が作成され、監査ステータスはCLOSEDになります。
                  </p>
                </section>
              ) : null}

              {isClosedIssue(selected) ? (
                <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <h4 className="text-sm font-bold text-emerald-950">解決情報</h4>
                  <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-semibold text-emerald-700">resolvedAt</dt>
                      <dd className="mt-1 text-emerald-950">{formatDateTime(selected.audit.resolvedAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-emerald-700">resolutionAction</dt>
                      <dd className="mt-1 text-emerald-950">{asText(selected.audit.resolutionAction)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-emerald-700">linkedSkuCode</dt>
                      <dd className="mt-1 text-emerald-950">{asText(selected.audit.linkedSkuCode)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-emerald-700">linkedProductName</dt>
                      <dd className="mt-1 text-emerald-950">{asText(selected.audit.linkedProductName)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-emerald-700">movementId</dt>
                      <dd className="mt-1 break-all text-emerald-950">{asText(selected.audit.resolutionMovementId)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-emerald-700">closedReason</dt>
                      <dd className="mt-1 text-emerald-950">{asText(selected.audit.closedReason)}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-xs font-semibold text-emerald-700">resolutionNote</dt>
                      <dd className="mt-1 break-words text-emerald-950">{asText(selected.audit.resolutionNote)}</dd>
                    </div>
                  </dl>
                </section>
              ) : null}

              {lastResolve ? (
                <section className="rounded-2xl border border-emerald-200 bg-white p-4">
                  <h4 className="text-sm font-bold text-slate-950">今回の解決結果</h4>
                  <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-semibold text-slate-500">SKU</dt>
                      <dd className="mt-1 text-slate-900">{lastResolve.item.sku.skuCode}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-slate-500">在庫移動</dt>
                      <dd className="mt-1 break-all text-slate-900">{lastResolve.item.movement.id}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-slate-500">数量</dt>
                      <dd className="mt-1 text-slate-900">{formatNumber(lastResolve.item.movement.quantity)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-slate-500">在庫状態</dt>
                      <dd className="mt-1 text-slate-900">{lastResolve.item.balance.stockStatusLabel}</dd>
                    </div>
                  </dl>
                </section>
              ) : null}

              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <h4 className="text-sm font-bold text-slate-950">Amazon注文ソース</h4>
                <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">注文ID</dt>
                    <dd className="mt-1 text-slate-900">{asText(selected.source.orderId)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">SKU</dt>
                    <dd className="mt-1 text-slate-900">{asText(selected.source.sku)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">商品名</dt>
                    <dd className="mt-1 text-slate-900">{asText(selected.source.productName)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">数量</dt>
                    <dd className="mt-1 text-slate-900">{formatNumber(selected.source.quantity)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">金額</dt>
                    <dd className="mt-1 text-slate-900">¥{formatNumber(selected.source.amount)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">businessMonth</dt>
                    <dd className="mt-1 text-slate-900">{asText(selected.businessMonth)}</dd>
                  </div>
                </dl>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <h4 className="text-sm font-bold text-slate-950">取込情報</h4>
                <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">importJobId</dt>
                    <dd className="mt-1 break-all text-slate-900">{selected.importJobId}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">rowNo</dt>
                    <dd className="mt-1 text-slate-900">{selected.rowNo}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">filename</dt>
                    <dd className="mt-1 break-all text-slate-900">{asText(selected.importJob.filename)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">sourceType</dt>
                    <dd className="mt-1 text-slate-900">{asText(selected.importJob.sourceType)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">matchStatus</dt>
                    <dd className="mt-1 text-slate-900">{asText(selected.matchStatus)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">matchReason</dt>
                    <dd className="mt-1 text-slate-900">{asText(selected.matchReason)}</dd>
                  </div>
                </dl>
              </section>
            </div>
          </aside>
        </div>
      ) : null}
    </main>
  );
}
