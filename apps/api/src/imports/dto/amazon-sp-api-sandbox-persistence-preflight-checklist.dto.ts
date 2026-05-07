import {
  type AmazonSpApiSandboxOverrideAuditSnapshot,
  assertAmazonSpApiSandboxOverrideAuditSnapshot,
} from './amazon-sp-api-sandbox-override-audit-snapshot.dto';
import { assertAmazonSpApiSandboxPermissionBoundary } from './amazon-sp-api-sandbox-permission-boundary.dto';
import { assertAmazonSpApiSandboxCsvDedupeBoundary } from './amazon-sp-api-sandbox-csv-dedupe-boundary.dto';
import { assertAmazonSpApiSandboxImportCenterVisibilityPolicy } from './amazon-sp-api-sandbox-import-center-visibility-policy.dto';

export const AMAZON_SP_API_SANDBOX_PERSISTENCE_PREFLIGHT_CHECKLIST_VERSION =
  'amazon-sp-api-sandbox-persistence-preflight-checklist-v1' as const;

export type AmazonSpApiSandboxPreflightItemKey =
  | 'canonical-dedupe-key-confirmed'
  | 'before-after-audit-snapshot-generated'
  | 'amount-quantity-diff-manual-review-completed'
  | 'inventory-compensation-plan-approved'
  | 'importjob-persistence-strategy-approved'
  | 'transaction-overwrite-strategy-approved'
  | 'permission-boundary-approved'
  | 'rollback-plan-approved'
  | 'controller-route-contract-approved'
  | 'token-oauth-security-model-approved'
  | 'import-center-visibility-approved'
  | 'csv-cross-source-dedupe-approved'
  | 'no-silent-overwrite-confirmed'
  | 'real-sp-api-client-contract-approved'
  | 'production-feature-flag-approved';

export type AmazonSpApiSandboxPreflightItem = {
  key: AmazonSpApiSandboxPreflightItemKey;
  label: string;
  required: true;
  satisfied: boolean;
  blocking: boolean;
  reason: string;
};

export type AmazonSpApiSandboxPersistencePreflightChecklist = {
  version: typeof AMAZON_SP_API_SANDBOX_PERSISTENCE_PREFLIGHT_CHECKLIST_VERSION;
  module: 'store-orders';
  sourceType: 'amazon-sp-api-sandbox';
  normalizedSourceType: 'AMAZON_ORDER_SP_API';

  currentPersistenceAllowed: false;
  currentOverwriteAllowed: false;
  currentDryRunOnly: true;

  futureIntent: {
    spApiDataPriority: true;
    authoritativeSource: 'AMAZON_ORDER_SP_API';
    lowerPrioritySources: readonly ['AMAZON_ORDER_CSV', 'MANUAL_DB_EXISTING'];
    futureOverwriteAllowedOnlyAfterAllPreflightSatisfied: true;
  };

  preflightItems: AmazonSpApiSandboxPreflightItem[];

  summary: {
    totalRequired: number;
    satisfied: number;
    blocking: number;
    readyForPersistence: false;
    readyForOverwrite: false;
  };

  hardBlocksNow: {
    dryRunFalse: true;
    controllerRoute: true;
    frontendRoute: true;
    realSpApiClient: true;
    oauth: true;
    tokenPersistence: true;
    schemaMigration: true;
    transactionOverwrite: true;
    inventoryOverwrite: true;
    backgroundSync: true;
  };
};

function item(args: {
  key: AmazonSpApiSandboxPreflightItemKey;
  label: string;
  satisfied: boolean;
  reason: string;
}): AmazonSpApiSandboxPreflightItem {
  return {
    key: args.key,
    label: args.label,
    required: true,
    satisfied: args.satisfied,
    blocking: !args.satisfied,
    reason: args.reason,
  };
}

