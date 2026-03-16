import {
  runBulkPostShellAction,
  runFlaggedReviewShellAction,
} from "@/core/transactions/journals-action-state";
import type { JournalsActionUiTone } from "@/core/transactions/journals-action-execution";

export type JournalsActionHandlerSetters = {
  setMessage: (value: string) => void;
  setTone: (value: JournalsActionUiTone) => void;
  setLoading: (value: boolean) => void;
};

export async function executeBulkPostShellAction(args: {
  hasSelection: boolean;
  setMessage: (value: string) => void;
  setTone: (value: JournalsActionUiTone) => void;
  setLoading: (value: boolean) => void;
}) {
  const { hasSelection, setMessage, setTone, setLoading } = args;

  await runBulkPostShellAction({
    hasSelection,
    setMessage,
    setTone,
    setLoading,
  });
}

export async function executeFlaggedReviewShellAction(
  args: JournalsActionHandlerSetters
) {
  const { setMessage, setTone, setLoading } = args;

  await runFlaggedReviewShellAction({
    setMessage,
    setTone,
    setLoading,
  });
}
