import type { BusinessViewType } from "@/core/business-view";

export type DashboardTheme = {
  heroClass: string;
  panelClass: string;
  darkPanelClass: string;
  chartPanelClass: string;
  kpiClasses: string[];
  accentText: string;
  focusLabel: string;
};

export function getDashboardTheme(view: BusinessViewType): DashboardTheme {
  if (view === "amazon") {
    return {
      heroClass:
        "bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.28),_transparent_35%),linear-gradient(135deg,#1d2b64_0%,#2b3f8f_45%,#4c1d95_100%)] text-white",
      panelClass: "border-white/10 bg-white/95",
      darkPanelClass:
        "border-white/10 bg-[linear-gradient(135deg,#1e1b4b_0%,#1d4ed8_50%,#581c87_100%)] text-white",
      chartPanelClass:
        "border-white/10 bg-[linear-gradient(135deg,#24115f_0%,#2435a6_50%,#3b0764_100%)] text-white",
      kpiClasses: [
        "bg-[linear-gradient(135deg,#8b5cf6_0%,#c084fc_100%)] text-white",
        "bg-[linear-gradient(135deg,#06b6d4_0%,#67e8f9_100%)] text-slate-900",
        "bg-[linear-gradient(135deg,#f97316_0%,#fb923c_100%)] text-white",
        "bg-[linear-gradient(135deg,#84cc16_0%,#bef264_100%)] text-slate-900",
      ],
      accentText: "Amazonの売上・入金・差額を最優先で把握します。",
      focusLabel: "Amazon operating cockpit",
    };
  }

  if (view === "ec") {
    return {
      heroClass:
        "bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.22),_transparent_35%),linear-gradient(135deg,#0f172a_0%,#14532d_45%,#166534_100%)] text-white",
      panelClass: "border-white/10 bg-white/95",
      darkPanelClass:
        "border-white/10 bg-[linear-gradient(135deg,#052e16_0%,#166534_55%,#15803d_100%)] text-white",
      chartPanelClass:
        "border-white/10 bg-[linear-gradient(135deg,#032b1d_0%,#0f766e_50%,#14532d_100%)] text-white",
      kpiClasses: [
        "bg-[linear-gradient(135deg,#22c55e_0%,#86efac_100%)] text-slate-900",
        "bg-[linear-gradient(135deg,#14b8a6_0%,#5eead4_100%)] text-slate-900",
        "bg-[linear-gradient(135deg,#f59e0b_0%,#fcd34d_100%)] text-slate-900",
        "bg-[linear-gradient(135deg,#60a5fa_0%,#bfdbfe_100%)] text-slate-900",
      ],
      accentText: "回収・費用・受注のバランスを重点的に確認します。",
      focusLabel: "EC operating cockpit",
    };
  }

  if (view === "restaurant") {
    return {
      heroClass:
        "bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.22),_transparent_35%),linear-gradient(135deg,#3f1d0d_0%,#7c2d12_50%,#b45309_100%)] text-white",
      panelClass: "border-white/10 bg-white/95",
      darkPanelClass:
        "border-white/10 bg-[linear-gradient(135deg,#431407_0%,#9a3412_55%,#b45309_100%)] text-white",
      chartPanelClass:
        "border-white/10 bg-[linear-gradient(135deg,#451a03_0%,#92400e_50%,#7c2d12_100%)] text-white",
      kpiClasses: [
        "bg-[linear-gradient(135deg,#f97316_0%,#fdba74_100%)] text-slate-900",
        "bg-[linear-gradient(135deg,#fb7185_0%,#fda4af_100%)] text-slate-900",
        "bg-[linear-gradient(135deg,#f59e0b_0%,#fde68a_100%)] text-slate-900",
        "bg-[linear-gradient(135deg,#a78bfa_0%,#ddd6fe_100%)] text-slate-900",
      ],
      accentText: "売上・原価・人件費の圧力を見える化します。",
      focusLabel: "Restaurant operating cockpit",
    };
  }

  return {
    heroClass:
      "bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_transparent_35%),linear-gradient(135deg,#0f172a_0%,#334155_50%,#1e293b_100%)] text-white",
    panelClass: "border-white/10 bg-white/95",
    darkPanelClass:
      "border-white/10 bg-[linear-gradient(135deg,#111827_0%,#334155_55%,#1e293b_100%)] text-white",
    chartPanelClass:
      "border-white/10 bg-[linear-gradient(135deg,#0f172a_0%,#1e3a8a_50%,#312e81_100%)] text-white",
    kpiClasses: [
      "bg-[linear-gradient(135deg,#6366f1_0%,#a5b4fc_100%)] text-white",
      "bg-[linear-gradient(135deg,#38bdf8_0%,#bae6fd_100%)] text-slate-900",
      "bg-[linear-gradient(135deg,#c084fc_0%,#e9d5ff_100%)] text-slate-900",
      "bg-[linear-gradient(135deg,#94a3b8_0%,#e2e8f0_100%)] text-slate-900",
    ],
    accentText: "売上・入金・費用・案件進行を俯瞰して把握します。",
    focusLabel: "Generic SMB cockpit",
  };
}
