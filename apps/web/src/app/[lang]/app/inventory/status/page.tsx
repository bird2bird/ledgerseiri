"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";
import { CrudPageShell } from "@/components/crud/CrudPageShell";
import { FilterBar, FilterInput, FilterSelect } from "@/components/crud/FilterBar";
import { DataTable, type DataTableColumn } from "@/components/crud/DataTable";
import { ExportButton } from "@/components/crud/ExportButton";

type InventoryRow = {
  id: string;
  skuId: string;
  sku: string;
  skuCode?: string;
  asin?: string | null;
  externalSku?: string | null;
  fulfillmentChannel?: string | null;
  name: string;
  productName?: string | null;
  store: string;
  storeId?: string | null;
  quantity: number;
  reservedQty: number;
  availableQty: number;
  alertLevel: number;
  stockStatus: "healthy" | "low" | "out" | "negative" | string;
  stockStatusLabel?: string;
  isActive: boolean;
  updatedAt: string;
};

type InventoryMovementRow = {
  id: string;
  skuId: string;
  sku: string;
  skuCode?: string;
  productName?: string | null;
  storeId?: string | null;
  store?: string | null;
  type: "IN" | "OUT" | "ADJUST" | string;
  quantity: number;
  occurredAt: string;
  sourceType?: string | null;
  sourceId?: string | null;
  importJobId?: string | null;
  sourceRowNo?: number | null;
  transactionId?: string | null;
  businessMonth?: string | null;
  memo?: string | null;
  createdAt: string;
};

type InventoryListResponse = {
  ok: boolean;
  domain: string;
  action: string;
  items: InventoryRow[];
  total?: number;
  summary?: InventorySummary;
  message?: string;
};

type InventoryMovementResponse = {
  ok: boolean;
  domain: string;
  action: string;
  items: InventoryMovementRow[];
  total?: number;
  message?: string;
};

type InventorySummary = {
  total: number;
  healthy: number;
  lowStock: number;
  outOfStock: number;
  negativeStock?: number;
  totalQuantity?: number;
  totalAvailable?: number;
};

type InventoryMetaResponse = {
  ok: boolean;
  domain: string;
  action?: string;
  stores?: Array<{ value: string; label: string }>;
  stockStatuses?: Array<{ value: string; label: string }>;
  summary?: InventorySummary;
  message?: string;
};

type AdjustmentForm = {
  skuCode: string;
  type: "IN" | "OUT" | "ADJUST";
  quantity: string;
  occurredAt: string;
  memo: string;
};

function toneClass(status: string) {
  switch (status) {
    case "negative":
    case "マイナス在庫":
      return "inline-flex rounded-full border border-fuchsia-200 bg-fuchsia-50 px-2.5 py-1 text-xs font-medium text-fuchsia-700";
    case "out":
    case "欠品":
      return "inline-flex rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700";
    case "low":
    case "要補充":
      return "inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700";
    default:
      return "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700";
  }
}

function movementToneClass(type: string) {
  switch (type) {
    case "IN":
      return "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700";
    case "OUT":
      return "inline-flex rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700";
    default:
      return "inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700";
  }
}

