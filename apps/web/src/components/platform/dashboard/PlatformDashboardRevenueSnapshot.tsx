import { PlatformDashboardMetricCard } from "./PlatformDashboardMetricCard";
import { PlatformDashboardSectionCard } from "./PlatformDashboardSectionCard";

export function PlatformDashboardRevenueSnapshot({
  title,
  currentMrrLabel,
  currentMrrValue,
  currentRevenueSubtitle,
  paidUsersLabel,
  paidUsersValue,
  paidRatioSubtitle,
  arpuLabel,
  arpuValue,
  planArpuSubtitle,
}: {
  title: string;
  currentMrrLabel: string;
  currentMrrValue: string;
  currentRevenueSubtitle: string;
  paidUsersLabel: string;
  paidUsersValue: string;
  paidRatioSubtitle: string;
  arpuLabel: string;
  arpuValue: string;
  planArpuSubtitle: string;
}) {
  return (
    <PlatformDashboardSectionCard title={title}>
      <div className="grid gap-4">
        <PlatformDashboardMetricCard
          title={currentMrrLabel}
          value={currentMrrValue}
          subtitle={currentRevenueSubtitle}
          tone="emerald"
        />
        <PlatformDashboardMetricCard
          title={paidUsersLabel}
          value={paidUsersValue}
          subtitle={paidRatioSubtitle}
          tone="violet"
        />
        <PlatformDashboardMetricCard
          title={arpuLabel}
          value={arpuValue}
          subtitle={planArpuSubtitle}
          tone="cyan"
        />
      </div>
    </PlatformDashboardSectionCard>
  );
}
