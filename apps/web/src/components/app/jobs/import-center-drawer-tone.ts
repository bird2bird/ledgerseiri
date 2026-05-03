import type { ImportJobItem } from "@/core/jobs";
import { getImportCenterJobTone } from "./import-center-status";

// Step109-Z1-H15-G-IMPORT-CENTER-DRAWER-TONE:
// Extract drawer action tone class helper from ImportJobsTableCard.tsx.
// Keep drawer guidance styling unchanged.

export function getDrawerActionToneClass(job: ImportJobItem) {
  const tone = getImportCenterJobTone(job);

  if (tone === "danger") return "border-rose-200 bg-rose-50 text-rose-700";
  if (tone === "warning") return "border-amber-200 bg-amber-50 text-amber-700";
  if (tone === "pendingPreview") return "border-sky-200 bg-sky-50 text-sky-700";
  if (tone === "processing") return "border-violet-200 bg-violet-50 text-violet-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}
