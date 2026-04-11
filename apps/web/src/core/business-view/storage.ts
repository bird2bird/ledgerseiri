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
