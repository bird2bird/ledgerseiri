import { headers } from "next/headers";
import { redirect } from "next/navigation";

function buildQs(sp?: Record<string, string | string[] | undefined>) {
  const qs = new URLSearchParams();

  if (!sp) return "";

  for (const [key, value] of Object.entries(sp)) {
    if (typeof value === "string" && value.length > 0) {
      qs.set(key, value);
      continue;
    }

    if (Array.isArray(value)) {
      for (const v of value) {
        if (typeof v === "string" && v.length > 0) qs.append(key, v);
      }
    }
  }

  const s = qs.toString();
  return s ? `?${s}` : "";
}

export default async function Root({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const h = await headers();
  const sp = await searchParams;
  const suffix = buildQs(sp);
  const acceptLang = h.get("accept-language") || "";

  if (acceptLang.includes("zh-TW")) redirect(`/zh-TW${suffix}`);
  if (acceptLang.includes("zh")) redirect(`/zh-CN${suffix}`);
  if (acceptLang.includes("en")) redirect(`/en${suffix}`);

  redirect(`/ja${suffix}`);
}
