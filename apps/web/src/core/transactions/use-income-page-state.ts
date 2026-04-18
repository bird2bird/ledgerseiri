import { useEffect, useMemo, useState } from "react";
import {
  aggregateStoreOrderIncomeRows,
  buildIncomeRowsFromAmazonFacts,
  createTransactionsContext,
  fetchIncomePageData,
  sortStoreOrderIncomeRows,
  type IncomeCategory,
  type IncomeRow,
} from "@/core/transactions/transactions";
import {
  createTransaction,
  listTransactionCategories,
  updateTransaction,
  type TransactionCategoryItem,
} from "@/core/transactions/api";
import { listAccounts, type AccountItem } from "@/core/funds/api";
import { loadAmazonStoreOrdersStage } from "@/core/jobs";
import { getNowLocalInputValue } from "@/core/transactions/income-page-constants";

const EMPTY_STAGE_CHARGE_SUMMARY = {
  orderSale: 0,
  adFee: 0,
  storageFee: 0,
  subscriptionFee: 0,
  fbaFee: 0,
  tax: 0,
  payout: 0,
  adjustment: 0,
  other: 0,
};

function normalizeImportMonths(values: string[]): string[] {
  return values
    .map((x) => String(x || "").trim())
    .filter(Boolean);
}

function deriveIncomeRowMonth(row: IncomeRow): string {
  const businessMonth = String(row.businessMonth || "").trim();
  if (businessMonth) return businessMonth;

  const raw = String(row.sortAt || row.importedAt || row.date || "").trim();
  if (!raw) return "";

  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) {
    return `${direct.getFullYear()}-${String(direct.getMonth() + 1).padStart(2, "0")}`;
  }

  const match = raw.match(/(20\d{2})[\/\-.年]?\s*(0?[1-9]|1[0-2])/);
  if (!match) return "";

  return `${match[1]}-${String(Number(match[2])).padStart(2, "0")}`;
}

function filterImportAwareStoreOrderRows(args: {
  rows: IncomeRow[];
  importFrom: string;
  importJobId: string;
  importMonths: string[];
}): IncomeRow[] {
  const { rows, importFrom, importJobId, importMonths } = args;

  if (importFrom !== "import-commit") {
    return rows;
  }

  const normalizedJobId = String(importJobId || "").trim();
  const monthSet = new Set(normalizeImportMonths(importMonths));

  return rows.filter((row) => {
    const sameJob = normalizedJobId
      ? String(row.importJobId || "").trim() === normalizedJobId
      : true;

    const sameMonth =
      monthSet.size > 0 ? monthSet.has(deriveIncomeRowMonth(row)) : true;

    return sameJob && sameMonth;
  });
}

function buildStoreOrderCompositeKey(args: {
  date?: string | null;
  orderId?: string | null;
  sku?: string | null;
}) {
  return `${String(args.date || "-")}__${String(args.orderId || "")}__${String(args.sku || "")}`;
}

function resolveSelectedRawTransactionRows(args: {
  category: IncomeCategory;
  storeOrderViewMode: "aggregated" | "raw";
  selectedRow: IncomeRow | null;
  rawStoreOrderRows: IncomeRow[];
}) {
  const { category, storeOrderViewMode, selectedRow, rawStoreOrderRows } = args;

  if (category !== "store-order" || !selectedRow) {
    return [];
  }

  if (storeOrderViewMode === "raw") {
    return rawStoreOrderRows.filter((row) => row.id === selectedRow.id);
  }

  const selectedDate = String(selectedRow.date || "-");
  const selectedOrderId = String(selectedRow.externalRef || "");
  const selectedSku = String(selectedRow.sku || "");
  const selectedKey = buildStoreOrderCompositeKey({
    date: selectedDate,
    orderId: selectedOrderId,
    sku: selectedSku,
  });

  const exact = rawStoreOrderRows.filter((row) => {
    const rowKey = buildStoreOrderCompositeKey({
      date: row.date,
      orderId: row.externalRef,
      sku: row.sku,
    });
    return rowKey === selectedKey;
  });
  if (exact.length > 0) return exact;

  const byAggregateId = rawStoreOrderRows.filter((row) => {
    const rowKey = buildStoreOrderCompositeKey({
      date: row.date,
      orderId: row.externalRef,
      sku: row.sku,
    });
    return rowKey === String(selectedRow.id || "");
  });
  if (byAggregateId.length > 0) return byAggregateId;

  const byDateAndOrder = rawStoreOrderRows.filter((row) => {
    return (
      String(row.date || "-") === selectedDate &&
      String(row.externalRef || "") === selectedOrderId
    );
  });
  if (byDateAndOrder.length > 0) return byDateAndOrder;

  return [];
}

