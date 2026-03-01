"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";

type Item = {
  key: string;
  label: ReactNode;
  onSelect?: () => void;
  href?: string;
  selected?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  danger?: boolean;
};

function cn(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={cn("h-4 w-4", className)} fill="none" aria-hidden="true">
      <path
        d="M16.6 5.6 8.2 14l-4-4"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MenuPopover({
  button,
  items,
  align = "right",
  width = "match-button",
  withCheck = true,
}: {
  button: (p: { open: boolean; toggle: () => void }) => ReactNode;
  items: Item[];
  align?: "right" | "left";
  width?: "match-button" | "w-max" | number;
  withCheck?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const toggle = () => setOpen((v) => !v);
  const close = () => setOpen(false);

  // pointerdown capture: more reliable than mousedown (esp. nested portals)
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) close();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown, true);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open]);

  const wClass = useMemo(() => {
    if (width === "match-button") return "min-w-full w-max";
    if (width === "w-max") return "w-max";
    if (typeof width === "number") return `w-[${width}px]`;
    return "min-w-full w-max";
  }, [width]);

  return (
    <div ref={ref} className="relative inline-block">
      {button({ open, toggle })}

      {open && (
        <div
          className={cn(
            "ls-menu absolute top-full mt-2 overflow-hidden z-[9999]",
            "animate-[menuIn_120ms_ease-out]",
            wClass,
            align === "right" ? "right-0" : "left-0"
          )}
        >
          <div className="py-1">
            {items.map((it) => {
              const onSelect = () => {
                close();
                if (it.onSelect) it.onSelect();
                if (it.href) window.location.href = it.href;
              };

              return (
                <button
                  key={it.key}
                  type="button"
                  className="block w-full text-left focus:outline-none"
                  onClick={onSelect}
                >
                  <div
                    className={cn(
                      "group relative flex w-full items-center gap-2 px-3 py-2 text-sm",
                      it.danger ? "text-rose-600" : "text-slate-900",
                      "hover:bg-black/[0.03]"
                    )}
                  >
                    <span className="absolute left-0 top-0 h-full w-1 bg-[#2b5cff] opacity-0 group-hover:opacity-100" />

                    {it.leftIcon ? <span className="text-slate-500">{it.leftIcon}</span> : null}

                    <span className="flex-1">{it.label}</span>

                    {withCheck && it.selected ? (
                      <span className="text-[#2b5cff]">
                        <CheckIcon />
                      </span>
                    ) : it.rightIcon ? (
                      <span className="text-slate-400">{it.rightIcon}</span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes menuIn {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
