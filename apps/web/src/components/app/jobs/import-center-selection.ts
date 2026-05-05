import type { ImportJobItem } from "@/core/jobs";

// Step109-Z1-H15-F-IMPORT-CENTER-SELECTION-HELPERS:
// Extract URL importJobId selection helpers from ImportJobsTableCard.tsx.
// Keep URL behavior unchanged:
// - importJobId highlights the row only.
// - Drawer is opened manually by user action.

export type ImportCenterUrlSelectionInfo = {
  importJobId: string;
  from: string;
  traceTarget: string;
  shouldAutoOpenDrawer: boolean;
};

export function readImportCenterUrlSelectionInfo(): ImportCenterUrlSelectionInfo {
  if (typeof window === "undefined") {
    return {
      importJobId: "",
      from: "",
      traceTarget: "",
      shouldAutoOpenDrawer: false,
    };
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const importJobId = params.get("importJobId") || "";
    const from = params.get("from") || "";
    const traceTarget = params.get("traceTarget") || "";

    return {
      importJobId,
      from,
      traceTarget,
      shouldAutoOpenDrawer:
        Boolean(importJobId) &&
        from === "expense-import-trace" &&
        traceTarget === "expense-category",
    };
  } catch {
    return {
      importJobId: "",
      from: "",
      traceTarget: "",
      shouldAutoOpenDrawer: false,
    };
  }
}

export function getImportJobIdFromUrl() {
  return readImportCenterUrlSelectionInfo().importJobId;
}

export function syncImportJobIdToUrl(importJobId: string | null) {
  if (typeof window === "undefined") return;

  try {
    const url = new URL(window.location.href);

    if (importJobId) {
      url.searchParams.set("importJobId", importJobId);
    } else {
      url.searchParams.delete("importJobId");
    }

    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (nextUrl !== currentUrl) {
      window.history.replaceState({}, "", nextUrl);
    }
  } catch {
    // noop: URL sync is a UI enhancement only.
  }
}

export function getSelectedImportJobRowClass(job: ImportJobItem, selectedJobId: string | null) {
  if (!selectedJobId || job.id !== selectedJobId) return "";

  return [
    "relative",
    "bg-sky-50/90",
    "ring-2",
    "ring-sky-300",
    "ring-inset",
    "shadow-[inset_5px_0_0_rgba(14,165,233,0.85)]",
    "after:absolute",
    "after:right-4",
    "after:top-4",
    "after:rounded-full",
    "after:border",
    "after:border-sky-200",
    "after:bg-white",
    "after:px-2",
    "after:py-0.5",
    "after:text-[10px]",
    "after:font-black",
    "after:text-sky-700",
    "after:content-['選択中']",
  ].join(" ");
}
