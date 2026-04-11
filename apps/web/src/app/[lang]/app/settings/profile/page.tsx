import React from "react";
import { BusinessTypeSettingsCard } from "@/components/app/settings/BusinessTypeSettingsCard";

export default function SettingsProfilePage() {
  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
        <div className="text-3xl font-semibold tracking-tight text-slate-900">
          プロフィール設定
        </div>
        <div className="mt-3 text-sm leading-7 text-slate-600">
          アカウントに関する表示設定や、現在のダッシュボード表示に影響する基本設定を変更できます。
        </div>
      </div>

      <BusinessTypeSettingsCard />
    </div>
  );
}
