"use client";

import React, { useMemo, useState } from "react";
import type { PreviewImportResponse } from "@/core/imports";

type RowStatus = "all" | "new" | "duplicate" | "conflict" | "error";

type PreviewRow = NonNullable<PreviewImportResponse["rows"]>[number];

function statusLabel(value: string) {
  switch (value) {
    case "new":
      return "新增";
    case "duplicate":
      return "重复";
    case "conflict":
      return "冲突";
    case "error":
      return "错误";
    default:
      return value || "-";
  }
}

function statusClassName(value: string) {
  switch (value) {
    case "new":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";
    case "duplicate":
      return "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200";
    case "conflict":
      return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";
    case "error":
      return "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200";
    default:
      return "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200";
  }
}

function stringifyPayload(payload?: Record<string, unknown>) {
  try {
    return JSON.stringify(payload || {}, null, 2);
  } catch {
    return "{}";
  }
}

function buildRowSearchText(row: PreviewRow) {
  const payloadText = stringifyPayload(row.normalizedPayload);
  return [
    String(row.rowNo || ""),
    String(row.businessMonth || ""),
    String(row.matchStatus || ""),
    String(row.matchReason || ""),
    payloadText,
  ]
    .join(" ")
    .toLowerCase();
}

function findPayloadHighlights(payload?: Record<string, unknown>): Array<[string, unknown]> {
  const p = payload || {};
  const items: Array<[string, unknown]> = [
    ["entityType", p.entityType],
    ["module", p.module],
    ["dedupeHash", p.dedupeHash],
    ["orderId", p.orderId],
    ["orderDate", p.orderDate],
    ["occurredAt", p.occurredAt],
    ["sku", p.sku],
    ["productName", p.productName],
    ["kind", p.kind],
    ["transactionType", p.transactionType],
    ["grossAmount", p.grossAmount],
    ["signedAmount", p.signedAmount],
    ["quantity", p.quantity],
    ["description", p.description],
  ];
  return items.filter(([, value]) => value !== undefined && value !== null && String(value) !== "");
}

