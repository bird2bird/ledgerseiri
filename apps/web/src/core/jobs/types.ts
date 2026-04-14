export type JobStatus = "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | string;

export type ImportJobItem = {
  id: string;
  companyId?: string;
  domain?: string | null;
  filename?: string | null;
  status?: JobStatus | null;
  totalRows?: number | null;
  successRows?: number | null;
  failedRows?: number | null;
  errorMessage?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type ExportJobItem = {
  id: string;
  companyId?: string;
  domain?: string | null;
  format?: string | null;
  status?: JobStatus | null;
  filterJson?: unknown;
  fileUrl?: string | null;
  errorMessage?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type MetaSummary = {
  total?: number;
  pending?: number;
  processing?: number;
  succeeded?: number;
  failed?: number;
};

export type ImportJobsResponse = {
  ok?: boolean;
  domain?: string;
  action?: string;
  items?: ImportJobItem[];
  total?: number;
  message?: string;
};

export type ExportJobsResponse = {
  ok?: boolean;
  domain?: string;
  action?: string;
  items?: ExportJobItem[];
  total?: number;
  message?: string;
};

export type ImportMetaResponse = {
  ok?: boolean;
  domain?: string;
  action?: string;
  domains?: Array<{ value: string; label: string }>;
  statuses?: Array<{ value: string; label: string }>;
  summary?: MetaSummary;
  message?: string;
};

export type ExportMetaResponse = {
  ok?: boolean;
  domain?: string;
  action?: string;
  domains?: Array<{ value: string; label: string }>;
  formats?: Array<{ value: string; label: string }>;
  statuses?: Array<{ value: string; label: string }>;
  summary?: MetaSummary;
  message?: string;
};

export type JobsSnapshot = {
  importItems: ImportJobItem[];
  exportItems: ExportJobItem[];
  importMeta: ImportMetaResponse | null;
  exportMeta: ExportMetaResponse | null;
};

export type AmazonStoreOrderRawRow = {
  rowNo: number;
  fields: Record<string, string>;
};

export type AmazonStoreOrderFact = {
  rowNo: number;
  orderId: string;
  orderDate?: string | null;
  sku: string;
  productName: string;
  quantity: number;
  amount: number;

  grossAmount: number;
  netAmount: number;
  feeAmount: number;
  taxAmount: number;
  shippingAmount: number;
  promotionAmount: number;

  rawTransactionType?: string | null;
  signedAmount?: number | null;
  description?: string | null;

  store?: string | null;
  fulfillment?: string | null;
  rawLabel: string;
};

export type AmazonStoreOrdersPreviewSummary = {
  filename: string;
  totalRows: number;
  successRows: number;
  failedRows: number;
  totalAmount: number;
  totalQuantity: number;
  delimiter: "comma" | "tab";
  headers: string[];
};

export type AmazonTransactionChargeKind =
  | "ORDER_SALE"
  | "AD_FEE"
  | "STORAGE_FEE"
  | "SUBSCRIPTION_FEE"
  | "FBA_FEE"
  | "TAX"
  | "PAYOUT"
  | "ADJUSTMENT"
  | "OTHER";

export type AmazonTransactionCharge = {
  id: string;
  rowNo: number;
  occurredAt?: string | null;
  orderId?: string | null;
  sku?: string | null;
  transactionType: string;
  description: string;
  kind: AmazonTransactionChargeKind;
  signedAmount: number;
};

export type AmazonTransactionChargeSummary = {
  orderSale: number;
  adFee: number;
  storageFee: number;
  subscriptionFee: number;
  fbaFee: number;
  tax: number;
  payout: number;
  adjustment: number;
  other: number;
};

export type AmazonStoreOrdersPreviewResponse = {
  ok?: boolean;
  domain?: string;
  action?: string;
  mode?: string;
  summary: AmazonStoreOrdersPreviewSummary;
  rawRows: AmazonStoreOrderRawRow[];
  facts: AmazonStoreOrderFact[];
  charges: AmazonTransactionCharge[];
  chargeSummary: AmazonTransactionChargeSummary;
  job?: ImportJobItem | null;
  message?: string;
};
