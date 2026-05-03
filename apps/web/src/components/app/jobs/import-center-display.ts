import type { ImportJobItem } from "@/core/jobs";
import { fmtDate } from "./jobs-shared";

// Step109-Z1-H15-D-IMPORT-CENTER-DISPLAY-HELPERS:
// Extract small display/format helpers from ImportJobsTableCard.tsx.
// Keep UI labels and JSON preview behavior unchanged.

export function getImportCenterSourceTypeLabel(sourceType?: string | null) {
  const value = String(sourceType || "").trim();

  if (!value) return "-";
  if (value.toLowerCase() === "csv") return "CSV";
  if (value === "expense-csv") return "支出CSV";
  if (value === "amazon-csv") return "Amazon CSV";
  if (value === "manual") return "手動";
  return value;
}

export function getImportedAtLabel(job: ImportJobItem) {
  return job.importedAt ? fmtDate(job.importedAt) : "未登録";
}

export function uniqueDomains(jobs: ImportJobItem[]) {
  return Array.from(
    new Set(
      jobs
        .map((job) => String(job.domain || "").trim())
        .filter(Boolean)
    )
  ).sort();
}

export function formatJsonPreview(value: unknown) {
  if (value == null) return "-";

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function shortId(value?: string | null) {
  if (!value) return "-";
  return value.length > 10 ? `${value.slice(0, 10)}...` : value;
}
