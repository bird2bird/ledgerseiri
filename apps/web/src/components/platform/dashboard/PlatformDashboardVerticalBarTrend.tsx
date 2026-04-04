export function PlatformDashboardVerticalBarTrend({
  rows,
  barKey,
  lineKey,
  barLabel,
  lineLabel,
}: {
  rows: Array<Record<string, any>>;
  barKey: string;
  lineKey: string;
  barLabel: string;
  lineLabel: string;
}) {
  const maxBar = Math.max(1, ...rows.map((r) => Number(r[barKey] || 0)));
  const maxLine = Math.max(1, ...rows.map((r) => Number(r[lineKey] || 0)));

  return (
    <div>
      <div className="mb-4 flex items-center gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-cyan-400" />
          {barLabel}
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-violet-400" />
          {lineLabel}
        </div>
      </div>

      <div className="grid grid-cols-6 gap-3 xl:gap-4">
        {rows.map((row, index) => {
          const barHeight = Math.max(8, (Number(row[barKey] || 0) / maxBar) * 140);
          const lineHeight = Math.max(8, (Number(row[lineKey] || 0) / maxLine) * 140);
          return (
            <div key={`${row.month || row.id || index}`} className="flex flex-col items-center gap-3">
              <div className="flex h-40 items-end gap-2">
                <div
                  className="w-6 rounded-t-xl bg-gradient-to-t from-cyan-500/80 to-emerald-300/80"
                  style={{ height: `${barHeight}px` }}
                  title={`${barLabel}: ${row[barKey] || 0}`}
                />
                <div
                  className="w-2 rounded-full bg-violet-400/90"
                  style={{ height: `${lineHeight}px` }}
                  title={`${lineLabel}: ${row[lineKey] || 0}`}
                />
              </div>
              <div className="text-center text-[11px] text-slate-400">
                {row.month || row.label || row.requestedAt || "-"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
