import { useEffect, useMemo, useState } from "react";
import {
  createTransactionsContext,
  fetchFundTransferPageData,
  type TransferRow,
  type TransferStatus,
} from "@/core/transactions/transactions";
import { createFundTransfer, listAccounts, updateFundTransfer, type AccountItem } from "@/core/funds/api";
import { getNowLocalInputValue } from "@/core/transactions/fund-transfer-page-constants";

export function useFundTransferPageState(args: {
  from: string;
  storeId: string;
  range: string;
  status: TransferStatus;
  action: string;
}) {
  const { from, storeId, range, status, action } = args;

  const [rows, setRows] = useState<TransferRow[]>([]);
  const [selectedRowId, setSelectedRowId] = useState("");
  const [adapterNote, setAdapterNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [panelError, setPanelError] = useState("");

  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
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
        status,
      });

      const res = await fetchFundTransferPageData(status, ctx);
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
  }, [from, storeId, range, status]);

  useEffect(() => {
    if (action !== "create") return;

    let mounted = true;
    setFormLoading(true);
    setPanelError("");

    listAccounts()
      .then((res) => {
        if (!mounted) return;
        setAccounts(res.items ?? []);
        if ((res.items ?? []).length >= 2) {
          setFromAccountId((v) => v || res.items[0].id);
          setToAccountId((v) => v || res.items[1].id);
        } else if ((res.items ?? []).length === 1) {
          setFromAccountId((v) => v || res.items[0].id);
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

  async function submitCreate() {
    try {
      setSubmitLoading(true);
      setPanelError("");

      await createFundTransfer({
        fromAccountId,
        toAccountId,
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

      await updateFundTransfer(selectedRow.id, {
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
    formLoading,
    submitLoading,
    panelError,

    fromAccountId,
    setFromAccountId,
    toAccountId,
    setToAccountId,
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
