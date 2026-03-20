import React from "react";

export function JobsMetaListSection(props: {
  title: string;
  items: Array<{ value: string; label: string }> | null | undefined;
  emptyText?: string;
}) {
  const rows = (props.items ?? []).filter((x) => x.value);

  return (
    <div>
      <div className="text-[11px] font-medium text-slate-500">{props.title}</div>
      <div className="mt-3 space-y-2">
        {rows.length === 0 ? (
          <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
            {props.emptyText ?? "no data"}
          </div>
        ) : (
          rows.map((item) => (
            <div
              key={item.value}
              className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            >
              {item.label}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
