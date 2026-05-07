"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type AmazonSpApiSandboxImportJobReadModelFilter,
  type AmazonSpApiSandboxImportJobReadModelPageSize,
  type AmazonSpApiSandboxImportJobReadModelResult,
  type AmazonSpApiSandboxImportJobReadModelRow,
  type AmazonSpApiSandboxImportJobReadModelSort,
  fetchAmazonSpApiSandboxImportJobReadModel,
} from "@/lib/api/amazonSpApiSandboxImportJobReadModelClient";

type StatusPillProps = {
  label: string;
  tone: "blue" | "green" | "amber" | "red" | "gray";
};

function StatusPill({ label, tone }: StatusPillProps) {
  const toneClassName =
    tone === "blue"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : tone === "green"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : tone === "amber"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : tone === "red"
            ? "border-rose-200 bg-rose-50 text-rose-700"
            : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${toneClassName}`}>
      {label}
    </span>
  );
}

function rowStatusTone(row: AmazonSpApiSandboxImportJobReadModelRow): StatusPillProps["tone"] {
  if (row.classification.toLowerCase().includes("invalid")) return "red";
  if (row.displayStatus.toLowerCase().includes("pending")) return "amber";
  if (row.displayStatus.toLowerCase().includes("display")) return "green";
  return "blue";
}

function formatNullableDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function errorMessageFor(result: AmazonSpApiSandboxImportJobReadModelResult | null) {
  if (!result || result.ok) return null;

  if (result.kind === "unauthenticated") {
    return "ログインが必要です。再度ログインしてください。";
  }

  if (result.kind === "forbidden-or-tenant-suspended") {
    return "このデータを表示する権限がありません。";
  }

  if (result.kind === "invalid-query") {
    return "検索条件が正しくありません。フィルターまたはページサイズを確認してください。";
  }

  if (result.kind === "unsafe-response") {
    return "安全でないレスポンスを検出しました。表示を停止しました。";
  }

  return result.message || "予期しないエラーが発生しました。";
}

export function AmazonSpApiSandboxReadModelPanelShell() {
  const [filter, setFilter] = useState<AmazonSpApiSandboxImportJobReadModelFilter>("amazon-sp-api-sandbox");
  const [sort, setSort] = useState<AmazonSpApiSandboxImportJobReadModelSort>("createdAt_desc");
  const [pageSize, setPageSize] = useState<AmazonSpApiSandboxImportJobReadModelPageSize>(20);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<AmazonSpApiSandboxImportJobReadModelResult | null>(null);
  const [loading, setLoading] = useState(false);

  const rows = useMemo(() => (result?.ok ? result.rows : []), [result]);
  const totalPages = result?.ok ? result.totalPages : 1;
  const errorMessage = errorMessageFor(result);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const nextResult = await fetchAmazonSpApiSandboxImportJobReadModel({
        filter,
        sort,
        page,
        pageSize,
      });

      if (!cancelled) {
        setResult(nextResult);
        setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [filter, sort, page, pageSize]);

  return (
    <section
      data-step122-y="amazon-sp-api-sandbox-read-model-runtime-panel"
      data-step122-w="amazon-sp-api-sandbox-read-model-panel-shell"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900">Amazon SP-API サンドボックス取込プレビュー</h2>
            <StatusPill label="runtime integration" tone="blue" />
            <StatusPill label="dryRun=true" tone="blue" />
            <StatusPill label="displayOnly" tone="green" />
          </div>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            LedgerSeiri 内に保存済みの Amazon SP-API サンドボックス ImportJob を読取専用で表示します。売上計上・在庫反映・OAuth・実SP-API接続は無効です。
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-400"
          >
            売上計上は無効
          </button>
          <button
            type="button"
            disabled
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-400"
          >
            在庫反映は無効
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
        Amazon SP-API サンドボックスの読取専用プレビューです。ここではデータ取得は read-model に限定され、保存・売上計上・在庫反映は実行されません。
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <label className="space-y-1 text-xs font-medium text-slate-600">
          フィルター
          <select
            value={filter}
            onChange={(event) => {
              setPage(1);
              setFilter(event.target.value as AmazonSpApiSandboxImportJobReadModelFilter);
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="amazon-sp-api-sandbox">amazon-sp-api-sandbox</option>
            <option value="pending-review">pending-review</option>
            <option value="uncommitted-staging">uncommitted-staging</option>
            <option value="invalid-sp-api-sandbox">invalid-sp-api-sandbox</option>
            <option value="all">all</option>
          </select>
        </label>

        <label className="space-y-1 text-xs font-medium text-slate-600">
          並び順
          <select
            value={sort}
            onChange={(event) => {
              setPage(1);
              setSort(event.target.value as AmazonSpApiSandboxImportJobReadModelSort);
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="createdAt_desc">作成日 新しい順</option>
            <option value="createdAt_asc">作成日 古い順</option>
            <option value="filename_asc">ファイル名 A-Z</option>
            <option value="filename_desc">ファイル名 Z-A</option>
            <option value="totalRows_desc">行数 多い順</option>
            <option value="totalRows_asc">行数 少ない順</option>
          </select>
        </label>

        <label className="space-y-1 text-xs font-medium text-slate-600">
          表示件数
          <select
            value={pageSize}
            onChange={(event) => {
              setPage(1);
              setPageSize(Number(event.target.value) as AmazonSpApiSandboxImportJobReadModelPageSize);
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value={20}>20件</option>
            <option value={50}>50件</option>
            <option value={100}>100件</option>
          </select>
        </label>

        <div className="space-y-1 text-xs font-medium text-slate-600">
          状態
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {loading ? "読込中" : result?.ok ? "表示中" : errorMessage ? "エラー" : "待機中"}
          </div>
        </div>
      </div>

      {errorMessage ? (
        <div className="mt-5 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
        <div className="grid grid-cols-12 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500">
          <div className="col-span-4">ファイル</div>
          <div className="col-span-2">状態</div>
          <div className="col-span-2">行数</div>
          <div className="col-span-2">分類</div>
          <div className="col-span-2">作成日</div>
        </div>

        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">読込中です...</div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">対象データはありません。</div>
        ) : (
          rows.map((row) => (
            <div key={row.id} className="grid grid-cols-12 items-center border-b border-slate-100 px-4 py-3 text-sm last:border-b-0">
              <div className="col-span-4 truncate font-medium text-slate-800">{row.filename || "-"}</div>
              <div className="col-span-2">
                <StatusPill label={row.displayStatus || row.status} tone={rowStatusTone(row)} />
              </div>
              <div className="col-span-2 text-slate-600">{row.totalRows.toLocaleString("ja-JP")}</div>
              <div className="col-span-2 text-slate-600">{row.classification || "-"}</div>
              <div className="col-span-2 text-slate-500">{formatNullableDate(row.createdAt)}</div>
            </div>
          ))
        )}
      </div>

      <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-xs text-slate-500">
          {result?.ok ? `${result.totalRows.toLocaleString("ja-JP")}件 / ${result.totalPages.toLocaleString("ja-JP")}ページ` : "読取専用 runtime preview"}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={loading || page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 disabled:bg-slate-50 disabled:text-slate-300"
          >
            前へ
          </button>
          <button
            type="button"
            disabled={loading || page >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 disabled:bg-slate-50 disabled:text-slate-300"
          >
            次へ
          </button>
        </div>
      </div>
    </section>
  );
}

export default AmazonSpApiSandboxReadModelPanelShell;
