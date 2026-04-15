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
};

type SearchParamsLike = {
  get: (key: string) => string | null;
};

function setIfPresent(params: URLSearchParams, key: string, value: string | null | undefined) {
  const normalized = String(value || "").trim();
  if (normalized) {
    params.set(key, normalized);
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
}) {
  const params = new URLSearchParams();

  setIfPresent(params, "from", args.from || "store-operation-drawer");
  if (args.autoDrawer) params.set("autoDrawer", "1");
  setIfPresent(params, "orderId", args.orderId);
  setIfPresent(params, "sku", args.sku);
  setIfPresent(params, "date", args.date);
  setIfPresent(params, "transactionId", args.transactionId);
  setIfPresent(params, "focusChargeId", args.focusChargeId);

  const query = params.toString();
  return query
    ? `/${args.lang}/app/income/store-orders?${query}`
    : `/${args.lang}/app/income/store-orders`;
}
