"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";
import {
  commitCashIncomeImport,
  previewCashIncomeImport,
  type CashIncomeCommitResponse,
  type CashIncomePreviewResponse,
} from "@/core/imports";
import { fetchWithAutoRefresh } from "@/core/auth/client-auth-fetch";
import {
  CASH_INCOME_ERROR_SAMPLE_TEXT,
  CASH_INCOME_SAMPLE_TEXT,
  formatCashAccountMatchMode,
  formatCashDraftMessage,
  formatCashDraftStatusLabel,
  formatCashServerMatchReason,
  parseCashIncomeCsvDraft,
  type CashIncomeDraftRow,
} from "@/core/imports/cash-income-import-client";

export function CashIncomeImportWorkspace(props: { lang: string }) {
  const { lang } = props;

  const [cashCsvDraftText, setCashCsvDraftText] = useState(CASH_INCOME_SAMPLE_TEXT);
  const [cashPreviewRows, setCashPreviewRows] = useState<CashIncomeDraftRow[]>([]);
  const [cashPreviewMessage, setCashPreviewMessage] = useState("");
  const [cashServerPreview, setCashServerPreview] =
    useState<CashIncomePreviewResponse | null>(null);
  const [cashServerPreviewLoading, setCashServerPreviewLoading] = useState(false);
  const [cashServerPreviewError, setCashServerPreviewError] = useState("");
  const [cashCommitResult, setCashCommitResult] =
    useState<CashIncomeCommitResponse | null>(null);
  const [cashCommitLoading, setCashCommitLoading] = useState(false);
  const [cashCommitError, setCashCommitError] = useState("");
  const [cashCompanyId, setCashCompanyId] = useState("");
  const [cashCompanyLoading, setCashCompanyLoading] = useState(false);
  const [cashCompanyError, setCashCompanyError] = useState("");


  const cashPreviewStats = useMemo(() => {
    const total = cashPreviewRows.length;
    const valid = cashPreviewRows.filter((row) => row.status === "valid").length;
    const warning = cashPreviewRows.filter((row) => row.status === "warning").length;
    const error = cashPreviewRows.filter((row) => row.status === "error").length;

    return { total, valid, warning, error };
  }, [cashPreviewRows]);

  const cashPendingRows = useMemo(() => {
    return cashPreviewRows
      .filter((row) => row.status !== "error")
      .map((row) => ({
        rowNo: row.rowNo,
        type: "OTHER" as const,
        direction: "INCOME" as const,
        accountName: row.account,
        amount: row.amount,
        occurredAt: row.occurredAt,
        memo: `[cash] ${row.memo}`.trim(),
        source: row.source,
      }));
  }, [cashPreviewRows]);

  const cashPendingStats = useMemo(() => {
    const pendingRows = cashPendingRows.length;
    const excludedErrorRows = cashPreviewRows.filter((row) => row.status === "error").length;
    const totalPendingAmount = cashPendingRows.reduce((sum, row) => sum + row.amount, 0);

    return {
      pendingRows,
      excludedErrorRows,
      totalPendingAmount,
    };
  }, [cashPendingRows, cashPreviewRows]);

  const cashServerAccountResolutionStats = useMemo(() => {
    const rows = Array.isArray(cashServerPreview?.rows) ? cashServerPreview.rows : [];
    const exactMatched = rows.filter(
      (row) => row.accountResolution?.matchMode === "exact_name"
    ).length;
    const cashFallbackMatched = rows.filter(
      (row) => row.accountResolution?.matchMode === "cash_fallback"
    ).length;
    const unresolved = rows.filter(
      (row) =>
        !row.normalizedPayload.accountId ||
        row.accountResolution?.matchMode === "unresolved"
    ).length;

    return {
      exactMatched,
      cashFallbackMatched,
      unresolved,
    };
  }, [cashServerPreview]);

  const cashServerReadiness = useMemo(() => {
    if (!cashServerPreview) {
      return {
        status: "waiting" as const,
        label: "後続 API 接続待ち",
        message: "Server Preview を実行すると正式取込前の準備状態を確認できます。",
        canProceed: false,
      };
    }

    const errorRows = Number(cashServerPreview.summary.errorRows || 0);
    const pendingRows = Number(cashServerPreview.summary.pendingRows || 0);
    const unresolvedRows = Number(cashServerAccountResolutionStats.unresolved || 0);

    if (errorRows > 0 || unresolvedRows > 0 || pendingRows === 0) {
      const reasons: string[] = [];
      if (errorRows > 0) reasons.push(`エラー行 ${errorRows} 件`);
      if (unresolvedRows > 0) reasons.push(`未解決口座 ${unresolvedRows} 件`);
      if (pendingRows === 0) reasons.push("取込可能行 0 件");

      return {
        status: "needs_fix" as const,
        label: "修正が必要",
        message: `正式取込前に修正が必要です：${reasons.join(" / ")}`,
        canProceed: false,
      };
    }

    return {
      status: "ready" as const,
      label: "正式取込準備OK",
      message: "Server Preview の結果は正式取込条件を満たしています。次ステップで commit API を接続します。",
      canProceed: false,
    };
  }, [cashServerAccountResolutionStats.unresolved, cashServerPreview]);

  const cashPostCommitHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set("from", "cash-import");
    params.set("committed", "1");
    params.set("range", "30d");

    if (cashCommitResult) {
      params.set(
        "importedRows",
        String(cashCommitResult.importedRows ?? cashCommitResult.summary.importedRows ?? 0)
      );
      params.set(
        "duplicateRows",
        String(cashCommitResult.duplicateRows ?? cashCommitResult.summary.duplicateRows ?? 0)
      );
      params.set(
        "blockedRows",
        String(cashCommitResult.blockedRows ?? cashCommitResult.summary.blockedRows ?? 0)
      );
      params.set(
        "amount",
        String(cashCommitResult.summary.totalImportedAmount || 0)
      );

      const txIds = (cashCommitResult.createdTransactionIds || [])
        .filter(Boolean)
        .join(",");
      if (txIds) {
        params.set("transactionIds", txIds);
      }
    }

    return `/${lang}/app/income/cash?${params.toString()}`;
  }, [cashCommitResult, lang]);


  function runCashClientPreview() {
    const rows = parseCashIncomeCsvDraft(cashCsvDraftText);
    setCashPreviewRows(rows);
    setCashServerPreview(null);
    setCashServerPreviewError("");
    setCashCommitResult(null);
    setCashCommitError("");

    if (rows.length === 0) {
      setCashPreviewMessage("CSV draft が空です。");
      return;
    }

    const errorCount = rows.filter((row) => row.status === "error").length;
    const warningCount = rows.filter((row) => row.status === "warning").length;

    setCashPreviewMessage(
      `プレビューを生成しました：rows=${rows.length}, error=${errorCount}, warning=${warningCount}。この preview はブラウザ上のみで実行され、DB/API には接続していません。`
    );
  }

  async function loadCashCompanyId() {
    setCashCompanyLoading(true);
    setCashCompanyError("");

    try {
      const res = await fetchWithAutoRefresh("/api/auth/me", {
        method: "GET",
      });

      if (!res.ok) {
        throw new Error(`auth me failed: ${res.status}`);
      }

      const payload = (await res.json()) as { companyId?: string | null };
      const nextCompanyId = String(payload?.companyId || "").trim();

      setCashCompanyId(nextCompanyId);
      if (!nextCompanyId) {
        setCashCompanyError("companyId が取得できません。ログイン状態または company 設定を確認してください。");
      }
    } catch (err) {
      setCashCompanyId("");
      setCashCompanyError(
        err instanceof Error ? err.message : "companyId load failed"
      );
    } finally {
      setCashCompanyLoading(false);
    }
  }

  async function runCashServerPreview() {
    setCashServerPreviewLoading(true);
    setCashServerPreviewError("");

    try {
      const rowsForServer =
        cashPreviewRows.length > 0
          ? cashPreviewRows
          : parseCashIncomeCsvDraft(cashCsvDraftText);

      if (rowsForServer.length === 0) {
        setCashServerPreview(null);
        setCashServerPreviewError("Server preview に送信する行がありません。");
        return;
      }

      if (cashPreviewRows.length === 0) {
        setCashPreviewRows(rowsForServer);
      }

      const companyId = cashCompanyId.trim();

      if (!companyId) {
        setCashServerPreview(null);
        setCashServerPreviewError("companyId が未取得のため Server Preview を実行できません。ページを再読み込みするか、ログイン状態を確認してください。");
        return;
      }

      const res = await previewCashIncomeImport({
        companyId,
        filename: "cash-income.csv",
        rows: rowsForServer.map((row) => ({
          rowNo: row.rowNo,
          accountName: row.account,
          amount: row.amount,
          occurredAt: row.occurredAt,
          memo: row.memo,
          source: row.source || undefined,
        })),
      });

      setCashServerPreview(res);
      setCashCommitResult(null);
      setCashCommitError("");
    } catch (err) {
      setCashServerPreview(null);
      setCashServerPreviewError(
        err instanceof Error ? err.message : "cash income server preview failed"
      );
    } finally {
      setCashServerPreviewLoading(false);
    }
  }

  async function runCashCommit() {
    if (!cashServerPreview || cashServerReadiness.status !== "ready") {
      setCashCommitError("正式取込を実行するには、Server Preview が準備OKである必要があります。");
      return;
    }

    const companyId = cashCompanyId.trim();
    if (!companyId) {
      setCashCommitError("companyId が未取得のため正式取込を実行できません。");
      return;
    }

    setCashCommitLoading(true);
    setCashCommitError("");

    try {
      const res = await commitCashIncomeImport({
        companyId,
        filename: cashServerPreview.filename || "cash-income.csv",
        rows: cashServerPreview.rows,
      });

      setCashCommitResult(res);

      if (!res.commitExecuted) {
        setCashCommitError(
          res.blockedReasons?.length
            ? res.blockedReasons.join(" / ")
            : "正式取込がブロックされました。"
        );
      }
    } catch (err) {
      setCashCommitResult(null);
      setCashCommitError(
        err instanceof Error ? err.message : "cash income commit failed"
      );
    } finally {
      setCashCommitLoading(false);
    }
  }


  React.useEffect(() => {
    void loadCashCompanyId();
  }, []);

