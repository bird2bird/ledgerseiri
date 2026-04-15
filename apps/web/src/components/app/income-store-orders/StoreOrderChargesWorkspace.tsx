"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { loadAmazonStoreOrdersStage } from "@/core/jobs";

type ChargeItem = {
  id: string;
  rowNo: number;
  occurredAt?: string | null;
  orderId?: string | null;
  sku?: string | null;
  transactionType: string;
  description: string;
  kind: string;
  signedAmount: number;
};

type ChargeSummary = {
  orderSale?: number;
  adFee: number;
  storageFee: number;
  subscriptionFee: number;
  fbaFee: number;
  tax: number;
  payout: number;
  adjustment: number;
  other: number;
};

type ChargeFilter =
  | "ALL"
  | "AD_FEE"
  | "STORAGE_FEE"
  | "SUBSCRIPTION_FEE"
  | "FBA_FEE"
  | "TAX"
  | "PAYOUT"
  | "ADJUSTMENT"
  | "OTHER"
  | "ORDER_SALE";

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

function parseChargeTimestamp(value?: string | null): number {
  const raw = String(value || "").trim();
  if (!raw) return 0;

  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) return direct.getTime();

  const normalized = raw.replace(/\s+JST$/i, "").trim();
  const m = normalized.match(
    /^(\d{4})\/(\d{1,2})\/(\d{1,2})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (!m) return 0;

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const hour = Number(m[4] || "0");
  const minute = Number(m[5] || "0");
  const second = Number(m[6] || "0");

  const date = new Date(year, month - 1, day, hour, minute, second);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function formatChargeDate(value?: string | null): string {
  const ts = parseChargeTimestamp(value);
  if (ts <= 0) return String(value || "-");
  return new Date(ts).toLocaleDateString("ja-JP");
}

function sortCharges(items: ChargeItem[]) {
  return [...items].sort((a, b) => {
    const dateDiff = parseChargeTimestamp(b.occurredAt) - parseChargeTimestamp(a.occurredAt);
    if (dateDiff !== 0) return dateDiff;
    const absDiff = Math.abs(Number(b.signedAmount || 0)) - Math.abs(Number(a.signedAmount || 0));
    if (absDiff !== 0) return absDiff;
    return String(a.id).localeCompare(String(b.id));
  });
}

function sumSignedAmount(items: ChargeItem[]) {
  return items.reduce((sum, item) => sum + Number(item.signedAmount || 0), 0);
}

function biggestCategory(summary: ChargeSummary) {
  const pairs = [
    { key: "AD_FEE", label: "広告費", value: Number(summary.adFee || 0) },
    { key: "STORAGE_FEE", label: "倉庫費用", value: Number(summary.storageFee || 0) },
    { key: "SUBSCRIPTION_FEE", label: "月額登録料", value: Number(summary.subscriptionFee || 0) },
    { key: "FBA_FEE", label: "FBA費用", value: Number(summary.fbaFee || 0) },
    { key: "TAX", label: "税金", value: Number(summary.tax || 0) },
    { key: "PAYOUT", label: "振込", value: Number(summary.payout || 0) },
    { key: "ADJUSTMENT", label: "調整", value: Number(summary.adjustment || 0) },
    { key: "OTHER", label: "その他", value: Number(summary.other || 0) },
  ];
  return pairs.sort((a, b) => Math.abs(b.value) - Math.abs(a.value))[0];
}

const EMPTY_SUMMARY: ChargeSummary = {
  orderSale: 0,
  adFee: 0,
  storageFee: 0,
  subscriptionFee: 0,
  fbaFee: 0,
  tax: 0,
  payout: 0,
  adjustment: 0,
  other: 0,
};

const FILTER_ITEMS: Array<{ value: ChargeFilter; label: string }> = [
  { value: "ALL", label: "全分類" },
  { value: "AD_FEE", label: "広告費" },
  { value: "SUBSCRIPTION_FEE", label: "月額登録料" },
  { value: "STORAGE_FEE", label: "倉庫費用" },
  { value: "FBA_FEE", label: "FBA費用" },
  { value: "TAX", label: "税金" },
  { value: "PAYOUT", label: "振込" },
  { value: "ADJUSTMENT", label: "調整" },
  { value: "OTHER", label: "その他" },
];

export function StoreOrderChargesWorkspace(props: { lang: string }) {
  const { lang } = props;

  const [charges, setCharges] = useState<ChargeItem[]>([]);
  const [summary, setSummary] = useState<ChargeSummary>(EMPTY_SUMMARY);
  const [selectedFilter, setSelectedFilter] = useState<ChargeFilter>("ALL");
  const [stageFilename, setStageFilename] = useState("");
  const [stageSavedAt, setStageSavedAt] = useState("");
  const [hasStage, setHasStage] = useState(false);

  useEffect(() => {
    const stage = loadAmazonStoreOrdersStage();
    setHasStage(!!stage);
    setCharges(Array.isArray(stage?.charges) ? stage!.charges : []);
    setSummary(stage?.chargeSummary ?? EMPTY_SUMMARY);
    setStageFilename(stage?.filename ?? "");
    setStageSavedAt(stage?.savedAt ?? "");
  }, []);

  const expenseOnlyCharges = useMemo(
    () => charges.filter((item) => item.kind !== "ORDER_SALE"),
    [charges]
  );

  const sortedCharges = useMemo(() => sortCharges(expenseOnlyCharges), [expenseOnlyCharges]);

  const filteredCharges = useMemo(() => {
    if (selectedFilter === "ALL") return sortedCharges;
    return sortedCharges.filter((item) => item.kind === selectedFilter);
  }, [sortedCharges, selectedFilter]);

  const visibleSignedAmount = useMemo(() => sumSignedAmount(filteredCharges), [filteredCharges]);
  const visibleAbsAmount = useMemo(
    () => filteredCharges.reduce((sum, item) => sum + Math.abs(Number(item.signedAmount || 0)), 0),
    [filteredCharges]
  );

  const biggest = useMemo(() => biggestCategory(summary), [summary]);

  const lastUpdatedText = useMemo(() => {
    if (!stageSavedAt) return "-";
    const d = new Date(stageSavedAt);
    if (Number.isNaN(d.getTime())) return stageSavedAt;
    return d.toLocaleString("ja-JP");
  }, [stageSavedAt]);

  const noPreviewYet = !hasStage;
  const hasPreviewButNoCharges = hasStage && expenseOnlyCharges.length === 0;

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold text-slate-900">店舗運営費（Amazon精算）</div>
            <div className="mt-2 text-sm text-slate-500">
              Amazon transaction CSV から分類した広告費、月額登録料、倉庫費用、FBA費用、税金、振込、調整を確認します。会計上は「支出 → 店舗運営費」として扱うビューです。
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/${lang}/app/expenses`}
              className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              支出 root へ戻る
            </Link>
            <Link
              href={`/${lang}/app/income/store-orders`}
              className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              店舗注文へ戻る
            </Link>
            <Link
              href={`/${lang}/app/data/import?module=income`}
              className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Import へ戻る
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Stage File</div>
            <div className="mt-2 text-sm font-semibold text-slate-900 break-all">
              {stageFilename || "まだ preview が保存されていません"}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Last Updated</div>
            <div className="mt-2 text-sm font-semibold text-slate-900">{lastUpdatedText}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Visible Rows</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{filteredCharges.length}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Current Filter</div>
            <div className="mt-2 text-sm font-semibold text-slate-900">
              {FILTER_ITEMS.find((x) => x.value === selectedFilter)?.label ?? "全分類"}
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">可視 Signed Total</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatJPY(visibleSignedAmount)}</div>
          <div className="mt-2 text-xs text-slate-500">符号付き合計（収入/支出差引）</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">可視 Absolute Total</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatJPY(visibleAbsAmount)}</div>
          <div className="mt-2 text-xs text-slate-500">金額絶対値ベースの規模</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">最大分類</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{biggest?.label ?? "-"}</div>
          <div className="mt-2 text-xs text-slate-500">{formatJPY(biggest?.value ?? 0)}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">振込</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatJPY(summary.payout)}</div>
          <div className="mt-2 text-xs text-slate-500">精算・入金の把握</div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">広告費</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatJPY(summary.adFee)}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">月額登録料</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatJPY(summary.subscriptionFee)}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">倉庫費用</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatJPY(summary.storageFee)}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">FBA費用</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatJPY(summary.fbaFee)}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">税金</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatJPY(summary.tax)}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">調整</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatJPY(summary.adjustment)}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">その他</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatJPY(summary.other)}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">注文売上（参考）</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatJPY(summary.orderSale ?? 0)}</div>
          <div className="mt-2 text-xs text-slate-500">同CSV内の売上分類</div>
        </div>
      </div>

      <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xl font-semibold text-slate-900">分類フィルター</div>
            <div className="mt-2 text-sm text-slate-500">
              店舗運営費ページ上で Amazon transaction charges を分類別に絞り込みます。
            </div>
          </div>
          <div className="text-sm text-slate-500">並び順: 日付降順 → 金額絶対値降順</div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {FILTER_ITEMS.map((item) => {
            const active = selectedFilter === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setSelectedFilter(item.value)}
                className={
                  active
                    ? "rounded-xl border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                    : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                }
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
        <div className="text-xl font-semibold text-slate-900">Charges Detail</div>
        <div className="mt-2 text-sm text-slate-500">
          transaction charges を日付降順で表示し、同日の中では金額の絶対値が大きい順に並べます。
        </div>

        {noPreviewYet ? (
          <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-10">
            <div className="text-lg font-semibold text-slate-900">まだ Amazon preview がありません</div>
            <div className="mt-2 text-sm text-slate-500">
              店舗運営費を表示するには、先に Amazon transaction CSV を preview し、stage に保存してください。
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={`/${lang}/app/data/import?module=income`}
                className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Import / CSV確認へ移動
              </Link>
              <Link
                href={`/${lang}/app/income/store-orders`}
                className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                店舗注文へ戻る
              </Link>
            </div>
          </div>
        ) : hasPreviewButNoCharges ? (
          <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-10">
            <div className="text-lg font-semibold text-slate-900">preview はありますが、charges データがありません</div>
            <div className="mt-2 text-sm text-slate-500">
              現在の stage には「非订单费用」charges が保存されていません。再度 preview を実行し、最新の Amazon charges / settlement を保存してください。
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={`/${lang}/app/data/import?module=income`}
                className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                再度 preview を実行
              </Link>
              <Link
                href={`/${lang}/app/expenses`}
                className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                支出 root へ戻る
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-100">
            <div className="grid grid-cols-[130px_140px_1.3fr_160px_150px_140px] gap-4 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
              <div>Date</div>
              <div>Kind</div>
              <div>Type / Description</div>
              <div>Order ID</div>
              <div>SKU</div>
              <div className="text-right">Signed Amount</div>
            </div>

            {filteredCharges.length === 0 ? (
              <div className="px-6 py-10 text-sm text-slate-500">
                現在のフィルター条件では表示対象がありません。別の分類を選択してください。
              </div>
            ) : (
              filteredCharges.map((charge) => (
                <div
                  key={charge.id}
                  className="grid grid-cols-[130px_140px_1.3fr_160px_150px_140px] gap-4 border-t border-slate-100 px-4 py-3 text-sm"
                >
                  <div className="text-slate-600">{formatChargeDate(charge.occurredAt)}</div>
                  <div className="text-slate-700">{chargeKindLabel(charge.kind)}</div>
                  <div>
                    <div className="font-medium text-slate-900">{charge.transactionType || "-"}</div>
                    <div className="mt-1 text-xs text-slate-500">{charge.description || "-"}</div>
                  </div>
                  <div className="text-slate-600">{charge.orderId || "-"}</div>
                  <div className="text-slate-600">{charge.sku || "-"}</div>
                  <div className="text-right font-medium text-slate-900">{formatJPY(charge.signedAmount)}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
