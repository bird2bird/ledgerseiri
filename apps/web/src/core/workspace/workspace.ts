import type { PlanCode } from "@/components/app/dashboard-v2/types";

export type Workspace = {
  slug: string;
  displayName: string;
  planCode: PlanCode;
};

export function normalizePlanCode(raw?: string): PlanCode {
  if (raw === "starter" || raw === "standard" || raw === "premium") return raw;
  return "starter";
}

export function prettifyDisplayName(input?: string) {
  const raw = (input || "").trim();
  if (!raw) return "Weiwei";

  return raw
    .replace(/[-_]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function resolveMockWorkspace({
  slug,
  plan,
}: {
  slug?: string;
  plan?: string;
}): Workspace {
  const safeSlug = (slug || "weiwei").trim() || "weiwei";

  return {
    slug: safeSlug,
    displayName: prettifyDisplayName(safeSlug),
    planCode: normalizePlanCode(plan),
  };
}
