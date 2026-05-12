import { redirect } from "next/navigation";

type Lang = "ja" | "en" | "zh-CN" | "zh-TW";

function normalizeLang(value: string | undefined): Lang {
  if (value === "ja" || value === "en" || value === "zh-CN" || value === "zh-TW") {
    return value;
  }
  return "ja";
}

export default function LegacyLpPage({ params }: { params: { lang?: string } }) {
  const lang = normalizeLang(params?.lang);
  redirect(`/${lang}`);
}