export function buildAmazonSpApiSandboxPersistencePreflightChecklist(args: {
  auditSnapshot?: AmazonSpApiSandboxOverrideAuditSnapshot;
  approvals?: Partial<Record<AmazonSpApiSandboxPreflightItemKey, boolean>>;
} = {}): AmazonSpApiSandboxPersistencePreflightChecklist {
  const permission = assertAmazonSpApiSandboxPermissionBoundary();
  const dedupe = assertAmazonSpApiSandboxCsvDedupeBoundary();
  const visibility = assertAmazonSpApiSandboxImportCenterVisibilityPolicy();

  const auditSnapshot = args.auditSnapshot
    ? assertAmazonSpApiSandboxOverrideAuditSnapshot(args.auditSnapshot)
    : null;
  const approvals = args.approvals || {};

  const hasCanonicalKey = Boolean(auditSnapshot?.canonicalKey);
  const hasBeforeAfterSnapshot = Boolean(auditSnapshot?.beforeSnapshot && auditSnapshot?.afterSnapshot);
  const hasAmountOrQuantityWarning = Boolean(
    auditSnapshot?.warningCodes?.some((code) =>
      code.includes('AMOUNT_MISMATCH') || code.includes('QUANTITY_MISMATCH'),
    ),
  );
  const hasInventoryCompensationWarning = Boolean(
    auditSnapshot?.warningCodes?.includes('INVENTORY_COMPENSATION_PLAN_REQUIRED'),
  );

  const preflightItems: AmazonSpApiSandboxPreflightItem[] = [
    item({
      key: 'canonical-dedupe-key-confirmed',
      label: 'Canonical dedupe key is confirmed.',
      satisfied: hasCanonicalKey && approvals['canonical-dedupe-key-confirmed'] === true,
      reason: hasCanonicalKey
        ? 'Canonical key exists but still requires explicit approval.'
        : 'Canonical key is missing.',
    }),
    item({
      key: 'before-after-audit-snapshot-generated',
      label: 'Before/after audit snapshot is generated.',
      satisfied: hasBeforeAfterSnapshot && approvals['before-after-audit-snapshot-generated'] === true,
      reason: hasBeforeAfterSnapshot
        ? 'Before/after snapshot exists but still requires explicit approval.'
        : 'Before/after snapshot is missing.',
    }),
    item({
      key: 'amount-quantity-diff-manual-review-completed',
      label: 'Amount and quantity differences are manually reviewed.',
      satisfied:
        (!hasAmountOrQuantityWarning || approvals['amount-quantity-diff-manual-review-completed'] === true) &&
        approvals['amount-quantity-diff-manual-review-completed'] === true,
      reason: hasAmountOrQuantityWarning
        ? 'Amount/quantity mismatch requires manual review.'
        : 'Manual review approval is still required even if no mismatch is detected.',
    }),
    item({
      key: 'inventory-compensation-plan-approved',
      label: 'Inventory compensation plan is approved.',
      satisfied:
        (!hasInventoryCompensationWarning || approvals['inventory-compensation-plan-approved'] === true) &&
        approvals['inventory-compensation-plan-approved'] === true,
      reason: hasInventoryCompensationWarning
        ? 'Inventory-impacting overwrite requires compensation plan.'
        : 'Inventory compensation approval is still required before enabling overwrite.',
    }),
    item({
      key: 'importjob-persistence-strategy-approved',
      label: 'ImportJob persistence strategy is approved.',
      satisfied: approvals['importjob-persistence-strategy-approved'] === true,
      reason: 'ImportJob persistence is currently blocked and has no approved strategy.',
    }),
    item({
      key: 'transaction-overwrite-strategy-approved',
      label: 'Transaction overwrite strategy is approved.',
      satisfied: approvals['transaction-overwrite-strategy-approved'] === true,
      reason: 'Transaction overwrite remains blocked.',
    }),
    item({
      key: 'permission-boundary-approved',
      label: 'Permission boundary is approved.',
      satisfied:
        permission.apiPriorityPolicy.futureSpApiDataPriority === true &&
        approvals['permission-boundary-approved'] === true,
      reason: 'Permission boundary exists but production approval is not granted.',
    }),
    item({
      key: 'rollback-plan-approved',
      label: 'Rollback plan is approved.',
      satisfied: approvals['rollback-plan-approved'] === true,
      reason: 'Rollback plan is required before persistence or overwrite.',
    }),
    item({
      key: 'controller-route-contract-approved',
      label: 'Controller route contract is approved.',
      satisfied: approvals['controller-route-contract-approved'] === true,
      reason: 'Controller route remains disabled.',
    }),
    item({
      key: 'token-oauth-security-model-approved',
      label: 'Token/OAuth security model is approved.',
      satisfied: approvals['token-oauth-security-model-approved'] === true,
      reason: 'OAuth and token persistence remain disabled.',
    }),
    item({
      key: 'import-center-visibility-approved',
      label: 'Import Center visibility is approved.',
      satisfied:
        visibility.currentVisibility.importCenterListVisible === false &&
        approvals['import-center-visibility-approved'] === true,
      reason: 'Import Center visibility is currently disabled.',
    }),
    item({
      key: 'csv-cross-source-dedupe-approved',
      label: 'CSV cross-source dedupe policy is approved.',
      satisfied:
        dedupe.currentPolicy.crossSourcePersistAllowed === false &&
        approvals['csv-cross-source-dedupe-approved'] === true,
      reason: 'Cross-source dedupe exists as contract only; persistence is blocked.',
    }),
    item({
      key: 'no-silent-overwrite-confirmed',
      label: 'No silent overwrite is confirmed.',
      satisfied:
        auditSnapshot?.auditRequirements.requiresNoSilentOverwrite === true &&
        approvals['no-silent-overwrite-confirmed'] === true,
      reason: 'No-silent-overwrite policy must be explicitly acknowledged.',
    }),
    item({
      key: 'real-sp-api-client-contract-approved',
      label: 'Real SP-API client contract is approved.',
      satisfied: approvals['real-sp-api-client-contract-approved'] === true,
      reason: 'Real SP-API client is not implemented and remains blocked.',
    }),
    item({
      key: 'production-feature-flag-approved',
      label: 'Production feature flag is approved.',
      satisfied: approvals['production-feature-flag-approved'] === true,
      reason: 'Production feature flag remains unavailable.',
    }),
  ];

  const satisfied = preflightItems.filter((x) => x.satisfied).length;
  const blocking = preflightItems.filter((x) => x.blocking).length;

  return {
    version: AMAZON_SP_API_SANDBOX_PERSISTENCE_PREFLIGHT_CHECKLIST_VERSION,
    module: 'store-orders',
    sourceType: 'amazon-sp-api-sandbox',
    normalizedSourceType: 'AMAZON_ORDER_SP_API',

    currentPersistenceAllowed: false,
    currentOverwriteAllowed: false,
    currentDryRunOnly: true,

    futureIntent: {
      spApiDataPriority: true,
      authoritativeSource: 'AMAZON_ORDER_SP_API',
      lowerPrioritySources: ['AMAZON_ORDER_CSV', 'MANUAL_DB_EXISTING'],
      futureOverwriteAllowedOnlyAfterAllPreflightSatisfied: true,
    },

    preflightItems,

    summary: {
      totalRequired: preflightItems.length,
      satisfied,
      blocking,
      readyForPersistence: false,
      readyForOverwrite: false,
    },

    hardBlocksNow: {
      dryRunFalse: true,
      controllerRoute: true,
      frontendRoute: true,
      realSpApiClient: true,
      oauth: true,
      tokenPersistence: true,
      schemaMigration: true,
      transactionOverwrite: true,
      inventoryOverwrite: true,
      backgroundSync: true,
    },
  };
}

