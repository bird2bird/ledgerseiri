import React from "react";
import { AiInsightsRow } from "./AiInsightsRow";

export function AiInsightsOperationalInsightsCard(props: {
  items: Array<{
    title: string;
    detail: string;
    tone?: "default" | "good" | "watch";
    href?: string;
  }>;
}) {
  return (
    <div className="ls-card-solid rounded-[28px] p-6">
      <div className="text-sm font-semibold text-slate-900">AI-generated operational insights</div>
      <div className="mt-4 space-y-3">
        {props.items.map((item, index) => (
          <AiInsightsRow
            key={`${item.title}-${index}`}
            title={item.title}
            detail={item.detail}
            tone={item.tone}
            href={item.href}
          />
        ))}
      </div>
    </div>
  );
}
