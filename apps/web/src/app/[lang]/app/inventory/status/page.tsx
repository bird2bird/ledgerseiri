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
  name: string;
  store: string;
  storeId?: string | null;
  quantity: number;
  reservedQty: number;
  availableQty: number;
  alertLevel: number;
  stockStatus: string;
  isActive: boolean;
  updatedAt: string;
};

type InventoryListResponse = {
  ok: boolean;
  domain: string;
  action: string;
  items: InventoryRow[];
  total?: number;
  message?: string;
};

type InventoryMetaResponse = {
  ok: boolean;
  domain: string;
  action?: string;
  stores?: Array<{ value: string; label: string }>;
  stockStatuses?: Array<{ value: string; label: string }>;
  summary?: {
    total: number;
    healthy: number;
    lowStock: number;
    outOfStock: number;
  };
  message?: string;
};

function toneClass(status: string) {
  switch (status) {
    case "欠品":
      return "inline-flex rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700";
    case "要補充":
      return "inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700";
    default:
      return "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700";
  }
}

export default function Page() {
  const params = useParams<{ lang: string }>();
  const lang = normalizeLang(params?.lang) as Lang;
  void lang;

  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [meta, setMeta] = useState<InventoryMetaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    let mounted = true;

    async function run() {
      setLoading(true);
      setError("");

      try {
        const [listRes, metaRes] = await Promise.all([
          fetch("/api/inventory/balances", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }),
          fetch("/api/inventory/balances/meta", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }),
        ]);

        if (!listRes.ok) {
          throw new Error(`inventory list request failed: ${listRes.status}`);
        }
        if (!metaRes.ok) {
          throw new Error(`inventory meta request failed: ${metaRes.status}`);
        }

        const listJson: InventoryListResponse = await listRes.json();
        const metaJson: InventoryMetaResponse = await metaRes.json();

        if (!mounted) return;
        setRows(Array.isArray(listJson.items) ? listJson.items : []);
        setMeta(metaJson);
      } catch (e: unknown) {
        if (!mounted) return;
        setRows([]);
        setMeta(null);
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredRows = useMemo(() => {
    const kw = keyword.trim().toLowerCase();

    return rows.filter((row) => {
      const hitKeyword =
        !kw ||
        row.name.toLowerCase().includes(kw) ||
        row.sku.toLowerCase().includes(kw);

      const hitStore =
        !storeFilter ||
        row.storeId === storeFilter ||
        row.store === storeFilter;

      const hitStatus =
        !statusFilter ||
        (statusFilter === "healthy" && row.stockStatus === "正常") ||
        (statusFilter === "low" && row.stockStatus === "要補充") ||
        (statusFilter === "out" && row.stockStatus === "欠品");

      return hitKeyword && hitStore && hitStatus;
    });
  }, [rows, keyword, storeFilter, statusFilter]);

  const columns: DataTableColumn<InventoryRow>[] = [
    {
      key: "sku",
      title: "SKU",
      render: (r) => <div className="font-medium text-slate-900">{r.sku}</div>,
      className: "whitespace-nowrap",
    },
    {
      key: "name",
      title: "商品名",
      render: (r) => r.name,
    },
    {
      key: "store",
      title: "店舗",
      render: (r) => r.store,
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
      title: "アラート閾値",
      render: (r) => String(r.alertLevel),
      className: "text-right whitespace-nowrap",
    },
    {
      key: "stockStatus",
      title: "状態",
      render: (r) => <span className={toneClass(r.stockStatus)}>{r.stockStatus}</span>,
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
    ];

  const description = error
    ? `商品別・店舗別の在庫状況を確認します。 (${error})`
    : loading
    ? "商品別・店舗別の在庫状況を確認します。読み込み中..."
    : `商品別・店舗別の在庫状況を確認します。現在 ${filteredRows.length} 件表示`;

  return (
    <CrudPageShell
      title="在庫状況"
      description={description}
      actions={
        <ExportButton onClick={() => alert("Step43-D で接続します")} />
      }
      filters={
        <FilterBar>
          <FilterInput
            placeholder="商品名 / SKU で検索"
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
      <div className="mb-4 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm text-slate-500">総SKU数</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {meta?.summary?.total ?? 0}
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-sm text-emerald-700">正常</div>
          <div className="mt-2 text-2xl font-semibold text-emerald-900">
            {meta?.summary?.healthy ?? 0}
          </div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-sm text-amber-700">要補充</div>
          <div className="mt-2 text-2xl font-semibold text-amber-900">
            {meta?.summary?.lowStock ?? 0}
          </div>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <div className="text-sm text-rose-700">欠品</div>
          <div className="mt-2 text-2xl font-semibold text-rose-900">
            {meta?.summary?.outOfStock ?? 0}
          </div>
        </div>
      </div>

      <DataTable columns={columns} rows={filteredRows} rowKey={(r) => r.id} />
    </CrudPageShell>
  );
}
