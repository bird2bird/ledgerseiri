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
      title="ヘルプ"
      description="使い方、FAQ、サポート導線を表示します。"
      moduleKey="help"
    />
  );
}
