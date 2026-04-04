export type PlatformMetricTone = "cyan" | "violet" | "emerald" | "amber" | "rose" | "sky";

function toneClasses(tone: PlatformMetricTone) {
  switch (tone) {
    case "violet":
      return {
        card: "from-violet-500/30 via-fuchsia-500/15 to-slate-950/40",
        badge: "text-violet-200",
        accent: "bg-violet-400",
      };
    case "emerald":
      return {
        card: "from-emerald-500/30 via-emerald-400/15 to-slate-950/40",
        badge: "text-emerald-200",
        accent: "bg-emerald-400",
      };
    case "amber":
      return {
        card: "from-amber-500/30 via-orange-400/15 to-slate-950/40",
        badge: "text-amber-100",
        accent: "bg-amber-400",
      };
    case "rose":
      return {
        card: "from-rose-500/30 via-pink-400/15 to-slate-950/40",
        badge: "text-rose-100",
        accent: "bg-rose-400",
      };
    case "sky":
      return {
        card: "from-sky-500/30 via-cyan-400/15 to-slate-950/40",
        badge: "text-sky-100",
        accent: "bg-sky-400",
      };
    case "cyan":
    default:
      return {
        card: "from-cyan-500/30 via-blue-500/15 to-slate-950/40",
        badge: "text-cyan-100",
        accent: "bg-cyan-400",
      };
  }
}

export function PlatformDashboardMetricCard({
  title,
  value,
  subtitle,
  tone = "cyan",
}: {
  title: string;
  value: string;
  subtitle?: string;
  tone?: PlatformMetricTone;
}) {
  const palette = toneClasses(tone);
  return (
    <div className={`rounded-[24px] border border-white/10 bg-gradient-to-br ${palette.card} p-4 shadow-[0_10px_30px_rgba(0,0,0,0.18)]`}>
      <div className={`text-[11px] uppercase tracking-[0.24em] ${palette.badge}`}>{title}</div>
      <div className="mt-4 text-3xl font-semibold text-white">{value}</div>
      <div className="mt-3 text-xs text-slate-300">{subtitle || "-"}</div>
      <div className="mt-4 h-1.5 w-16 rounded-full bg-white/10">
        <div className={`h-1.5 w-10 rounded-full ${palette.accent}`} />
      </div>
    </div>
  );
}
