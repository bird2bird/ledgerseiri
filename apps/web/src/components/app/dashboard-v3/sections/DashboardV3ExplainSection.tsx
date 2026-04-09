import React from "react";
import type { DashboardV3ExplainSummary } from "@/core/dashboard-v3/types";
import { DashboardV3ExplainPreview } from "@/components/app/dashboard-v3-preview/DashboardV3ExplainPreview";

type Props = {
  lang: string;
  items: DashboardV3ExplainSummary[];
};

export function DashboardV3ExplainSection(props: Props) {
  return <DashboardV3ExplainPreview lang={props.lang} items={props.items} />;
}
