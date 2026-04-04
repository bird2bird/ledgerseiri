import { PlatformDashboardSectionCard } from "./PlatformDashboardSectionCard";

export function PlatformDashboardPaymentIntelPanel({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: string }>;
}) {
  return (
    <PlatformDashboardSectionCard title={title}>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-2">
        {rows.map((row, index) => (
          <div
            key={`${row.label}-${index}`}
            className={`rounded-2xl border border-white/10 bg-white/5 p-4 ${index === rows.length - 1 && rows.length % 2 === 1 ? "md:col-span-2" : ""}`}
          >
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{row.label}</div>
            <div className="mt-2 text-2xl font-semibold text-white">{row.value}</div>
          </div>
        ))}
      </div>
    </PlatformDashboardSectionCard>
  );
}
