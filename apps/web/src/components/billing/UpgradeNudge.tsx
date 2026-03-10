"use client";

import Link from "next/link";
import { useWorkspace } from "@/core/workspace/useWorkspace";

export function UpgradeNudge({ feature }: { feature: string }) {
  const ws = useWorkspace();
  const lang = ws?.workspace?.locale ?? "ja";

  return (
    <div className="rounded-[20px] border border-amber-200 bg-amber-50 p-4 text-sm">
      <div className="font-semibold text-amber-800">
        この機能は現在のプランでは利用できません
      </div>

      <div className="mt-1 text-amber-700">
        機能: {feature}
      </div>

      <Link
        href={`/${lang}/app/billing/change`}
        className="mt-3 inline-block rounded-lg bg-amber-500 px-4 py-2 text-white"
      >
        プランをアップグレード
      </Link>
    </div>
  );
}
