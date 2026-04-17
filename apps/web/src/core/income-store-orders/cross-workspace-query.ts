export type CrossWorkspaceQuery = {
  from: string;
  autoDrawer: boolean;
  orderId: string;
  sku: string;
  date: string;
  kind: string;
  transactionId: string;
  focusChargeId: string;
  sourceType: string;
  view: string;
  importJobId: string;
  months: string[];
  module: string;
};

export type ImportAwareWorkspaceContext = {
  active: boolean;
  from: string;
  importJobId: string;
  months: string[];
  module: string;
};

type SearchParamsLike = {
  get: (key: string) => string | null;
};

function setIfPresent(
  params: URLSearchParams,
  key: string,
  value: string | null | undefined
) {
  const normalized = String(value || "").trim();
  if (normalized) {
    params.set(key, normalized);
  }
}

function readArrayParam(raw: string): string[] {
  return String(raw || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function setArrayParam(
  params: URLSearchParams,
  key: string,
  values: string[] | null | undefined
) {
  const normalized = Array.isArray(values)
    ? values.map((x) => String(x || "").trim()).filter(Boolean)
    : [];
  if (normalized.length > 0) {
    params.set(key, normalized.join(","));
  }
}

export function readCrossWorkspaceQuery(
  searchParams: SearchParamsLike | URLSearchParams | null | undefined
): CrossWorkspaceQuery {
  const get = (key: string) => String(searchParams?.get(key) || "");

  return {
    from: get("from"),
    autoDrawer: get("autoDrawer") === "1",
    orderId: get("orderId"),
    sku: get("sku"),
    date: get("date"),
    kind: get("kind"),
    transactionId: get("transactionId"),
    focusChargeId: get("focusChargeId"),
    sourceType: get("sourceType"),
    view: get("view"),
    importJobId: get("importJobId"),
    months: readArrayParam(get("months")),
    module: get("module"),
  };
}

export function readImportAwareWorkspaceContext(
  searchParams: SearchParamsLike | URLSearchParams | null | undefined
): ImportAwareWorkspaceContext {
  const query = readCrossWorkspaceQuery(searchParams);
  const active = query.from === "import-commit";

  return {
    active,
    from: query.from,
    importJobId: query.importJobId,
    months: query.months,
    module: query.module,
  };
}

export function buildImportAwareBannerText(args: {
  targetLabel: string;
  importJobId: string;
  months: string[];
}) {
  return {
    title: `导入已完成，已跳转到 ${args.targetLabel} 工作台`,
    subtitle: `importJobId: ${args.importJobId || "-"} / months: ${
      args.months.length ? args.months.join(", ") : "-"
    }`,
  };
}

export function buildStoreOperationWorkspaceHref(args: {
  lang: string;
  from?: string;
  autoDrawer?: boolean;
  orderId?: string | null;
  sku?: string | null;
  date?: string | null;
  kind?: string | null;
  transactionId?: string | null;
  focusChargeId?: string | null;
  sourceType?: string | null;
  view?: string | null;
  importJobId?: string | null;
  months?: string[] | null;
  module?: string | null;
}) {
  const params = new URLSearchParams();

  setIfPresent(params, "from", args.from || "store-order-breakdown");
  if (args.autoDrawer) params.set("autoDrawer", "1");
  setIfPresent(params, "orderId", args.orderId);
  setIfPresent(params, "sku", args.sku);
  setIfPresent(params, "date", args.date);
  setIfPresent(params, "kind", args.kind);
  setIfPresent(params, "transactionId", args.transactionId);
  setIfPresent(params, "focusChargeId", args.focusChargeId);
  setIfPresent(params, "sourceType", args.sourceType);
  setIfPresent(params, "view", args.view);
  setIfPresent(params, "importJobId", args.importJobId);
  setArrayParam(params, "months", args.months || []);
  setIfPresent(params, "module", args.module);

  const query = params.toString();
  return query
    ? `/${args.lang}/app/expenses/store-operation?${query}`
    : `/${args.lang}/app/expenses/store-operation`;
}

export function buildStoreOrdersWorkspaceHref(args: {
  lang: string;
  from?: string;
  autoDrawer?: boolean;
  orderId?: string | null;
  sku?: string | null;
  date?: string | null;
  transactionId?: string | null;
  focusChargeId?: string | null;
  importJobId?: string | null;
  months?: string[] | null;
  module?: string | null;
}) {
  const params = new URLSearchParams();

  setIfPresent(params, "from", args.from || "store-operation-drawer");
  if (args.autoDrawer) params.set("autoDrawer", "1");
  setIfPresent(params, "orderId", args.orderId);
  setIfPresent(params, "sku", args.sku);
  setIfPresent(params, "date", args.date);
  setIfPresent(params, "transactionId", args.transactionId);
  setIfPresent(params, "focusChargeId", args.focusChargeId);
  setIfPresent(params, "importJobId", args.importJobId);
  setArrayParam(params, "months", args.months || []);
  setIfPresent(params, "module", args.module);

  const query = params.toString();
  return query
    ? `/${args.lang}/app/income/store-orders?${query}`
    : `/${args.lang}/app/income/store-orders`;
}

export function buildImportCommitWorkspaceHref(args: {
  lang: string;
  moduleMode: "store-orders" | "store-operation";
  importJobId: string;
  months: string[];
}) {
  if (args.moduleMode === "store-operation") {
    return buildStoreOperationWorkspaceHref({
      lang: args.lang,
      from: "import-commit",
      importJobId: args.importJobId,
      months: args.months,
      module: args.moduleMode,
    });
  }

  return buildStoreOrdersWorkspaceHref({
    lang: args.lang,
    from: "import-commit",
    importJobId: args.importJobId,
    months: args.months,
    module: args.moduleMode,
  });
}
