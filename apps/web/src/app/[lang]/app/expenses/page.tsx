"use client";

import React, { useMemo } from "react";
import { useParams } from "next/navigation";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";
import { getAppT } from "@/lib/i18n/app";

export default function Page() {
  const params = useParams<{ lang: string }>();
  const currentLang = useMemo<Lang>(() => normalizeLang(params?.lang), [params?.lang]);
  const t = useMemo(() => getAppT(currentLang), [currentLang]);

  return (
    <div className="ls-card-solid p-4">
      <div className="text-sm font-semibold text-slate-900">{t("listTitleExpenses")}</div>
      <div className="mt-2 text-[12px] text-slate-500">MVP placeholder — next will render real list/table + filters.</div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white">
            <tr className="text-left text-slate-500">
              <th className="px-3 py-2">No.</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Vendor / Memo</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {[1,2,3,4,5].map((i) => (
              <tr key={i} className="border-t hover:bg-slate-50">
                <td className="px-3 py-2 text-slate-700">#20260303_194508-${i}</td>
                <td className="px-3 py-2 text-slate-700">2026-03-0${i}</td>
                <td className="px-3 py-2 text-slate-700">Demo row ${i}</td>
                <td className="px-3 py-2 text-right font-semibold">¥ {i}0,000</td>
                <td className="px-3 py-2 text-slate-600">Draft</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
