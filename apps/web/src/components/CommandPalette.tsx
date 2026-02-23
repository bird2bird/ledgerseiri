"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type Action = {
  id: string;
  label: string;
  keywords?: string[];
  href: string; // absolute with lang prefix
  section?: string;
};

function cn(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

type LangCode = "ja" | "en" | "zh-CN" | "zh-TW";
function getLangFromPath(pathname: string): LangCode {
  const seg = (pathname.split("/")[1] || "ja") as LangCode;
  return seg === "ja" || seg === "en" || seg === "zh-CN" || seg === "zh-TW" ? seg : "ja";
}
function withLang(pathname: string, target: string): string {
  const lang = getLangFromPath(pathname);
  return `/${lang}${target}`;
}

export default function CommandPalette() {
  const pathname = usePathname() || "/ja";
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const actions: Action[] = useMemo(() => {
    return [
      { id: "dash", label: "Dashboard", href: withLang(pathname, "/app"), section: "App" },
      { id: "profile", label: "Profile", href: withLang(pathname, "/app/profile"), section: "App" },
      { id: "billing", label: "Billing", href: withLang(pathname, "/app/billing"), section: "App" },
      { id: "upgrade", label: "Upgrade", href: withLang(pathname, "/app/upgrade"), section: "App" },
      { id: "settings", label: "Settings", href: withLang(pathname, "/app/settings"), section: "App" },
      { id: "login", label: "Login", href: withLang(pathname, "/login"), section: "Account" },
    ];
  }, [pathname]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return actions;
    return actions.filter((a) => {
      const hay = [a.label, ...(a.keywords || [])].join(" ").toLowerCase();
      return hay.includes(s);
    });
  }, [actions, q]);

  const close = () => {
    setOpen(false);
    setQ("");
    setActive(0);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isK = e.key.toLowerCase() === "k";
      if ((e.metaKey || e.ctrlKey) && isK) {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
        return;
      }
      if (!open) return;
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((v) => Math.min(v + 1, Math.max(0, filtered.length - 1)));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((v) => Math.max(0, v - 1));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const a = filtered[active];
        if (a) window.location.href = a.href;
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, filtered, active]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[99999]">
      {/* overlay */}
      <button
        className="absolute inset-0 bg-black/30"
        onClick={close}
        aria-label="Close command palette"
      />
      <div className="absolute left-1/2 top-16 w-[min(720px,92vw)] -translate-x-1/2">
        <div className="overflow-hidden rounded-3xl border border-black/10 bg-white/85 backdrop-blur shadow-2xl">
          <div className="border-b border-black/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">⌘</span>
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setActive(0);
                }}
                placeholder="Search…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
              <span className="rounded-full border border-black/10 bg-white px-2 py-0.5 text-[11px] text-slate-500 shadow-sm">
                Esc
              </span>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-auto p-2">
            {filtered.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-slate-500">No results</div>
            ) : (
              filtered.map((a, i) => (
                <button
                  key={a.id}
                  className={cn(
                    "group relative flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm",
                    i === active ? "bg-black/[0.04]" : "hover:bg-black/[0.03]"
                  )}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => (window.location.href = a.href)}
                >
                  <span className="absolute left-0 top-0 h-full w-1 rounded-l-2xl bg-[#2b5cff] opacity-0 group-hover:opacity-100" />
                  <div className="flex flex-col">
                    <span className="text-slate-900">{a.label}</span>
                    {a.section ? <span className="text-[12px] text-slate-500">{a.section}</span> : null}
                  </div>
                  <span className="text-[12px] text-slate-400">{a.href.replace(/^\/(ja|en|zh-CN|zh-TW)/, "")}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
