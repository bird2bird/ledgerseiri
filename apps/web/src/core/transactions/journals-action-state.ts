import {
  getJournalsActionEmptyMessage,
  getJournalsActionInitialTone,
  getJournalsActionMissingSelectionMessage,
  getBulkPostShellSuccessMessage,
  getFlaggedReviewShellSuccessMessage,
  runJournalsActionShell,
  type JournalsActionUiTone,
} from "@/core/transactions/journals-action-execution";

export type JournalsActionState = {
  message: string;
  tone: JournalsActionUiTone;
  loading: boolean;
};

export function createInitialJournalsActionState(): JournalsActionState {
  return {
    message: getJournalsActionEmptyMessage(),
    tone: getJournalsActionInitialTone(),
    loading: false,
  };
}

export function resetJournalsActionState(
  setters: {
    setMessage: (value: string) => void;
    setTone: (value: JournalsActionUiTone) => void;
    setLoading: (value: boolean) => void;
  }
) {
  setters.setMessage(getJournalsActionEmptyMessage());
  setters.setTone(getJournalsActionInitialTone());
  setters.setLoading(false);
}

export async function runBulkPostShellAction(args: {
  hasSelection: boolean;
  setMessage: (value: string) => void;
  setTone: (value: JournalsActionUiTone) => void;
  setLoading: (value: boolean) => void;
}) {
  const { hasSelection, setMessage, setTone, setLoading } = args;

  if (!hasSelection) {
    setTone("error");
    setMessage(getJournalsActionMissingSelectionMessage());
    return;
  }

  try {
    setLoading(true);
    setTone(getJournalsActionInitialTone());
    setMessage(getJournalsActionEmptyMessage());

    await runJournalsActionShell();

    setTone("success");
    setMessage(getBulkPostShellSuccessMessage());
  } catch (e: unknown) {
    setTone("error");
    setMessage(e instanceof Error ? e.message : String(e));
  } finally {
    setLoading(false);
  }
}

export async function runFlaggedReviewShellAction(args: {
  setMessage: (value: string) => void;
  setTone: (value: JournalsActionUiTone) => void;
  setLoading: (value: boolean) => void;
}) {
  const { setMessage, setTone, setLoading } = args;

  try {
    setLoading(true);
    setTone(getJournalsActionInitialTone());
    setMessage(getJournalsActionEmptyMessage());

    await runJournalsActionShell();

    setTone("success");
    setMessage(getFlaggedReviewShellSuccessMessage());
  } catch (e: unknown) {
    setTone("error");
    setMessage(e instanceof Error ? e.message : String(e));
  } finally {
    setLoading(false);
  }
}