export function useIncomePageState(args: {
  from: string;
  storeId: string;
  range: string;
  category: IncomeCategory;
  action: string;
  importJobId: string;
  importMonths: string[];
}) {
  const { from, storeId, range, category, action, importJobId, importMonths } = args;

  const [rows, setRows] = useState<IncomeRow[]>([]);
  const [selectedRowId, setSelectedRowId] = useState("");
  const [adapterNote, setAdapterNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [txCategories, setTxCategories] = useState<TransactionCategoryItem[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [panelError, setPanelError] = useState("");

  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [occurredAt, setOccurredAt] = useState(getNowLocalInputValue());
  const [memo, setMemo] = useState("");

  const [editAmount, setEditAmount] = useState("");
  const [editMemo, setEditMemo] = useState("");
  const [editUiError, setEditUiError] = useState("");
  const [editUiMessage, setEditUiMessage] = useState("");
  const [editSaveLoading, setEditSaveLoading] = useState(false);

  const [pageSize, setPageSize] = useState<20 | 50 | 100>(20);
  const [currentPage, setCurrentPage] = useState(1);

  const [rawStoreOrderRows, setRawStoreOrderRows] = useState<IncomeRow[]>([]);
  const [aggregatedStoreOrderRows, setAggregatedStoreOrderRows] = useState<IncomeRow[]>([]);
  const [storeOrderViewMode, setStoreOrderViewMode] = useState<"aggregated" | "raw">("aggregated");

  const [stageChargeSummary, setStageChargeSummary] = useState(EMPTY_STAGE_CHARGE_SUMMARY);

  const importMonthsKey = useMemo(
    () => normalizeImportMonths(importMonths).join(","),
    [importMonths]
  );

  const selectedRow = useMemo(
    () => rows.find((row) => row.id === selectedRowId) ?? null,
    [rows, selectedRowId]
  );

  async function loadRows() {
    setLoading(true);
    setError("");

    try {
      if (category === "store-order" && from !== "import-commit") {
        const stage = loadAmazonStoreOrdersStage();
        if (stage?.facts?.length) {
          const rawRows = sortStoreOrderIncomeRows(
            buildIncomeRowsFromAmazonFacts({
              facts: stage.facts,
              filename: stage.filename,
              savedAt: stage.savedAt,
            })
          );
          const aggregatedRows = sortStoreOrderIncomeRows(
            aggregateStoreOrderIncomeRows(rawRows)
          );

          setRawStoreOrderRows(rawRows);
          setAggregatedStoreOrderRows(aggregatedRows);
          setRows(storeOrderViewMode === "raw" ? rawRows : aggregatedRows);
          setStageChargeSummary(stage.chargeSummary ?? EMPTY_STAGE_CHARGE_SUMMARY);
          setAdapterNote(
            `Step105-D4-G3: amazon-store-orders staging を ${storeOrderViewMode === "raw" ? "原始transaction" : "date + orderId + SKU 集約"} で優先表示中 · ${stage.filename} · ${stage.savedAt}`
          );
          return;
        }
      }

      const ctx = createTransactionsContext({
        from,
        storeId,
        range,
        category,
      });

      const res = await fetchIncomePageData(category, ctx);
      const nextRows =
        category === "store-order" ? sortStoreOrderIncomeRows(res.rows) : res.rows;

      if (category === "store-order") {
        const rawRows = sortStoreOrderIncomeRows(
          filterImportAwareStoreOrderRows({
            rows: res.rows,
            importFrom: from,
            importJobId,
            importMonths,
          })
        );
        const aggregatedRows = sortStoreOrderIncomeRows(
          aggregateStoreOrderIncomeRows(rawRows)
        );

        setRawStoreOrderRows(rawRows);
        setAggregatedStoreOrderRows(aggregatedRows);
        setRows(storeOrderViewMode === "raw" ? rawRows : aggregatedRows);
      } else {
        setRawStoreOrderRows([]);
        setAggregatedStoreOrderRows([]);
        setRows(nextRows);
      }

      setStageChargeSummary(EMPTY_STAGE_CHARGE_SUMMARY);
      if (category === "store-order" && from === "import-commit") {
        const filteredMonths = normalizeImportMonths(importMonths);
        setAdapterNote(
          `Step105-EG: import-aware DB filter active · importJobId=${importJobId || "-"} · months=${filteredMonths.length ? filteredMonths.join(",") : "-"}`
        );
      } else {
        setAdapterNote(res.meta.note ?? "");
      }
    } catch (e: unknown) {
      setRows([]);
      setRawStoreOrderRows([]);
      setAggregatedStoreOrderRows([]);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRows();
  }, [from, storeId, range, category, importJobId, importMonthsKey]);

  useEffect(() => {
    setCurrentPage(1);
  }, [from, storeId, range, category, importJobId, importMonthsKey]);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  useEffect(() => {
    if (category !== "store-order") return;

    const nextRows =
      storeOrderViewMode === "raw" ? rawStoreOrderRows : aggregatedStoreOrderRows;

    setRows(nextRows);
    setSelectedRowId("");
  }, [category, storeOrderViewMode, rawStoreOrderRows, aggregatedStoreOrderRows]);

  useEffect(() => {
    if (action !== "create") return;

    let mounted = true;
    setFormLoading(true);
    setPanelError("");

    Promise.all([listAccounts(), listTransactionCategories("INCOME")])
      .then(([accountsRes, categoriesRes]) => {
        if (!mounted) return;
        setAccounts(accountsRes.items ?? []);
        setTxCategories(categoriesRes.items ?? []);

        if ((accountsRes.items ?? []).length > 0) {
          setAccountId((v) => v || accountsRes.items[0].id);
        }
        if ((categoriesRes.items ?? []).length > 0) {
          setCategoryId((v) => v || categoriesRes.items[0].id);
        }
      })
      .catch((e: unknown) => {
        if (!mounted) return;
        setPanelError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (mounted) setFormLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [action]);

  useEffect(() => {
    if (action !== "edit" || !selectedRow) return;
    setEditAmount(String(selectedRow.amount ?? ""));
    setEditMemo(selectedRow.memo ?? "");
    setEditUiError("");
    setEditUiMessage("");
    setEditSaveLoading(false);
  }, [action, selectedRow]);

  const editAmountNumber = Number(editAmount || 0);
  const editAmountValid = Number.isFinite(editAmountNumber) && editAmountNumber > 0;
  const editMemoTooLong = editMemo.length > 500;
  const editDirty =
    !!selectedRow &&
    (String(editAmount) !== String(selectedRow.amount ?? "") ||
      String(editMemo) !== String(selectedRow.memo ?? ""));
  const editCanSave =
    !!selectedRow && editAmountValid && !editMemoTooLong && editDirty;

  async function handleEditSave() {
    setEditUiError("");
    setEditUiMessage("");

    if (!selectedRow) {
      setEditUiError("編集対象が選択されていません。");
      return;
    }
    if (!editAmountValid) {
      setEditUiError("金額は 0 より大きい数値を入力してください。");
      return;
    }
    if (editMemoTooLong) {
      setEditUiError("メモは 500 文字以内で入力してください。");
      return;
    }
    if (!editDirty) {
      setEditUiError("変更内容がありません。");
      return;
    }

    try {
      setEditSaveLoading(true);

      await updateTransaction(selectedRow.id, {
        amount: Number(editAmount),
        memo: editMemo,
      });

      const preservedId = selectedRow.id;
      await loadRows();
      setSelectedRowId(preservedId);

      setEditAmount(String(Number(editAmount)));
      setEditMemo(editMemo);
      setEditUiError("");
      setEditUiMessage("保存しました。");
      setTimeout(() => {
        setEditUiMessage("");
      }, 2000);
    } catch (e: unknown) {
      setEditUiMessage("");
      setEditUiError(e instanceof Error ? e.message : String(e));
    } finally {
      setEditSaveLoading(false);
    }
  }

  async function submitCreate() {
    try {
      setSubmitLoading(true);
      setPanelError("");

      await createTransaction({
        accountId: accountId || null,
        categoryId: categoryId || null,
        type: "INCOME_MANUAL",
        direction: "INCOME",
        amount: Number(amount || 0),
        currency: "JPY",
        occurredAt: new Date(occurredAt).toISOString(),
        memo,
      });

      setAmount("");
      setMemo("");
      setOccurredAt(getNowLocalInputValue());
      await loadRows();
    } catch (e: unknown) {
      setPanelError(e instanceof Error ? e.message : String(e));
      throw e;
    } finally {
      setSubmitLoading(false);
    }
  }

  const totalRows = rows.length;

  const totalNetAmount = useMemo(
    () => rows.reduce((sum, row) => sum + Number(row.netAmount ?? row.amount ?? 0), 0),
    [rows]
  );
  const totalFeeAmount = useMemo(
    () => rows.reduce((sum, row) => sum + Number(row.feeAmount ?? 0), 0),
    [rows]
  );
  const totalTaxAmount = useMemo(
    () => rows.reduce((sum, row) => sum + Number(row.taxAmount ?? 0), 0),
    [rows]
  );
  const totalShippingAmount = useMemo(
    () => rows.reduce((sum, row) => sum + Number(row.shippingAmount ?? 0), 0),
    [rows]
  );
  const totalPromotionAmount = useMemo(
    () => rows.reduce((sum, row) => sum + Number(row.promotionAmount ?? 0), 0),
    [rows]
  );
  const totalQuantity = useMemo(
    () =>
      rows.reduce((sum, row) => {
        const qty = Number(row.quantity ?? 0);
        return sum + (Number.isFinite(qty) ? qty : 0);
      }, 0),
    [rows]
  );

  const selectedRawTransactionRows = resolveSelectedRawTransactionRows({
    category,
    storeOrderViewMode,
    selectedRow,
    rawStoreOrderRows,
  });

  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const visibleRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, currentPage, pageSize]);

  const pageStartRow = totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEndRow = totalRows === 0 ? 0 : Math.min(currentPage * pageSize, totalRows);

  const totalAmount = useMemo(
    () => rows.reduce((sum, row) => sum + row.amount, 0),
    [rows]
  );

  return {
    rows,
    visibleRows,
    selectedRowId,
    setSelectedRowId,
    selectedRow,
    selectedRawTransactionRows,
    rawStoreOrderRows,
    adapterNote,
    loading,
    error,
    totalAmount,
    totalNetAmount,
    totalFeeAmount,
    totalTaxAmount,
    totalShippingAmount,
    totalPromotionAmount,
    stageChargeSummary,
    rawStoreOrderCount: rawStoreOrderRows.length,
    aggregatedStoreOrderCount: aggregatedStoreOrderRows.length,
    storeOrderViewMode,
    setStoreOrderViewMode,
    totalRows,
    totalQuantity,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    totalPages,
    pageStartRow,
    pageEndRow,
    reloadRows: loadRows,

    accounts,
    txCategories,
    formLoading,
    submitLoading,
    panelError,
    setPanelError,

    accountId,
    setAccountId,
    categoryId,
    setCategoryId,
    amount,
    setAmount,
    occurredAt,
    setOccurredAt,
    memo,
    setMemo,

    editAmount,
    setEditAmount,
    editMemo,
    setEditMemo,
    editUiError,
    setEditUiError,
    editUiMessage,
    setEditUiMessage,
    editSaveLoading,

    editAmountValid,
    editMemoTooLong,
    editDirty,
    editCanSave,

    submitCreate,
    handleEditSave,
  };
}
