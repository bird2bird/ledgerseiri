import { useEffect, useMemo, useState } from "react";
import {
  createTransactionsContext,
  fetchExpensesPageData,
  type ExpenseCategory,
  type ExpenseRow,
} from "@/core/transactions/transactions";
import {
  createTransaction,
  listTransactionCategories,
  updateTransaction,
  type TransactionCategoryItem,
} from "@/core/transactions/api";
import { listAccounts, type AccountItem } from "@/core/funds/api";
import { getNowLocalInputValue } from "@/core/transactions/expenses-page-constants";

export function useExpensesPageState(args: {
  from: string;
  storeId: string;
  range: string;
  category: ExpenseCategory;
  action: string;
}) {
  const { from, storeId, range, category, action } = args;

  const [rows, setRows] = useState<ExpenseRow[]>([]);
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

  const selectedRow = useMemo(
    () => rows.find((row) => row.id === selectedRowId) ?? null,
    [rows, selectedRowId]
  );

  async function loadRows() {
    setLoading(true);
    setError("");

    try {
      const ctx = createTransactionsContext({
        from,
        storeId,
        range,
        category,
      });

      const res = await fetchExpensesPageData(category, ctx);
      setRows(res.rows);
      setAdapterNote(res.meta.note ?? "");
    } catch (e: unknown) {
      setRows([]);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRows();
  }, [from, storeId, range, category]);

  useEffect(() => {
    if (action !== "create") return;

    let mounted = true;
    setFormLoading(true);
    setPanelError("");

    Promise.all([listAccounts(), listTransactionCategories("EXPENSE")])
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
        type: "EXPENSE_MANUAL",
        direction: "EXPENSE",
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

  const totalAmount = useMemo(
    () => rows.reduce((sum, row) => sum + row.amount, 0),
    [rows]
  );

  return {
    rows,
    selectedRowId,
    setSelectedRowId,
    selectedRow,
    adapterNote,
    loading,
    error,
    totalAmount,
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
