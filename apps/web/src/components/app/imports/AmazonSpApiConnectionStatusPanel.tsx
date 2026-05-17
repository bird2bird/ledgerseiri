"use client";

import React from "react";
import {
  AMAZON_SP_API_DEFAULT_MARKETPLACE_ID,
  AMAZON_SP_API_DEFAULT_REGION,
  AMAZON_SP_API_DEFAULT_STORE_ID,
  commitAmazonSpApiOrdersRealImportJob,
  previewAmazonSpApiOrdersReal,
  previewAmazonSpApiOrdersHistoricalSyncPlan,
  readAmazonSpApiConnectionStatus,
  requestAmazonSpApiAuthorizationUrl,
  type AmazonSpApiAuthorizationUrlResponse,
  type AmazonSpApiConnectionStatusResponse,
  type AmazonSpApiOrdersRealImportJobCommitResponse,
  type AmazonSpApiOrdersRealPreviewResponse,
  type AmazonSpApiOrdersHistoricalSyncPlanPreviewResponse,
} from "@/core/imports/api";

type PanelStatus =
  | "not_connected"
  | "checking"
  | "connecting"
  | "authorization_ready"
  | "connected"
  | "connected_hint"
  | "reconnect_required"
  | "error";

type LastAuthorizationState = {
  authorizationUrl?: string;
  stateExpiresAt?: string;
  marketplaceId?: string;
  region?: string;
  storeId?: string;
  sandbox?: boolean;
};

type BackendStatusDetail = AmazonSpApiConnectionStatusResponse | null;

type OrderPullStepStatus = "idle" | "loading" | "success" | "error";

type HistoricalSyncPlanPreviewStatus = "idle" | "loading" | "success" | "error";


type AmazonOrdersPullRangePreset = "7D" | "14D" | "30D" | "THIS_MONTH" | "LAST_MONTH" | "CUSTOM";

const AMAZON_ORDER_PULL_RANGE_PRESETS: Array<{ value: AmazonOrdersPullRangePreset; label: string }> = [
  { value: "7D", label: "最近7日" },
  { value: "14D", label: "最近14日" },
  { value: "30D", label: "最近30日" },
  { value: "THIS_MONTH", label: "今月" },
  { value: "LAST_MONTH", label: "先月" },
  { value: "CUSTOM", label: "カスタム期間" },
];

type AmazonOrdersPullWindow = {
  createdAfter: string;
  createdBefore: string;
  startDate: string;
  endDate: string;
  days?: number;
  rangeMode: AmazonOrdersPullRangePreset;
};

function padAmazonOrderDatePart(value: number): string {
  return String(value).padStart(2, "0");
}

function toAmazonOrderDateInputValue(date: Date): string {
  return [
    date.getFullYear(),
    padAmazonOrderDatePart(date.getMonth() + 1),
    padAmazonOrderDatePart(date.getDate()),
  ].join("-");
}

function parseAmazonOrderDateInputValue(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map((part) => Number(part));
  const parsed = new Date(year, month - 1, day);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function addAmazonOrderDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function buildAmazonOrderPullWindowFromDateInputs(
  startDate: string,
  endDate: string,
  rangeMode: AmazonOrdersPullRangePreset,
  days?: number,
): AmazonOrdersPullWindow {
  return {
    startDate,
    endDate,
    createdAfter: `${startDate}T00:00:00.000Z`,
    createdBefore: `${endDate}T23:59:59.999Z`,
    days,
    rangeMode,
  };
}

function buildAmazonOrderPullWindowFromPreset(
  preset: AmazonOrdersPullRangePreset,
  customStartDate: string,
  customEndDate: string,
  now = new Date(),
): AmazonOrdersPullWindow {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (preset === "CUSTOM") {
    const start = parseAmazonOrderDateInputValue(customStartDate);
    const end = parseAmazonOrderDateInputValue(customEndDate);
    if (start && end && start.getTime() <= end.getTime()) {
      return buildAmazonOrderPullWindowFromDateInputs(customStartDate, customEndDate, preset);
    }
    return buildAmazonOrderPullWindowFromDateInputs(
      toAmazonOrderDateInputValue(addAmazonOrderDays(today, -13)),
      toAmazonOrderDateInputValue(today),
      "14D",
      14,
    );
  }

  if (preset === "THIS_MONTH") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return buildAmazonOrderPullWindowFromDateInputs(
      toAmazonOrderDateInputValue(start),
      toAmazonOrderDateInputValue(today),
      preset,
    );
  }

  if (preset === "LAST_MONTH") {
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const end = new Date(today.getFullYear(), today.getMonth(), 0);
    return buildAmazonOrderPullWindowFromDateInputs(
      toAmazonOrderDateInputValue(start),
      toAmazonOrderDateInputValue(end),
      preset,
    );
  }

  const days = preset === "7D" ? 7 : preset === "30D" ? 30 : 14;
  const start = addAmazonOrderDays(today, -(days - 1));
  return buildAmazonOrderPullWindowFromDateInputs(
    toAmazonOrderDateInputValue(start),
    toAmazonOrderDateInputValue(today),
    preset,
    days,
  );
}

