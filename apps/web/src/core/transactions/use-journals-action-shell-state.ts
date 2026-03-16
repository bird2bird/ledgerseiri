"use client";

import { useState } from "react";
import { createInitialJournalsActionState, resetJournalsActionState } from "@/core/transactions/journals-action-state";
import type { JournalsActionUiTone } from "@/core/transactions/journals-action-execution";

export function useJournalsActionShellState() {
  const [bulkPostUiMessage, setBulkPostUiMessage] = useState(createInitialJournalsActionState().message);
  const [bulkPostUiTone, setBulkPostUiTone] = useState<JournalsActionUiTone>(createInitialJournalsActionState().tone);
  const [bulkPostLoading, setBulkPostLoading] = useState(createInitialJournalsActionState().loading);

  const [flaggedUiMessage, setFlaggedUiMessage] = useState(createInitialJournalsActionState().message);
  const [flaggedUiTone, setFlaggedUiTone] = useState<JournalsActionUiTone>(createInitialJournalsActionState().tone);
  const [flaggedLoading, setFlaggedLoading] = useState(createInitialJournalsActionState().loading);

  function resetAllActionShellState() {
    resetJournalsActionState({
      setMessage: setBulkPostUiMessage,
      setTone: setBulkPostUiTone,
      setLoading: setBulkPostLoading,
    });

    resetJournalsActionState({
      setMessage: setFlaggedUiMessage,
      setTone: setFlaggedUiTone,
      setLoading: setFlaggedLoading,
    });
  }

  return {
    bulkPostUiMessage,
    setBulkPostUiMessage,
    bulkPostUiTone,
    setBulkPostUiTone,
    bulkPostLoading,
    setBulkPostLoading,
    flaggedUiMessage,
    setFlaggedUiMessage,
    flaggedUiTone,
    setFlaggedUiTone,
    flaggedLoading,
    setFlaggedLoading,
    resetAllActionShellState,
  };
}

export default useJournalsActionShellState;
