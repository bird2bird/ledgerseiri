import React from "react";
import type { BusinessViewType } from "@/core/business-view";
import type { DashboardV3Alert } from "@/core/dashboard-v3/types";
import { DashboardV3AnomalyWorkspace } from "@/components/app/dashboard-v3/DashboardV3AnomalyWorkspace";
import { DashboardV3AlertsPreview } from "@/components/app/dashboard-v3-preview/DashboardV3AlertsPreview";

type Props = {
  lang: string;
  businessView: BusinessViewType;
  items: DashboardV3Alert[];
};

export function DashboardV3AnomalySection(props: Props) {
  return (
    <div className="space-y-6">
      <DashboardV3AnomalyWorkspace businessView={props.businessView} items={props.items} />
      <DashboardV3AlertsPreview lang={props.lang} items={props.items} />
    </div>
  );
}
