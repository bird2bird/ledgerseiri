import { loadJobsSnapshot } from "@/core/jobs";
import type { AmazonReconciliationSnapshot } from "./types";

export async function loadAmazonReconciliationSnapshot(): Promise<AmazonReconciliationSnapshot> {
  const snapshot = await loadJobsSnapshot();

  const importSummary = snapshot.importMeta?.summary ?? null;
  const exportSummary = snapshot.exportMeta?.summary ?? null;

  const totalFailed =
    Number(importSummary?.failed ?? 0) +
    Number(exportSummary?.failed ?? 0);

  return {
    importItems: snapshot.importItems,
    exportItems: snapshot.exportItems,
    importSummary,
    exportSummary,
    totalFailed,
  };
}
