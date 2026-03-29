"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";

type PlanLimitEventDetail = {
  message?: string;
  target?: string;
};

function normalizeTarget(raw?: string | null): "starter" | "standard" | "premium" {
  if (raw === "starter" || raw === "standard" || raw === "premium") return raw;
  return "standard";
}

function buildBillingChangePath(lang: string, target: "starter" | "standard" | "premium") {
  return `/${lang}/app/billing/change?target=${target}`;
}

export default function PlanLimitUpgradeModal() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const lang = normalizeLang(params?.lang) as Lang;

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("現在のプラン上限に達しました。アップグレードすると引き続き利用できます。");
  const [target, setTarget] = useState<"starter" | "standard" | "premium">("standard");

  useEffect(() => {
    const onPlanLimit = (evt: Event) => {
      const custom = evt as CustomEvent<PlanLimitEventDetail>;
      const detail = custom?.detail || {};
      setMessage(
        String(detail.message || "現在のプラン上限に達しました。アップグレードすると引き続き利用できます。")
      );
      setTarget(normalizeTarget(detail.target));
      setOpen(true);
    };

    window.addEventListener("ledgerseiri:plan-limit-reached", onPlanLimit as EventListener);
    return () => {
      window.removeEventListener("ledgerseiri:plan-limit-reached", onPlanLimit as EventListener);
    };
  }, []);

  const billingHref = useMemo(() => buildBillingChangePath(lang, target), [lang, target]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 px-4">
      <div className="w-full max-w-lg rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-slate-900">プラン上限に達しました</div>
            <div className="mt-2 text-sm leading-6 text-slate-600">{message}</div>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50"
          >
            閉じる
          </button>
        </div>

        <div className="mt-5 rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
          現在の操作は上限により完了できませんでした。プラン変更ページで上位プランを選択できます。
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-[16px] border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            後で
          </button>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push(billingHref);
            }}
            className="rounded-[16px] bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            プラン変更へ
          </button>
        </div>
      </div>
    </div>
  );
}
