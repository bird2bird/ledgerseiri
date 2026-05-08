"use client";

import React from "react";
import {
  requestAmazonSpApiAuthorizationUrl,
  type AmazonSpApiAuthorizationUrlResponse,
} from "@/core/imports/api";

type PanelStatus =
  | "not_connected"
  | "connecting"
  | "authorization_ready"
  | "connected_hint"
  | "error";

type LastAuthorizationState = {
  authorizationUrl?: string;
  stateExpiresAt?: string;
  marketplaceId?: string;
  region?: string;
  storeId?: string;
  sandbox?: boolean;
};

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
  if (status === "connecting") return "接続URLを準備中";
  if (status === "authorization_ready") return "Amazon認可URLを発行済み";
  if (status === "connected_hint") return "接続完了の可能性あり";
  if (status === "error") return "接続確認エラー";
  return "未接続";
}

function getStatusClass(status: PanelStatus) {
  if (status === "authorization_ready") return "border-sky-200 bg-sky-50 text-sky-700";
  if (status === "connected_hint") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "error") return "border-rose-200 bg-rose-50 text-rose-700";
  if (status === "connecting") return "border-violet-200 bg-violet-50 text-violet-700";
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

export function AmazonSpApiConnectionStatusPanel() {
  const [status, setStatus] = React.useState<PanelStatus>("not_connected");
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [lastAuthorization, setLastAuthorization] = React.useState<LastAuthorizationState | null>(null);

  React.useEffect(() => {
    setStatus(getCallbackHintStatus());
  }, []);

  async function requestAuthorization(forceReauthorize = false) {
    setLoading(true);
    setStatus("connecting");
    setMessage("");

    try {
      const data = await requestAmazonSpApiAuthorizationUrl({
        storeId: "store-step130b-boundary",
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

  function refreshLocalStatus() {
    setStatus(getCallbackHintStatus());
    setMessage(
      "現在の画面URLとローカル状態を更新しました。正式な接続状態APIの読取は次の実装ステップで接続します。"
    );
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
            Amazon注文レポートのAPI連携に向けた接続パネルです。現段階では認可URLの発行と
            callback後の接続完了表示までを対象にし、注文レポート取得・ImportJob作成・在庫扣減はまだ実行しません。
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

          {lastAuthorization?.stateExpiresAt ? (
            <div
              data-testid="amazon-sp-api-authorization-url-issued"
              className="mt-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs font-bold leading-5 text-sky-700"
            >
              認可URLを発行しました。有効期限: {lastAuthorization.stateExpiresAt}
            </div>
          ) : null}

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
            onClick={refreshLocalStatus}
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
