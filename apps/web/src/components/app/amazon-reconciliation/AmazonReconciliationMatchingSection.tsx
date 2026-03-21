import React from "react";
import type { MatchingSummaryCardModel } from "@/core/amazon-reconciliation";
import { AmazonReconciliationMatchingSummaryCard } from "@/components/app/amazon-reconciliation/AmazonReconciliationMatchingSummaryCard";

export function AmazonReconciliationMatchingSection(props: {
  lang: string;
  model: MatchingSummaryCardModel;
}) {
  return (
    <section className="grid grid-cols-1 gap-6">
      <AmazonReconciliationMatchingSummaryCard
        lang={props.lang}
        model={props.model}
      />
    </section>
  );
}
