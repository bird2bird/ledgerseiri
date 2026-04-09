import React from "react";
import Link from "next/link";
import type { BusinessViewType } from "@/core/business-view";
import { getDashboardActionMap } from "@/core/dashboard-v3/action-map";

type Props = {
  lang: string;
  businessView: BusinessViewType;
};

export function DashboardV3MigrationPanel(props: Props) {
  const actions = getDashboardActionMap({
    lang: props.lang,
    businessView: props.businessView,
  });

  return (
    <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
      <div className="text-sm font-semibold text-slate-900">
        Legacy migration guidance
      </div>
      <div className="mt-2 text-sm leading-6 text-slate-700">
        V3 cockpit を主導線にしつつ、必要に応じて既存画面へ移動できます。
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={actions.primaryReportHref}
          className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-100"
        >
          主要レポートへ
        </Link>
        <Link
          href={actions.anomalyWorkspaceHref}
          className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-100"
        >
          異常確認へ
        </Link>
        <Link
          href={actions.explainWorkspaceHref}
          className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-100"
        >
          Explain 関連へ
        </Link>
      </div>
    </div>
  );
}
