import type { WorkspaceContextValue } from "./types";
import { resolveWorkspaceContext } from "./resolve";

export type WorkspaceRepositoryInput = {
  slug?: string | null;
  plan?: string | null;
  locale?: string | null;
};

export async function getWorkspaceContext(
  input: WorkspaceRepositoryInput
): Promise<WorkspaceContextValue> {
  // Step 15 contract-ready mock repository
  // Future replacement:
  // - lookup workspace by slug
  // - lookup subscription by workspace/account
  // - compute entitlements + limits from billing tables
  return resolveWorkspaceContext({
    slug: input.slug,
    plan: input.plan,
    locale: input.locale,
  });
}
