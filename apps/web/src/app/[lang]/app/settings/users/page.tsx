"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";

type WorkspaceContextResponse = {
  workspace?: {
    slug?: string;
    displayName?: string;
    companyName?: string;
    locale?: string;
  };
  subscription?: {
    planCode?: string;
    status?: string;
    source?: string;
  };
};

type CompanyApiResponse = {
  company?: {
    id?: string;
    name?: string;
    fiscalMonthStart?: number;
    timezone?: string;
    currency?: string;
    createdAt?: string;
  } | null;
  stores?: Array<{
    id?: string;
    name?: string;
    platform?: string;
    region?: string;
    createdAt?: string;
  }>;
};

function cls(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function InfoCard(props: {
  label: string;
  value: React.ReactNode;
  helper?: React.ReactNode;
}) {
  const { label, value, helper } = props;
  return (
    <div className="rounded-[22px] border border-black/5 bg-slate-50 p-4">
      <div className="text-[11px] font-medium text-slate-500">{label}</div>
      <div className="mt-2 text-base font-semibold text-slate-900">{value}</div>
      {helper ? <div className="mt-1 text-xs text-slate-500">{helper}</div> : null}
    </div>
  );
}

function SectionCard(props: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  const { title, desc, children } = props;
  return (
    <section className="ls-card-solid rounded-[28px] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          {desc ? <div className="mt-1 text-[12px] text-slate-500">{desc}</div> : null}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function Page() {
  const params = useParams<{ lang: string }>();
  const lang = normalizeLang(params?.lang) as Lang;

  const [ctx, setCtx] = useState<WorkspaceContextResponse | null>(null);
  const [companyRes, setCompanyRes] = useState<CompanyApiResponse | null>(null);

  const [loadingCtx, setLoadingCtx] = useState(true);
  const [loadingCompany, setLoadingCompany] = useState(true);

  const [ctxError, setCtxError] = useState("");
  const [companyError, setCompanyError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function run() {
      setLoadingCtx(true);
      setCtxError("");

      try {
        const res = await fetch("/workspace/context", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const json = await res.json().catch(() => null);
        if (!mounted) return;

        if (!res.ok) {
          setCtxError(`workspace/context failed: ${res.status}`);
          setCtx(null);
        } else {
          setCtx((json || null) as WorkspaceContextResponse | null);
        }
      } catch (error) {
        if (!mounted) return;
        setCtxError(error instanceof Error ? error.message : "workspace/context failed");
        setCtx(null);
      } finally {
        if (mounted) setLoadingCtx(false);
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function run() {
      setLoadingCompany(true);
      setCompanyError("");

      try {
        const res = await fetch("/api/company", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const json = await res.json().catch(() => null);
        if (!mounted) return;

        if (!res.ok) {
          setCompanyError(
            res.status === 401
              ? "会社 / ユーザー管理 API は未ログイン状態のため利用できません。"
              : `/api/company failed: ${res.status}`
          );
          setCompanyRes(null);
        } else {
          setCompanyRes((json || null) as CompanyApiResponse | null);
        }
      } catch (error) {
        if (!mounted) return;
        setCompanyError(error instanceof Error ? error.message : "/api/company failed");
        setCompanyRes(null);
      } finally {
        if (mounted) setLoadingCompany(false);
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, []);

  const workspaceName =
    ctx?.workspace?.displayName?.trim() ||
    ctx?.workspace?.companyName?.trim() ||
    "LedgerSeiri Workspace";

  const companyName =
    companyRes?.company?.name?.trim() ||
    ctx?.workspace?.companyName?.trim() ||
    "未設定";

  const workspaceSlug = ctx?.workspace?.slug?.trim() || "default";
  const planCode = ctx?.subscription?.planCode?.trim() || "starter";
  const planStatus = ctx?.subscription?.status?.trim() || "active";
  const planSource = ctx?.subscription?.source?.trim() || "unknown";

  const stores = useMemo(() => companyRes?.stores ?? [], [companyRes]);
  const storesCount = stores.length;

  const readinessRows = useMemo(
    () => [
      {
        key: "workspace-context",
        title: "Workspace Context",
        value: loadingCtx ? "loading..." : ctx ? "ready" : "fallback",
        note:
          ctxError ||
          "workspace / subscription / locale を読み込み、settings 全体の表示基準に使います。",
      },
      {
        key: "company-api",
        title: "Company / Store API",
        value: loadingCompany ? "loading..." : companyRes ? "ready" : "limited",
        note:
          companyError ||
          "現在は /api/company を使って会社情報と stores を参照。未ログイン時は graceful degradation。",
      },
      {
        key: "users-management",
        title: "Users Management",
        value: "planned",
        note:
          "Step45-E1 は settings/users の production baseline。実ユーザー一覧・招待・権限変更は後続 Step で接続。",
      },
    ],
    [loadingCtx, ctx, ctxError, loadingCompany, companyRes, companyError]
  );

  const storeSummary = useMemo(() => {
    if (stores.length === 0) {
      return [];
    }

    return stores.slice(0, 6).map((store, index) => ({
      id: store.id || `store-${index}`,
      name: store.name || "Unnamed Store",
      platform: store.platform || "-",
      region: store.region || "-",
    }));
  }, [stores]);

  return (
    <main className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-white/60 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_55%,#334155_100%)] p-7 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
        <div className="inline-flex rounded-full bg-white/12 px-3 py-1 text-[11px] font-medium text-white/90">
          Settings · Users Baseline
        </div>

        <h1 className="mt-5 text-[34px] font-semibold tracking-tight">
          ユーザー管理
        </h1>

        <div className="mt-3 text-sm text-white/80">
          Step45-E1: settings/users を placeholder から production baseline に置き換え、
          workspace / company / store 情報を使った管理入口ページに揃えます。
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-[22px] bg-white/92 p-5 text-slate-900 shadow-sm">
            <div className="text-[11px] font-medium text-slate-500">Workspace</div>
            <div className="mt-2 text-base font-semibold">{workspaceName}</div>
            <div className="mt-1 text-xs text-slate-500">{workspaceSlug}</div>
          </div>

          <div className="rounded-[22px] bg-white/92 p-5 text-slate-900 shadow-sm">
            <div className="text-[11px] font-medium text-slate-500">Company</div>
            <div className="mt-2 text-base font-semibold">{companyName}</div>
            <div className="mt-1 text-xs text-slate-500">
              {companyRes?.company?.currency || "JPY"} / {companyRes?.company?.timezone || "Asia/Tokyo"}
            </div>
          </div>

          <div className="rounded-[22px] bg-white/92 p-5 text-slate-900 shadow-sm">
            <div className="text-[11px] font-medium text-slate-500">Plan</div>
            <div className="mt-2 text-base font-semibold">{planCode}</div>
            <div className="mt-1 text-xs text-slate-500">
              status: {planStatus} / source: {planSource}
            </div>
          </div>

          <div className="rounded-[22px] bg-white/92 p-5 text-slate-900 shadow-sm">
            <div className="text-[11px] font-medium text-slate-500">Stores</div>
            <div className="mt-2 text-base font-semibold">{storesCount}</div>
            <div className="mt-1 text-xs text-slate-500">team / permission scope baseline</div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-8 space-y-6">
          <SectionCard
            title="Management Readiness"
            desc="settings/users を本番系ページへ移行するための現在接続済みデータ基盤"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {readinessRows.map((row) => (
                <div
                  key={row.key}
                  className="rounded-[22px] border border-black/5 bg-slate-50 p-4"
                >
                  <div className="text-[11px] font-medium text-slate-500">{row.title}</div>
                  <div className="mt-2 text-base font-semibold text-slate-900">{row.value}</div>
                  <div className="mt-2 text-xs leading-5 text-slate-500">{row.note}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Store Scope Summary"
            desc="ユーザー権限は通常 store scope と結びつくため、まず管理対象店舗を確認"
          >
            {storeSummary.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                利用可能な store 情報はまだありません。未ログイン、または会社 / 店舗未設定の可能性があります。
              </div>
            ) : (
              <div className="overflow-hidden rounded-[22px] border border-slate-200">
                <div className="grid grid-cols-[1.4fr_1fr_0.8fr] gap-4 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
                  <div>Store</div>
                  <div>Platform</div>
                  <div>Region</div>
                </div>

                {storeSummary.map((store) => (
                  <div
                    key={store.id}
                    className="grid grid-cols-[1.4fr_1fr_0.8fr] gap-4 border-t border-slate-100 px-4 py-3 text-sm"
                  >
                    <div className="font-medium text-slate-900">{store.name}</div>
                    <div className="text-slate-600">{store.platform}</div>
                    <div className="text-slate-600">{store.region}</div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Next Implementation Scope"
            desc="Step45-E1 では読み取り中心。後続で team management を段階的に追加"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-[22px] border border-black/5 bg-white p-4">
                <div className="text-sm font-semibold text-slate-900">Step45-E2 Candidate</div>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  <li>• current session user summary</li>
                  <li>• auth/me or session-me の整合確認</li>
                  <li>• role display baseline</li>
                  <li>• invite CTA stub</li>
                </ul>
              </div>

              <div className="rounded-[22px] border border-black/5 bg-white p-4">
                <div className="text-sm font-semibold text-slate-900">Step45-E3 Candidate</div>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  <li>• permissions page production baseline</li>
                  <li>• security page production baseline</li>
                  <li>• settings freeze</li>
                  <li>• auth/billing/settings navigation cleanup</li>
                </ul>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="col-span-12 xl:col-span-4 space-y-6">
          <SectionCard
            title="Quick Navigation"
            desc="settings center 内の関連ページに直接遷移"
          >
            <div className="flex flex-col gap-3">
              <Link
                href={`/${lang}/app/settings`}
                className="ls-btn ls-btn-ghost inline-flex justify-center px-4 py-2 text-sm font-semibold"
              >
                Settings Home
              </Link>

              <Link
                href={`/${lang}/app/settings/company`}
                className="ls-btn ls-btn-ghost inline-flex justify-center px-4 py-2 text-sm font-semibold"
              >
                会社情報
              </Link>

              <Link
                href={`/${lang}/app/settings/stores`}
                className="ls-btn ls-btn-ghost inline-flex justify-center px-4 py-2 text-sm font-semibold"
              >
                店舗管理
              </Link>

              <Link
                href={`/${lang}/app/settings/security`}
                className="ls-btn ls-btn-ghost inline-flex justify-center px-4 py-2 text-sm font-semibold"
              >
                セキュリティ
              </Link>

              <Link
                href={`/${lang}/app/settings/permissions`}
                className="ls-btn ls-btn-ghost inline-flex justify-center px-4 py-2 text-sm font-semibold"
              >
                権限管理
              </Link>
            </div>
          </SectionCard>

          <SectionCard
            title="Current Signals"
            desc="このページが依存している現状シグナル"
          >
            <div className="space-y-3">
              <InfoCard
                label="workspace/context"
                value={loadingCtx ? "loading..." : ctx ? "OK" : "fallback"}
                helper={ctxError || "公開 endpoint。settings/billing 共通の文脈源"}
              />
              <InfoCard
                label="/api/company"
                value={loadingCompany ? "loading..." : companyRes ? "OK" : "limited"}
                helper={companyError || "JWT セッション依存。未ログイン時は 401 を許容"}
              />
              <InfoCard
                label="Users CRUD"
                value="not connected"
                helper="本ステップでは未接続。安全に baseline のみ整備"
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Guardrail"
            desc="このステップで意図的にやらないこと"
          >
            <ul className="space-y-2 text-sm text-slate-600">
              <li>• auth API contract の変更</li>
              <li>• company/store backend の変更</li>
              <li>• billing/workspace contract の変更</li>
              <li>• user invite / edit / delete 実装</li>
              <li>• role/permission schema 追加</li>
            </ul>
          </SectionCard>
        </div>
      </div>
    </main>
  );
}
