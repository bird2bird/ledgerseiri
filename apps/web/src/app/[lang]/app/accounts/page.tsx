"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CrudPageShell } from "@/components/crud/CrudPageShell";
import { FilterBar, FilterInput, FilterSelect } from "@/components/crud/FilterBar";
import { DataTable, type DataTableColumn } from "@/components/crud/DataTable";
import { RowActions } from "@/components/crud/RowActions";
import { ImportButton } from "@/components/crud/ImportButton";
import { ExportButton } from "@/components/crud/ExportButton";
import { CreateEditDrawer } from "@/components/crud/CreateEditDrawer";
import { DeleteConfirmDialog } from "@/components/crud/DeleteConfirmDialog";
import { ErrorState } from "@/components/crud/ErrorState";
import { EmptyState } from "@/components/crud/EmptyState";
import { createAccount, listAccounts, type AccountItem } from "@/core/funds/api";

function yen(v: number) {
  return `¥${v.toLocaleString("ja-JP")}`;
}

export default function Page() {
  const [rows, setRows] = useState<AccountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [name, setName] = useState("");
  const [type, setType] = useState("BANK");
  const [currency, setCurrency] = useState("JPY");
  const [openingBalance, setOpeningBalance] = useState("0");

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await listAccounts();
      setRows(data.items);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submitCreate() {
    try {
      await createAccount({
        name,
        type,
        currency,
        openingBalance: Number(openingBalance || 0),
      });
      setDrawerOpen(false);
      setName("");
      setType("BANK");
      setCurrency("JPY");
      setOpeningBalance("0");
      await load();
    } catch (e: any) {
      alert(e?.message ?? String(e));
    }
  }

  const columns: DataTableColumn<AccountItem>[] = useMemo(
    () => [
      {
        key: "name",
        title: "口座名",
        render: (r) => <div className="font-medium text-slate-900">{r.name}</div>,
      },
      { key: "type", title: "種別", render: (r) => r.type },
      { key: "currency", title: "通貨", render: (r) => r.currency },
      {
        key: "openingBalance",
        title: "開始残高",
        render: (r) => yen(r.openingBalance),
        className: "whitespace-nowrap",
      },
      {
        key: "store",
        title: "店舗",
        render: (r) => r.storeName ?? "-",
      },
      {
        key: "status",
        title: "状態",
        render: (r) => (r.isActive ? "有効" : "無効"),
      },
      {
        key: "actions",
        title: "操作",
        render: () => (
          <RowActions
            onEdit={() => alert("編集は Step 32A-2 以降で接続します")}
            onDelete={() => setDeleteOpen(true)}
          />
        ),
        className: "whitespace-nowrap",
      },
    ],
    []
  );

  return (
    <>
      <CrudPageShell
        title="口座一覧"
        description="銀行口座・現金・電子ウォレットを統一管理します。"
        actions={
          <>
            <ImportButton onClick={() => alert("Step 33 で接続します")} />
            <ExportButton onClick={() => alert("Step 33 で接続します")} />
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="ls-btn ls-btn-primary inline-flex px-4 py-2 text-sm font-semibold"
            >
              新規口座
            </button>
          </>
        }
        filters={
          <FilterBar>
            <FilterInput placeholder="口座名で検索（Step 32A-2 で接続）" />
            <FilterSelect defaultValue="">
              <option value="">すべての種別</option>
              <option value="BANK">BANK</option>
              <option value="CASH">CASH</option>
              <option value="EWALLET">EWALLET</option>
              <option value="PAYMENT_GATEWAY">PAYMENT_GATEWAY</option>
            </FilterSelect>
          </FilterBar>
        }
      >
        {error ? (
          <ErrorState description={error} />
        ) : loading ? (
          <div className="text-sm text-slate-500">読み込み中...</div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="口座がまだありません"
            description="最初の口座を作成してください。"
            action={
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="ls-btn ls-btn-primary inline-flex px-4 py-2 text-sm font-semibold"
              >
                口座を作成
              </button>
            }
          />
        ) : (
          <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />
        )}
      </CrudPageShell>

      <CreateEditDrawer open={drawerOpen} title="口座作成" onClose={() => setDrawerOpen(false)}>
        <div className="space-y-4">
          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">口座名</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 w-full rounded-[14px] border border-black/8 px-3 text-sm"
            />
          </div>

          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">種別</div>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="h-10 w-full rounded-[14px] border border-black/8 px-3 text-sm"
            >
              <option value="BANK">BANK</option>
              <option value="CASH">CASH</option>
              <option value="EWALLET">EWALLET</option>
              <option value="PAYMENT_GATEWAY">PAYMENT_GATEWAY</option>
              <option value="OTHER">OTHER</option>
            </select>
          </div>

          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">通貨</div>
            <input
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="h-10 w-full rounded-[14px] border border-black/8 px-3 text-sm"
            />
          </div>

          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">開始残高</div>
            <input
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              className="h-10 w-full rounded-[14px] border border-black/8 px-3 text-sm"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={submitCreate}
              className="ls-btn ls-btn-primary inline-flex px-4 py-2 text-sm font-semibold"
            >
              保存
            </button>
          </div>
        </div>
      </CreateEditDrawer>

      <DeleteConfirmDialog
        open={deleteOpen}
        description="削除 API は Step 32A-2 で接続します。"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          setDeleteOpen(false);
          alert("削除は Step 32A-2 で接続します");
        }}
      />
    </>
  );
}
