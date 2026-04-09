"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";
import {
  type BusinessType,
  readBusinessTypeFromStorage,
  writeBusinessTypeToStorage,
} from "@/core/onboarding/business-type";

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

function getNextHref(lang: Lang, type: BusinessType): string {
  if (type === "amazon") {
    return `/${lang}/onboarding/aha/amazon`;
  }
  return `/${lang}/app`;
}

export default function BusinessTypePage() {
  const params = useParams<{ lang: string }>();
  const router = useRouter();
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
      router.push(getNextHref(lang, selected));
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
                      (active ? "border-blue-600 bg-blue-600" : "border-slate-300 bg-white")
                    }
                    aria-hidden="true"
                  />
                </div>
              </button>
            );
          })}
        </div>

        <div className="mx-auto mt-8 flex max-w-4xl items-center justify-end">
          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
            className={
              "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white shadow-sm transition " +
              (!canContinue ? "cursor-not-allowed bg-slate-300" : "bg-[#2b5cff] hover:opacity-95")
            }
          >
            {submitting ? "Loading..." : "続ける"}
          </button>
        </div>
      </div>
    </div>
  );
}
