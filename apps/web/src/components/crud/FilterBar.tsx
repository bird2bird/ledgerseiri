"use client";

import React from "react";

export function FilterBar({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

export function FilterInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-10 min-w-[180px] rounded-[14px] border border-black/8 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[color:var(--ls-primary)]/50"
    />
  );
}

export function FilterSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="h-10 min-w-[160px] rounded-[14px] border border-black/8 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[color:var(--ls-primary)]/50"
    />
  );
}
