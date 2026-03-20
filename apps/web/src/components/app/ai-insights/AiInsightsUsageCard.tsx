import React from "react";
import { AiInsightsStatCard } from "./AiInsightsStatCard";

export function AiInsightsUsageCard(props: {
  aiChatUsedMonthly?: number;
  aiChatMonthly?: number;
  aiChatPctText: string;
  aiInvoiceOcrUsedMonthly?: number;
  aiInvoiceOcrMonthly?: number;
  aiInvoiceOcrPctText: string;
}) {
  return (
    <section className="ls-card-solid rounded-[28px] p-6">
      <div className="text-sm font-semibold text-slate-900">利用枠</div>
      <div className="mt-4 space-y-3">
        <AiInsightsStatCard
          title="AI Chat"
          value={`${props.aiChatUsedMonthly ?? 0} / ${props.aiChatMonthly ?? 0}`}
          helper={props.aiChatPctText}
          tone="primary"
        />
        <AiInsightsStatCard
          title="AI OCR"
          value={`${props.aiInvoiceOcrUsedMonthly ?? 0} / ${props.aiInvoiceOcrMonthly ?? 0}`}
          helper={props.aiInvoiceOcrPctText}
          tone="default"
        />
      </div>
    </section>
  );
}
