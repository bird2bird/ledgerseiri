"use client";

import React from "react";

export function ExportButton({
  onClick,
}: {
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ls-btn ls-btn-ghost inline-flex px-4 py-2 text-sm font-semibold"
    >
      エクスポート
    </button>
  );
}
