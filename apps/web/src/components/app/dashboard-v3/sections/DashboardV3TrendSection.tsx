import React from "react";
import type { DashboardV3TrendSeries } from "@/core/dashboard-v3/types";
import { DashboardV3TrendPreview } from "@/components/app/dashboard-v3-preview/DashboardV3TrendPreview";

type Props = {
  items: DashboardV3TrendSeries[];
};

export function DashboardV3TrendSection(props: Props) {
  return <DashboardV3TrendPreview items={props.items} />;
}
