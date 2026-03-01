"use client";

import { useMemo, useState } from "react";

type Item = { q: string; a: string };

function cn(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

export default function FAQAccordion({
  items,
  defaultOpenIndex = -1,
  twoColumn = true,
}: {
  items: Item[];
  defaultOpenIndex?: number; // -1 => all closed
  twoColumn?: boolean;
}) {
  const [openIndex, setOpenIndex] = useState<number>(defaultOpenIndex);

  const cols = useMemo(() => {
    if (!twoColumn) return { left: items, right: [] as Item[] };
    const mid = Math.ceil(items.length / 2);
    return { left: items.slice(0, mid), right: items.slice(mid) };
  }, [items, twoColumn]);

  const ItemCard = ({ it, idx }: { it: Item; idx: number }) => {
    const open = openIndex === idx;
    return (
      <div className="ls-card p-5">
        <button
          type="button"
          className="flex w-full items-start justify-between gap-4 text-left"
          aria-expanded={open}
          onClick={() => setOpenIndex((prev) => (prev === idx ? -1 : idx))}
        >
          <div className="text-sm font-semibold text-slate-900">{it.q}</div>
          <span
            className={cn(
              "mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full border border-black/10 bg-white/70 text-slate-600 shadow-sm",
              "transition-transform",
              open && "rotate-180"
            )}
            aria-hidden="true"
          >
            ▾
          </span>
        </button>

        <div
          className={cn(
            "grid overflow-hidden transition-[grid-template-rows,opacity] duration-200 ease-out",
            open ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0 mt-0"
          )}
        >
          <div className="overflow-hidden">
            <div className="text-sm text-slate-600 leading-relaxed">{it.a}</div>
          </div>
        </div>
      </div>
    );
  };

  const offset = cols.left.length;

  return (
    <div className={cn(twoColumn ? "grid grid-cols-1 gap-4 md:grid-cols-2" : "grid grid-cols-1 gap-4")}>
      <div className="space-y-4">
        {cols.left.map((it, i) => (
          <ItemCard key={it.q} it={it} idx={i} />
        ))}
      </div>
      {twoColumn && (
        <div className="space-y-4">
          {cols.right.map((it, i) => (
            <ItemCard key={it.q} it={it} idx={offset + i} />
          ))}
        </div>
      )}
    </div>
  );
}
