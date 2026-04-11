import type { BusinessViewType } from "@/core/business-view";
import { normalizeBusinessView } from "@/core/business-view";

export const BUSINESS_VIEW_COOKIE = "ls_business_view";

export function readBusinessViewFromUnknown(value: unknown): BusinessViewType | null {
  if (typeof value !== "string" || !value.trim()) return null;
  return normalizeBusinessView(value);
}

export function writeBusinessViewCookie(value: BusinessViewType) {
  document.cookie = `${BUSINESS_VIEW_COOKIE}=${value}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}


export function readBusinessViewCookieFromDocument() {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie ? document.cookie.split("; ") : [];
  const target = cookies.find((item) => item.startsWith(`${BUSINESS_VIEW_COOKIE}=`));
  if (!target) return null;

  const value = target.slice(`${BUSINESS_VIEW_COOKIE}=`.length);
  return readBusinessViewFromUnknown(value);
}

export function clearBusinessViewCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${BUSINESS_VIEW_COOKIE}=; path=/; max-age=0; samesite=lax`;
}
