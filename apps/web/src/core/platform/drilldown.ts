export type PlatformDrilldownQueryValue =
  | string
  | number
  | boolean
  | null
  | undefined;

export type PlatformDrilldownQuery = Record<string, PlatformDrilldownQueryValue>;

export type PlatformDrilldownFrom =
  | "users_detail"
  | "users_detail_latest_operation"
  | "users_detail_latest_audit"
  | "users_recent_operations"
  | "users_recent_audits"
  | "operations_detail"
  | "operations_item";

export function buildPlatformQueryString(
  params?: PlatformDrilldownQuery
): string {
  const sp = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    sp.set(key, String(value));
  });
  return sp.toString();
}

function buildPlatformHref(
  lang: string,
  page: "audit" | "reconciliation" | "operations" | "users",
  params?: PlatformDrilldownQuery
): string {
  const qs = buildPlatformQueryString(params);
  return `/${lang}/platform/${page}${qs ? `?${qs}` : ""}`;
}

export function buildPlatformAuditHref(
  lang: string,
  params?: PlatformDrilldownQuery
): string {
  return buildPlatformHref(lang, "audit", params);
}

export function buildPlatformReconciliationHref(
  lang: string,
  params?: PlatformDrilldownQuery
): string {
  return buildPlatformHref(lang, "reconciliation", params);
}

export function buildPlatformOperationsHref(
  lang: string,
  params?: PlatformDrilldownQuery
): string {
  return buildPlatformHref(lang, "operations", params);
}

export function buildPlatformUsersHref(
  lang: string,
  params?: PlatformDrilldownQuery
): string {
  return buildPlatformHref(lang, "users", params);
}

export function buildPlatformSourceBackLink(
  lang: string,
  args: {
    from?: string;
    selected?: string;
    operationId?: string;
    companyId?: string;
    candidateId?: string;
    persistenceKey?: string;
  }
): { href: string; label: string } | null {
  const from = args.from || "";
  const selected = args.selected || "";
  const operationId = args.operationId || "";
  const companyId = args.companyId || "";
  const candidateId = args.candidateId || "";
  const persistenceKey = args.persistenceKey || "";

  if (from.startsWith("users_") || from === "users_detail") {
    return {
      href: buildPlatformUsersHref(lang, {
        selected,
        companyId,
        candidateId,
        persistenceKey,
        operationId,
      }),
      label: "Back to Users",
    };
  }

  if (from.startsWith("operations_")) {
    return {
      href: buildPlatformOperationsHref(lang, {
        selected: operationId || selected,
      }),
      label: "Back to Operations",
    };
  }

  return null;
}
