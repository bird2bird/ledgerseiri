"use client";

import React from "react";
import Link from "next/link";
import type { BusinessViewType } from "@/core/business-view";
import { getDashboardCopy } from "@/core/dashboard-copy";

type Props = {
  lang: string;
  businessView: BusinessViewType;
};

function labelOf(view: BusinessViewType, lang: string): string {
  const c = getDashboardCopy(lang);
  return c.businessLabels[view];
}

export function DashboardUserQuickMenu(props: Props) {
  const copy = getDashboardCopy(props.lang);

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm">
        <span className="font-medium">{copy.quickBusinessType}</span>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-900">
          {labelOf(props.businessView, props.lang)}
        </span>
      </div>

      <Link
        href={`/${props.lang}/app/settings/profile`}
        className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
      >
        {copy.quickChangeType}
      </Link>
    </div>
  );
}
