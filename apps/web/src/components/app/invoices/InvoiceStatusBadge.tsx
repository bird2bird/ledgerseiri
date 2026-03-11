"use client";

import React from "react";
import type { InvoiceStatus } from "@/core/invoices/api";

function classNameByStatus(status: InvoiceStatus) {
  switch (status) {
    case "PAID":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "PARTIALLY_PAID":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "OVERDUE":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "CANCELED":
      return "border-slate-200 bg-slate-100 text-slate-500";
    case "ISSUED":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${classNameByStatus(status)}`}>
      {status}
    </span>
  );
}
