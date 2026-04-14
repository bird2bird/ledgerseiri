"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  clearAmazonStoreOrdersStage,
  createAmazonStoreOrdersImportJob,
  hasAmazonStoreOrdersStage,
  previewAmazonStoreOrdersCsv,
  saveAmazonStoreOrdersStage,
  type AmazonStoreOrdersPreviewResponse,
  type AmazonTransactionCharge
} from "@/core/jobs";
import { fmtDate } from "./jobs-shared";

function formatJPY(value: number) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function chargeKindLabel(kind?: string) {
  switch (String(kind || "")) {
    case "ORDER_SALE":
      return "注文売上";
    case "AD_FEE":
      return "広告費";
    case "STORAGE_FEE":
      return "倉庫費用";
    case "SUBSCRIPTION_FEE":
      return "月額登録料";
    case "FBA_FEE":
      return "FBA費用";
    case "TAX":
      return "税金";
    case "PAYOUT":
      return "振込";
    case "ADJUSTMENT":
      return "調整";
    default:
      return "その他";
  }
}

function sortCharges(items: AmazonTransactionCharge[]) {
  return [...items].sort(
    (a, b) => Math.abs(Number(b.signedAmount || 0)) - Math.abs(Number(a.signedAmount || 0))
  );
}

export function AmazonStoreOrdersImportCard(props: {
  lang: string;
  moduleHint?: string | null;
  onCreated?: () => void | Promise<void>;
}) {
  const { lang, moduleHint, onCreated } = props;

  const [filename, setFilename] = useState("amazon-store-orders.csv");
  const [csvText, setCsvText] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [preview, setPreview] = useState<AmazonStoreOrdersPreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [hasStage, setHasStage] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const emphasisText = useMemo(() => {
    if (moduleHint === "income") {
      return "收入模块から遷移したため、Amazon 店舗注文 CSV の preview / create を優先表示しています。";
    }
    return "Step105-C foundation: Amazon 店舗注文 CSV の preview / create を先に接続します。";
  }, [moduleHint]);

  useEffect(() => {
    setHasStage(hasAmazonStoreOrdersStage());
  }, []);

  async function handleFileChange(file: File | null) {
    if (!file) return;
    const text = await file.text();
    setFilename(file.name || "amazon-store-orders.csv");
    setSelectedFileName(file.name || "");
    setSelectedFileName(file.name || "");
    setCsvText(text);
    setError("");
    setMessage(`ファイルを読み込みました: ${file.name}`);
  }

  async function runPreview() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await previewAmazonStoreOrdersCsv({
        filename,
        csvText,
      });
      setPreview(res);
      saveAmazonStoreOrdersStage(res);
      setHasStage(true);
      setMessage("preview を更新し、store-orders 用 staging に保存しました。");
    } catch (err) {
      setPreview(null);
      setError(err instanceof Error ? err.message : "preview failed");
    } finally {
      setLoading(false);
    }
  }

  async function runCreate() {
    setCreating(true);
    setError("");
    setMessage("");

    try {
      const res = await createAmazonStoreOrdersImportJob({
        filename,
        csvText,
      });
      setPreview(res);
      saveAmazonStoreOrdersStage(res);
      setHasStage(true);
      setMessage(
        res.job
          ? `import job を作成し、store-orders 用 staging に保存しました: ${res.job.filename} / ${res.job.status}`
          : "import job を作成し、staging に保存しました。"
      );
      if (onCreated) {
        await onCreated();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "create failed");
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="ls-card-solid rounded-[28px] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">
            Amazon 店舗注文 CSV Foundation
          </div>
          <div className="mt-1 text-[12px] text-slate-500">
            {emphasisText}
          </div>
        </div>

        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600">
          domain = amazon-store-orders
        </div>
      </div>

      <div className="mt-5 rounded-[22px] border border-sky-200 bg-sky-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-slate-900">Store Orders Staging</div>
            <div className="mt-1 text-[12px] text-slate-600">
              Preview / Create 成功後、解析済み fact をブラウザ staging に保存し、
              store-orders ページで直接確認できます。
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/${lang}/app/income/store-orders`}
              className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              店舗注文ページで確認
            </Link>
            <Link
              href={`/${lang}/app/income/store-orders/charges`}
              className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              店舗運営費を確認
            </Link>
            <button
              type="button"
              onClick={() => {
                clearAmazonStoreOrdersStage();
                setHasStage(false);
                setMessage("staging をクリアしました。");
              }}
              className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              staging クリア
            </button>
          </div>
        </div>

        <div className="mt-3 text-xs text-slate-500">
          staging status: {hasStage ? "ready" : "empty"}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-medium text-slate-900">CSV Input</div>
            <div className="mt-2 text-[12px] text-slate-500">
              ファイル選択または CSV/TSV テキスト貼り付けで preview できます。
            </div>

            <div className="mt-4 space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.tsv,text/csv,text/plain"
                onChange={(e) => {
                  void handleFileChange(e.target.files?.[0] ?? null);
                }}
                className="hidden"
              />

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  ファイルを選択
                </button>

                <div className="text-sm text-slate-500">
                  {selectedFileName ? `選択済み: ${selectedFileName}` : "まだファイルは選択されていません"}
                </div>
              </div>

              <input
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="h-11 w-full rounded-[14px] border border-black/8 bg-white px-3 text-sm"
                placeholder="filename.csv"
              />

              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={12}
                className="w-full rounded-[14px] border border-black/8 bg-white px-3 py-3 text-sm"
                placeholder="Amazon 店舗注文 CSV をここに貼り付け"
              />

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void runPreview()}
                  disabled={loading || !csvText.trim()}
                  className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {loading ? "Preview 中..." : "Preview"}
                </button>

                <button
                  type="button"
                  onClick={() => void runCreate()}
                  disabled={creating || !csvText.trim()}
                  className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  {creating ? "Job 作成中..." : "Import Job 作成"}
                </button>
              </div>
            </div>
          </div>

          {error ? (
            <div className="rounded-[22px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {message ? (
            <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              {message}
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-medium text-slate-900">Preview Summary</div>

            {preview ? (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-[18px] bg-white p-3">
                  <div className="text-[11px] text-slate-500">Rows</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {preview.summary?.totalRows ?? 0}
                  </div>
                </div>
                <div className="rounded-[18px] bg-white p-3">
                  <div className="text-[11px] text-slate-500">Parsed Facts</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {preview.summary?.successRows ?? 0}
                  </div>
                </div>
                <div className="rounded-[18px] bg-white p-3">
                  <div className="text-[11px] text-slate-500">Failed Rows</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {preview.summary?.failedRows ?? 0}
                  </div>
                </div>
                <div className="rounded-[18px] bg-white p-3">
                  <div className="text-[11px] text-slate-500">Total Amount</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {formatJPY(preview.summary?.totalAmount ?? 0)}
                  </div>
                </div>
                <div className="rounded-[18px] bg-white p-3">
                  <div className="text-[11px] text-slate-500">Total Quantity</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {preview.summary?.totalQuantity ?? 0}
                  </div>
                </div>
                <div className="rounded-[18px] bg-white p-3">
                  <div className="text-[11px] text-slate-500">Delimiter</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {preview.summary?.delimiter ?? "-"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-[18px] border border-dashed border-slate-200 bg-white px-4 py-8 text-sm text-slate-500">
                まだ preview はありません。
              </div>
            )}
          </div>

          <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-medium text-slate-900">Transaction Classification Summary</div>

            {preview ? (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-[18px] bg-white p-3">
                  <div className="text-[11px] text-slate-500">注文売上</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {formatJPY(preview.chargeSummary?.orderSale ?? 0)}
                  </div>
                </div>
                <div className="rounded-[18px] bg-white p-3">
                  <div className="text-[11px] text-slate-500">広告費</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {formatJPY(preview.chargeSummary?.adFee ?? 0)}
                  </div>
                </div>
                <div className="rounded-[18px] bg-white p-3">
                  <div className="text-[11px] text-slate-500">月額登録料</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {formatJPY(preview.chargeSummary?.subscriptionFee ?? 0)}
                  </div>
                </div>
                <div className="rounded-[18px] bg-white p-3">
                  <div className="text-[11px] text-slate-500">倉庫費用</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {formatJPY(preview.chargeSummary?.storageFee ?? 0)}
                  </div>
                </div>
                <div className="rounded-[18px] bg-white p-3">
                  <div className="text-[11px] text-slate-500">FBA費用</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {formatJPY(preview.chargeSummary?.fbaFee ?? 0)}
                  </div>
                </div>
                <div className="rounded-[18px] bg-white p-3">
                  <div className="text-[11px] text-slate-500">税金</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {formatJPY(preview.chargeSummary?.tax ?? 0)}
                  </div>
                </div>
                <div className="rounded-[18px] bg-white p-3">
                  <div className="text-[11px] text-slate-500">振込</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {formatJPY(preview.chargeSummary?.payout ?? 0)}
                  </div>
                </div>
                <div className="rounded-[18px] bg-white p-3">
                  <div className="text-[11px] text-slate-500">調整</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {formatJPY(preview.chargeSummary?.adjustment ?? 0)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-[18px] border border-dashed border-slate-200 bg-white px-4 py-8 text-sm text-slate-500">
                まだ分類サマリーはありません。
              </div>
            )}
          </div>

          {preview?.job ? (
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-medium text-slate-900">Created Job</div>
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                <div>ID: {preview.job.id}</div>
                <div>Filename: {preview.job.filename || "-"}</div>
                <div>Status: {preview.job.status || "-"}</div>
                <div>Updated: {fmtDate(preview.job.updatedAt)}</div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {preview ? (
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div className="rounded-[18px] border border-slate-200 bg-white p-4">
            <div className="text-[11px] text-slate-500">広告費</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{formatJPY(preview.chargeSummary?.adFee ?? 0)}</div>
          </div>
          <div className="rounded-[18px] border border-slate-200 bg-white p-4">
            <div className="text-[11px] text-slate-500">倉庫 / 保管料</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{formatJPY(preview.chargeSummary?.storageFee ?? 0)}</div>
          </div>
          <div className="rounded-[18px] border border-slate-200 bg-white p-4">
            <div className="text-[11px] text-slate-500">月額 / 登録料</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{formatJPY(preview.chargeSummary?.subscriptionFee ?? 0)}</div>
          </div>
          <div className="rounded-[18px] border border-slate-200 bg-white p-4">
            <div className="text-[11px] text-slate-500">FBA / 販売手数料</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{formatJPY(preview.chargeSummary?.fbaFee ?? 0)}</div>
          </div>
          <div className="rounded-[18px] border border-slate-200 bg-white p-4">
            <div className="text-[11px] text-slate-500">税金</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{formatJPY(preview.chargeSummary?.tax ?? 0)}</div>
          </div>
          <div className="rounded-[18px] border border-slate-200 bg-white p-4">
            <div className="text-[11px] text-slate-500">振込 / 入金</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{formatJPY(preview.chargeSummary?.payout ?? 0)}</div>
          </div>
          <div className="rounded-[18px] border border-slate-200 bg-white p-4">
            <div className="text-[11px] text-slate-500">調整</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{formatJPY(preview.chargeSummary?.adjustment ?? 0)}</div>
          </div>
          <div className="rounded-[18px] border border-slate-200 bg-white p-4">
            <div className="text-[11px] text-slate-500">その他</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{formatJPY(preview.chargeSummary?.other ?? 0)}</div>
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-[22px] border border-slate-200 p-4">
          <div className="text-sm font-medium text-slate-900">Raw Rows Sample</div>
          {preview?.rawRows?.length ? (
            <div className="mt-3 overflow-auto rounded-[18px] border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 text-left">Row</th>
                    <th className="px-3 py-2 text-left">Fields</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rawRows.slice(0, 8).map((row) => (
                    <tr key={row.rowNo} className="border-t border-slate-100 align-top">
                      <td className="px-3 py-2 text-slate-700">{row.rowNo}</td>
                      <td className="px-3 py-2 text-slate-700">
                        <pre className="whitespace-pre-wrap break-all text-[11px]">
                          {JSON.stringify(row.fields, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-3 text-sm text-slate-500">no raw rows</div>
          )}
        </div>

        <div className="rounded-[22px] border border-slate-200 p-4">
          <div className="text-sm font-medium text-slate-900">Non-order Charges Sample</div>
          {preview?.charges?.length ? (
            <div className="mt-3 overflow-auto rounded-[18px] border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 text-left">Kind</th>
                    <th className="px-3 py-2 text-left">Type</th>
                    <th className="px-3 py-2 text-left">Description</th>
                    <th className="px-3 py-2 text-right">Signed</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.charges.slice(0, 12).map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="px-3 py-2 text-slate-700">{item.kind}</td>
                      <td className="px-3 py-2 text-slate-700">{item.transactionType || "-"}</td>
                      <td className="px-3 py-2 text-slate-700">{item.description || "-"}</td>
                      <td className="px-3 py-2 text-right text-slate-700">{formatJPY(item.signedAmount || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-3 text-sm text-slate-500">no charges</div>
          )}
        </div>

        <div className="rounded-[22px] border border-slate-200 p-4">
          <div className="text-sm font-medium text-slate-900">Normalized Facts Sample</div>
          {preview?.facts?.length ? (
            <div className="mt-3 overflow-auto rounded-[18px] border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 text-left">Order ID</th>
                    <th className="px-3 py-2 text-left">SKU</th>
                    <th className="px-3 py-2 text-left">Product</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.facts.slice(0, 8).map((fact, idx) => (
                    <tr key={`${fact.orderId}-${fact.sku}-${idx}`} className="border-t border-slate-100">
                      <td className="px-3 py-2 text-slate-700">{fact.orderId || "-"}</td>
                      <td className="px-3 py-2 text-slate-700">{fact.sku || "-"}</td>
                      <td className="px-3 py-2 text-slate-700">{fact.productName || "-"}</td>
                      <td className="px-3 py-2 text-right text-slate-700">{fact.quantity}</td>
                      <td className="px-3 py-2 text-right text-slate-700">{formatJPY(fact.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-3 text-sm text-slate-500">no facts</div>
          )}
        </div>
      </div>
      <div className="mt-5 rounded-[22px] border border-slate-200 p-4">
        <div className="text-sm font-medium text-slate-900">Transaction Charges Sample</div>
        {preview?.charges?.length ? (
          <div className="mt-3 overflow-auto rounded-[18px] border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2 text-left">Kind</th>
                  <th className="px-3 py-2 text-left">Type / Description</th>
                  <th className="px-3 py-2 text-left">Order ID</th>
                  <th className="px-3 py-2 text-left">SKU</th>
                  <th className="px-3 py-2 text-right">Signed Amount</th>
                </tr>
              </thead>
              <tbody>
                {sortCharges(preview.charges).slice(0, 20).map((charge, idx) => (
                  <tr key={`${charge.id}-${idx}`} className="border-t border-slate-100 align-top">
                    <td className="px-3 py-2 text-slate-700">{chargeKindLabel(charge.kind)}</td>
                    <td className="px-3 py-2 text-slate-700">
                      <div>{charge.transactionType || "-"}</div>
                      <div className="mt-1 text-xs text-slate-500">{charge.description || "-"}</div>
                    </td>
                    <td className="px-3 py-2 text-slate-700">{charge.orderId || "-"}</td>
                    <td className="px-3 py-2 text-slate-700">{charge.sku || "-"}</td>
                    <td className="px-3 py-2 text-right text-slate-700">{formatJPY(charge.signedAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-3 text-sm text-slate-500">no charges</div>
        )}
      </div>

    </section>
  );
}
