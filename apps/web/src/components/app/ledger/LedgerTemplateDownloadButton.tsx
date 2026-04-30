"use client";

import React from "react";
import {
  buildLedgerTemplateCsv,
  getLedgerScopeConfig,
  type LedgerScope,
} from "@/core/ledger/ledger-scopes";

type LedgerTemplateDownloadButtonProps = {
  scope: LedgerScope;
  className?: string;
  children?: React.ReactNode;
};

function buildCsvDownloadBlob(csv: string) {
  // UTF-8 BOM keeps Japanese text readable in Excel.
  return new Blob(["\ufeff", csv], {
    type: "text/csv;charset=utf-8",
  });
}

export function LedgerTemplateDownloadButton({
  scope,
  className,
  children,
}: LedgerTemplateDownloadButtonProps) {
  const config = getLedgerScopeConfig(scope);

  function handleDownload() {
    const csv = buildLedgerTemplateCsv(scope);
    const blob = buildCsvDownloadBlob(csv);
    const url = URL.createObjectURL(blob);

    try {
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = config.templateFileName;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      className={
        className ||
        "rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-bold text-slate-900 transition hover:bg-slate-50"
      }
      title={`${config.titleJa} テンプレートをダウンロード`}
      data-scope={`ledger-template-download ${config.scope}`}
    >
      {children || `${config.titleJa}テンプレート下载`}
    </button>
  );
}
