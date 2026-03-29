import React from "react";
import AppShell from "@/components/app/AppShell";
import PlanLimitUpgradeModal from "@/components/app/PlanLimitUpgradeModal";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      {children}
      <PlanLimitUpgradeModal />
    </AppShell>
  );
}
