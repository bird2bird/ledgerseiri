"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";
import {
  type BusinessType,
  readBusinessTypeFromStorage,
  writeBusinessTypeToStorage,
} from "@/core/onboarding/business-type";
import { writeBusinessViewCookie } from "@/core/business-view/storage";

type BusinessTypeOption = {
  value: BusinessType;
  title: string;
  description: string;
  badge: string;
  highlights: string[];
};

const OPTIONS: BusinessTypeOption[] = [
  {
    value: "amazon",
    title: "Amazon販売",
    description: "売上・入金・差額・広告費・返金を中心に可視化",
    badge: "Recommended",
    highlights: ["Amazon settlement", "差額Explain", "運営 cockpit"],
  },
  {
    value: "ec",
    title: "EC",
    description: "回収・費用・受注バランスを見える化",
    badge: "Commerce",
    highlights: ["回収管理", "費用分析", "受注 overview"],
  },
  {
    value: "restaurant",
    title: "飲食店",
    description: "売上・原価・人件費・利益圧力を把握",
    badge: "Retail Ops",
    highlights: ["原価率", "人件費圧力", "利益感覚"],
  },
  {
    value: "generic",
    title: "その他",
    description: "一般的な中小事業者向けの経営ダッシュボード",
    badge: "SMB",
    highlights: ["売上・入金", "費用管理", "経営 overview"],
  },
];

function getNextHref(lang: Lang, _type: BusinessType, nextPath?: string | null): string {
  return nextPath && nextPath.trim() ? nextPath : `/${lang}/app`;
}

function selectionLabel(value: BusinessType | null): string {
  if (value === "amazon") return "Amazon販売";
  if (value === "ec") return "EC";
  if (value === "restaurant") return "飲食店";
  if (value === "generic") return "その他";
  return "未選択";
}

function selectionDescription(value: BusinessType | null): string {
  if (value === "amazon") return "Amazonの売上・入金・差額の理解から開始します。";
  if (value === "ec") return "EC運営に必要な回収・費用・受注の整理から開始します。";
  if (value === "restaurant") return "飲食店の売上・原価・利益圧力の把握から開始します。";
  if (value === "generic") return "中小事業者向けの標準ダッシュボードから開始します。";
  return "あなたに合った dashboard を最初から表示します。";
}

function PageContent() {
  const params = useParams<{ lang: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang: Lang = normalizeLang(params?.lang);

  const [selected, setSelected] = useState<BusinessType | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const saved = readBusinessTypeFromStorage();
    if (saved) {
      setSelected(saved);
    }
  }, []);

  const canContinue = useMemo(() => Boolean(selected) && !submitting, [selected, submitting]);

  async function onContinue() {
    if (!selected || submitting) return;

    setSubmitting(true);
    try {
      writeBusinessTypeToStorage(selected);
      writeBusinessViewCookie(selected);
      router.push(getNextHref(lang, selected, searchParams.get("next")));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-6 py-10 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[36px] border border-black/5 bg-white/90 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-8 xl:p-10">
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                Step 1 / Onboarding
              </div>

              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
                あなたの事業に合った
                <br />
                Dashboard から始めます
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
                最初に business type を選ぶと、LedgerSeiri が最初の画面構成・指標・説明導線を最適化します。
                後から設定画面でいつでも変更できます。
              </p>

              <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="text-sm font-semibold text-slate-900">Fast setup</div>
                  <div className="mt-2 text-sm leading-6 text-slate-600">
                    初回の選択だけで、最初の dashboard を自動調整します。
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="text-sm font-semibold text-slate-900">Right metrics</div>
                  <div className="mt-2 text-sm leading-6 text-slate-600">
                    事業タイプごとに重点 KPI と説明の見せ方を切り替えます。
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="text-sm font-semibold text-slate-900">Always changeable</div>
                  <div className="mt-2 text-sm leading-6 text-slate-600">
                    あとでプロフィール設定から business type を変更できます。
                  </div>
                </div>
              </div>

              <div className="mt-8 rounded-[28px] border border-indigo-100 bg-[linear-gradient(135deg,#eef2ff_0%,#f5f3ff_100%)] p-6">
                <div className="text-sm font-semibold text-slate-900">
                  現在の選択
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="inline-flex rounded-full border border-indigo-200 bg-white px-3 py-1 text-sm font-medium text-slate-900">
                    {selectionLabel(selected)}
                  </span>
                  <span className="text-sm text-slate-600">
                    {selectionDescription(selected)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="rounded-[32px] border border-black/5 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-sm md:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-lg font-semibold text-slate-900">
                      Business Type
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      最も近いものを 1 つ選択してください
                    </div>
                  </div>
                  <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700">
                    4 options
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {OPTIONS.map((option) => {
                    const active = selected === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSelected(option.value)}
                        className={
                          "w-full rounded-[28px] border p-5 text-left transition-all " +
                          (active
                            ? "border-blue-500 bg-blue-50 shadow-[0_8px_30px_rgba(59,130,246,0.12)] ring-2 ring-blue-200"
                            : "border-black/5 bg-white hover:border-slate-300 hover:bg-slate-50")
                        }
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="text-xl font-semibold text-slate-900">
                                {option.title}
                              </div>
                              <span
                                className={
                                  "inline-flex rounded-full px-2.5 py-1 text-xs font-medium " +
                                  (active
                                    ? "bg-blue-600 text-white"
                                    : "border border-slate-200 bg-slate-50 text-slate-600")
                                }
                              >
                                {option.badge}
                              </span>
                            </div>

                            <div className="mt-3 text-sm leading-6 text-slate-600">
                              {option.description}
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              {option.highlights.map((item) => (
                                <span
                                  key={item}
                                  className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div
                            className={
                              "mt-1 h-6 w-6 rounded-full border transition " +
                              (active
                                ? "border-blue-500 bg-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.14)]"
                                : "border-slate-300 bg-white")
                            }
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm leading-6 text-slate-500">
                    この選択は後から
                    <span className="font-medium text-slate-700"> 設定 → 個人资料 </span>
                    で変更できます。
                  </div>

                  <button
                    type="button"
                    onClick={onContinue}
                    disabled={!canContinue}
                    className="inline-flex items-center justify-center rounded-full bg-[#2b5cff] px-7 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(43,92,255,0.28)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? "処理中..." : "このタイプで始める"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BusinessTypePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center px-6 py-12">
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-600 shadow-sm">
            Loading...
          </div>
        </div>
      }
    >
      <PageContent />
    </Suspense>
  );
}
