"use client";

import { useParams } from "next/navigation";
import { StoreOrderChargesWorkspace } from "@/components/app/income-store-orders/StoreOrderChargesWorkspace";

export default function StoreOrderChargesPage() {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang ?? "ja";

  return <StoreOrderChargesWorkspace lang={lang} />;
}
