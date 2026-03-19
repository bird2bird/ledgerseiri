"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";
import { CrudPageShell } from "@/components/crud/CrudPageShell";
import { FilterBar, FilterInput, FilterSelect } from "@/components/crud/FilterBar";
import { DataTable, type DataTableColumn } from "@/components/crud/DataTable";
import { RowActions } from "@/components/crud/RowActions";
import { ImportButton } from "@/components/crud/ImportButton";
import { ExportButton } from "@/components/crud/ExportButton";
import { CreateEditDrawer } from "@/components/crud/CreateEditDrawer";
import { DeleteConfirmDialog } from "@/components/crud/DeleteConfirmDialog";

type ProductRow = {
  id: string;
  name: string;
  sku: string;
  store: string;
  status: string;
  storeId?: string | null;
};

type ProductsApiResponse = {
  ok: boolean;
  domain: string;
  action: string;
  items: ProductRow[];
  total?: number;
  message?: string;
};

type ProductsMetaResponse = {
  ok: boolean;
  domain: string;
  action?: string;
  stores?: Array<{ value: string; label: string }>;
  statuses?: Array<{ value: string; label: string }>;
  summary?: {
    total: number;
    active: number;
    inactive: number;
  };
  message?: string;
};

export default function Page() {
  const params = useParams<{ lang: string }>();
  const lang = normalizeLang(params?.lang) as Lang;
  void lang;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [rows, setRows] = useState<ProductRow[]>([]);
  const [meta, setMeta] = useState<ProductsMetaResponse | null>(null);
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
          fetch("/api/products", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }),
          fetch("/api/products/meta", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }),
        ]);

        if (!listRes.ok) {
          throw new Error(`products list request failed: ${listRes.status}`);
        }
        if (!metaRes.ok) {
          throw new Error(`products meta request failed: ${metaRes.status}`);
        }

        const listJson: ProductsApiResponse = await listRes.json();
        const metaJson: ProductsMetaResponse = await metaRes.json();

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
        (statusFilter === "active" && row.status === "販売中") ||
        (statusFilter === "inactive" && row.status === "停止中");

      return hitKeyword && hitStore && hitStatus;
    });
  }, [rows, keyword, storeFilter, statusFilter]);

  const columns: DataTableColumn<ProductRow>[] = [
    {
      key: "name",
      title: "商品名",
      render: (r) => <div className="font-medium text-slate-900">{r.name}</div>,
    },
    {
      key: "sku",
      title: "SKU",
      render: (r) => r.sku,
      className: "whitespace-nowrap",
    },
    {
      key: "store",
      title: "店舗",
      render: (r) => r.store,
    },
    {
      key: "status",
      title: "状態",
      render: (r) => r.status,
    },
    {
      key: "actions",
      title: "操作",
      render: () => (
        <RowActions
          onEdit={() => setDrawerOpen(true)}
          onDelete={() => setDeleteOpen(true)}
        />
      ),
      className: "whitespace-nowrap",
    },
  ];

  const storeOptions = meta?.stores ?? [{ value: "", label: "すべての店舗" }];
  const statusOptions =
    meta?.statuses ?? [
      { value: "", label: "すべての状態" },
      { value: "active", label: "販売中" },
      { value: "inactive", label: "停止中" },
    ];

  const description = error
    ? `商品マスタとSKUを管理します。 (${error})`
    : loading
    ? "商品マスタとSKUを管理します。読み込み中..."
    : `商品マスタとSKUを管理します。現在 ${filteredRows.length} 件表示`;

  return (
    <>
      <CrudPageShell
        title="商品一覧"
        description={description}
        actions={
          <>
            <ImportButton onClick={() => alert("Step43-D で接続します")} />
            <ExportButton onClick={() => alert("Step43-D で接続します")} />
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="ls-btn ls-btn-primary inline-flex px-4 py-2 text-sm font-semibold"
            >
              新規商品
            </button>
          </>
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
        <DataTable columns={columns} rows={filteredRows} rowKey={(r) => r.id} />
      </CrudPageShell>

      <CreateEditDrawer
        open={drawerOpen}
        title="商品作成 / 編集"
        onClose={() => setDrawerOpen(false)}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        title="商品を削除しますか？"
        description="商品マスタ削除は後続の在庫/分析に影響するため、Step43-C 以降で正式実装します。"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          setDeleteOpen(false);
          alert("Step43-C 以降で削除処理を接続します");
        }}
      />
    </>
  );
}
