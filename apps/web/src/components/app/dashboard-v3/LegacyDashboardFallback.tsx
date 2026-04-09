import React from "react";
import type { BusinessViewType } from "@/core/business-view";
import { getBusinessViewConfig } from "@/core/business-view/config";

type Props = {
  businessView: BusinessViewType;
  children: React.ReactNode;
};

export function LegacyDashboardFallback(props: Props) {
  const cfg = getBusinessViewConfig(props.businessView);

  return (
    <details className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
      <summary className="cursor-pointer text-sm font-semibold text-slate-900">
        {cfg.legacyTitle}
      </summary>
      <div className="mt-5">{props.children}</div>
    </details>
  );
}
