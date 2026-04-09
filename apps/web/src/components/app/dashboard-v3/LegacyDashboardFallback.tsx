import React from "react";

type Props = {
  children: React.ReactNode;
};

export function LegacyDashboardFallback(props: Props) {
  return (
    <details className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
      <summary className="cursor-pointer text-sm font-semibold text-slate-900">
        Legacy DashboardHomeV2 fallback
      </summary>
      <div className="mt-5">{props.children}</div>
    </details>
  );
}
