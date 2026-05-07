"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";

type StockStatus = "healthy" | "low" | "out" | "negative" | string;

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
  brand?: string | null;
  category?: string | null;
  store: string;
  storeId?: string | null;
  quantity: number;
  reservedQty: number;
  availableQty: number;
  alertLevel: number;
  stockStatus: StockStatus;
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

type InventorySummary = {
  total: number;
  healthy: number;
  lowStock: number;
  outOfStock: number;
  negativeStock?: number;
  totalQuantity?: number;
  totalAvailable?: number;
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

type InventoryMetaResponse = {
  ok: boolean;
  domain: string;
  action?: string;
  stores?: Array<{ value: string; label: string }>;
  stockStatuses?: Array<{ value: string; label: string }>;
  summary?: InventorySummary;
  message?: string;
};

type ManualAdjustmentResponse = {
  ok: boolean;
  domain: string;
  action: string;
  item?: {
    movementId: string;
    balanceId: string;
    skuId: string;
    skuCode: string;
    type: string;
    quantityDelta: number;
    quantity: number;
    reservedQty: number;
    availableQty: number;
    alertLevel: number;
    stockStatus: StockStatus;
    stockStatusLabel?: string;
    occurredAt: string;
    movement?: InventoryMovementRow;
  };
  message?: string;
};

type AdjustmentForm = {
  skuCode: string;
  type: "IN" | "OUT" | "ADJUST";
  quantity: string;
  occurredAt: string;
  memo: string;
};

function todayDateInputValue() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function asNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function formatNumber(value: unknown) {
  return asNumber(value).toLocaleString("ja-JP");
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

function formatDate(v?: string | null) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function statusRank(status: StockStatus) {
  if (status === "negative") return 0;
  if (status === "out") return 1;
  if (status === "low") return 2;
  return 3;
}

function statusTone(status: StockStatus) {
  switch (status) {
    case "negative":
    case "マイナス在庫":
      return {
        badge: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
        card: "border-fuchsia-200 bg-fuchsia-50",
        text: "text-fuchsia-800",
        label: "マイナス在庫",
      };
    case "out":
    case "欠品":
      return {
        badge: "border-rose-200 bg-rose-50 text-rose-700",
        card: "border-rose-200 bg-rose-50",
        text: "text-rose-800",
        label: "欠品",
      };
    case "low":
    case "要補充":
      return {
        badge: "border-amber-200 bg-amber-50 text-amber-700",
        card: "border-amber-200 bg-amber-50",
        text: "text-amber-800",
        label: "要補充",
      };
    default:
      return {
        badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
        card: "border-emerald-200 bg-emerald-50",
        text: "text-emerald-800",
        label: "正常",
      };
  }
}

function movementTone(type: string) {
  if (type === "IN") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (type === "OUT") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function buildAdjustmentForm(row?: InventoryRow | null): AdjustmentForm {
  return {
    skuCode: row?.skuCode || row?.sku || "",
    type: "ADJUST",
    quantity: "",
    occurredAt: todayDateInputValue(),
    memo: "",
  };
}

function riskCount(summary: InventorySummary) {
  return (summary.lowStock ?? 0) + (summary.outOfStock ?? 0) + (summary.negativeStock ?? 0);
}

// Step114-A-3: drawer guidance for risky inventory states.
function recommendedAction(row: InventoryRow | null) {
  if (!row) return null;

  if (row.stockStatus === "negative") {
    return {
      title: "マイナス在庫です",
      body: "Amazon注文・監査解決・手動調整の履歴を確認し、必要に応じて棚卸差分をADJUSTで補正してください。",
      tone: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-900",
    };
  }

  if (row.stockStatus === "out") {
    return {
      title: "欠品状態です",
      body: "販売継続前に入庫予定・FBA在庫・未反映の注文取込を確認してください。",
      tone: "border-rose-200 bg-rose-50 text-rose-900",
    };
  }

  if (row.stockStatus === "low") {
    return {
      title: "補充確認が必要です",
      body: "利用可能数が閾値以下です。補充計画またはalertLevelの妥当性を確認してください。",
      tone: "border-amber-200 bg-amber-50 text-amber-900",
    };
  }

  return null;
}

function movementImportCenterHref(lang: Lang, movement: InventoryMovementRow) {
  return movement.importJobId ? `/${lang}/app/data/import?importJobId=${encodeURIComponent(movement.importJobId)}` : "";
}

function movementAuditHref(lang: Lang, movement: InventoryMovementRow) {
  if (movement.sourceType !== "INVENTORY_AUDIT_RESOLUTION") return "";
  if (movement.importJobId) return `/${lang}/app/inventory/audit?importJobId=${encodeURIComponent(movement.importJobId)}`;
  return `/${lang}/app/inventory/audit`;
}

function movementTransactionHref(lang: Lang, movement: InventoryMovementRow) {
  return movement.transactionId ? `/${lang}/app/transactions?transactionId=${encodeURIComponent(movement.transactionId)}` : "";
}

// Step114-B-1: semantic trace labels for inventory movement source provenance.
function movementTraceKind(movement: InventoryMovementRow) {
  if (movement.sourceType === "INVENTORY_AUDIT_RESOLUTION") return "audit";
  if (movement.sourceType === "AMAZON_ORDER_IMPORT") return "amazon";
  if (movement.importJobId) return "import";
  if (movement.transactionId) return "transaction";
  if (movement.type === "ADJUST") return "manual";
  return "other";
}

function movementTraceLabel(movement: InventoryMovementRow) {
  const kind = movementTraceKind(movement);
  if (kind === "audit") return "在庫監査解決";
  if (kind === "amazon") return "Amazon注文取込";
  if (kind === "import") return "取込データ";
  if (kind === "transaction") return "取引連動";
  if (kind === "manual") return "手動調整";
  return movement.sourceType || "在庫移動";
}

function movementTraceTone(movement: InventoryMovementRow) {
  const kind = movementTraceKind(movement);
  if (kind === "audit") return "border-amber-200 bg-amber-50 text-amber-900";
  if (kind === "amazon") return "border-sky-200 bg-sky-50 text-sky-900";
  if (kind === "import") return "border-violet-200 bg-violet-50 text-violet-900";
  if (kind === "transaction") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (kind === "manual") return "border-slate-200 bg-slate-50 text-slate-900";
  return "border-slate-200 bg-white text-slate-900";
}

function movementTraceSummary(movement: InventoryMovementRow) {
  const parts = [
    movement.sourceType ? `sourceType=${movement.sourceType}` : null,
    movement.businessMonth ? `businessMonth=${movement.businessMonth}` : null,
    movement.sourceRowNo != null ? `row=${movement.sourceRowNo}` : null,
    movement.transactionId ? "transaction linked" : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" / ") : "追跡情報はmovement単体で記録されています。";
}

function applyManualAdjustmentResult(row: InventoryRow, result?: ManualAdjustmentResponse["item"]): InventoryRow {
  if (!result) return row;

  return {
    ...row,
    quantity: result.quantity,
    reservedQty: result.reservedQty,
    availableQty: result.availableQty,
    alertLevel: result.alertLevel,
    stockStatus: result.stockStatus,
    stockStatusLabel: result.stockStatusLabel ?? row.stockStatusLabel,
    updatedAt: result.occurredAt || row.updatedAt,
  };
}

// Step114-C-3: show the freshly created manual adjustment movement immediately in the drawer.
function buildManualAdjustmentMovement(row: InventoryRow, result?: ManualAdjustmentResponse["item"]): InventoryMovementRow | null {
  if (!result?.movement) return null;

  return {
    id: result.movement.id,
    skuId: row.skuId,
    sku: row.skuCode || row.sku,
    skuCode: row.skuCode || row.sku,
    productName: row.productName || row.name,
    storeId: row.storeId ?? null,
    store: row.store,
    type: result.movement.type,
    quantity: result.movement.quantity,
    occurredAt: result.movement.occurredAt,
    sourceType: result.movement.sourceType,
    sourceId: result.movement.sourceId,
    importJobId: result.movement.importJobId,
    sourceRowNo: result.movement.sourceRowNo,
    transactionId: result.movement.transactionId,
    businessMonth: result.movement.businessMonth,
    memo: result.movement.memo,
    createdAt: result.movement.createdAt,
  };
}

export default function Page() {
  const params = useParams<{ lang: string }>();
  const searchParams = useSearchParams();
  const lang = normalizeLang(params?.lang) as Lang;
  const initialSkuQuery = searchParams.get("sku")?.trim() ?? "";
  const initialImportJobIdQuery = searchParams.get("importJobId")?.trim() ?? "";

  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [movements, setMovements] = useState<InventoryMovementRow[]>([]);
  const [meta, setMeta] = useState<InventoryMetaResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [movementLoading, setMovementLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [movementError, setMovementError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const [keyword, setKeyword] = useState(initialSkuQuery);
  const [storeFilter, setStoreFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [selected, setSelected] = useState<InventoryRow | null>(null);
  const [form, setForm] = useState<AdjustmentForm>(buildAdjustmentForm(null));

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

      const nextRows = Array.isArray(listJson.items) ? listJson.items : [];
      setRows(nextRows);
      setMeta(metaJson);

      setSelected((current) => {
        if (!current) return current;
        const next = nextRows.find((row) => row.skuId === current.skuId || row.id === current.id);
        return next ?? current;
      });
    } catch (e: unknown) {
      setRows([]);
      setMeta(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function loadMovements(row?: InventoryRow | null) {
    const target = row ?? selected;
    setMovementLoading(true);
    setMovementError("");

    const qs = new URLSearchParams();
    qs.set("limit", "20");
    if (storeFilter) qs.set("storeId", storeFilter);
    if (target?.skuCode || target?.sku) qs.set("skuCode", target.skuCode || target.sku);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, storeFilter, statusFilter]);

  useEffect(() => {
    if (selected) {
      void loadMovements(selected);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.skuId, storeFilter]);

  const summary = meta?.summary ?? {
    total: 0,
    healthy: 0,
    lowStock: 0,
    outOfStock: 0,
    negativeStock: 0,
    totalQuantity: 0,
    totalAvailable: 0,
  };

  const storeOptions = meta?.stores ?? [{ value: "", label: "すべての店舗" }];
  const statusOptions =
    meta?.stockStatuses ?? [
      { value: "", label: "すべての状態" },
      { value: "healthy", label: "正常" },
      { value: "low", label: "要補充" },
      { value: "out", label: "欠品" },
      { value: "negative", label: "マイナス在庫" },
    ];

  const riskRows = useMemo(
    () =>
      [...rows]
        .filter((row) => row.stockStatus !== "healthy")
        .sort((a, b) => statusRank(a.stockStatus) - statusRank(b.stockStatus)),
    [rows],
  );

  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => statusRank(a.stockStatus) - statusRank(b.stockStatus)),
    [rows],
  );

  const selectedTone = selected ? statusTone(selected.stockStatus) : null;

  const selectedRecommendation = selected ? recommendedAction(selected) : null;

  function openDrawer(row: InventoryRow) {
    setSelected(row);
    setForm(buildAdjustmentForm(row));
    setSaveMessage("");
    setMovementError("");
    void loadMovements(row);
  }

  function closeDrawer() {
    setSelected(null);
    setMovements([]);
    setMovementError("");
    setSaveMessage("");
    setForm(buildAdjustmentForm(null));
  }

  async function submitAdjustment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaveMessage("");
    setError("");

    try {
      if (!form.memo.trim()) {
        throw new Error("手動在庫調整には理由・メモが必要です。");
      }

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

      const json: ManualAdjustmentResponse | null = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.message || `manual adjustment failed: ${res.status}`);
      }

      setSaveMessage("手動調整を保存しました。");
      setForm((prev) => ({ ...prev, quantity: "", memo: "" }));

      if (selected && json?.item) {
        const nextSelected = applyManualAdjustmentResult(selected, json.item);
        const nextMovement = buildManualAdjustmentMovement(nextSelected, json.item);

        setSelected(nextSelected);
        setRows((current) => current.map((row) => (row.skuId === nextSelected.skuId ? nextSelected : row)));

        if (nextMovement) {
          setMovements((current) => [nextMovement, ...current.filter((item) => item.id !== nextMovement.id)]);
        }

        await loadStocks();
        await loadMovements(nextSelected);
      } else {
        await loadStocks();
        await loadMovements(selected);
      }
    } catch (e: unknown) {
      setSaveMessage("");
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-bold text-sky-700">Inventory Status</div>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                在庫状況
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                SKU別・店舗別の在庫、引当、利用可能数を確認します。低在庫・欠品・マイナス在庫を優先表示し、行を選択すると移動履歴と手動調整を確認できます。
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => loadStocks()}
                disabled={loading}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
              >
                {loading ? "更新中..." : "再読込"}
              </button>
              <a
                href="/ja/app/inventory/audit"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-4 text-sm font-bold text-amber-800 shadow-sm hover:bg-amber-100"
              >
                在庫監査へ
              </a>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <KpiCard label="総SKU数" value={summary.total ?? 0} caption="在庫管理対象" tone="slate" />
            <KpiCard
              label="総在庫"
              value={summary.totalQuantity ?? 0}
              caption="Balance quantity"
              tone="sky"
            />
            <KpiCard
              label="利用可能"
              value={summary.totalAvailable ?? 0}
              caption="在庫 - 引当"
              tone="emerald"
            />
            <KpiCard
              label="リスクSKU"
              value={riskCount(summary)}
              caption="要補充・欠品・マイナス"
              tone="amber"
            />
            <KpiCard
              label="マイナス"
              value={summary.negativeStock ?? 0}
              caption="即時確認が必要"
              tone="fuchsia"
            />
          </div>
        </section>

        {initialSkuQuery || initialImportJobIdQuery ? (
          <section className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            <div className="font-black">Inventory reverse navigation</div>
            {initialSkuQuery ? (
              <div className="mt-1 font-mono text-xs">sku={initialSkuQuery}</div>
            ) : null}
            {initialImportJobIdQuery ? (
              <div className="mt-1 font-mono text-xs">importJobId={initialImportJobIdQuery}</div>
            ) : null}
            <div className="mt-2 text-xs font-semibold text-sky-700">
              Import Center / Inventory Audit から在庫状況へ遷移しました。SKU指定がある場合は検索条件に反映されます。
            </div>
          </section>
        ) : null}

        <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
            <label className="grid gap-1 text-sm font-bold text-slate-700">
              検索
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="商品名 / SKU / ASIN / External SKU"
                aria-label="Step114-B-3 SKU reverse navigation search"
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              />
            </label>

            <label className="grid gap-1 text-sm font-bold text-slate-700">
              店舗
              <select
                value={storeFilter}
                onChange={(e) => setStoreFilter(e.target.value)}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              >
                {storeOptions.map((opt) => (
                  <option key={`${opt.value}-${opt.label}`} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-sm font-bold text-slate-700">
              状態
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              >
                {statusOptions.map((opt) => (
                  <option key={`${opt.value}-${opt.label}`} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                Risk Priority
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                <span className="rounded-full border border-fuchsia-200 bg-fuchsia-50 px-3 py-1 text-fuchsia-700">
                  1. マイナス
                </span>
                <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-rose-700">
                  2. 欠品
                </span>
                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
                  3. 要補充
                </span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
                  4. 正常
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
                Attention
              </div>
              <div className="mt-2 text-sm font-bold text-amber-950">
                {riskRows.length > 0
                  ? `${riskRows.length} SKU に確認が必要です。`
                  : "現在、リスク在庫はありません。"}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-black text-slate-950">SKU在庫一覧</h2>
              <p className="mt-1 text-xs text-slate-500">
                {loading ? "読み込み中..." : `${sortedRows.length} 件表示。行をクリックして詳細を確認。`}
              </p>
            </div>
            <div className="text-xs font-semibold text-slate-500">
              API: /api/inventory/stocks
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">状態</th>
                  <th className="px-5 py-3">SKU / 商品</th>
                  <th className="px-5 py-3">店舗</th>
                  <th className="px-5 py-3 text-right">在庫</th>
                  <th className="px-5 py-3 text-right">引当</th>
                  <th className="px-5 py-3 text-right">利用可能</th>
                  <th className="px-5 py-3 text-right">閾値</th>
                  <th className="px-5 py-3">更新日</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-sm font-medium text-slate-500">
                      loading...
                    </td>
                  </tr>
                ) : sortedRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-sm font-medium text-slate-500">
                      条件に一致する在庫はありません。
                    </td>
                  </tr>
                ) : (
                  sortedRows.map((row) => {
                    const tone = statusTone(row.stockStatus);
                    return (
                      <tr
                        key={row.id}
                        onClick={() => openDrawer(row)}
                        className={`cursor-pointer transition hover:bg-sky-50/60 ${
                          selected?.skuId === row.skuId ? "bg-sky-50 ring-1 ring-inset ring-sky-200" : ""
                        }`}
                      >
                        <td className="whitespace-nowrap px-5 py-4">
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${tone.badge}`}>
                            {row.stockStatusLabel || tone.label}
                          </span>
                        </td>
                        <td className="min-w-[280px] px-5 py-4">
                          <div className="font-black text-slate-950">{row.skuCode || row.sku}</div>
                          <div className="mt-1 text-sm font-medium text-slate-700">{row.name}</div>
                          <div className="mt-1 text-xs text-slate-400">
                            {row.asin ? `ASIN: ${row.asin}` : row.externalSku ? `External: ${row.externalSku}` : "-"}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <div className="font-semibold text-slate-800">{row.store}</div>
                          <div className="mt-1 text-xs text-slate-400">{row.fulfillmentChannel || "FBA"}</div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right text-base font-black text-slate-950">
                          {formatNumber(row.quantity)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-slate-700">
                          {formatNumber(row.reservedQty)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right text-base font-black text-slate-950">
                          {formatNumber(row.availableQty)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-slate-700">
                          {formatNumber(row.alertLevel)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                          {formatDate(row.updatedAt)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="close inventory drawer backdrop"
            onClick={closeDrawer}
            className="absolute inset-0 bg-slate-950/30"
          />
          <aside className="relative h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">
                    SKU Detail
                  </div>
                  <h2 className="mt-1 text-xl font-black text-slate-950">
                    {selected.skuCode || selected.sku}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">{selected.name}</p>
                </div>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  閉じる
                </button>
              </div>
            </div>

            <div className="grid gap-5 p-6">
              <section className={`rounded-3xl border p-5 ${selectedTone?.card ?? "border-slate-200 bg-slate-50"}`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-sm font-bold text-slate-600">現在の在庫状態</div>
                    <div className={`mt-2 text-2xl font-black ${selectedTone?.text ?? "text-slate-950"}`}>
                      {selected.stockStatusLabel || selectedTone?.label || selected.stockStatus}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-right shadow-sm">
                    <div className="text-xs font-bold text-slate-500">利用可能</div>
                    <div className="mt-1 text-2xl font-black text-slate-950">
                      {formatNumber(selected.availableQty)}
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-4">
                  <Metric label="在庫" value={formatNumber(selected.quantity)} />
                  <Metric label="引当" value={formatNumber(selected.reservedQty)} />
                  <Metric label="閾値" value={formatNumber(selected.alertLevel)} />
                  <Metric label="更新" value={formatDate(selected.updatedAt)} />
                </div>
</section>

              {selectedRecommendation ? (
                <section className={`rounded-3xl border px-5 py-4 ${selectedRecommendation.tone}`}>
                  <div className="text-xs font-bold uppercase tracking-[0.18em] opacity-70">
                    Recommended Action
                  </div>
                  <div className="mt-2 text-base font-black">{selectedRecommendation.title}</div>
                  <p className="mt-1 text-sm leading-6 opacity-80">{selectedRecommendation.body}</p>
                </section>
              ) : null}

              {saveMessage ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                  {saveMessage}
                </div>
              ) : null}

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-base font-black text-slate-950">商品・店舗情報</div>
                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <Info label="Product" value={selected.productName || selected.name} />
                  <Info label="Store" value={selected.store} />
                  <Info label="ASIN" value={selected.asin || "-"} />
                  <Info label="External SKU" value={selected.externalSku || "-"} />
                  <Info label="Brand" value={selected.brand || "-"} />
                  <Info label="Category" value={selected.category || "-"} />
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-black text-slate-950">手動在庫調整</div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      必ず理由・メモを残し、InventoryMovement を作成してから InventoryBalance を更新します。
                    </p>
                  </div>
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                    Memo required
                  </span>
                </div>

                <form onSubmit={submitAdjustment} className="mt-4 grid gap-3">
                  <label className="grid gap-1 text-sm font-bold text-slate-700">
                    SKU
                    <input
                      value={form.skuCode}
                      onChange={(e) => setForm((prev) => ({ ...prev, skuCode: e.target.value }))}
                      className="h-11 rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                      required
                    />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-1 text-sm font-bold text-slate-700">
                      Type
                      <select
                        value={form.type}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            type: e.target.value as AdjustmentForm["type"],
                          }))
                        }
                        className="h-11 rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                      >
                        <option value="IN">IN / 入庫</option>
                        <option value="OUT">OUT / 出庫</option>
                        <option value="ADJUST">ADJUST / 調整</option>
                      </select>
                    </label>

                    <label className="grid gap-1 text-sm font-bold text-slate-700">
                      Quantity
                      <input
                        value={form.quantity}
                        onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
                        placeholder="例: 10"
                        className="h-11 rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                        required
                      />
                    </label>
                  </div>

                  <label className="grid gap-1 text-sm font-bold text-slate-700">
                    Date
                    <input
                      type="date"
                      value={form.occurredAt}
                      onChange={(e) => setForm((prev) => ({ ...prev, occurredAt: e.target.value }))}
                      className="h-11 rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                    />
                  </label>

                  <label className="grid gap-1 text-sm font-bold text-slate-700">
                    Memo <span className="text-xs font-semibold text-rose-600">必須</span>
                    <textarea
                      value={form.memo}
                      onChange={(e) => setForm((prev) => ({ ...prev, memo: e.target.value }))}
                      placeholder="棚卸、手動補正、破損、返品など"
                      className="min-h-24 rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                      required
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={saving}
                    className="h-11 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "保存中..." : "InventoryMovement を作成"}
                  </button>
                </form>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-black text-slate-950">最近の在庫移動</div>
                    <p className="mt-1 text-xs text-slate-500">
                      sourceType / sourceId / importJobId / transactionId から取込・監査・取引連動の経路を追跡します。
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadMovements(selected)}
                    disabled={movementLoading}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                  >
                    {movementLoading ? "更新中" : "更新"}
                  </button>
                </div>

                {movementError ? (
                  <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {movementError}
                  </div>
                ) : null}

                <div className="mt-4 grid gap-3">
                  {movementLoading ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-medium text-slate-500">
                      loading...
                    </div>
                  ) : movements.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-medium text-slate-500">
                      movement はありません。
                    </div>
                  ) : (
                    movements.map((movement) => (
                      <div key={movement.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${movementTone(movement.type)}`}>
                              {movement.type}
                            </span>
                            <div className="mt-2 text-sm font-bold text-slate-900">
                              {movement.sourceType || "MANUAL"}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-black text-slate-950">{formatNumber(movement.quantity)}</div>
                            <div className="mt-1 text-xs text-slate-500">{formatDateTime(movement.occurredAt)}</div>
                          </div>
                        </div>
                        <div className={`mt-3 rounded-2xl border px-4 py-3 ${movementTraceTone(movement)}`}>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="text-xs font-bold uppercase tracking-[0.18em] opacity-70">
                                Movement Trace
                              </div>
                              <div className="mt-1 text-sm font-black">{movementTraceLabel(movement)}</div>
                              <div className="mt-1 text-xs leading-5 opacity-80">
                                {movementTraceSummary(movement)}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs font-bold">
                              {movement.importJobId ? (
                                <a
                                  href={movementImportCenterHref(lang, movement)}
                                  className="rounded-full border border-white/70 bg-white/80 px-3 py-1 text-violet-700 shadow-sm hover:bg-white"
                                >
                                  Import Center
                                </a>
                              ) : null}
                              {movementAuditHref(lang, movement) ? (
                                <a
                                  href={movementAuditHref(lang, movement)}
                                  className="rounded-full border border-white/70 bg-white/80 px-3 py-1 text-amber-700 shadow-sm hover:bg-white"
                                >
                                  Inventory Audit
                                </a>
                              ) : null}
                              {movementTransactionHref(lang, movement) ? (
                                <a
                                  href={movementTransactionHref(lang, movement)}
                                  className="rounded-full border border-white/70 bg-white/80 px-3 py-1 text-emerald-700 shadow-sm hover:bg-white"
                                >
                                  Transaction
                                </a>
                              ) : null}
                            </div>
                          </div>

                          <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                            <TraceField label="sourceType" value={movement.sourceType || "-"} />
                            <TraceField label="sourceId" value={movement.sourceId || "-"} />
                            <TraceField label="importJobId" value={movement.importJobId || "-"} />
                            <TraceField label="transactionId" value={movement.transactionId || "-"} />
                            <TraceField label="businessMonth" value={movement.businessMonth || "-"} />
                            <TraceField label="sourceRowNo" value={movement.sourceRowNo != null ? String(movement.sourceRowNo) : "-"} />
                          </div>

                          {movement.memo ? (
                            <div className="mt-3 rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-xs leading-5 text-slate-700">
                              <div className="font-black text-slate-500">memo</div>
                              <div className="mt-1 break-all">{movement.memo}</div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function KpiCard({
  label,
  value,
  caption,
  tone,
}: {
  label: string;
  value: number;
  caption: string;
  tone: "slate" | "sky" | "emerald" | "amber" | "fuchsia";
}) {
  const toneClass =
    tone === "sky"
      ? "border-sky-200 bg-sky-50 text-sky-900"
      : tone === "emerald"
        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
        : tone === "amber"
          ? "border-amber-200 bg-amber-50 text-amber-900"
          : tone === "fuchsia"
            ? "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-900"
            : "border-slate-200 bg-slate-50 text-slate-900";

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <div className="text-sm font-bold opacity-80">{label}</div>
      <div className="mt-2 text-2xl font-black">{formatNumber(value)}</div>
      <div className="mt-1 text-xs font-semibold opacity-70">{caption}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white px-4 py-3 shadow-sm">
      <div className="text-xs font-bold text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-black text-slate-950">{value}</div>
    </div>
  );
}

function TraceField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/70 bg-white/80 px-3 py-2">
      <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 break-all font-mono text-[11px] font-bold text-slate-700">{value || "-"}</div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 break-all text-sm font-bold text-slate-900">{value || "-"}</div>
    </div>
  );
}