export function assertAmazonSpApiSandboxPersistencePreflightChecklist(
  checklist: AmazonSpApiSandboxPersistencePreflightChecklist,
): AmazonSpApiSandboxPersistencePreflightChecklist {
  if (checklist.version !== AMAZON_SP_API_SANDBOX_PERSISTENCE_PREFLIGHT_CHECKLIST_VERSION) {
    throw new Error('Step117-F preflight violation: version mismatch.');
  }

  if (checklist.currentPersistenceAllowed !== false) {
    throw new Error('Step117-F preflight violation: persistence must remain blocked.');
  }

  if (checklist.currentOverwriteAllowed !== false) {
    throw new Error('Step117-F preflight violation: overwrite must remain blocked.');
  }

  if (checklist.currentDryRunOnly !== true) {
    throw new Error('Step117-F preflight violation: dry-run-only policy must remain true.');
  }

  if (checklist.futureIntent.authoritativeSource !== 'AMAZON_ORDER_SP_API') {
    throw new Error('Step117-F preflight violation: future authoritative source must be SP-API.');
  }

  if (checklist.summary.readyForPersistence !== false) {
    throw new Error('Step117-F preflight violation: readyForPersistence must remain false.');
  }

  if (checklist.summary.readyForOverwrite !== false) {
    throw new Error('Step117-F preflight violation: readyForOverwrite must remain false.');
  }

  if (checklist.preflightItems.length < 10) {
    throw new Error('Step117-F preflight violation: checklist is incomplete.');
  }

  for (const [key, blocked] of Object.entries(checklist.hardBlocksNow)) {
    if (blocked !== true) {
      throw new Error(`Step117-F preflight violation: hardBlocksNow.${key} must remain true.`);
    }
  }

  return checklist;
}
