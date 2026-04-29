"use client";

import { useParams } from "next/navigation";
import { ExpenseCategoryProductWorkspace } from "@/components/app/expenses/ExpenseCategoryProductWorkspace";

export default function OtherExpensePage() {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang ?? "ja";

  return <ExpenseCategoryProductWorkspace lang={lang} kind="other-expense" />;
}
