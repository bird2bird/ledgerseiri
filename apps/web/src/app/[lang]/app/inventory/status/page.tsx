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
      title="在庫状況"
      description="商品別・店舗別の在庫状況を確認します。"
      moduleKey="inventory-status"
    />
  );
}
