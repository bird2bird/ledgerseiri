"use client";

import { useMemo, useState } from "react";

type Item = { q: string; a: string };

function cn(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

export default function FaqAccordion({
  items,
  columns = 2,
}: {
  items: Item[];
  columns?: 1 | 2;
}) {
  const [open, setOpen] = useState<Record<number, boolean>>({});

  const cols = useMemo(() => {
    if (columns === 1) return [items];
    const left: Item[] = [];
    const right: Item[] = [];
    items.forEach((it, idx) => (idx % 2 === 0 ? left : right).push(it));
    return [left, right];
  }, [items, columns]);

  const renderItem = (it: Item, globalIndex: number) => {
    const isOpen = !!open[globalIndex];

    return (
      <button
        key={it.q}
        type="button"
        onClick={() => setOpen((m) => ({ ...m, [globalIndex]: !m[globalIndex] }))}
        className={cn(
          "ls-card-solid w-full text-left px-6 py-5",
          "transition hover:shadow-[var(--sh-md)]",
          "focus:outline-none focus-visible:shadow-[var(--sh-sm),0_0_0_4px_rgba(var(--ring))]"
        )}
        aria-expanded={isOpen}
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-slate-900">{it.q}</div>
            <div
              className={cn(
                "mt-2 text-sm text-slate-600",
                isOpen ? "block" : "hidden"
              )}
            >
              {it.a}
            </div>
          </div>

          <span
            className={cn(
              "mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full border border-black/10 bg-white text-slate-600",
              "transition",
              isOpen ? "rotate-180" : "rotate-0"
            )}
            aria-hidden="true"
          >
            ▾
          </span>
        </div>

        {!isOpen && (
          <div className="mt-2 text-sm text-slate-500 line-clamp-2">
            {it.a}
          </div>
        )}
      </button>
    );
  };

  return (
    <div className={cn("grid gap-4", columns === 2 ? "md:grid-cols-2" : "grid-cols-1")}>
      {columns === 1 ? (
        cols[0].map((it, idx) => renderItem(it, idx))
      ) : (
        <>
          <div className="grid gap-4">
            {cols[0].map((it, idx) => renderItem(it, idx * 2))}
          </div>
          <div className="grid gap-4">
            {cols[1].map((it, idx) => renderItem(it, idx * 2 + 1))}
          </div>
        </>
      )}
    </div>
  );
}