function buildDefaultAmazonOrderPullWindow() {
  const createdBefore = new Date();
  const createdAfter = new Date(createdBefore.getTime() - 14 * 24 * 60 * 60 * 1000);

  return {
    createdAfter: createdAfter.toISOString(),
    createdBefore: createdBefore.toISOString(),
  };
}

function getOrderPullStatusClass(status: OrderPullStepStatus) {
  if (status === "success") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "error") return "border-rose-200 bg-rose-50 text-rose-700";
  if (status === "loading") return "border-violet-200 bg-violet-50 text-violet-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function getHistoricalSyncPlanStatusClass(status: HistoricalSyncPlanPreviewStatus) {
  if (status === "success") return "border-indigo-200 bg-indigo-50 text-indigo-700";
  if (status === "error") return "border-rose-200 bg-rose-50 text-rose-700";
  if (status === "loading") return "border-violet-200 bg-violet-50 text-violet-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function getHistoricalSyncPlanStatusLabel(status: HistoricalSyncPlanPreviewStatus) {
  if (status === "loading") return "計画作成中";
  if (status === "success") return "計画プレビュー済み";
  if (status === "error") return "計画エラー";
  return "未作成";
}

function formatOrderPullWindow(value: string) {
  try {
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatNullableDateTime(value?: string | null) {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatBooleanJa(value?: boolean | null) {
  if (value === true) return "はい";
  if (value === false) return "いいえ";
  return "—";
}

function getReadModelStatusLabel(value?: string | null) {
  if (value === "connected") return "connected";
  if (value === "needs_reauth") return "needs_reauth";
  if (value === "error") return "error";
  if (value === "disconnected") return "disconnected";
  return value || "—";
}

// Step139-Z4-FRONTEND-AMAZON-SP-API-STATUS-PANEL-CLOSEOUT:
// Step139-Z3-FRONTEND-AMAZON-SP-API-STATUS-READ-MODEL-RENDER:
// Keep Y3 real DB read-model details in the panel state and render sanitized fields only.
// Never display encrypted/raw token values.
function buildBackendStatusRows(data: BackendStatusDetail) {
  return [
    { label: "読取モード", value: data?.readModelMode || "—" },
    { label: "DB状態", value: getReadModelStatusLabel(data?.readModelStatus) },
    { label: "認証情報", value: formatBooleanJa(data?.credentialPresent) },
    { label: "一時トークン", value: formatBooleanJa(data?.accessTokenCachePresent) },
    { label: "一時トークン期限切れ", value: formatBooleanJa(data?.accessTokenExpired) },
    { label: "一時トークン期限", value: formatNullableDateTime(data?.accessTokenExpiresAt) },
    { label: "認証情報更新日時", value: formatNullableDateTime(data?.credentialRotatedAt) },
    { label: "認証情報失効日時", value: formatNullableDateTime(data?.credentialRevokedAt) },
    { label: "最終同期日時", value: formatNullableDateTime(data?.lastSyncAt) },
    { label: "最終エラーコード", value: data?.lastErrorCode || "—" },
  ];
}

function getReturnToPath() {
  if (typeof window === "undefined") return "/ja/app/data/import";
  return `${window.location.pathname}${window.location.search || ""}`;
}

function getCallbackHintStatus(): PanelStatus {
  if (typeof window === "undefined") return "not_connected";

  const params = new URLSearchParams(window.location.search);
  const status = params.get("status") || params.get("amazonSpApiStatus") || params.get("amazonSpApi");

  if (
    status === "token_persistence_completed" ||
    status === "connected" ||
    status === "success"
  ) {
    return "connected_hint";
  }

  return "not_connected";
}

function getStatusLabel(status: PanelStatus) {
  if (status === "checking") return "接続状態を確認中";
  if (status === "connecting") return "接続URLを準備中";
  if (status === "authorization_ready") return "Amazon認可URLを発行済み";
  if (status === "connected") return "接続済み";
  if (status === "connected_hint") return "接続完了の可能性あり";
  if (status === "reconnect_required") return "再接続が必要";
  if (status === "error") return "接続エラー";
  return "未接続";
}

function getStatusClass(status: PanelStatus) {
  if (status === "authorization_ready") return "border-sky-200 bg-sky-50 text-sky-700";
  if (status === "connected" || status === "connected_hint") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "reconnect_required") return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "error") return "border-rose-200 bg-rose-50 text-rose-700";
  if (status === "checking" || status === "connecting") return "border-violet-200 bg-violet-50 text-violet-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function summarizeAuthorization(data?: AmazonSpApiAuthorizationUrlResponse | null): LastAuthorizationState | null {
  if (!data || !data.authorizationUrl) return null;

  return {
    authorizationUrl: data.authorizationUrl,
    stateExpiresAt: data.stateExpiresAt,
    marketplaceId: data.marketplaceId || data.sanitizedResult?.marketplaceId,
    region: data.region || data.sanitizedResult?.region,
    storeId: data.storeId || data.sanitizedResult?.storeId,
    sandbox: data.sandbox,
  };
}

// Step134-B-FRONTEND-AMAZON-SP-API-STATUS-READ:
// Backend status has priority over callback URL hint once the endpoint responds.
function normalizeBackendStatus(data?: AmazonSpApiConnectionStatusResponse | null): PanelStatus {
  const rawStatus = String(
    data?.status || data?.sanitizedResult?.status || ""
  ).toUpperCase();
  const readModelStatus = String(
    data?.readModelStatus || data?.sanitizedResult?.readModelStatus || ""
  ).toLowerCase();

  if (
    rawStatus === "CONNECTED" ||
    readModelStatus === "connected" ||
    data?.connected ||
    data?.sanitizedResult?.connected
  ) {
    return "connected";
  }

  if (
    rawStatus === "RECONNECT_REQUIRED" ||
    readModelStatus === "needs_reauth" ||
    data?.needsReconnect ||
    data?.reconnectRequired ||
    data?.sanitizedResult?.reconnectRequired
  ) {
    return "reconnect_required";
  }

  if (rawStatus === "ERROR" || readModelStatus === "error") {
    return "error";
  }

  return "not_connected";
}

function buildBackendStatusMessage(
  data: AmazonSpApiConnectionStatusResponse | null,
  panelStatus: PanelStatus
) {
  const backendMessage = data?.messageRedacted || data?.message;

  if (backendMessage) return backendMessage;
  if (data?.lastErrorMessageRedacted) return data.lastErrorMessageRedacted;
  if (data?.lastErrorCode) return `Amazon SP-API の接続状態にエラーがあります: ${data.lastErrorCode}`;
  if (panelStatus === "connected") return "Amazon SP-API の接続状態を確認しました。";
  if (panelStatus === "reconnect_required") return "Amazon SP-API の再接続が必要です。";
  if (panelStatus === "error") return "Amazon SP-API の接続状態を確認できませんでした。";
  return "Amazon SP-API は未接続です。";
}


export function AmazonSpApiConnectionStatusPanel() {
  const [status, setStatus] = React.useState<PanelStatus>("not_connected");
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [backendStatusDetail, setBackendStatusDetail] = React.useState<BackendStatusDetail>(null);
  const [lastAuthorization, setLastAuthorization] = React.useState<LastAuthorizationState | null>(null);

  const [orderPullStatus, setOrderPullStatus] = React.useState<OrderPullStepStatus>("idle");
  const [orderPullMessage, setOrderPullMessage] = React.useState("");
  const [orderPreview, setOrderPreview] = React.useState<AmazonSpApiOrdersRealPreviewResponse | null>(null);
  const [orderImportJob, setOrderImportJob] =
    React.useState<AmazonSpApiOrdersRealImportJobCommitResponse | null>(null);
  const [historicalSyncPlanStatus, setHistoricalSyncPlanStatus] =
    React.useState<HistoricalSyncPlanPreviewStatus>("idle");
  const [historicalSyncPlanMessage, setHistoricalSyncPlanMessage] = React.useState("");
  const [historicalSyncPlanPreview, setHistoricalSyncPlanPreview] =
    React.useState<AmazonSpApiOrdersHistoricalSyncPlanPreviewResponse | null>(null);
  const [orderPullRangePreset, setOrderPullRangePreset] = React.useState<AmazonOrdersPullRangePreset>("14D");
  const defaultOrderPullWindow = React.useMemo(() => buildDefaultAmazonOrderPullWindow(), []);
  const [customOrderPullStartDate, setCustomOrderPullStartDate] = React.useState(() =>
    defaultOrderPullWindow.createdAfter.slice(0, 10),
  );
  const [customOrderPullEndDate, setCustomOrderPullEndDate] = React.useState(() =>
    defaultOrderPullWindow.createdBefore.slice(0, 10),
  );
  const orderPullWindow = React.useMemo(
    () => buildAmazonOrderPullWindowFromPreset(orderPullRangePreset, customOrderPullStartDate, customOrderPullEndDate),
    [customOrderPullEndDate, customOrderPullStartDate, orderPullRangePreset],
  );

  React.useEffect(() => {
    let cancelled = false;

    async function initialReadConnectionStatus() {
      const callbackHintStatus = getCallbackHintStatus();

      if (callbackHintStatus === "connected_hint") {
        setStatus("connected_hint");
      }

      setLoading(true);
      setStatus(callbackHintStatus === "connected_hint" ? "connected_hint" : "checking");
      setMessage("");

      try {
        const data = await readAmazonSpApiConnectionStatus({
          storeId: "cmn4jghll0005o901075vk5w4",
          marketplaceId: "A1VC38T7YXB528",
          region: "JP",
        });

        if (cancelled) return;

        const nextStatus = normalizeBackendStatus(data);
        setBackendStatusDetail(data);
        setStatus(nextStatus);
        setMessage(buildBackendStatusMessage(data, nextStatus));
      } catch (err) {
        if (cancelled) return;

        if (callbackHintStatus === "connected_hint") {
          setStatus("connected_hint");
          setMessage(
            "callback URL から接続完了の可能性を検出しましたが、接続状態APIの確認に失敗しました。"
          );
          return;
        }

        setBackendStatusDetail(null);
        setStatus("error");
        setMessage(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void initialReadConnectionStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  async function requestAuthorization(forceReauthorize = false) {
    setLoading(true);
    setStatus("connecting");
    setMessage("");

    try {
      const data = await requestAmazonSpApiAuthorizationUrl({
        storeId: "cmn4jghll0005o901075vk5w4",
        marketplaceId: "A1VC38T7YXB528",
        region: "JP",
        returnTo: getReturnToPath(),
        sandbox: true,
        forceReauthorize,
        locale: "ja-JP",
      });

      const summary = summarizeAuthorization(data);
      setLastAuthorization(summary);
      setStatus("authorization_ready");

      if (!summary?.authorizationUrl) {
        setMessage("Amazon認可URLを取得できませんでした。時間をおいて再試行してください。");
        setStatus("error");
        return;
      }

      setMessage("Amazonの認可画面へ移動します。戻った後、接続状態を確認してください。");

      // Keep the URL visible in state before navigating. This preserves testability and avoids raw secret rendering.
      window.location.assign(summary.authorizationUrl);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function refreshBackendStatus() {
    setLoading(true);
    setStatus("checking");
    setMessage("");

    try {
      const data = await readAmazonSpApiConnectionStatus({
        storeId: "cmn4jghll0005o901075vk5w4",
        marketplaceId: "A1VC38T7YXB528",
        region: "JP",
      });

      const nextStatus = normalizeBackendStatus(data);
      setBackendStatusDetail(data);
      setStatus(nextStatus);
      setMessage(buildBackendStatusMessage(data, nextStatus));
    } catch (err) {
      const callbackHintStatus = getCallbackHintStatus();

      if (callbackHintStatus === "connected_hint") {
        setStatus("connected_hint");
        setMessage(
          "callback URL から接続完了の可能性を検出しましたが、接続状態APIの確認に失敗しました。"
        );
        return;
      }

      setStatus("error");
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function fetchAmazonOrdersPreview() {
    setOrderPullStatus("loading");
    setOrderPullMessage("");
    setOrderPreview(null);
    setOrderImportJob(null);

    try {
      const data = await previewAmazonSpApiOrdersReal({
        storeId: AMAZON_SP_API_DEFAULT_STORE_ID,
        marketplaceId: AMAZON_SP_API_DEFAULT_MARKETPLACE_ID,
        region: AMAZON_SP_API_DEFAULT_REGION,
        createdAfter: orderPullWindow.createdAfter,
        createdBefore: orderPullWindow.createdBefore,
        startDate: orderPullWindow.startDate,
        endDate: orderPullWindow.endDate,
        days: orderPullWindow.days,
        orderStatuses: ["Shipped", "Unshipped", "PartiallyShipped"],
        maxResultsPerPage: 20,
        realPreview: true,
      });

      setOrderPreview(data);
      setOrderPullStatus("success");
      setOrderPullMessage(
        `注文を取得しました。注文 ${data.normalizedOrders?.length ?? 0} 件 / 明細 ${
          data.normalizedOrderItems?.length ?? 0
        } 件。`
      );
    } catch (err) {
      setOrderPullStatus("error");
      setOrderPullMessage(err instanceof Error ? err.message : String(err));
    }
  }

  async function createAmazonOrdersImportJob() {
    setOrderPullStatus("loading");
    setOrderPullMessage("");

    try {
      const data = await commitAmazonSpApiOrdersRealImportJob({
        storeId: AMAZON_SP_API_DEFAULT_STORE_ID,
        marketplaceId: AMAZON_SP_API_DEFAULT_MARKETPLACE_ID,
        region: AMAZON_SP_API_DEFAULT_REGION,
        createdAfter: orderPullWindow.createdAfter,
        createdBefore: orderPullWindow.createdBefore,
        startDate: orderPullWindow.startDate,
        endDate: orderPullWindow.endDate,
        days: orderPullWindow.days,
        orderStatuses: ["Shipped", "Unshipped", "PartiallyShipped"],
        maxResultsPerPage: 20,
        realPreview: true,
      });

      setOrderImportJob(data);
      setOrderPullStatus("success");
      setOrderPullMessage(
        data.importJobId
          ? `ImportJobを作成しました。保存行数 ${data.totalRows ?? 0} 件（注文ヘッダー ${orderPreview?.normalizedOrders?.length ?? 0} 件 / 保存商品明細 ${Math.max(0, Number(data.totalRows ?? 0) - Number(orderPreview?.normalizedOrders?.length ?? 0))} 件）を保存しました。`
          : "ImportJob作成結果を受信しました。"
      );
    } catch (err) {
      setOrderPullStatus("error");
      setOrderPullMessage(err instanceof Error ? err.message : String(err));
    }
  }

  async function previewHistoricalSyncPlan() {
    setHistoricalSyncPlanStatus("loading");
    setHistoricalSyncPlanMessage("");
    setHistoricalSyncPlanPreview(null);

    try {
      const data = await previewAmazonSpApiOrdersHistoricalSyncPlan({
        storeId: AMAZON_SP_API_DEFAULT_STORE_ID,
        marketplaceId: AMAZON_SP_API_DEFAULT_MARKETPLACE_ID,
        region: AMAZON_SP_API_DEFAULT_REGION,
        syncStartDate: orderPullWindow.startDate,
        syncEndDate: orderPullWindow.endDate,
        segmentDays: orderPullWindow.days && orderPullWindow.days <= 31 ? orderPullWindow.days : undefined,
      });

      setHistoricalSyncPlanPreview(data);
      setHistoricalSyncPlanStatus("success");

      const segmentCount = data.plan?.plannedSegments?.length ?? 0;
      const totalDays = data.plan?.normalizedRange?.totalDaysInclusive ?? "—";
      setHistoricalSyncPlanMessage(
        `同期計画を作成しました（preview-only）。セグメント ${segmentCount} 件 / 対象日数 ${totalDays} 日。同期実行・DB書き込みは行っていません。`
      );
    } catch (err) {
      setHistoricalSyncPlanStatus("error");
      setHistoricalSyncPlanMessage(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <section
      data-testid="amazon-sp-api-connection-status-panel"
      className="rounded-[2rem] border border-slate-200 bg-white/95 p-6 shadow-sm ring-1 ring-slate-100"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-black text-slate-950">Amazon SP-API 接続</h2>
            <span
              data-testid="amazon-sp-api-connection-status-badge"
              className={`rounded-full border px-2.5 py-1 text-xs font-bold ${getStatusClass(status)}`}
            >
              {getStatusLabel(status)}
            </span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
              Sandbox / OAuth準備中
            </span>
          </div>

          <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
            Amazon SP-API から注文を取得し、ImportJob と ImportStagingRow として保存します。
            この画面では会計入账・Transaction作成・在庫扣減は行いません。
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Marketplace</div>
              <div className="mt-1 text-sm font-black text-slate-800">
                {lastAuthorization?.marketplaceId || "A1VC38T7YXB528"}
              </div>
              <div className="mt-1 text-xs font-semibold text-slate-500">Amazon.co.jp</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Region</div>
              <div className="mt-1 text-sm font-black text-slate-800">{lastAuthorization?.region || "JP"}</div>
              <div className="mt-1 text-xs font-semibold text-slate-500">日本マーケット向け</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Token Security</div>
              <div className="mt-1 text-sm font-black text-slate-800">Secret非表示</div>
              <div className="mt-1 text-xs font-semibold text-slate-500">raw tokenはUIに表示しません</div>
            </div>
          </div>

          <div
            data-testid="amazon-sp-api-real-db-read-model-details"
            className="mt-4 rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                  Amazon SP-API 接続詳細
                </div>
                <div className="mt-1 text-sm font-black text-slate-800">
                  接続情報・認証情報・一時トークン状態
                </div>
              </div>
              <span
                data-testid="amazon-sp-api-read-model-status"
                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-black text-slate-600"
              >
                {getReadModelStatusLabel(backendStatusDetail?.readModelStatus)}
              </span>
            </div>

            <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {buildBackendStatusRows(backendStatusDetail).map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                    {item.label}
                  </div>
                  <div className="mt-1 break-words text-xs font-bold text-slate-700">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            {backendStatusDetail?.lastErrorMessageRedacted ? (
              <div
                data-testid="amazon-sp-api-last-error-message-redacted"
                className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold leading-5 text-rose-700"
              >
                {backendStatusDetail.lastErrorMessageRedacted}
              </div>
            ) : null}
          </div>

          {lastAuthorization?.stateExpiresAt ? (
            <div
              data-testid="amazon-sp-api-authorization-url-issued"
              className="mt-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs font-bold leading-5 text-sky-700"
            >
              認可URLを発行しました。有効期限: {lastAuthorization.stateExpiresAt}
            </div>
          ) : null}

          <div
            data-testid="amazon-sp-api-simple-order-pull-card"
            className="mt-4 rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-4 shadow-sm"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-[11px] font-black uppercase tracking-wide text-emerald-700">
                  Amazon注文取得
                </div>
                <h3 className="mt-1 text-base font-black text-slate-950">
                  注文を取得して Import Center で確認
                </h3>
                <p className="mt-1 max-w-3xl text-xs font-bold leading-5 text-emerald-900">
                  最短パス：注文を取得 → ImportJobを作成 → Import Centerで確認。
                  Transaction作成・在庫扣減は行いません。
                </p>
                <div className="mt-2 text-[11px] font-bold text-emerald-800">
                  取得期間: {formatOrderPullWindow(orderPullWindow.createdAfter)} 〜{" "}
                  {formatOrderPullWindow(orderPullWindow.createdBefore)}
                </div>
              </div>

              <span
                data-testid="amazon-sp-api-simple-order-pull-status"
                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${getOrderPullStatusClass(orderPullStatus)}`}
              >
                {orderPullStatus === "loading"
                  ? "処理中"
                  : orderPullStatus === "success"
                    ? "完了"
                    : orderPullStatus === "error"
                      ? "エラー"
                      : "未実行"}
              </span>
            </div>

            <div className="mt-4 grid gap-2 md:grid-cols-3">
              
              <div
                data-testid="amazon-sp-api-orders-date-range-selector"
                className="rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                        取得期間
                      </div>
                      <div
                        data-testid="amazon-sp-api-orders-date-range-display"
                        className="mt-1 text-sm font-bold text-slate-800"
                      >
                        {formatOrderPullWindow(orderPullWindow.createdAfter)} 〜{" "}
                        {formatOrderPullWindow(orderPullWindow.createdBefore)}
                      </div>
                    </div>
                    <div className="text-[11px] font-bold text-slate-500">最大31日</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                    {AMAZON_ORDER_PULL_RANGE_PRESETS.map((item) => (
                      <button
                        key={item.value}
                        data-testid={`amazon-sp-api-orders-date-range-preset-${item.value}`}
                        type="button"
                        onClick={() => setOrderPullRangePreset(item.value)}
                        className={`rounded-xl border px-3 py-2 text-xs font-black transition ${
                          orderPullRangePreset === item.value
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {orderPullRangePreset === "CUSTOM" ? (
                    <div
                      data-testid="amazon-sp-api-orders-custom-date-range"
                      className="grid grid-cols-1 gap-2 md:grid-cols-2"
                    >
                      <label className="text-xs font-bold text-slate-600">
                        開始日
                        <input
                          data-testid="amazon-sp-api-orders-custom-start-date"
                          type="date"
                          value={customOrderPullStartDate}
                          onChange={(event) => setCustomOrderPullStartDate(event.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-emerald-400"
                        />
                      </label>
                      <label className="text-xs font-bold text-slate-600">
                        終了日
                        <input
                          data-testid="amazon-sp-api-orders-custom-end-date"
                          type="date"
                          value={customOrderPullEndDate}
                          onChange={(event) => setCustomOrderPullEndDate(event.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-emerald-400"
                        />
                      </label>
                    </div>
                  ) : null}
                </div>
              </div>

<button
                data-testid="amazon-sp-api-fetch-orders-button"
                type="button"
                onClick={() => void fetchAmazonOrdersPreview()}
                disabled={orderPullStatus === "loading"}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                1. 注文を取得
              </button>

              <button
                data-testid="amazon-sp-api-create-importjob-button"
                type="button"
                onClick={() => void createAmazonOrdersImportJob()}
                disabled={orderPullStatus === "loading"}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 text-sm font-black text-emerald-700 shadow-sm transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                2. ImportJobを作成
              </button>

              <a
                data-testid="amazon-sp-api-open-import-center-button"
                href={`/ja/app/data/import${
                  orderImportJob?.importJobId
                    ? `?importJobId=${encodeURIComponent(orderImportJob.importJobId)}`
                    : ""
                }`}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                3. Import Centerで確認
              </a>
            </div>

            <div
              data-testid="amazon-sp-api-historical-sync-plan-preview-card"
              className="mt-4 rounded-3xl border border-indigo-200 bg-indigo-50 px-4 py-4 shadow-sm"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-wide text-indigo-700">
                    Historical Sync Plan Preview
                  </div>
                  <h3 className="mt-1 text-base font-black text-slate-950">
                    バックグラウンド取得の計画だけを確認
                  </h3>
                  <p className="mt-1 max-w-3xl text-xs font-bold leading-5 text-indigo-900">
                    Step149-N は preview-only です。同期実行・SyncJob作成・Amazon API取得・DB書き込みは行いません。
                  </p>
                  <div
                    data-testid="amazon-sp-api-historical-sync-plan-preview-range"
                    className="mt-2 text-[11px] font-bold text-indigo-800"
                  >
                    計画対象: {orderPullWindow.startDate} 〜 {orderPullWindow.endDate}
                  </div>
                </div>

                <span
                  data-testid="amazon-sp-api-historical-sync-plan-preview-status"
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${getHistoricalSyncPlanStatusClass(historicalSyncPlanStatus)}`}
                >
                  {getHistoricalSyncPlanStatusLabel(historicalSyncPlanStatus)}
                </span>
              </div>

              <div className="mt-4 grid gap-2 md:grid-cols-3">
                <button
                  data-testid="amazon-sp-api-historical-sync-plan-preview-button"
                  type="button"
                  onClick={() => void previewHistoricalSyncPlan()}
                  disabled={historicalSyncPlanStatus === "loading"}
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-indigo-700 px-4 text-sm font-black text-white shadow-sm transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  同期計画をプレビュー
                </button>

                <div className="rounded-2xl border border-indigo-100 bg-white px-3 py-2 text-xs">
                  <div className="font-black text-slate-500">実行状態</div>
                  <div data-testid="amazon-sp-api-historical-sync-plan-preview-execution" className="mt-1 font-black text-slate-950">
                    disabled / preview-only
                  </div>
                </div>

                <div className="rounded-2xl border border-indigo-100 bg-white px-3 py-2 text-xs">
                  <div className="font-black text-slate-500">DB書き込み</div>
                  <div data-testid="amazon-sp-api-historical-sync-plan-preview-db-write" className="mt-1 font-black text-slate-950">
                    未実行
                  </div>
                </div>
              </div>

              {historicalSyncPlanMessage ? (
                <div
                  data-testid="amazon-sp-api-historical-sync-plan-preview-message"
                  className={`mt-3 rounded-2xl border px-3 py-2 text-xs font-bold leading-5 ${
                    historicalSyncPlanStatus === "error"
                      ? "border-rose-200 bg-white text-rose-700"
                      : "border-indigo-200 bg-white text-indigo-800"
                  }`}
                >
                  {historicalSyncPlanMessage}
                </div>
              ) : null}

              {historicalSyncPlanPreview ? (
                <div
                  data-testid="amazon-sp-api-historical-sync-plan-preview-summary"
                  className="mt-3 grid gap-2 text-xs md:grid-cols-4"
                >
                  <div className="rounded-2xl border border-indigo-100 bg-white px-3 py-2">
                    <div className="font-black text-slate-500">accepted</div>
                    <div className="mt-1 font-black text-slate-950">
                      {String(historicalSyncPlanPreview.accepted)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-indigo-100 bg-white px-3 py-2">
                    <div className="font-black text-slate-500">disabled</div>
                    <div className="mt-1 font-black text-slate-950">
                      {String(historicalSyncPlanPreview.disabled)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-indigo-100 bg-white px-3 py-2">
                    <div className="font-black text-slate-500">セグメント</div>
                    <div data-testid="amazon-sp-api-historical-sync-plan-preview-segment-count" className="mt-1 font-black text-slate-950">
                      {historicalSyncPlanPreview.plan?.plannedSegments?.length ?? 0}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-indigo-100 bg-white px-3 py-2">
                    <div className="font-black text-slate-500">最大ページ/区間</div>
                    <div className="mt-1 font-black text-slate-950">
                      {historicalSyncPlanPreview.plan?.paginationPolicy?.maxPagesPerSegment ?? "—"}
                    </div>
                  </div>
                </div>
              ) : null}

              {historicalSyncPlanPreview?.plan?.plannedSegments?.length ? (
                <div
                  data-testid="amazon-sp-api-historical-sync-plan-preview-segment-list"
                  className="mt-3 overflow-hidden rounded-2xl border border-indigo-100 bg-white"
                >
                  <div className="grid grid-cols-[80px_1fr_1fr_90px] gap-2 border-b border-indigo-100 bg-indigo-50 px-3 py-2 text-[11px] font-black text-indigo-800">
                    <div>#</div>
                    <div>createdAfter</div>
                    <div>createdBefore</div>
                    <div>days</div>
                  </div>
                  {historicalSyncPlanPreview.plan.plannedSegments.slice(0, 6).map((segment) => (
                    <div
                      key={segment.segmentIndex}
                      data-testid="amazon-sp-api-historical-sync-plan-preview-segment-row"
                      className="grid grid-cols-[80px_1fr_1fr_90px] gap-2 border-b border-indigo-50 px-3 py-2 text-[11px] font-bold text-slate-700 last:border-b-0"
                    >
                      <div>{segment.segmentIndex}</div>
                      <div>{formatOrderPullWindow(segment.createdAfter)}</div>
                      <div>{formatOrderPullWindow(segment.createdBefore)}</div>
                      <div>{segment.segmentDaysInclusive}</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            {orderPullMessage ? (
              <div
                data-testid="amazon-sp-api-simple-order-pull-message"
                className={`mt-3 rounded-2xl border px-3 py-2 text-xs font-bold leading-5 ${
                  orderPullStatus === "error"
                    ? "border-rose-200 bg-white text-rose-700"
                    : "border-emerald-200 bg-white text-emerald-800"
                }`}
              >
                {orderPullMessage}
              </div>
            ) : null}

            {orderPreview ? (
              <div
                data-testid="amazon-sp-api-simple-order-preview-summary"
                className="mt-3 grid gap-2 text-xs md:grid-cols-3"
              >
                <div className="rounded-2xl border border-emerald-100 bg-white px-3 py-2">
                  <div className="font-black text-slate-500">取得注文</div>
                  <div className="mt-1 font-black text-slate-950">
                    {orderPreview?.normalizedOrders?.length ?? 0}
                  </div>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-white px-3 py-2">
                  <div className="font-black text-slate-500">取得注文明細</div>
                  <div className="mt-1 font-black text-slate-950">
                    {orderPreview.normalizedOrderItems?.length ?? 0}
                  </div>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-white px-3 py-2">
                  <div className="font-black text-slate-500">DB書き込み</div>
                  <div className="mt-1 font-black text-slate-950">未実行</div>
                </div>
              </div>
            ) : null}

            {orderImportJob?.importJobId ? (
              <div
                data-testid="amazon-sp-api-simple-importjob-result"
                className="mt-3 rounded-2xl border border-emerald-200 bg-white px-3 py-3 text-xs font-bold text-emerald-800"
              >
                <div>ImportJob: {orderImportJob.importJobId}</div>
                <div className="mt-1">
                  保存行数: {orderImportJob.totalRows ?? 0} / 注文ヘッダー:{" "}
                  {orderPreview?.normalizedOrders?.length ?? 0} / 保存商品明細:{" "}
                  {Math.max(
                    0,
                    Number(orderImportJob.totalRows ?? 0) - Number(orderPreview?.normalizedOrders?.length ?? 0),
                  )}{" "}
                  / sourceType: {orderImportJob.sourceType || "amazon-sp-api-orders"}
                </div>
                <a
                  href={`/ja/app/data/import?importJobId=${encodeURIComponent(orderImportJob.importJobId)}`}
                  className="mt-3 inline-flex h-9 items-center justify-center rounded-xl bg-slate-950 px-3 text-xs font-black text-white shadow-sm hover:bg-slate-800"
                >
                  Import Centerで確認
                </a>
              </div>
            ) : null}
          </div>

          {message ? (
            <div
              data-testid="amazon-sp-api-connection-message"
              className={`mt-3 rounded-2xl border px-4 py-3 text-sm font-bold leading-6 ${
                status === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-slate-200 bg-slate-50 text-slate-600"
              }`}
            >
              {message}
            </div>
          ) : null}
        </div>

        <div className="flex min-w-[240px] flex-col gap-2">
          <button
            data-testid="amazon-sp-api-connect-button"
            type="button"
            onClick={() => void requestAuthorization(false)}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "接続準備中..." : "Amazonと接続"}
          </button>

          <button
            data-testid="amazon-sp-api-refresh-status-button"
            type="button"
            onClick={() => void refreshBackendStatus()}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            接続状態を更新
          </button>

          <button
            data-testid="amazon-sp-api-reconnect-button"
            type="button"
            onClick={() => void requestAuthorization(true)}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 px-4 text-sm font-bold text-sky-700 shadow-sm transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            再接続
          </button>

          <button
            data-testid="amazon-sp-api-revoke-button"
            type="button"
            disabled
            title="接続解除APIのフロント接続は後続ステップで実装します"
            className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-400"
          >
            接続を解除
          </button>
        </div>
      </div>
    </section>
  );
}