function formatDateTime(v?: string | null) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function todayDateInputValue() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function Page() {
  const params = useParams<{ lang: string }>();
  const lang = normalizeLang(params?.lang) as Lang;
  void lang;

  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [movements, setMovements] = useState<InventoryMovementRow[]>([]);
  const [meta, setMeta] = useState<InventoryMetaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [movementLoading, setMovementLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [movementError, setMovementError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [keyword, setKeyword] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedSkuCode, setSelectedSkuCode] = useState("");
  const [form, setForm] = useState<AdjustmentForm>({
    skuCode: "",
    type: "ADJUST",
    quantity: "",
    occurredAt: todayDateInputValue(),
    memo: "",
  });

  async function loadStocks() {
    setLoading(true);
    setError("");

    const qs = new URLSearchParams();
    if (storeFilter) qs.set("storeId", storeFilter);
    if (statusFilter) qs.set("status", statusFilter);
    if (keyword.trim()) qs.set("q", keyword.trim());

    try {
      const [listRes, metaRes] = await Promise.all([
        fetch(`/api/inventory/stocks?${qs.toString()}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }),
        fetch("/api/inventory/meta", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }),
      ]);

      if (!listRes.ok) throw new Error(`inventory stocks request failed: ${listRes.status}`);
      if (!metaRes.ok) throw new Error(`inventory meta request failed: ${metaRes.status}`);

      const listJson: InventoryListResponse = await listRes.json();
      const metaJson: InventoryMetaResponse = await metaRes.json();

      setRows(Array.isArray(listJson.items) ? listJson.items : []);
      setMeta(metaJson);
    } catch (e: unknown) {
      setRows([]);
      setMeta(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function loadMovements(nextSkuCode = selectedSkuCode) {
    setMovementLoading(true);
    setMovementError("");

    const qs = new URLSearchParams();
    qs.set("limit", "20");
    if (storeFilter) qs.set("storeId", storeFilter);
    if (nextSkuCode.trim()) qs.set("skuCode", nextSkuCode.trim());

    try {
      const res = await fetch(`/api/inventory/movements?${qs.toString()}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) throw new Error(`inventory movements request failed: ${res.status}`);

      const json: InventoryMovementResponse = await res.json();
      setMovements(Array.isArray(json.items) ? json.items : []);
    } catch (e: unknown) {
      setMovements([]);
      setMovementError(e instanceof Error ? e.message : String(e));
    } finally {
      setMovementLoading(false);
    }
  }

  useEffect(() => {
    loadStocks();
  }, [keyword, storeFilter, statusFilter]);

  useEffect(() => {
    loadMovements();
  }, [storeFilter, selectedSkuCode]);

  const summary = meta?.summary ?? {
    total: 0,
    healthy: 0,
    lowStock: 0,
    outOfStock: 0,
    negativeStock: 0,
    totalQuantity: 0,
    totalAvailable: 0,
  };

  const columns: DataTableColumn<InventoryRow>[] = [
    {
      key: "sku",
      title: "SKU",
      render: (r) => (
        <button
          type="button"
          onClick={() => {
            const nextSku = r.skuCode || r.sku;
            setSelectedSkuCode(nextSku);
            setForm((prev) => ({ ...prev, skuCode: nextSku }));
          }}
          className="font-medium text-slate-900 underline-offset-2 hover:underline"
        >
          {r.skuCode || r.sku}
        </button>
      ),
      className: "whitespace-nowrap",
    },
    {
      key: "name",
      title: "商品名",
      render: (r) => (
        <div>
          <div className="font-medium text-slate-800">{r.name}</div>
          <div className="mt-1 text-xs text-slate-400">
            {r.asin ? `ASIN: ${r.asin}` : r.externalSku ? `External: ${r.externalSku}` : "-"}
          </div>
        </div>
      ),
    },
    {
      key: "store",
      title: "店舗",
      render: (r) => r.store,
    },
    {
      key: "fulfillmentChannel",
      title: "FC",
      render: (r) => r.fulfillmentChannel || "FBA",
      className: "whitespace-nowrap",
    },
    {
      key: "quantity",
      title: "在庫",
      render: (r) => String(r.quantity),
      className: "text-right whitespace-nowrap",
    },
    {
      key: "reservedQty",
      title: "引当",
      render: (r) => String(r.reservedQty),
      className: "text-right whitespace-nowrap",
    },
    {
      key: "availableQty",
      title: "利用可能",
      render: (r) => String(r.availableQty),
      className: "text-right whitespace-nowrap",
    },
    {
      key: "alertLevel",
      title: "閾値",
      render: (r) => String(r.alertLevel),
      className: "text-right whitespace-nowrap",
    },
    {
      key: "stockStatus",
      title: "状態",
      render: (r) => (
        <span className={toneClass(r.stockStatus)}>
          {r.stockStatusLabel || r.stockStatus}
        </span>
      ),
      className: "whitespace-nowrap",
    },
  ];

  const storeOptions = meta?.stores ?? [{ value: "", label: "すべての店舗" }];
  const statusOptions =
    meta?.stockStatuses ?? [
      { value: "", label: "すべての状態" },
      { value: "healthy", label: "正常" },
      { value: "low", label: "要補充" },
      { value: "out", label: "欠品" },
      { value: "negative", label: "マイナス在庫" },
    ];

  const description = error
    ? `商品別・店舗別の在庫状況を確認します。 (${error})`
    : loading
      ? "商品別・店舗別の在庫状況を確認します。読み込み中..."
      : `商品別・店舗別の在庫状況を確認します。現在 ${rows.length} 件表示`;

  async function submitAdjustment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaveMessage("");
    setError("");

    try {
      const res = await fetch("/api/inventory/manual-adjustments", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          skuCode: form.skuCode.trim(),
          type: form.type,
          quantity: form.quantity.trim(),
          occurredAt: form.occurredAt,
          memo: form.memo.trim() || undefined,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.message || `manual adjustment failed: ${res.status}`);
      }

      setSaveMessage("手動調整を保存しました。");
      setForm((prev) => ({ ...prev, quantity: "", memo: "" }));
      await Promise.all([loadStocks(), loadMovements(form.skuCode)]);
    } catch (e: unknown) {
      setSaveMessage("");
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <CrudPageShell
      title="在庫状況"
      description={description}
      actions={<ExportButton onClick={() => alert("Step110-H 以降で接続します")} />}
      filters={
        <FilterBar>
          <FilterInput
            placeholder="商品名 / SKU / ASIN で検索"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <FilterSelect value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)}>
            {storeOptions.map((opt) => (
              <option key={`${opt.value}-${opt.label}`} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {statusOptions.map((opt) => (
              <option key={`${opt.value}-${opt.label}`} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </FilterSelect>
        </FilterBar>
      }
    >
      <div className="mb-4 grid gap-4 md:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm text-slate-500">総SKU数</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{summary.total ?? 0}</div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-sm text-emerald-700">正常</div>
          <div className="mt-2 text-2xl font-semibold text-emerald-900">{summary.healthy ?? 0}</div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-sm text-amber-700">要補充</div>
          <div className="mt-2 text-2xl font-semibold text-amber-900">{summary.lowStock ?? 0}</div>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <div className="text-sm text-rose-700">欠品</div>
          <div className="mt-2 text-2xl font-semibold text-rose-900">{summary.outOfStock ?? 0}</div>
        </div>
        <div className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50 p-4">
          <div className="text-sm text-fuchsia-700">マイナス</div>
          <div className="mt-2 text-2xl font-semibold text-fuchsia-900">{summary.negativeStock ?? 0}</div>
        </div>
      </div>

      {saveMessage ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {saveMessage}
        </div>
      ) : null}

      <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <form
          onSubmit={submitAdjustment}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="text-lg font-semibold text-slate-900">手動在庫調整</div>
          <p className="mt-1 text-sm text-slate-500">
            InventoryMovement を作成してから InventoryBalance を更新します。
          </p>

          <div className="mt-4 grid gap-3">
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              SKU
              <input
                value={form.skuCode}
                onChange={(e) => setForm((prev) => ({ ...prev, skuCode: e.target.value }))}
                placeholder="SKUコード"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                required
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Type
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      type: e.target.value as AdjustmentForm["type"],
                    }))
                  }
                  className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                >
                  <option value="IN">IN / 入庫</option>
                  <option value="OUT">OUT / 出庫</option>
                  <option value="ADJUST">ADJUST / 調整</option>
                </select>
              </label>

              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Quantity
                <input
                  value={form.quantity}
                  onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
                  placeholder="例: 10"
                  className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                  required
                />
              </label>
            </div>

            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Date
              <input
                type="date"
                value={form.occurredAt}
                onChange={(e) => setForm((prev) => ({ ...prev, occurredAt: e.target.value }))}
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
              />
            </label>

            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Memo
              <textarea
                value={form.memo}
                onChange={(e) => setForm((prev) => ({ ...prev, memo: e.target.value }))}
                placeholder="棚卸、手動補正など"
                className="min-h-20 rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
              />
            </label>

            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "保存中..." : "在庫調整を保存"}
            </button>
          </div>
        </form>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-slate-900">在庫移動履歴</div>
              <p className="mt-1 text-sm text-slate-500">
                {selectedSkuCode ? `${selectedSkuCode} の最新履歴` : "最新20件を表示"}
              </p>
            </div>
            {selectedSkuCode ? (
              <button
                type="button"
                onClick={() => setSelectedSkuCode("")}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                選択解除
              </button>
            ) : null}
          </div>

          {movementError ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {movementError}
            </div>
          ) : null}

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-[90px_90px_1fr_120px] gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500">
              <div>Type</div>
              <div className="text-right">Qty</div>
              <div>Source / Memo</div>
              <div>Occurred</div>
            </div>

            {movementLoading ? (
              <div className="px-4 py-8 text-sm text-slate-500">loading...</div>
            ) : movements.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-500">no movements</div>
            ) : (
              movements.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[90px_90px_1fr_120px] gap-3 border-t border-slate-100 px-4 py-3 text-sm"
                >
                  <div>
                    <span className={movementToneClass(row.type)}>{row.type}</span>
                  </div>
                  <div className="text-right font-semibold text-slate-900">{row.quantity}</div>
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-800">
                      {row.skuCode || row.sku} / {row.sourceType || "MANUAL"}
                    </div>
                    <div className="mt-1 truncate text-xs text-slate-400">
                      {row.memo || row.importJobId || row.transactionId || "-"}
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">{formatDateTime(row.occurredAt)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </CrudPageShell>
  );
}
