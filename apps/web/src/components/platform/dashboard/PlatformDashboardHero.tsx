import Link from "next/link";
import { PlatformLanguageSwitch } from "@/components/platform/PlatformLanguageSwitch";

export function PlatformDashboardHero({
  lang,
  workspaceLabel,
  heroTitle,
  heroSubtitle,
  heroBadgeA,
  heroBadgeB,
  heroBadgeC,
  totalUsers,
  currentMrr,
  riskTenants,
  reloadLabel,
  onReload,
  backToWorkspaces,
  openUsers,
  openOperations,
  openAudit,
  openReviewQueue,
}: {
  lang: string;
  workspaceLabel: string;
  heroTitle: string;
  heroSubtitle: string;
  heroBadgeA: string;
  heroBadgeB: string;
  heroBadgeC: string;
  totalUsers: string;
  currentMrr: string;
  riskTenants: string;
  reloadLabel: string;
  onReload: () => void;
  backToWorkspaces: string;
  openUsers: string;
  openOperations: string;
  openAudit: string;
  openReviewQueue: string;
}) {
  return (
    <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(88,28,135,0.35),rgba(37,99,235,0.18),rgba(8,145,178,0.28))]">
      <div className="grid gap-6 px-8 py-8 xl:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-cyan-100">
              {heroBadgeA}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-violet-100">
              {heroBadgeB}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-emerald-100">
              {heroBadgeC}
            </span>
          </div>

          <div className="mt-8 text-xs uppercase tracking-[0.34em] text-cyan-200/80">{workspaceLabel}</div>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white xl:text-5xl">
            {heroTitle}
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-200/85">{heroSubtitle}</p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.2em] text-slate-300">Users</div>
              <div className="mt-2 text-2xl font-semibold text-white">{totalUsers}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.2em] text-slate-300">MRR</div>
              <div className="mt-2 text-2xl font-semibold text-white">{currentMrr}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.2em] text-slate-300">Risk</div>
              <div className="mt-2 text-2xl font-semibold text-white">{riskTenants}</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 xl:items-end">
          <div className="flex flex-wrap items-center gap-3">
            <PlatformLanguageSwitch lang={lang} path="/platform/dashboard" />
            <button
              type="button"
              onClick={onReload}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-100 hover:bg-white/10"
            >
              {reloadLabel}
            </button>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 xl:max-w-md">
            <Link
              href={`/${lang}/platform/users`}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-100 transition hover:bg-white/10"
            >
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{backToWorkspaces}</div>
              <div className="mt-2 font-semibold">{openUsers}</div>
            </Link>
            <Link
              href={`/${lang}/platform/operations`}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-100 transition hover:bg-white/10"
            >
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{backToWorkspaces}</div>
              <div className="mt-2 font-semibold">{openOperations}</div>
            </Link>
            <Link
              href={`/${lang}/platform/audit`}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-100 transition hover:bg-white/10"
            >
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{backToWorkspaces}</div>
              <div className="mt-2 font-semibold">{openAudit}</div>
            </Link>
            <Link
              href={`/${lang}/platform/reconciliation`}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-100 transition hover:bg-white/10"
            >
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{backToWorkspaces}</div>
              <div className="mt-2 font-semibold">{openReviewQueue}</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
