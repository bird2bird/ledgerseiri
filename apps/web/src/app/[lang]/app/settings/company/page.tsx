"use client";

import React from "react";
import { useParams } from "next/navigation";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";
import { PagePlaceholder } from "@/components/app/PagePlaceholder";

export default function Page() {
  const params = useParams<{ lang: string }>();
  const lang = normalizeLang(params?.lang) as Lang;

  return (
    <PagePlaceholder
      lang={lang}
      title="会社情報"
      description="会社情報と基本設定を管理します。"
      moduleKey="settings-company"
    />
  );
}
