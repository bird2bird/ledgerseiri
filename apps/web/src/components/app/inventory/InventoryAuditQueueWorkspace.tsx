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

function asText(value: unknown, fallback = "-") {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
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
  const [skuDraft, setSkuDraft] = useState("");
  const [sku, setSku] = useState("");
  const [data, setData] = useState<AuditIssuesResponse | null>(null);
  const [selected, setSelected] = useState<AuditIssueItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(
    () =>
      buildQuery({
        status,
        sku,
        limit: "50",
        offset: "0",
      }),
    [status, sku],
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "監査キューの取得に失敗しました。");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const items = data?.items ?? [];
  const openIssues = data?.summary?.openIssues ?? 0;
  const totalIssues = data?.summary?.totalIssues ?? 0;

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
                この画面はStep110-V時点では読み取り専用です。
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                <div className="text-xs font-semibold text-amber-700">OPEN</div>
                <div className="mt-1 text-2xl font-bold text-amber-900">{formatNumber(openIssues)}</div>
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

          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:flex-row lg:items-end">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-500">ステータス</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="h-10 min-w-36 rounded-xl border border-slate-300 bg-white px-3 text-sm shadow-sm outline-none focus:border-slate-500"
              >
                <option value="OPEN">OPEN</option>
                <option value="ALL">ALL</option>
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
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-base font-bold text-slate-950">監査対象明細</h2>
              <p className="mt-1 text-xs text-slate-500">
                SKUマッピング未解決の取込行を確認できます。
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
                    <th className="px-5 py-3">理由</th>
                    <th className="px-5 py-3">注文ID</th>
                    <th className="px-5 py-3 text-right">数量</th>
                    <th className="px-5 py-3">取込ファイル</th>
                    <th className="px-5 py-3">取込日時</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-amber-50/60">
                      <td className="max-w-xs px-5 py-4">
                        <div className="font-semibold text-slate-950">{asText(item.audit.sku)}</div>
                        <div className="mt-1 truncate text-xs text-slate-500">
                          {asText(item.source.productName)}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                          {asText(item.audit.reason)}
                        </span>
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
                        {formatDateTime(item.importJob.importedAt)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelected(item)}
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
              <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <h4 className="text-sm font-bold text-amber-900">監査ステータス</h4>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs font-semibold text-amber-700">status</dt>
                    <dd className="mt-1 font-semibold text-amber-950">{asText(selected.audit.status)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-amber-700">severity</dt>
                    <dd className="mt-1 font-semibold text-amber-950">{asText(selected.audit.severity)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-amber-700">reason</dt>
                    <dd className="mt-1 font-semibold text-amber-950">{asText(selected.audit.reason)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-amber-700">code</dt>
                    <dd className="mt-1 font-semibold text-amber-950">{asText(selected.audit.code)}</dd>
                  </div>
                </dl>
              </section>

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

              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h4 className="text-sm font-bold text-slate-950">次の対応</h4>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Step110-Vでは読み取り専用です。次ステップでSKUマッピング作成、再処理、CLOSED化などの操作を追加します。
                </p>
              </section>
            </div>
          </aside>
        </div>
      ) : null}
    </main>
  );
}
