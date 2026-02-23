export type Lang = "ja" | "en" | "zh-CN" | "zh-TW";
export const LANGS: Lang[] = ["ja", "en", "zh-CN", "zh-TW"];

export function normalizeLang(input: any): Lang {
  const s = String(input ?? "").trim();
  if (s === "ja" || s === "en" || s === "zh-CN" || s === "zh-TW") return s;
  // common aliases
  const low = s.toLowerCase();
  if (low === "zh-cn" || low === "zh_hans" || low === "zh-hans") return "zh-CN";
  if (low === "zh-tw" || low === "zh_hant" || low === "zh-hant") return "zh-TW";
  if (low.startsWith("ja")) return "ja";
  if (low.startsWith("en")) return "en";
  if (low.startsWith("zh")) return "zh-CN";
  return "ja";
}

export function isLangSegment(seg: string): seg is Lang {
  return seg === "ja" || seg === "en" || seg === "zh-CN" || seg === "zh-TW";
}

/**
 * Pick preferred language from Accept-Language header.
 * - Priority: ja / en / zh-CN / zh-TW
 * - Fallback: ja
 */
export function pickLangFromAcceptLanguage(header: string | null | undefined): Lang {
  const h = String(header ?? "").trim();
  if (!h) return "ja";

  // parse like: "zh-CN,zh;q=0.9,en;q=0.8,ja;q=0.7"
  const items = h.split(",")
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => {
      const [tag, ...rest] = s.split(";").map(x => x.trim());
      const qPart = rest.find(x => x.startsWith("q="));
      const q = qPart ? Number(qPart.slice(2)) : 1;
      return { tag, q: Number.isFinite(q) ? q : 1 };
    })
    .sort((a,b) => b.q - a.q);

  for (const it of items) {
    const t = it.tag;

    // exact matches
    if (t === "ja" || t.startsWith("ja-")) return "ja";
    if (t === "en" || t.startsWith("en-")) return "en";

    // Chinese handling
    const low = t.toLowerCase();
    if (low === "zh-cn" || low.startsWith("zh-cn")) return "zh-CN";
    if (low === "zh-tw" || low.startsWith("zh-tw")) return "zh-TW";
    if (low === "zh-hans" || low.startsWith("zh-hans")) return "zh-CN";
    if (low === "zh-hant" || low.startsWith("zh-hant")) return "zh-TW";
    if (low.startsWith("zh")) return "zh-CN";
  }

  return "ja";
}
