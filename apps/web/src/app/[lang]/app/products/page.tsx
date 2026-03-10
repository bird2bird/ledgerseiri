"use client";

import React, { useMemo, useState } from "react";
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
};

export default function Page() {
  const params = useParams<{ lang: string }>();
  const lang = normalizeLang(params?.lang) as Lang;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const rows: ProductRow[] = useMemo(
    () => [
      {
        id: "prd-1",
        name: "KIMOCA Keyboard",
        sku: "KIMOCA-RK75",
        store: "Amazon JP",
        status: "販売中",
      },
      {
        id: "prd-2",
        name: "Portable Monitor 15.6",
        sku: "LOMBO-PM156",
        store: "Amazon JP",
        status: "販売中",
      },
    ],
    []
  );

  const columns: DataTableColumn<ProductRow>[] = [
    { key: "name", title: "商品名", render: (r) => <div className="font-medium text-slate-900">{r.name}</div> },
    { key: "sku", title: "SKU", render: (r) => r.sku, className: "whitespace-nowrap" },
    { key: "store", title: "店舗", render: (r) => r.store },
    { key: "status", title: "状態", render: (r) => r.status },
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

  return (
    <>
      <CrudPageShell
        title="商品一覧"
        description="商品マスタとSKUを管理します。"
        actions={
          <>
            <ImportButton onClick={() => alert("Step 33 で接続します")} />
            <ExportButton onClick={() => alert("Step 33 で接続します")} />
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
            <FilterInput placeholder="商品名 / SKU で検索" />
            <FilterSelect defaultValue="">
              <option value="">すべての店舗</option>
              <option value="amazon-jp">Amazon JP</option>
            </FilterSelect>
            <FilterSelect defaultValue="">
              <option value="">すべての状態</option>
              <option value="active">販売中</option>
              <option value="inactive">停止中</option>
            </FilterSelect>
          </FilterBar>
        }
      >
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />
      </CrudPageShell>

      <CreateEditDrawer
        open={drawerOpen}
        title="商品作成 / 編集"
        onClose={() => setDrawerOpen(false)}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        title="商品を削除しますか？"
        description="商品マスタ削除は後続の在庫/分析に影響するため、Step 32D で正式実装します。"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          setDeleteOpen(false);
          alert("Step 32D で削除処理を接続します");
        }}
      />
    </>
  );
}
