"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";

type SettingsCard = {
  key: string;
  title: string;
  description: string;
  href: string;
  badge?: string;
};

function withLang(lang: Lang, href: string) {
  return `/${lang}${href}`;
}

export default function Page() {
  const params = useParams<{ lang: string }>();
  const lang = normalizeLang(params?.lang) as Lang;

  const primaryCards: SettingsCard[] = [
    {
      key: "company",
      title: "会社情報",
      description: "会社名、会計開始月、基本情報などの管理。",
      href: "/app/settings/company",
      badge: "Step45-C",
    },
    {
      key: "stores",
      title: "店舗管理",
      description: "店舗・チャネル・販売先の一覧と管理。",
      href: "/app/settings/stores",
      badge: "Step45-D",
    },
    {
      key: "billing",
      title: "プラン情報",
      description: "現在プラン、利用状況、上限値の確認。",
      href: "/app/billing",
      badge: "Live",
    },
    {
      key: "plan-change",
      title: "プラン変更",
      description: "Starter / Standard / Premium の比較と変更導線。",
      href: "/app/billing/change",
      badge: "Live",
    },
  ];

  const secondaryCards: SettingsCard[] = [
    {
      key: "users",
      title: "ユーザー管理",
      description: "ユーザー一覧、招待、アカウント状態の管理。",
      href: "/app/settings/users",
      badge: "Placeholder",
    },
    {
      key: "permissions",
      title: "権限管理",
      description: "ロール、閲覧権限、操作権限の管理。",
      href: "/app/settings/permissions",
      badge: "Placeholder",
    },
    {
      key: "accounts",
      title: "口座設定",
      description: "資金管理で利用する口座や初期値の設定。",
      href: "/app/settings/accounts",
      badge: "Placeholder",
    },
    {
      key: "categories",
      title: "カテゴリ設定",
      description: "収入・支出カテゴリや補助分類の設定。",
      href: "/app/settings/categories",
      badge: "Placeholder",
    },
    {
      key: "currency-tax",
      title: "通貨・税務設定",
      description: "通貨、税率、会計処理上の基本設定。",
      href: "/app/settings/currency-tax",
      badge: "Placeholder",
    },
    {
      key: "notifications",
      title: "通知設定",
      description: "通知条件、アラート、配信ルールの設定。",
      href: "/app/settings/notifications",
      badge: "Placeholder",
    },
    {
      key: "security",
      title: "セキュリティ",
      description: "セッション、安全設定、監査まわりの設定。",
      href: "/app/settings/security",
      badge: "Placeholder",
    },
    {
      key: "profile",
      title: "プロフィール",
      description: "表示名、個人プロフィール、基本情報の設定。",
      href: "/app/settings/profile",
      badge: "Placeholder",
    },
  ];

  return (
    <main className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-white/60 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_52%,#334155_100%)] p-7 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
        <div className="inline-flex rounded-full bg-white/12 px-3 py-1 text-[11px] font-medium text-white/90">
          Settings Center
        </div>

        <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-[34px] font-semibold tracking-tight">設定</h1>
            <div className="mt-3 max-w-3xl text-sm text-white/80">
              LedgerSeiri の会社情報、店舗、プラン、権限、通知、安全設定をここから管理します。
              Step45 では Settings を production 入口ページとして整理し、後続の Company / Stores / Billing 実装へ接続します。
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-[20px] bg-white/92 p-4 text-slate-900 shadow-sm">
              <div className="text-[11px] font-medium text-slate-500">Primary</div>
              <div className="mt-2 text-xl font-semibold">{primaryCards.length}</div>
            </div>
            <div className="rounded-[20px] bg-white/92 p-4 text-slate-900 shadow-sm">
              <div className="text-[11px] font-medium text-slate-500">Secondary</div>
              <div className="mt-2 text-xl font-semibold">{secondaryCards.length}</div>
            </div>
            <div className="rounded-[20px] bg-white/92 p-4 text-slate-900 shadow-sm">
              <div className="text-[11px] font-medium text-slate-500">Live Now</div>
              <div className="mt-2 text-xl font-semibold">Billing</div>
            </div>
            <div className="rounded-[20px] bg-white/92 p-4 text-slate-900 shadow-sm">
              <div className="text-[11px] font-medium text-slate-500">Next</div>
              <div className="mt-2 text-xl font-semibold">Company / Stores</div>
            </div>
          </div>
        </div>
      </section>

      <section className="ls-card-solid rounded-[28px] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-slate-900">主要設定</div>
            <div className="mt-1 text-[12px] text-slate-500">
              まず先に production 化する対象。Company / Stores / Billing を中心に接続します。
            </div>
          </div>

          <Link
            href={withLang(lang, "/app/billing")}
            className="ls-btn ls-btn-ghost inline-flex px-4 py-2 text-sm font-semibold"
          >
            Billing を開く
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
          {primaryCards.map((card) => (
            <Link
              key={card.key}
              href={withLang(lang, card.href)}
              className="group rounded-[24px] border border-black/5 bg-white p-5 transition hover:-translate-y-0.5 hover:border-[color:var(--ls-primary)]/25 hover:shadow-[0_16px_30px_rgba(15,23,42,0.08)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold text-slate-900">{card.title}</div>
                  <div className="mt-2 text-sm text-slate-600">{card.description}</div>
                </div>

                {card.badge ? (
                  <span className="inline-flex rounded-full border border-black/5 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                    {card.badge}
                  </span>
                ) : null}
              </div>

              <div className="mt-5 inline-flex items-center text-sm font-medium text-[color:var(--ls-primary)]">
                開く
                <span className="ml-2 transition group-hover:translate-x-0.5">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="ls-card-solid rounded-[28px] p-5">
        <div className="text-sm font-semibold text-slate-900">補助設定</div>
        <div className="mt-1 text-[12px] text-slate-500">
          現段階では production style placeholder。後続フェーズで個別に API と接続します。
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {secondaryCards.map((card) => (
            <Link
              key={card.key}
              href={withLang(lang, card.href)}
              className="rounded-[22px] border border-black/5 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-base font-semibold text-slate-900">{card.title}</div>
                {card.badge ? (
                  <span className="inline-flex rounded-full border border-black/5 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                    {card.badge}
                  </span>
                ) : null}
              </div>
              <div className="mt-2 text-sm text-slate-600">{card.description}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="ls-card-solid rounded-[28px] p-5 xl:col-span-2">
          <div className="text-sm font-semibold text-slate-900">Step45 実装ガイド</div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-[22px] border border-black/5 bg-slate-50 p-4">
              <div className="text-[11px] font-medium text-slate-500">Step45-B</div>
              <div className="mt-2 text-base font-semibold text-slate-900">Settings Home</div>
              <div className="mt-2 text-sm text-slate-600">設定トップの production 入口化。</div>
            </div>
            <div className="rounded-[22px] border border-black/5 bg-slate-50 p-4">
              <div className="text-[11px] font-medium text-slate-500">Step45-C</div>
              <div className="mt-2 text-base font-semibold text-slate-900">Company</div>
              <div className="mt-2 text-sm text-slate-600">会社情報ページを real API に接続。</div>
            </div>
            <div className="rounded-[22px] border border-black/5 bg-slate-50 p-4">
              <div className="text-[11px] font-medium text-slate-500">Step45-D</div>
              <div className="mt-2 text-base font-semibold text-slate-900">Stores</div>
              <div className="mt-2 text-sm text-slate-600">店舗一覧と新規作成の接続。</div>
            </div>
          </div>
        </div>

        <div className="ls-card-solid rounded-[28px] p-5">
          <div className="text-sm font-semibold text-slate-900">Quick Links</div>
          <div className="mt-4 space-y-3">
            <Link
              href={withLang(lang, "/app/settings/company")}
              className="block rounded-[18px] border border-black/5 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              会社情報
            </Link>
            <Link
              href={withLang(lang, "/app/settings/stores")}
              className="block rounded-[18px] border border-black/5 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              店舗管理
            </Link>
            <Link
              href={withLang(lang, "/app/billing")}
              className="block rounded-[18px] border border-black/5 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              プラン情報
            </Link>
            <Link
              href={withLang(lang, "/app/billing/change")}
              className="block rounded-[18px] border border-black/5 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              プラン変更
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