export function ImportPreviewTable(props: {
  preview: PreviewImportResponse | null;
}) {
  const { preview } = props;
  const [tab, setTab] = useState<RowStatus>("all");
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState("");

  const rows = Array.isArray(preview?.rows) ? preview!.rows : [];

  const tabCounts = useMemo(() => {
    return {
      all: rows.length,
      new: rows.filter((row) => String(row.matchStatus || "") === "new").length,
      duplicate: rows.filter((row) => String(row.matchStatus || "") === "duplicate").length,
      conflict: rows.filter((row) => String(row.matchStatus || "") === "conflict").length,
      error: rows.filter((row) => String(row.matchStatus || "") === "error").length,
    };
  }, [rows]);

  const filteredRows = useMemo(() => {
    const keyword = String(search || "").trim().toLowerCase();

    return rows.filter((row) => {
      const statusOk =
        tab === "all" ? true : String(row.matchStatus || "") === tab;

      if (!statusOk) return false;
      if (!keyword) return true;

      return buildRowSearchText(row).includes(keyword);
    });
  }, [rows, tab, search]);

  const tabs: Array<{ value: RowStatus; label: string; count: number }> = [
    { value: "all", label: "全部", count: tabCounts.all },
    { value: "new", label: "新增", count: tabCounts.new },
    { value: "duplicate", label: "重复", count: tabCounts.duplicate },
    { value: "conflict", label: "冲突", count: tabCounts.conflict },
    { value: "error", label: "错误", count: tabCounts.error },
  ];

  const selectedRow =
    filteredRows.find((row, idx) => `${row.rowNo}-${idx}` === selectedKey) ||
    null;

  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-slate-900">Preview Rows</div>
          <div className="mt-1 text-xs text-slate-500">
            Step105-EQ：preview table 产品化，支持 status tabs、search、以及 normalized payload detail。
          </div>
        </div>
        <div className="text-xs text-slate-500">
          rows: {filteredRows.length} / total: {rows.length}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {tabs.map((item) => {
          const active = tab === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setTab(item.value)}
              className={
                active
                  ? "rounded-xl border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                  : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              }
            >
              {item.label} ({item.count})
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_280px]">
        <div className="rounded-[18px] border border-slate-200 bg-white p-3">
          <div className="text-[11px] text-slate-500">Search</div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索 rowNo / month / reason / payload / sku / orderId ..."
            className="mt-2 h-11 w-full rounded-[14px] border border-black/8 bg-white px-3 text-sm"
          />
        </div>

        <div className="rounded-[18px] border border-slate-200 bg-white p-3">
          <div className="text-[11px] text-slate-500">Current Filter</div>
          <div className="mt-2 text-sm text-slate-700">
            status = <span className="font-medium text-slate-900">{statusLabel(tab)}</span>
            <br />
            keyword ={" "}
            <span className="font-medium text-slate-900">
              {search.trim() ? search.trim() : "-"}
            </span>
          </div>
        </div>
      </div>

      {preview ? (
        filteredRows.length ? (
          <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="overflow-auto rounded-[18px] border border-slate-200 bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 text-left">状态</th>
                    <th className="px-3 py-2 text-left">Row</th>
                    <th className="px-3 py-2 text-left">Month</th>
                    <th className="px-3 py-2 text-left">Reason</th>
                    <th className="px-3 py-2 text-left">Payload Highlights</th>
                    <th className="px-3 py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row, idx) => {
                    const key = `${row.rowNo}-${idx}`;
                    const selected = key === selectedKey;
                    const highlights = findPayloadHighlights(row.normalizedPayload);

                    return (
                      <tr
                        key={key}
                        className={`border-t border-slate-100 align-top ${
                          selected ? "bg-sky-50/40" : ""
                        }`}
                      >
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClassName(
                              String(row.matchStatus || "")
                            )}`}
                          >
                            {statusLabel(String(row.matchStatus || ""))}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-700">{row.rowNo}</td>
                        <td className="px-3 py-2 text-slate-700">
                          {row.businessMonth || "-"}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          <div className="max-w-[240px] whitespace-pre-wrap break-words">
                            {row.matchReason || "-"}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {highlights.length ? (
                            <div className="flex max-w-[320px] flex-wrap gap-2">
                              {highlights.slice(0, 4).map(([label, value]: [string, unknown]) => (
                                <span
                                  key={`${key}-${label}`}
                                  className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-700"
                                >
                                  {label}: {String(value)}
                                </span>
                              ))}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => setSelectedKey(selected ? "" : key)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            {selected ? "收起详情" : "查看详情"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="rounded-[18px] border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-slate-900">
                    Normalized Payload Detail
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    选中一行后，查看 payload 细节与匹配原因。
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  {selectedRow ? `row ${selectedRow.rowNo}` : "未选择"}
                </div>
              </div>

              {selectedRow ? (
                <div className="mt-4 space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[14px] bg-slate-50 p-3">
                      <div className="text-[11px] text-slate-500">Status</div>
                      <div className="mt-1">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClassName(
                            String(selectedRow.matchStatus || "")
                          )}`}
                        >
                          {statusLabel(String(selectedRow.matchStatus || ""))}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-[14px] bg-slate-50 p-3">
                      <div className="text-[11px] text-slate-500">Business Month</div>
                      <div className="mt-1 text-sm font-medium text-slate-900">
                        {selectedRow.businessMonth || "-"}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[14px] bg-slate-50 p-3">
                    <div className="text-[11px] text-slate-500">Match Reason</div>
                    <div className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-700">
                      {selectedRow.matchReason || "-"}
                    </div>
                  </div>

                  <div className="rounded-[14px] bg-slate-50 p-3">
                    <div className="text-[11px] text-slate-500">Payload Highlights</div>
                    <div className="mt-2 space-y-2">
                      {findPayloadHighlights(selectedRow.normalizedPayload).length ? (
                        findPayloadHighlights(selectedRow.normalizedPayload).map(
                          ([label, value]: [string, unknown]) => (
                            <div
                              key={`${selectedRow.rowNo}-${label}`}
                              className="flex items-start justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm"
                            >
                              <div className="min-w-[110px] font-medium text-slate-800">
                                {label}
                              </div>
                              <div className="break-all text-right text-slate-600">
                                {String(value)}
                              </div>
                            </div>
                          )
                        )
                      ) : (
                        <div className="text-sm text-slate-500">-</div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[14px] bg-slate-900 p-3">
                    <div className="text-[11px] text-slate-400">Normalized Payload JSON</div>
                    <pre className="mt-2 max-h-[420px] overflow-auto whitespace-pre-wrap break-all text-[11px] text-slate-100">
                      {stringifyPayload(selectedRow.normalizedPayload)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-[14px] border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-sm text-slate-500">
                  请从左侧选择一行，查看 normalized payload detail。
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-[18px] border border-dashed border-slate-200 bg-white px-4 py-8 text-sm text-slate-500">
            当前筛选条件下没有匹配的 preview rows。
          </div>
        )
      ) : (
        <div className="mt-4 rounded-[18px] border border-dashed border-slate-200 bg-white px-4 py-8 text-sm text-slate-500">
          还没有 preview 结果。
        </div>
      )}
    </div>
  );
}