return (
      <section className="space-y-6 rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold text-slate-900">
              現金収入CSV取込
            </div>
            <div className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              現金入金データを CSV で取り込むための専用ワークスペースです。ブラウザ上の CSV preview、Server Preview、口座照合、正式取込、重複スキップまで一つの流れで確認できます。
            </div>
          </div>

          <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            module = cash-income
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-5">
              <div className="text-sm font-semibold text-slate-900">
                取込予定フィールド
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Cash Income の手動登録 drawer と同じ最小項目を CSV でも扱う想定です。
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="grid grid-cols-[160px_1fr] border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  <div>CSV Column</div>
                  <div>Description</div>
                </div>

                {[
                  ["account", "入金先口座。後続ステップで accountId と照合します。"],
                  ["amount", "現金収入金額。0 より大きい数値のみ有効です。"],
                  ["occurredAt", "発生日。YYYY-MM-DD または日時形式を想定します。"],
                  ["memo", "店頭現金売上、イベント売上、現金補正入金などの補足メモ。"],
                  ["source", "任意。入金元、店舗、補助情報など。初期版では memo への統合も可。"],
                ].map(([name, description]) => (
                  <div
                    key={name}
                    className="grid grid-cols-[160px_1fr] border-b border-slate-100 px-4 py-3 text-sm last:border-b-0"
                  >
                    <div className="font-medium text-slate-900">{name}</div>
                    <div className="text-slate-600">{description}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    CSV サンプルフォーマット
                  </div>
                  <div className="mt-2 text-xs leading-5 text-slate-500">
                    まずはこの形式で cash-income CSV を準備します。実際の取込処理は次ステップで preview / validation に接続します。
                  </div>
                </div>
                <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-600">
                  static sample
                </div>
              </div>

              <pre className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-6 text-slate-700">
                {[
                  "account,amount,occurredAt,memo,source",
                  "現金,12000,2026-04-24,店頭現金売上,横浜店",
                  "現金,8500,2026-04-25,イベント現金売上,展示会",
                  "現金,3000,2026-04-26,現金補正入金,手動調整",
                ].join("\n")}
              </pre>

              <div className="mt-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800">
                金額は数値のみ、発生日は YYYY-MM-DD または日時形式を想定します。口座名は後続ステップで accountId と照合します。
              </div>
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Client-side Draft Preview
                  </div>
                  <div className="mt-2 text-xs leading-5 text-slate-500">
                    CSV を貼り付けて、保存前にブラウザ上だけで preview / validation を確認します。DB と API には接続しません。
                  </div>
                </div>
                <div className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
                  client only
                </div>
              </div>

              <textarea
                value={cashCsvDraftText}
                onChange={(e) => setCashCsvDraftText(e.target.value)}
                rows={7}
                className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-xs leading-6 text-slate-700"
                placeholder="account,amount,occurredAt,memo,source"
              />

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={runCashClientPreview}
                  className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Preview CSV
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCashCsvDraftText("");
                    setCashPreviewRows([]);
                    setCashServerPreview(null);
                    setCashServerPreviewError("");
                    setCashCommitResult(null);
                    setCashCommitError("");
                    setCashPreviewMessage("Draft をクリアしました。");
                  }}
                  className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Clear Draft
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCashCsvDraftText(CASH_INCOME_SAMPLE_TEXT);
                    setCashPreviewRows([]);
                    setCashServerPreview(null);
                    setCashServerPreviewError("");
                    setCashCommitResult(null);
                    setCashCommitError("");
                    setCashPreviewMessage("サンプル CSV を復元しました。Preview CSV を押して確認してください。");
                  }}
                  className="inline-flex rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                >
                  Use sample
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const rows = parseCashIncomeCsvDraft(CASH_INCOME_SAMPLE_TEXT);
                    setCashCsvDraftText(CASH_INCOME_SAMPLE_TEXT);
                    setCashPreviewRows(rows);
                    setCashServerPreview(null);
                    setCashServerPreviewError("");
                    setCashCommitResult(null);
                    setCashCommitError("");
                    setCashPreviewMessage(
                      `サンプル CSV を復元し、preview を自動生成しました：rows=${rows.length}。`
                    );
                  }}
                  className="inline-flex rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                >
                  Use sample + preview
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCashCsvDraftText(CASH_INCOME_ERROR_SAMPLE_TEXT);
                    setCashPreviewRows([]);
                    setCashServerPreview(null);
                    setCashServerPreviewError("");
                    setCashCommitResult(null);
                    setCashCommitError("");
                    setCashPreviewMessage("エラー確認用サンプルをセットしました。Preview CSV を押して validation を確認してください。");
                  }}
                  className="inline-flex rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                >
                  Use error sample
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const rows = parseCashIncomeCsvDraft(CASH_INCOME_ERROR_SAMPLE_TEXT);
                    const errorCount = rows.filter((row) => row.status === "error").length;
                    const warningCount = rows.filter((row) => row.status === "warning").length;
                    setCashCsvDraftText(CASH_INCOME_ERROR_SAMPLE_TEXT);
                    setCashPreviewRows(rows);
                    setCashServerPreview(null);
                    setCashServerPreviewError("");
                    setCashCommitResult(null);
                    setCashCommitError("");
                    setCashPreviewMessage(
                      `エラー確認用サンプルをセットし、preview を自動生成しました：rows=${rows.length}, error=${errorCount}, warning=${warningCount}。`
                    );
                  }}
                  className="inline-flex rounded-xl border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-50"
                >
                  Use error sample + preview
                </button>

                <div className="text-xs text-slate-500">
                  No DB write / No API call
                </div>
              </div>

              {cashPreviewMessage ? (
                <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-700">
                  {cashPreviewMessage}
                </div>
              ) : null}

              <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs leading-5 text-slate-600">
                エラー動作を確認する場合は「Use error sample」を押してから Preview CSV を実行してください。
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <div className="rounded-2xl bg-white p-3">
                  <div className="text-[11px] text-slate-500">Rows</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {cashPreviewStats.total}
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-3">
                  <div className="text-[11px] text-slate-500">Valid</div>
                  <div className="mt-1 text-lg font-semibold text-emerald-700">
                    {cashPreviewStats.valid}
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-3">
                  <div className="text-[11px] text-slate-500">Warning</div>
                  <div className="mt-1 text-lg font-semibold text-amber-700">
                    {cashPreviewStats.warning}
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-3">
                  <div className="text-[11px] text-slate-500">Error</div>
                  <div className="mt-1 text-lg font-semibold text-rose-700">
                    {cashPreviewStats.error}
                  </div>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <div className="min-w-[900px]">
                  <div className="grid grid-cols-[70px_120px_120px_130px_1fr_120px_170px] gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    <div>Row</div>
                    <div>Account</div>
                    <div>Amount</div>
                    <div>Occurred</div>
                    <div>Memo</div>
                    <div>Source</div>
                    <div>Status</div>
                  </div>

                  {cashPreviewRows.length > 0 ? (
                    cashPreviewRows.map((row) => (
                      <div
                        key={`${row.rowNo}-${row.account}-${row.amount}-${row.memo}`}
                        className="grid grid-cols-[70px_120px_120px_130px_1fr_120px_170px] gap-3 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0"
                      >
                        <div className="text-slate-500">{row.rowNo}</div>
                        <div className="font-medium text-slate-900">{row.account || "-"}</div>
                        <div className="text-slate-700">
                          {row.amount > 0 ? `¥${row.amount.toLocaleString("ja-JP")}` : "-"}
                        </div>
                        <div className="text-slate-600">{row.occurredAt || "-"}</div>
                        <div className="text-slate-600">{row.memo || "-"}</div>
                        <div className="text-slate-600">{row.source || "-"}</div>
                        <div>
                          <div
                            className={
                              row.status === "valid"
                                ? "inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200"
                                : row.status === "warning"
                                  ? "inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200"
                                  : "inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-200"
                            }
                          >
                            {formatCashDraftStatusLabel(row.status)}
                          </div>
                          {row.messages.length > 0 ? (
                            <div className="mt-1 text-[11px] leading-4 text-slate-500">
                              {row.messages.map(formatCashDraftMessage).join(" / ")}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-sm text-slate-500">
                      CSV を貼り付けるか Use sample を押してから、Preview CSV をクリックしてください。
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Pending Import Design
                  </div>
                  <div className="mt-2 text-xs leading-5 text-slate-500">
                    Preview 済みの行を、将来の transaction create flow に渡す想定 payload として確認します。現時点では保存せず、DB/API には接続しません。
                  </div>
                </div>
                <div className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
                  design only
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-[11px] text-slate-500">Commit Type</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">OTHER</div>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-[11px] text-slate-500">Direction</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">INCOME</div>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-[11px] text-slate-500">Memo Prefix</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">[cash]</div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs leading-5 text-slate-600">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="font-semibold text-slate-900">Company Context</span>
                    <span className="ml-2">
                      {cashCompanyLoading
                        ? "companyId を取得中..."
                        : cashCompanyId
                          ? `companyId=${cashCompanyId}`
                          : "companyId 未取得"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void loadCashCompanyId()}
                    className="inline-flex rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    companyId 再取得
                  </button>
                </div>
                {cashCompanyError ? (
                  <div className="mt-2 text-rose-700">{cashCompanyError}</div>
                ) : null}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-[11px] text-slate-500">Pending Rows</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {cashPendingStats.pendingRows}
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-[11px] text-slate-500">Excluded Error Rows</div>
                  <div className="mt-1 text-lg font-semibold text-rose-700">
                    {cashPendingStats.excludedErrorRows}
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-[11px] text-slate-500">Total Pending Amount</div>
                  <div className="mt-1 text-lg font-semibold text-emerald-700">
                    ¥{cashPendingStats.totalPendingAmount.toLocaleString("ja-JP")}
                  </div>
                </div>
              </div>

              {cashPendingStats.excludedErrorRows > 0 ? (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-700">
                  エラー行は pending payload から除外されます。修正後に Preview CSV を再実行してください。
                </div>
              ) : null}

              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
                正式導入は後続ステップで transaction create flow に接続します。accountName は accountId 照合が必要なため、この段階では pending payload として表示のみ行います。
              </div>

              <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <div className="min-w-[920px]">
                  <div className="grid grid-cols-[70px_90px_100px_120px_120px_130px_1fr_120px] gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    <div>Row</div>
                    <div>Type</div>
                    <div>Direction</div>
                    <div>Account</div>
                    <div>Amount</div>
                    <div>Occurred</div>
                    <div>Memo</div>
                    <div>Source</div>
                  </div>

                  {cashPendingRows.length > 0 ? (
                    cashPendingRows.map((row) => (
                      <div
                        key={`pending-${row.rowNo}-${row.amount}-${row.memo}`}
                        className="grid grid-cols-[70px_90px_100px_120px_120px_130px_1fr_120px] gap-3 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0"
                      >
                        <div className="text-slate-500">{row.rowNo}</div>
                        <div className="font-semibold text-slate-900">{row.type}</div>
                        <div className="font-semibold text-slate-900">{row.direction}</div>
                        <div className="text-slate-700">{row.accountName || "-"}</div>
                        <div className="text-slate-700">
                          ¥{row.amount.toLocaleString("ja-JP")}
                        </div>
                        <div className="text-slate-600">{row.occurredAt || "-"}</div>
                        <div className="text-slate-600">{row.memo}</div>
                        <div className="text-slate-600">{row.source || "-"}</div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-sm text-slate-500">
                      Preview CSV を実行すると、エラー以外の行が pending import payload として表示されます。
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                <div className="text-xs leading-5 text-slate-500">
                  次ステップでは、この payload を transaction create flow に接続し、accountName → accountId の照合と一括登録 API を追加します。
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={
                      cashServerReadiness.status === "ready"
                        ? "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700"
                        : cashServerReadiness.status === "needs_fix"
                          ? "inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-800"
                          : "inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600"
                    }
                  >
                    {cashServerReadiness.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => void runCashServerPreview()}
                    disabled={
                      cashServerPreviewLoading ||
                      cashCompanyLoading ||
                      !cashCompanyId ||
                      cashPreviewRows.length === 0
                    }
                    className="inline-flex rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {cashServerPreviewLoading ? "Server Preview..." : "Server Preview"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void runCashCommit()}
                    disabled={cashServerReadiness.status !== "ready" || cashCommitLoading}
                    className={
                      cashServerReadiness.status === "ready"
                        ? "inline-flex rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                        : "inline-flex cursor-not-allowed rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white opacity-40"
                    }
                  >
                    {cashCommitLoading
                      ? "正式取込中..."
                      : cashServerReadiness.status === "ready"
                        ? "正式取込を実行"
                        : "次のステップへ進む"}
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800">
                Server Preview は保存前確認です。正式取込ボタンを押すと Transaction を作成します。
              </div>

              <div
                className={
                  cashServerReadiness.status === "ready"
                    ? "mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-700"
                    : cashServerReadiness.status === "needs_fix"
                      ? "mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800"
                      : "mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600"
                }
              >
                <div className="font-semibold">{cashServerReadiness.label}</div>
                <div className="mt-1">{cashServerReadiness.message}</div>
              </div>

              {cashServerPreviewError ? (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-700">
                  {cashServerPreviewError}
                </div>
              ) : null}

              {cashServerPreview ? (
                <div className="mt-4 rounded-[22px] border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        Server Preview Result
                      </div>
                      <div className="mt-1 text-xs leading-5 text-slate-500">
                        Server Preview API から返却された normalizedPayload です。保存処理は「正式取込を実行」まで実行しません。
                      </div>
                    </div>
                    <div className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
                      {cashServerPreview.action}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-5">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <div className="text-[11px] text-slate-500">Total Rows</div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">
                        {cashServerPreview.summary.totalRows}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <div className="text-[11px] text-slate-500">Pending</div>
                      <div className="mt-1 text-lg font-semibold text-emerald-700">
                        {cashServerPreview.summary.pendingRows}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <div className="text-[11px] text-slate-500">Error</div>
                      <div className="mt-1 text-lg font-semibold text-rose-700">
                        {cashServerPreview.summary.errorRows}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <div className="text-[11px] text-slate-500">Warning</div>
                      <div className="mt-1 text-lg font-semibold text-amber-700">
                        {cashServerPreview.summary.warningRows}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <div className="text-[11px] text-slate-500">Amount</div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">
                        ¥{cashServerPreview.summary.totalPendingAmount.toLocaleString("ja-JP")}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <div className="text-[11px] text-slate-500">Exact matched</div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">
                        {cashServerAccountResolutionStats.exactMatched}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <div className="text-[11px] text-slate-500">Cash fallback matched</div>
                      <div className="mt-1 text-lg font-semibold text-emerald-700">
                        {cashServerAccountResolutionStats.cashFallbackMatched}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <div className="text-[11px] text-slate-500">Unresolved</div>
                      <div className="mt-1 text-lg font-semibold text-amber-700">
                        {cashServerAccountResolutionStats.unresolved}
                      </div>
                    </div>
                  </div>

                  {cashServerAccountResolutionStats.unresolved > 0 ? (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
                      <div className="font-semibold text-amber-900">
                        未解決の口座があります。正式取込前に口座名を修正してください。
                      </div>
                      <div className="mt-1">
                        CSV の account 列を既存の入金先口座名に合わせるか、設定画面で口座を追加してください。現時点では未解決行は正式登録できません。
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link
                          href={`/${lang}/app/settings/accounts`}
                          className="inline-flex rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-amber-800 transition hover:bg-amber-100"
                        >
                          入金先口座を設定する
                        </Link>
                        <button
                          type="button"
                          onClick={() => void runCashServerPreview()}
                          className="inline-flex rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-amber-800 transition hover:bg-amber-100"
                        >
                          Server Preview を再実行
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                    <div className="min-w-[980px]">
                      <div className="grid grid-cols-[70px_120px_100px_120px_130px_1fr_150px_170px] gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        <div>Row</div>
                        <div>Status</div>
                        <div>Type</div>
                        <div>Amount</div>
                        <div>Occurred</div>
                        <div>Memo</div>
                        <div>Account</div>
                        <div>Account ID</div>
                      </div>

                      {cashServerPreview.rows.map((row) => (
                        <div
                          key={`server-${row.rowNo}-${row.matchStatus}`}
                          className={
                            row.accountResolution?.matchMode === "unresolved"
                              ? "grid grid-cols-[70px_120px_100px_120px_130px_1fr_150px_170px] gap-3 border-b border-amber-100 bg-amber-50/60 px-4 py-3 text-sm last:border-b-0"
                              : "grid grid-cols-[70px_120px_100px_120px_130px_1fr_150px_170px] gap-3 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0"
                          }
                        >
                          <div className="text-slate-500">{row.rowNo}</div>
                          <div>
                            <div className="font-semibold text-slate-900">{row.matchStatus}</div>
                            {row.matchReason ? (
                              <div className="mt-1 text-[11px] leading-4 text-slate-500">
                                {formatCashServerMatchReason(row.matchReason)}
                              </div>
                            ) : null}
                          </div>
                          <div className="text-slate-700">{row.normalizedPayload.type}</div>
                          <div className="text-slate-700">
                            ¥{row.normalizedPayload.amount.toLocaleString("ja-JP")}
                          </div>
                          <div className="text-slate-600">{row.normalizedPayload.occurredAt || "-"}</div>
                          <div className="text-slate-600">{row.normalizedPayload.memo}</div>
                          <div className="text-slate-600">
                            {row.normalizedPayload.accountName || "-"}
                          </div>
                          <div className="space-y-1">
                            <div className="font-mono text-[11px] text-slate-600">
                              {row.normalizedPayload.accountId || "unresolved"}
                            </div>
                            <div
                              className={
                                row.accountResolution?.matchMode === "unresolved"
                                  ? "inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800"
                                  : "inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                              }
                            >
                              {formatCashAccountMatchMode(row.accountResolution?.matchMode)}
                            </div>
                            {row.accountResolution?.matchMode === "unresolved" ? (
                              <Link
                                href={`/${lang}/app/settings/accounts`}
                                className="inline-flex rounded-full border border-amber-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-amber-800 transition hover:bg-amber-100"
                              >
                                口座設定へ
                              </Link>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {cashCommitError ? (
              <div className="rounded-[22px] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
                <div className="font-semibold">正式取込エラー</div>
                <div className="mt-2 text-xs leading-5">{cashCommitError}</div>
              </div>
            ) : null}

            {cashCommitResult ? (
              <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-emerald-900">
                      Cash Commit Result
                    </div>
                    <div className="mt-1 text-xs leading-5 text-emerald-700">
                      正式取込 API の実行結果です。作成済みの Transaction は現金収入ページで確認できます。遷移後は最新データを再取得し、30日表示で確認します。
                    </div>
                  </div>
                  <div className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-[11px] font-semibold text-emerald-700">
                    {cashCommitResult.action}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  <div className="rounded-2xl bg-white p-4">
                    <div className="text-[11px] text-slate-500">Imported Rows</div>
                    <div className="mt-1 text-lg font-semibold text-emerald-700">
                      {cashCommitResult.importedRows ?? cashCommitResult.summary.importedRows ?? 0}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <div className="text-[11px] text-slate-500">Duplicate Rows</div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">
                      {cashCommitResult.duplicateRows ?? cashCommitResult.summary.duplicateRows ?? 0}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <div className="text-[11px] text-slate-500">Blocked Rows</div>
                    <div className="mt-1 text-lg font-semibold text-amber-700">
                      {cashCommitResult.blockedRows ?? cashCommitResult.summary.blockedRows ?? 0}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <div className="text-[11px] text-slate-500">Imported Amount</div>
                    <div className="mt-1 text-lg font-semibold text-emerald-700">
                      ¥{Number(cashCommitResult.summary.totalImportedAmount || 0).toLocaleString("ja-JP")}
                    </div>
                  </div>
                </div>

                {(cashCommitResult.duplicateRows ?? cashCommitResult.summary.duplicateRows ?? 0) > 0 ? (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
                    <div className="font-semibold text-amber-900">
                      重複スキップ: {cashCommitResult.duplicateRows ?? cashCommitResult.summary.duplicateRows ?? 0} 件
                    </div>
                    <div className="mt-1">
                      同じ dedupeHash の Transaction が既に存在するため、重複行は新規作成せずにスキップしました。
                    </div>
                    {(cashCommitResult.importedRows ?? cashCommitResult.summary.importedRows ?? 0) === 0 ? (
                      <div className="mt-1 font-semibold">
                        すべて既存データとして検出されました。新規作成はありません。
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800">
                  <div className="font-semibold text-blue-900">データ反映について</div>
                  <div className="mt-1">
                    現金収入ページへ移動すると、Transaction 一覧を再取得して最新状態を表示します。新規作成が 0 件の場合でも、重複として検出された既存データは cash table 側で確認できます。
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-xs leading-5 text-slate-600">
                  <div className="font-semibold text-slate-900">Created Transaction IDs</div>
                  <div className="mt-2 font-mono">
                    {cashCommitResult.createdTransactionIds?.length
                      ? cashCommitResult.createdTransactionIds.filter(Boolean).join(", ")
                      : "-"}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={cashPostCommitHref}
                    className="inline-flex rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
                  >
                    現金収入ページで確認する
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setCashCommitResult(null);
                      setCashCommitError("");
                      void runCashServerPreview();
                    }}
                    className="inline-flex rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                  >
                    Server Preview を再実行
                  </button>
                </div>
              </div>
            ) : null}

            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-5">
              <div className="text-sm font-semibold text-slate-900">
                現在の実装ステータス
              </div>
              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-xs text-slate-500">Entry</div>
                  <div className="mt-1 text-sm font-medium text-slate-900">
                    /app/data/import?module=cash-income から専用画面を表示
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-xs text-slate-500">Sample</div>
                  <div className="mt-1 text-sm font-medium text-slate-900">
                    CSV サンプルフォーマット表示：完了
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-xs text-slate-500">Preview</div>
                  <div className="mt-1 text-sm font-medium text-slate-900">
                    Client-side preview：完了。DB/API には未接続
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-xs text-slate-500">Pending Payload</div>
                  <div className="mt-1 text-sm font-medium text-slate-900">
                    cash import workspace component extraction まで完了（Transaction write enabled）
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[22px] border border-amber-200 bg-amber-50 p-5">
              <div className="text-sm font-semibold text-amber-900">
                次の開発予定
              </div>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-800">
                <li>1. CSV サンプルフォーマット表示：完了</li>
                <li>2. クライアント側 client-side preview table：完了</li>
                <li>3. CSV validation と preview state：完了（client-side only）</li>
                <li>4. Pending import payload design：完了</li>
                <li>5. Pending payload summary linkage：完了</li>
                <li>6. Server preview contract 接続：完了</li>
                <li>7. accountName → accountId exact match contract：完了</li>
                <li>8. account alias / cash fallback matching：完了</li>
                <li>9. frontend companyId server preview：完了</li>
                <li>10. server preview result UX：完了</li>
                <li>11. unresolved account correction UX：完了</li>
                <li>12. pre-commit readiness gate：完了</li>
                <li>13. frontend cash commit wiring：完了</li>
                <li>14. post-commit cash page navigation：完了</li>
                <li>15. duplicate result clarity：完了</li>
                <li>16. post-import refresh consistency：完了</li>
                <li>17. cash import cleanup：完了</li>
                <li>18. helper extraction preparation：完了</li>
                <li>19. pure helper extraction：完了</li>\n                <li>20. workspace component extraction：完了</li>
                <li>20. 将来：取込履歴・ImportJob 接続</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href={`/${lang}/app/income/cash`}
                className="inline-flex items-center justify-center rounded-xl border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                現金収入ページへ戻る
              </Link>
              <Link
                href={`/${lang}/app/settings/accounts`}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                入金先口座を設定する
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
}
