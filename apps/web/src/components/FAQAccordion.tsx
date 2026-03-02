"use client";

import { useState } from "react";

export type FAQItem = { q: string; a: string };

function cn(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

export default function FAQAccordion({
  items,
  defaultOpenIndex = -1,
  twoColumn = true,
}: {
  items: FAQItem[];
  defaultOpenIndex?: number; // -1 => all closed
  twoColumn?: boolean;
}) {
  const [openIndex, setOpenIndex] = useState<number>(defaultOpenIndex);

  return (
    <div className={cn("grid gap-4", twoColumn ? "md:grid-cols-2" : "grid-cols-1")}>
      {items.map((it, idx) => {
        const open = idx == openIndex;
        return (
          <div
            key={it.q}
            className={cn(
              "rounded-3xl border border-black/10 bg-white/80 shadow-sm overflow-hidden",
              open && "ring-1 ring-black/10"
            )}
          >
            <button
              type="button"
              className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 hover:bg-black/[0.02]"
              aria-expanded={open}
              onClick={() => setOpenIndex(open ? -1 : idx)}
            >
              <div className="text-sm font-semibold text-slate-900">{it.q}</div>
              <span
                className={cn(
                  "inline-flex h-7 w-7 items-center justify-center rounded-full border border-black/10 bg-white text-slate-500 transition",
                  open && "rotate-45"
                )}
                aria-hidden="true"
              >
                +
              </span>
            </button>

            <div className={cn("px-6 pb-5 text-sm text-slate-600", open ? "block" : "hidden")}>
              {it.a}
            </div>
          </div>
        );
      })}
    </div>
  );
}
