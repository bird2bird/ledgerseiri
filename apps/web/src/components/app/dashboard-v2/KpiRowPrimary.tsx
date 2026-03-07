"use client";

import React from "react";
import type { KpiCardData } from "./types";
import { KpiCard } from "./KpiCard";

export function KpiRowPrimary({ items }: { items: KpiCardData[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => (
        <KpiCard key={item.key} data={item} />
      ))}
    </div>
  );
}
