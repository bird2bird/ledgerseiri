"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";
import {
  type BusinessType,
  readBusinessTypeFromStorage,
  writeBusinessTypeToStorage,
} from "@/core/onboarding/business-type";
import {
  readBusinessViewCookieFromDocument,
  writeBusinessViewCookie,
} from "@/core/business-view/storage";

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

function normalizeSelected(
  storageValue: BusinessType | null,
  cookieValue: BusinessType | null
): BusinessType {
  return storageValue || cookieValue || "generic";
}

export function BusinessTypeSettingsCard() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const lang: Lang = normalizeLang(params?.lang);

  const [selected, setSelected] = useState<BusinessType>("generic");
  const [saved, setSaved] = useState<BusinessType>("generic");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const storageValue = readBusinessTypeFromStorage();
    const cookieValue = readBusinessViewCookieFromDocument();
    const current = normalizeSelected(storageValue, cookieValue);
    setSelected(current);
    setSaved(current);
  }, []);

  const dirty = useMemo(() => selected !== saved, [selected, saved]);

  async function handleSave() {
    if (saving || !dirty) return;

    setSaving(true);
    setNotice("");

    try {
      writeBusinessTypeToStorage(selected);
      writeBusinessViewCookie(selected);
      setSaved(selected);
      setNotice("事業タイプを更新しました。ダッシュボードを切り替えます。");
      router.push(`/${lang}/app`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-2xl">
          <div className="text-2xl font-semibold text-slate-900">事業タイプ</div>
          <div className="mt-2 text-sm leading-7 text-slate-600">
            初回選択した business type をここで変更できます。保存後、Dashboard の中身が新しい事業タイプに切り替わります。
          </div>
        </div>

        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
          Current: {saved}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {OPTIONS.map((option) => {
          const active = selected === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelected(option.value)}
              className={
                "rounded-3xl border p-5 text-left transition " +
                (active
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                  : "border-black/5 bg-white hover:bg-slate-50")
              }
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold text-slate-900">
                    {option.title}
                  </div>
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

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-500">
          {notice || "保存すると、以後のログインでもこの type が使われます。"}
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving}
          className="inline-flex items-center justify-center rounded-full bg-[#2b5cff] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存して反映"}
        </button>
      </div>
    </div>
  );
}
