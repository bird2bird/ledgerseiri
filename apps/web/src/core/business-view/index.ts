import { getDashboardCopy } from "@/core/dashboard-copy";

export type BusinessViewType = "amazon" | "ec" | "restaurant" | "generic";

export function normalizeBusinessView(value: unknown): BusinessViewType {
  if (value === "amazon") return "amazon";
  if (value === "ec") return "ec";
  if (value === "restaurant") return "restaurant";
  return "generic";
}

export function getBusinessViewLabel(view: BusinessViewType, lang?: string): string {
  const c = getDashboardCopy(lang);
  return c.businessLabels[view];
}

export function getBusinessViewDescription(view: BusinessViewType, lang?: string): string {
  const c = getDashboardCopy(lang);
  return c.businessDescriptions[view];
}
