import React from "react";
import type { DashboardV3DistributionBlock } from "@/core/dashboard-v3/types";
import { DashboardV3DistributionPreview } from "@/components/app/dashboard-v3-preview/DashboardV3DistributionPreview";

type Props = {
  items: DashboardV3DistributionBlock[];
};

export function DashboardV3DistributionSection(props: Props) {
  return <DashboardV3DistributionPreview items={props.items} />;
}
