import React from "react";
import type { MatchingBaselineSummary } from "@/core/amazon-reconciliation";
import { AmazonReconciliationReadinessCard } from "./AmazonReconciliationReadinessCard";
import { AmazonReconciliationQuickActionsCard } from "./AmazonReconciliationQuickActionsCard";

export function AmazonReconciliationBottomSection(props: {
  lang: string;
  matching: MatchingBaselineSummary;
}) {
  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <AmazonReconciliationReadinessCard matching={props.matching} />
      <AmazonReconciliationQuickActionsCard lang={props.lang} />
    </section>
  );
}
