import { PlatformDashboardSectionCard } from "./PlatformDashboardSectionCard";

export function PlatformDashboardDonutCard({
  title,
  rows,
  total,
  colorStops,
  renderMeta,
}: {
  title: string;
  rows: Array<{ label: string; value: number; meta?: string }>;
  total: number;
  colorStops: string[];
  renderMeta?: (row: { label: string; value: number; meta?: string }) => string | undefined;
}) {
  const safeTotal = Math.max(1, total);
  let cursor = 0;
  const segments = rows.map((row, idx) => {
    const pct = (row.value / safeTotal) * 100;
    const start = cursor;
    const end = cursor + pct;
    cursor = end;
    return `${colorStops[idx % colorStops.length]} ${start.toFixed(1)}% ${end.toFixed(1)}%`;
  });

  return (
    <PlatformDashboardSectionCard title={title}>
      <div className="grid items-center gap-6 md:grid-cols-[180px_1fr]">
        <div className="flex justify-center">
          <div
            className="relative h-40 w-40 rounded-full border border-white/10"
            style={{ background: `conic-gradient(${segments.join(", ")})` }}
          >
            <div className="absolute inset-[22px] rounded-full bg-[#0d1230]" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Total</div>
              <div className="mt-2 text-2xl font-semibold text-white">{Number(total || 0).toLocaleString("en-US")}</div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {rows.map((row, idx) => (
            <div key={row.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: colorStops[idx % colorStops.length] }}
                  />
                  <span className="text-sm text-slate-200">{row.label}</span>
                </div>
                <div className="text-sm font-semibold text-white">
                  {Number(row.value || 0).toLocaleString("en-US")}
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-400">
                {((row.value / safeTotal) * 100).toFixed(1)}%
                {renderMeta && renderMeta(row) ? ` · ${renderMeta(row)}` : ""}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PlatformDashboardSectionCard>
  );
}
