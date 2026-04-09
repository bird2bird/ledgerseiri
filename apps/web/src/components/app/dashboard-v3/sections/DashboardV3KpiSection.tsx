import React from "react";
import type { DashboardV3Kpi } from "@/core/dashboard-v3/types";
import { DashboardV3KpiRow } from "@/components/app/dashboard-v3-preview/DashboardV3KpiRow";

type Props = {
  items: DashboardV3Kpi[];
};

export function DashboardV3KpiSection(props: Props) {
  return <DashboardV3KpiRow items={props.items} />;
}
