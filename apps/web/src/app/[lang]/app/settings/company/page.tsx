"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";

type CompanyDto = {
  id: string;
  name: string;
  fiscalMonthStart?: number | null;
  timezone?: string | null;
  currency?: string | null;
  createdAt?: string | null;
};

type StoreDto = {
  id: string;
  name: string;
  platform?: string | null;
  region?: string | null;
  createdAt?: string | null;
};

type CompanyResponse = {
  company: CompanyDto | null;
  stores: StoreDto[];
};

function fmtMonthStart(value?: number | null) {
  const month = Number(value ?? 1);
  if (!Number.isFinite(month) || month < 1 || month > 12) return "1月";
  return `${month}月`;
}

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

function metricCard(args: {
  label: string;
  value: string;
  helper?: string;
  tone?: "default" | "primary" | "success";
}) {
  const tone =
    args.tone === "primary"
      ? "border-sky-200 bg-sky-50"
      : args.tone === "success"
      ? "border-emerald-200 bg-emerald-50"
      : "border-slate-200 bg-slate-50";

  return (
    <div className={`rounded-[22px] border p-4 ${tone}`}>
      <div className="text-[11px] font-medium text-slate-500">{args.label}</div>
      <div className="mt-2 text-xl font-semibold text-slate-900">{args.value}</div>
      {args.helper ? <div className="mt-2 text-xs text-slate-500">{args.helper}</div> : null}
    </div>
  );
}

export default function SettingsCompanyPage() {
  const params = useParams<{ lang: string }>();
  const lang = normalizeLang(params?.lang) as Lang;

  const [data, setData] = useState<CompanyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/company", {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`/api/company failed: ${res.status} ${text}`);
      }

      const json = (await res.json()) as CompanyResponse;
      setData({
        company: json?.company ?? null,
        stores: Array.isArray(json?.stores) ? json.stores : [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to load company");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const company = data?.company ?? null;
  const stores = data?.stores ?? [];

  const primaryStoreNames = useMemo(
    () => stores.slice(0, 5).map((store) => store.name).filter(Boolean),
    [stores]
  );

  if (loading) {
    return (
      <main className="space-y-6">
        <section className="ls-card-solid rounded-[28px] p-6">
          <div className="text-sm text-slate-500">会社情報を読み込み中...</div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="space-y-6">
        <section className="rounded-[28px] border border-rose-200 bg-rose-50 p-6">
          <div className="text-sm font-semibold text-rose-700">会社情報の取得に失敗しました</div>
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
          Company Settings
        </div>

        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[34px] font-semibold tracking-tight">会社情報</h1>
            <div className="mt-3 text-sm text-white/80">
              現在の company baseline を表示します。編集保存は次ステップで接続します。
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
              href={`/${lang}/app/settings/stores`}
              className="ls-btn ls-btn-ghost inline-flex border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
            >
              店舗管理へ
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-[22px] bg-white/92 p-5 text-slate-900 shadow-sm">
            <div className="text-[11px] font-medium text-slate-500">Company Name</div>
            <div className="mt-2 text-xl font-semibold">{company?.name?.trim() || "—"}</div>
          </div>

          <div className="rounded-[22px] bg-white/92 p-5 text-slate-900 shadow-sm">
            <div className="text-[11px] font-medium text-slate-500">Timezone</div>
            <div className="mt-2 text-xl font-semibold">{company?.timezone?.trim() || "Asia/Tokyo"}</div>
          </div>

          <div className="rounded-[22px] bg-white/92 p-5 text-slate-900 shadow-sm">
            <div className="text-[11px] font-medium text-slate-500">Currency</div>
            <div className="mt-2 text-xl font-semibold">{company?.currency?.trim() || "JPY"}</div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {metricCard({
          label: "会計年度開始月",
          value: fmtMonthStart(company?.fiscalMonthStart),
          helper: "fiscalMonthStart",
          tone: "primary",
        })}
        {metricCard({
          label: "店舗数",
          value: String(stores.length),
          helper: "company 配下の store 数",
          tone: "success",
        })}
        {metricCard({
          label: "作成日",
          value: fmtDate(company?.createdAt),
          helper: "company.createdAt",
        })}
        {metricCard({
          label: "状態",
          value: company ? "接続済み" : "未作成",
          helper: company ? "company record available" : "company record missing",
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section className="ls-card-solid rounded-[28px] p-5 xl:col-span-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-900">Company Detail</div>
              <div className="mt-1 text-[12px] text-slate-500">
                /api/company の戻り値を安全に表示しています
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

          <div className="mt-5 overflow-hidden rounded-[22px] border border-slate-200">
            <div className="grid grid-cols-[180px_1fr] gap-0 text-sm">
              {[
                { key: "ID", value: company?.id || "-" },
                { key: "会社名", value: company?.name || "-" },
                { key: "会計年度開始月", value: fmtMonthStart(company?.fiscalMonthStart) },
                { key: "タイムゾーン", value: company?.timezone || "Asia/Tokyo" },
                { key: "通貨", value: company?.currency || "JPY" },
                { key: "作成日", value: fmtDate(company?.createdAt) },
              ].map((row, idx) => (
                <React.Fragment key={row.key}>
                  <div
                    className={`border-r border-slate-200 px-4 py-3 font-medium text-slate-600 ${
                      idx > 0 ? "border-t border-slate-200" : ""
                    } bg-slate-50`}
                  >
                    {row.key}
                  </div>
                  <div
                    className={`px-4 py-3 text-slate-900 ${
                      idx > 0 ? "border-t border-slate-200" : ""
                    }`}
                  >
                    <div className="break-all">{row.value}</div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-[22px] border border-dashed border-[color:var(--ls-primary)]/35 bg-[color:var(--ls-primary)]/5 p-4">
            <div className="text-sm font-medium text-slate-900">Next Step</div>
            <div className="mt-2 text-sm text-slate-600">
              Step45-D で company edit/save を安全に追加します。当前阶段只做真实读取，不改写数据。
            </div>
          </div>
        </section>

        <section className="ls-card-solid rounded-[28px] p-5 xl:col-span-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-900">Related Stores</div>
              <div className="mt-1 text-[12px] text-slate-500">
                /api/company 同时返回 stores
              </div>
            </div>

            <Link
              href={`/${lang}/app/settings/stores`}
              className="ls-btn ls-btn-ghost inline-flex px-4 py-2 text-sm font-semibold"
            >
              店舗管理へ
            </Link>
          </div>

          {stores.length === 0 ? (
            <div className="mt-5 rounded-[22px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
              まだ店舗がありません。次のステップで settings/stores を production 化します。
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {stores.map((store) => (
                <div
                  key={store.id}
                  className="rounded-[22px] border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{store.name || "-"}</div>
                      <div className="mt-1 text-xs text-slate-500 break-all">{store.id}</div>
                    </div>

                    <div className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
                      {(store.platform || "AMAZON").toUpperCase()} / {(store.region || "JP").toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {primaryStoreNames.length > 0 ? (
            <div className="mt-5 rounded-[22px] border border-black/5 bg-white p-4">
              <div className="text-[11px] font-medium text-slate-500">Store Preview</div>
              <div className="mt-2 text-sm text-slate-700">
                {primaryStoreNames.join(" / ")}
              </div>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}
