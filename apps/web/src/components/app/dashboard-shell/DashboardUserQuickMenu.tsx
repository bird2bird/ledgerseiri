"use client";

import React from "react";
import Link from "next/link";
import type { BusinessViewType } from "@/core/business-view";

type Props = {
  lang: string;
  businessView: BusinessViewType;
};

function labelOf(view: BusinessViewType): string {
  if (view === "amazon") return "Amazon";
  if (view === "ec") return "EC";
  if (view === "restaurant") return "飲食店";
  return "その他";
}

export function DashboardUserQuickMenu(props: Props) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm">
        <span className="font-medium">Business Type</span>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-900">
          {labelOf(props.businessView)}
        </span>
      </div>

      <Link
        href={`/${props.lang}/app/settings/profile`}
        className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
      >
        事業タイプを変更
      </Link>
    </div>
  );
}
