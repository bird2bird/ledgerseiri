export type BillingStatusCode =
  | "ACTIVE"
  | "TRIALING"
  | "PAST_DUE"
  | "CANCELED"
  | "UNKNOWN";

export type BillingStatusMeta = {
  code: BillingStatusCode;
  label: string;
  toneClass: string;
  helper: string;
};

export function normalizeBillingStatus(input?: string | null): BillingStatusCode {
  const raw = String(input || "").trim().toUpperCase();

  if (raw === "ACTIVE") return "ACTIVE";
  if (raw === "TRIALING") return "TRIALING";
  if (raw === "PAST_DUE") return "PAST_DUE";
  if (raw === "CANCELED" || raw === "CANCELLED") return "CANCELED";
  return "UNKNOWN";
}

export function getBillingStatusMeta(input?: string | null): BillingStatusMeta {
  const code = normalizeBillingStatus(input);

  if (code === "ACTIVE") {
    return {
      code,
      label: "Active",
      toneClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
      helper: "現在の契約は有効です。",
    };
  }

  if (code === "TRIALING") {
    return {
      code,
      label: "Trialing",
      toneClass: "border-sky-200 bg-sky-50 text-sky-700",
      helper: "無料試用期間中です。",
    };
  }

  if (code === "PAST_DUE") {
    return {
      code,
      label: "Past due",
      toneClass: "border-amber-200 bg-amber-50 text-amber-700",
      helper: "支払い確認が必要です。",
    };
  }

  if (code === "CANCELED") {
    return {
      code,
      label: "Canceled",
      toneClass: "border-slate-300 bg-slate-100 text-slate-600",
      helper: "契約はキャンセル済みです。",
    };
  }

  return {
    code,
    label: "Unknown",
    toneClass: "border-slate-200 bg-slate-50 text-slate-600",
    helper: "契約状態を確認できませんでした。",
  };
}
