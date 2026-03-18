import { useEffect, useMemo, useState } from "react";
import {
  createTransactionsContext,
  fetchJournalsPageData,
  type JournalRow,
  type JournalTab,
} from "@/core/transactions/transactions";

export function useJournalsPageState(args: {
  from: string;
  storeId: string;
  range: string;
  tab: JournalTab;
}) {
  const { from, storeId, range, tab } = args;

  const [rows, setRows] = useState<JournalRow[]>([]);
  const [selectedRowId, setSelectedRowId] = useState("");
  const [adapterNote, setAdapterNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        tab,
      });

      const res = await fetchJournalsPageData(tab, ctx);
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
  }, [from, storeId, range, tab]);

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
  };
}
