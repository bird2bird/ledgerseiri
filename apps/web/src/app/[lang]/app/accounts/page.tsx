"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createAccount, listAccounts, updateAccount, type AccountItem } from "@/core/accounts/api";

const ACCOUNT_TYPE_ITEMS = ["BANK", "CASH", "EC_WALLET", "CARD", "OTHER"] as const;

export default function AccountsPage() {
  const [rows, setRows] = useState<AccountItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedRowId, setSelectedRowId] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createName, setCreateName] = useState("");
  const [createType, setCreateType] = useState<string>("BANK");
  const [createCurrency, setCreateCurrency] = useState("JPY");

  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("");
  const [editCurrency, setEditCurrency] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editMessage, setEditMessage] = useState("");

  const selectedRow = useMemo(
    () => rows.find((row) => row.id === selectedRowId) ?? null,
    [rows, selectedRowId]
  );

  async function loadRows() {
    setLoading(true);
    setError("");
    try {
      const res = await listAccounts();
      setRows(res.items ?? []);
    } catch (e: unknown) {
      setRows([]);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRows();
  }, []);

  useEffect(() => {
    if (!selectedRow) return;
    setEditName(selectedRow.name ?? "");
    setEditType(selectedRow.type ?? "BANK");
    setEditCurrency(selectedRow.currency ?? "JPY");
    setEditError("");
    setEditMessage("");
    setEditLoading(false);
  }, [selectedRow]);

  async function handleCreate() {
    setCreateError("");

    const name = createName.trim();
    if (!name) {
      setCreateError("口座名を入力してください。");
      return;
    }

    try {
      setCreateLoading(true);
      const res = await createAccount({
        name,
        type: createType,
        currency: createCurrency,
      });

      setCreateOpen(false);
      setCreateName("");
      setCreateType("BANK");
      setCreateCurrency("JPY");

      await loadRows();
      setSelectedRowId(res.item.id);
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleSaveEdit() {
    if (!selectedRow) {
      setEditError("編集対象が選択されていません。");
      return;
    }

    const name = editName.trim();
    if (!name) {
      setEditError("口座名を入力してください。");
      return;
    }

    try {
      setEditLoading(true);
      setEditError("");
      setEditMessage("");

      await updateAccount(selectedRow.id, {
        name,
        type: editType,
        currency: editCurrency,
      });

      await loadRows();
      setSelectedRowId(selectedRow.id);
      setEditMessage("保存しました。");
      setTimeout(() => setEditMessage(""), 2000);
    } catch (e: unknown) {
      setEditError(e instanceof Error ? e.message : String(e));
    } finally {
      setEditLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold text-slate-900">口座一覧</div>
            <div className="mt-2 text-sm text-slate-500">
              銀行口座・現金・ECウォレットなどの会計口座を一覧管理します。
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCreateOpen((v) => !v)}
            className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {createOpen ? "閉じる" : "新規口座"}
          </button>
        </div>
      </div>

      {createOpen ? (
        <div className="rounded-3xl border border-blue-100 bg-blue-50/60 p-6 shadow-sm">
          <div className="text-lg font-semibold text-slate-900">新規口座を作成</div>
          <div className="mt-1 text-sm text-slate-600">
            Accounts baseline API を使って新規口座を追加します。
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-1 text-sm font-medium text-slate-700">口座名</div>
              <input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="h-11 w-full rounded-[14px] border border-black/8 bg-white px-3 text-sm"
              />
            </div>

            <div>
              <div className="mb-1 text-sm font-medium text-slate-700">口座種別</div>
              <select
                value={createType}
                onChange={(e) => setCreateType(e.target.value)}
                className="h-11 w-full rounded-[14px] border border-black/8 bg-white px-3 text-sm"
              >
                {ACCOUNT_TYPE_ITEMS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="mb-1 text-sm font-medium text-slate-700">通貨</div>
              <input
                value={createCurrency}
                onChange={(e) => setCreateCurrency(e.target.value)}
                className="h-11 w-full rounded-[14px] border border-black/8 bg-white px-3 text-sm"
              />
            </div>
          </div>

          {createError ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {createError}
            </div>
          ) : null}

          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={createLoading}
              className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {createLoading ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-4">
          <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
            <div className="text-sm text-slate-500">Accounts</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">{rows.length}</div>
          </div>

          <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-900">Selected Account</div>
            {selectedRow ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Name</div>
                  <div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.name}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Type</div>
                  <div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.type}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Currency</div>
                  <div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.currency}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Created</div>
                  <div className="mt-1 text-sm font-medium text-slate-900">
                    {selectedRow.createdAt || "-"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-2 text-sm text-slate-500">
                口座を選択すると、ここに詳細が表示されます。
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold text-slate-900">Accounts</div>
          <div className="mt-1 text-sm text-slate-500">list → select → edit baseline</div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-[1.4fr_120px_100px] gap-4 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
              <div>Name</div>
              <div>Type</div>
              <div>Currency</div>
            </div>

            {loading ? (
              <div className="px-4 py-8 text-sm text-slate-500">loading...</div>
            ) : error ? (
              <div className="px-4 py-8 text-sm text-rose-600">{error}</div>
            ) : rows.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-500">no accounts</div>
            ) : (
              rows.map((row) => (
                <div
                  key={row.id}
                  onClick={() => setSelectedRowId(row.id)}
                  className={`grid cursor-pointer grid-cols-[1.4fr_120px_100px] gap-4 border-t border-slate-100 px-4 py-3 text-sm ${
                    selectedRowId === row.id
                      ? "bg-slate-50 ring-1 ring-inset ring-slate-300"
                      : ""
                  }`}
                >
                  <div className="font-medium text-slate-900">{row.name}</div>
                  <div className="text-slate-600">{row.type}</div>
                  <div className="text-slate-600">{row.currency}</div>
                </div>
              ))
            )}
          </div>

          {selectedRow ? (
            <div className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-medium text-slate-900">口座を編集</div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-1 text-sm font-medium text-slate-700">口座名</div>
                  <input
                    value={editName}
                    onChange={(e) => {
                      setEditName(e.target.value);
                      setEditError("");
                      setEditMessage("");
                    }}
                    className="h-11 w-full rounded-[14px] border border-black/8 bg-white px-3 text-sm"
                  />
                </div>

                <div>
                  <div className="mb-1 text-sm font-medium text-slate-700">口座種別</div>
                  <select
                    value={editType}
                    onChange={(e) => {
                      setEditType(e.target.value);
                      setEditError("");
                      setEditMessage("");
                    }}
                    className="h-11 w-full rounded-[14px] border border-black/8 bg-white px-3 text-sm"
                  >
                    {ACCOUNT_TYPE_ITEMS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="mb-1 text-sm font-medium text-slate-700">通貨</div>
                  <input
                    value={editCurrency}
                    onChange={(e) => {
                      setEditCurrency(e.target.value);
                      setEditError("");
                      setEditMessage("");
                    }}
                    className="h-11 w-full rounded-[14px] border border-black/8 bg-white px-3 text-sm"
                  />
                </div>
              </div>

              {editError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {editError}
                </div>
              ) : null}

              {editMessage ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {editMessage}
                </div>
              ) : null}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedRow) return;
                    setEditName(selectedRow.name ?? "");
                    setEditType(selectedRow.type ?? "BANK");
                    setEditCurrency(selectedRow.currency ?? "JPY");
                    setEditError("");
                    setEditMessage("");
                  }}
                  disabled={editLoading}
                  className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  リセット
                </button>

                <button
                  type="button"
                  onClick={() => void handleSaveEdit()}
                  disabled={editLoading}
                  className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {editLoading ? "保存中..." : "保存"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
