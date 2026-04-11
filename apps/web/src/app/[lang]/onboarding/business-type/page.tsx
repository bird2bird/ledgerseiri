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
};

const OPTIONS: BusinessTypeOption[] = [
  {
    value: "amazon",
    title: "Amazon販売",
    description: "売上・入金・手数料差額を見える化",
  },
  {
    value: "ec",
    title: "EC",
    description: "ネット販売向けの経営データ管理",
  },
  {
    value: "restaurant",
    title: "飲食店",
    description: "売上・原価・利益の流れを把握",
  },
  {
    value: "generic",
    title: "その他",
    description: "一般的な中小事業者向け",
  },
];

function getNextHref(lang: Lang, type: BusinessType, nextPath?: string | null): string {
  const fallback = nextPath && nextPath.trim() ? nextPath : `/${lang}/app`;

  if (type === "amazon") {
    return `/${lang}/onboarding/aha/amazon?next=${encodeURIComponent(fallback)}`;
  }

  return fallback;
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
    <div className="min-h-screen bg-[#f8fafc] px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            Step 1 / Onboarding
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
            事業タイプを選択してください
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            最初に近い事業タイプを選ぶと、あなた向けの画面から始められます。
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-2">
          {OPTIONS.map((option) => {
            const active = selected === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelected(option.value)}
                className={
                  "rounded-3xl border bg-white p-6 text-left shadow-sm transition " +
                  (active
                    ? "border-blue-500 ring-2 ring-blue-200"
                    : "border-black/5 hover:border-slate-300 hover:bg-slate-50")
                }
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-semibold text-slate-900">{option.title}</div>
                    <div className="mt-2 text-sm leading-6 text-slate-600">
                      {option.description}
                    </div>
                  </div>

                  <div
                    className={
                      "mt-1 h-5 w-5 rounded-full border " +
                      (active
                        ? "border-blue-500 bg-blue-500"
                        : "border-slate-300 bg-white")
                    }
                  />
                </div>
              </button>
            );
          })}
        </div>

        <div className="mx-auto mt-8 flex max-w-4xl justify-end">
          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
            className="inline-flex items-center justify-center rounded-full bg-[#2b5cff] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "処理中..." : "続ける"}
          </button>
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
