import type { WorkspaceContext } from "@/core/workspace/types";
import { resolveWorkspaceContext } from "@/core/workspace/resolve";

export async function getWorkspaceContext(args: {
  slug: string;
  locale: string;
  plan?: string;
}): Promise<WorkspaceContext> {
  return resolveWorkspaceContext(args);
}
