"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";

type StoreDto = {
  id: string;
  name: string;
  platform?: string | null;
  region?: string | null;
  createdAt?: string | null;
};

type StoreResponse = {
  stores?: StoreDto[];
};

function fmtDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function normalizeText(value?: string | null, fallback = "-") {
  const v = String(value ?? "").trim();
  return v || fallback;
}

function metricCard(args: {
  label: string;
  value: string;
  helper?: string;
  tone?: "default" | "primary" | "success" | "warning";
}) {
  const tone =
    args.tone === "primary"
      ? "border-sky-200 bg-sky-50"
      : args.tone === "success"
      ? "border-emerald-200 bg-emerald-50"
      : args.tone === "warning"
      ? "border-amber-200 bg-amber-50"
      : "border-slate-200 bg-slate-50";

  return (
    <div className={`rounded-[22px] border p-4 ${tone}`}>
      <div className="text-[11px] font-medium text-slate-500">{args.label}</div>
      <div className="mt-2 text-xl font-semibold text-slate-900">{args.value}</div>
      {args.helper ? <div className="mt-2 text-xs text-slate-500">{args.helper}</div> : null}
    </div>
  );
}

export default function SettingsStoresPage() {
  const params = useParams<{ lang: string }>();
  const lang = normalizeLang(params?.lang) as Lang;

  const [stores, setStores] = useState<StoreDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/store", {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`/api/store failed: ${res.status} ${text}`);
      }

      const json = (await res.json()) as StoreResponse;
      setStores(Array.isArray(json?.stores) ? json.stores : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to load stores");
      setStores([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const platformSummary = useMemo(() => {
    const map = new Map<string, number>();
    for (const store of stores) {
      const key = normalizeText(store.platform, "UNKNOWN").toUpperCase();
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [stores]);

  const regionSummary = useMemo(() => {
    const map = new Map<string, number>();
    for (const store of stores) {
      const key = normalizeText(store.region, "UNKNOWN").toUpperCase();
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [stores]);

  const latestCreatedAt = useMemo(() => {
    const values = stores
      .map((x) => x.createdAt)
      .filter(Boolean)
      .map((x) => new Date(String(x)).getTime())
      .filter((x) => Number.isFinite(x));

    if (values.length === 0) return "-";
    return fmtDate(new Date(Math.max(...values)).toISOString());
  }, [stores]);

  if (loading) {
    return (
      <main className="space-y-6">
        <section className="ls-card-solid rounded-[28px] p-6">
          <div className="text-sm text-slate-500">店舗情報を読み込み中...</div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="space-y-6">
        <section className="rounded-[28px] border border-rose-200 bg-rose-50 p-6">
          <div className="text-sm font-semibold text-rose-700">店舗情報の取得に失敗しました</div>
          <div className="mt-2 break-all text-sm text-rose-600">{error}</div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void load()}
              className="ls-btn ls-btn-primary inline-flex px-4 py-2 text-sm font-semibold"
            >
              再読み込み
            </button>

            <Link
              href={`/${lang}/app/settings`}
              className="ls-btn ls-btn-ghost inline-flex px-4 py-2 text-sm font-semibold"
            >
              Settings に戻る
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-white/60 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_55%,#334155_100%)] p-7 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
        <div className="inline-flex rounded-full bg-white/12 px-3 py-1 text-[11px] font-medium text-white/90">
          Store Settings
        </div>

        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[34px] font-semibold tracking-tight">店舗管理</h1>
            <div className="mt-3 text-sm text-white/80">
              現在の store baseline を表示します。作成・編集・削除は次ステップで接続します。
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/${lang}/app/settings`}
              className="ls-btn ls-btn-ghost inline-flex border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
            >
              Settings に戻る
            </Link>

            <Link
              href={`/${lang}/app/settings/company`}
              className="ls-btn ls-btn-ghost inline-flex border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
            >
              会社情報へ
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-[22px] bg-white/92 p-5 text-slate-900 shadow-sm">
            <div className="text-[11px] font-medium text-slate-500">Store Count</div>
            <div className="mt-2 text-xl font-semibold">{stores.length}</div>
          </div>

          <div className="rounded-[22px] bg-white/92 p-5 text-slate-900 shadow-sm">
            <div className="text-[11px] font-medium text-slate-500">Platforms</div>
            <div className="mt-2 text-xl font-semibold">{platformSummary.length}</div>
          </div>

          <div className="rounded-[22px] bg-white/92 p-5 text-slate-900 shadow-sm">
            <div className="text-[11px] font-medium text-slate-500">Latest Created</div>
            <div className="mt-2 text-xl font-semibold">{latestCreatedAt}</div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {metricCard({
          label: "総店舗数",
          value: String(stores.length),
          helper: "/api/store stores.length",
          tone: "primary",
        })}
        {metricCard({
          label: "プラットフォーム数",
          value: String(platformSummary.length),
          helper: "platform distinct count",
          tone: "success",
        })}
        {metricCard({
          label: "地域数",
          value: String(regionSummary.length),
          helper: "region distinct count",
          tone: "warning",
        })}
        {metricCard({
          label: "状態",
          value: stores.length > 0 ? "接続済み" : "未登録",
          helper: stores.length > 0 ? "store records available" : "no store records",
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section className="ls-card-solid rounded-[28px] p-5 xl:col-span-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-900">Store List</div>
              <div className="mt-1 text-[12px] text-slate-500">
                /api/store の戻り値を安全に表示しています
              </div>
            </div>

            <button
              type="button"
              onClick={() => void load()}
              className="ls-btn ls-btn-ghost inline-flex px-4 py-2 text-sm font-semibold"
            >
              再読み込み
            </button>
          </div>

          {stores.length === 0 ? (
            <div className="mt-5 rounded-[22px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
              店舗がまだありません。次ステップで create/edit の導線を追加できます。
            </div>
          ) : (
            <div className="mt-5 overflow-hidden rounded-[22px] border border-slate-200">
              <div className="grid grid-cols-[1.5fr_140px_100px_140px] gap-4 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
                <div>店舗名</div>
                <div>Platform</div>
                <div>Region</div>
                <div>作成日</div>
              </div>

              {stores.map((store) => (
                <div
                  key={store.id}
                  className="grid grid-cols-[1.5fr_140px_100px_140px] gap-4 border-t border-slate-100 px-4 py-3 text-sm"
                >
                  <div>
                    <div className="font-medium text-slate-900">{normalizeText(store.name)}</div>
                    <div className="mt-1 break-all text-xs text-slate-500">{store.id}</div>
                  </div>
                  <div className="text-slate-700">{normalizeText(store.platform, "AMAZON").toUpperCase()}</div>
                  <div className="text-slate-700">{normalizeText(store.region, "JP").toUpperCase()}</div>
                  <div className="text-slate-700">{fmtDate(store.createdAt)}</div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 rounded-[22px] border border-dashed border-[color:var(--ls-primary)]/35 bg-[color:var(--ls-primary)]/5 p-4">
            <div className="text-sm font-medium text-slate-900">Next Step</div>
            <div className="mt-2 text-sm text-slate-600">
              Step45-E で stores create/save baseline、または settings/users / settings/security production 化へ進めます。
            </div>
          </div>
        </section>

        <section className="ls-card-solid rounded-[28px] p-5 xl:col-span-4">
          <div className="text-sm font-semibold text-slate-900">Summary</div>
          <div className="mt-1 text-[12px] text-slate-500">platform / region aggregation</div>

          <div className="mt-5 space-y-5">
            <div>
              <div className="text-[11px] font-medium text-slate-500">Platforms</div>
              <div className="mt-3 space-y-2">
                {platformSummary.length === 0 ? (
                  <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                    no data
                  </div>
                ) : (
                  platformSummary.map(([key, count]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      <div className="text-sm font-medium text-slate-800">{key}</div>
                      <div className="text-sm text-slate-600">{count}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-medium text-slate-500">Regions</div>
              <div className="mt-3 space-y-2">
                {regionSummary.length === 0 ? (
                  <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                    no data
                  </div>
                ) : (
                  regionSummary.map(([key, count]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      <div className="text-sm font-medium text-slate-800">{key}</div>
                      <div className="text-sm text-slate-600">{count}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
