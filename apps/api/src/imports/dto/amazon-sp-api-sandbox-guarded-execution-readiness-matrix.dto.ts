import {
  type AmazonSpApiSandboxStagedInventoryCompensationPlan,
  assertAmazonSpApiSandboxStagedInventoryCompensationPlan,
} from './amazon-sp-api-sandbox-staged-inventory-compensation-plan.dto';
import { assertAmazonSpApiSandboxPermissionBoundary } from './amazon-sp-api-sandbox-permission-boundary.dto';

export const AMAZON_SP_API_SANDBOX_GUARDED_EXECUTION_READINESS_MATRIX_VERSION =
  'amazon-sp-api-sandbox-guarded-execution-readiness-matrix-v1' as const;

export type AmazonSpApiSandboxExecutionGateKey =
  | 'environment-gate'
  | 'controller-route-gate'
  | 'frontend-route-gate'
  | 'dry-run-false-gate'
  | 'importjob-persistence-gate'
  | 'transaction-overwrite-gate'
  | 'inventory-compensation-gate'
  | 'audit-snapshot-gate'
  | 'permission-boundary-gate'
  | 'preflight-checklist-gate'
  | 'oauth-token-security-gate'
  | 'schema-migration-gate'
  | 'rollback-plan-gate'
  | 'manual-review-gate'
  | 'production-feature-flag-gate';

export type AmazonSpApiSandboxExecutionCapability =
  | 'preview'
  | 'staged-importjob-plan'
  | 'staged-transaction-overwrite-plan'
  | 'staged-inventory-compensation-plan'
  | 'persist-importjob'
  | 'persist-staging-rows'
  | 'overwrite-transaction'
  | 'create-inventory-compensation'
  | 'real-sp-api-sync'
  | 'oauth-connect'
  | 'token-persistence'
  | 'controller-api'
  | 'frontend-ui';

export type AmazonSpApiSandboxReadinessGate = {
  key: AmazonSpApiSandboxExecutionGateKey;
  label: string;
  required: true;
  passed: boolean;
  blocking: boolean;
  reason: string;
};

export type AmazonSpApiSandboxCapabilityReadiness = {
  capability: AmazonSpApiSandboxExecutionCapability;
  allowedNow: boolean;
  blockedBy: AmazonSpApiSandboxExecutionGateKey[];
  reason: string;
};

export type AmazonSpApiSandboxGuardedExecutionReadinessMatrix = {
  version: typeof AMAZON_SP_API_SANDBOX_GUARDED_EXECUTION_READINESS_MATRIX_VERSION;
  module: 'store-orders';
  sourceType: 'amazon-sp-api-sandbox';
  normalizedSourceType: 'AMAZON_ORDER_SP_API';

  currentExecutionMode: 'INTERNAL_PLAN_ONLY';
  globalExecutionAllowed: false;
  writesDatabase: false;
  dryRunFalseAllowed: false;

  inventoryCompensationPlan: AmazonSpApiSandboxStagedInventoryCompensationPlan;

  gates: AmazonSpApiSandboxReadinessGate[];
  capabilities: AmazonSpApiSandboxCapabilityReadiness[];

  summary: {
    totalGates: number;
    passedGates: number;
    blockingGates: number;
    allowedCapabilities: number;
    blockedCapabilities: number;
    readyForAnyPersistence: false;
    readyForController: false;
    readyForFrontend: false;
    readyForRealSpApi: false;
  };

  finalDecision: {
    mayContinuePlanOnly: true;
    mayPersistImportJob: false;
    mayPersistStagingRows: false;
    mayOverwriteTransaction: false;
    mayCreateInventoryCompensation: false;
    mayOpenController: false;
    mayOpenFrontend: false;
    mayCallRealSpApi: false;
    mayPersistToken: false;
  };
};

function gate(args: {
  key: AmazonSpApiSandboxExecutionGateKey;
  label: string;
  passed: boolean;
  reason: string;
}): AmazonSpApiSandboxReadinessGate {
  return {
    key: args.key,
    label: args.label,
    required: true,
    passed: args.passed,
    blocking: !args.passed,
    reason: args.reason,
  };
}

function capability(args: {
  capability: AmazonSpApiSandboxExecutionCapability;
  allowedNow: boolean;
  blockedBy: AmazonSpApiSandboxExecutionGateKey[];
  reason: string;
}): AmazonSpApiSandboxCapabilityReadiness {
  return args;
}

export function buildAmazonSpApiSandboxGuardedExecutionReadinessMatrix(args: {
  inventoryCompensationPlan: AmazonSpApiSandboxStagedInventoryCompensationPlan;
}): AmazonSpApiSandboxGuardedExecutionReadinessMatrix {
  const permission = assertAmazonSpApiSandboxPermissionBoundary();
  const inventoryCompensationPlan = assertAmazonSpApiSandboxStagedInventoryCompensationPlan(
    args.inventoryCompensationPlan,
  );

  const preflight = inventoryCompensationPlan
    .transactionOverwritePlan
    .importJobPlan
    .preflightChecklist;

  const gates: AmazonSpApiSandboxReadinessGate[] = [
    gate({
      key: 'environment-gate',
      label: 'Internal sandbox environment gate is explicit.',
      passed: true,
      reason: 'Smoke sets sandbox internal env explicitly; real SP-API/OAuth/token persistence remain false.',
    }),
    gate({
      key: 'controller-route-gate',
      label: 'Controller route remains closed.',
      passed: false,
      reason: 'No controller contract has been approved; route must remain closed.',
    }),
    gate({
      key: 'frontend-route-gate',
      label: 'Frontend route remains closed.',
      passed: false,
      reason: 'No frontend route or Import Center UI has been approved.',
    }),
    gate({
      key: 'dry-run-false-gate',
      label: 'dryRun:false remains blocked.',
      passed: false,
      reason: 'STEP116_H_SP_API_SANDBOX_NON_DRY_RUN_BLOCKED is still required.',
    }),
    gate({
      key: 'importjob-persistence-gate',
      label: 'ImportJob persistence remains blocked.',
      passed: false,
      reason: 'Step118-A only produced a staged plan; it writes no database rows.',
    }),
    gate({
      key: 'transaction-overwrite-gate',
      label: 'Transaction overwrite remains blocked.',
      passed: false,
      reason: 'Step118-B only produced a staged overwrite plan.',
    }),
    gate({
      key: 'inventory-compensation-gate',
      label: 'Inventory compensation remains blocked.',
      passed: false,
      reason: 'Step118-C only produced a staged inventory compensation plan.',
    }),
    gate({
      key: 'audit-snapshot-gate',
      label: 'Override audit snapshot exists.',
      passed: inventoryCompensationPlan.transactionOverwritePlan.operations.length > 0,
      reason: 'Audit snapshot is attached to the staged overwrite plan for review only.',
    }),
    gate({
      key: 'permission-boundary-gate',
      label: 'Permission boundary exists but does not permit execution.',
      passed:
        permission.currentAccessPolicy.internalOnly === true &&
        permission.apiPriorityPolicy.currentOverwriteAllowed === false,
      reason: 'Permission boundary confirms SP-API future priority, but current overwrite is disabled.',
    }),
    gate({
      key: 'preflight-checklist-gate',
      label: 'Preflight checklist exists but is not execution-ready.',
      passed:
        preflight.currentPersistenceAllowed === false &&
        preflight.currentOverwriteAllowed === false &&
        preflight.summary.readyForPersistence === false &&
        preflight.summary.readyForOverwrite === false,
      reason: 'Checklist is present, but current readiness intentionally remains false.',
    }),
    gate({
      key: 'oauth-token-security-gate',
      label: 'OAuth/token security model remains closed.',
      passed: false,
      reason: 'OAuth and token persistence are not implemented or approved.',
    }),
    gate({
      key: 'schema-migration-gate',
      label: 'Schema migration remains blocked.',
      passed: false,
      reason: 'No token/audit/readiness/persistence schema has been approved.',
    }),
    gate({
      key: 'rollback-plan-gate',
      label: 'Rollback plan remains required.',
      passed: false,
      reason: 'A production rollback plan is not yet approved.',
    }),
    gate({
      key: 'manual-review-gate',
      label: 'Manual review remains required for amount/quantity/inventory differences.',
      passed: false,
      reason: 'Plan contains manual-review and inventory-compensation warnings.',
    }),
    gate({
      key: 'production-feature-flag-gate',
      label: 'Production feature flag remains closed.',
      passed: false,
      reason: 'No production feature flag is approved.',
    }),
  ];

  const capabilities: AmazonSpApiSandboxCapabilityReadiness[] = [
    capability({
      capability: 'preview',
      allowedNow: true,
      blockedBy: [],
      reason: 'Internal sandbox preview is allowed by service env gate.',
    }),
    capability({
      capability: 'staged-importjob-plan',
      allowedNow: true,
      blockedBy: [],
      reason: 'Plan-only ImportJob persistence planning is allowed.',
    }),
    capability({
      capability: 'staged-transaction-overwrite-plan',
      allowedNow: true,
      blockedBy: [],
      reason: 'Plan-only Transaction overwrite planning is allowed.',
    }),
    capability({
      capability: 'staged-inventory-compensation-plan',
      allowedNow: true,
      blockedBy: [],
      reason: 'Plan-only inventory compensation planning is allowed.',
    }),
    capability({
      capability: 'persist-importjob',
      allowedNow: false,
      blockedBy: ['dry-run-false-gate', 'importjob-persistence-gate', 'preflight-checklist-gate'],
      reason: 'ImportJob persistence remains blocked.',
    }),
    capability({
      capability: 'persist-staging-rows',
      allowedNow: false,
      blockedBy: ['dry-run-false-gate', 'importjob-persistence-gate', 'preflight-checklist-gate'],
      reason: 'ImportStagingRow persistence remains blocked.',
    }),
    capability({
      capability: 'overwrite-transaction',
      allowedNow: false,
      blockedBy: ['transaction-overwrite-gate', 'manual-review-gate', 'rollback-plan-gate'],
      reason: 'Transaction overwrite remains blocked.',
    }),
    capability({
      capability: 'create-inventory-compensation',
      allowedNow: false,
      blockedBy: ['inventory-compensation-gate', 'manual-review-gate', 'rollback-plan-gate'],
      reason: 'Inventory compensation execution remains blocked.',
    }),
    capability({
      capability: 'real-sp-api-sync',
      allowedNow: false,
      blockedBy: ['oauth-token-security-gate', 'production-feature-flag-gate'],
      reason: 'Real SP-API sync is not implemented or approved.',
    }),
    capability({
      capability: 'oauth-connect',
      allowedNow: false,
      blockedBy: ['oauth-token-security-gate'],
      reason: 'OAuth remains blocked.',
    }),
    capability({
      capability: 'token-persistence',
      allowedNow: false,
      blockedBy: ['oauth-token-security-gate', 'schema-migration-gate'],
      reason: 'Token persistence remains blocked.',
    }),
    capability({
      capability: 'controller-api',
      allowedNow: false,
      blockedBy: ['controller-route-gate', 'production-feature-flag-gate'],
      reason: 'Controller route remains closed.',
    }),
    capability({
      capability: 'frontend-ui',
      allowedNow: false,
      blockedBy: ['frontend-route-gate', 'controller-route-gate'],
      reason: 'Frontend route remains closed.',
    }),
  ];

  const passedGates = gates.filter((item) => item.passed).length;
  const blockingGates = gates.filter((item) => item.blocking).length;
  const allowedCapabilities = capabilities.filter((item) => item.allowedNow).length;
  const blockedCapabilities = capabilities.filter((item) => !item.allowedNow).length;

  return {
    version: AMAZON_SP_API_SANDBOX_GUARDED_EXECUTION_READINESS_MATRIX_VERSION,
    module: 'store-orders',
    sourceType: 'amazon-sp-api-sandbox',
    normalizedSourceType: 'AMAZON_ORDER_SP_API',
    currentExecutionMode: 'INTERNAL_PLAN_ONLY',
    globalExecutionAllowed: false,
    writesDatabase: false,
    dryRunFalseAllowed: false,
    inventoryCompensationPlan,
    gates,
    capabilities,
    summary: {
      totalGates: gates.length,
      passedGates,
      blockingGates,
      allowedCapabilities,
      blockedCapabilities,
      readyForAnyPersistence: false,
      readyForController: false,
      readyForFrontend: false,
      readyForRealSpApi: false,
    },
    finalDecision: {
      mayContinuePlanOnly: true,
      mayPersistImportJob: false,
      mayPersistStagingRows: false,
      mayOverwriteTransaction: false,
      mayCreateInventoryCompensation: false,
      mayOpenController: false,
      mayOpenFrontend: false,
      mayCallRealSpApi: false,
      mayPersistToken: false,
    },
  };
}

export function assertAmazonSpApiSandboxGuardedExecutionReadinessMatrix(
  matrix: AmazonSpApiSandboxGuardedExecutionReadinessMatrix,
): AmazonSpApiSandboxGuardedExecutionReadinessMatrix {
  if (matrix.version !== AMAZON_SP_API_SANDBOX_GUARDED_EXECUTION_READINESS_MATRIX_VERSION) {
    throw new Error('Step118-D readiness matrix violation: version mismatch.');
  }

  if (matrix.currentExecutionMode !== 'INTERNAL_PLAN_ONLY') {
    throw new Error('Step118-D readiness matrix violation: execution mode must remain INTERNAL_PLAN_ONLY.');
  }

  if (matrix.globalExecutionAllowed !== false) {
    throw new Error('Step118-D readiness matrix violation: global execution must remain disabled.');
  }

  if (matrix.writesDatabase !== false) {
    throw new Error('Step118-D readiness matrix violation: writesDatabase must be false.');
  }

  if (matrix.dryRunFalseAllowed !== false) {
    throw new Error('Step118-D readiness matrix violation: dryRun:false must remain blocked.');
  }

  if (matrix.summary.readyForAnyPersistence !== false) {
    throw new Error('Step118-D readiness matrix violation: persistence readiness must remain false.');
  }

  if (matrix.summary.readyForController !== false) {
    throw new Error('Step118-D readiness matrix violation: controller readiness must remain false.');
  }

  if (matrix.summary.readyForFrontend !== false) {
    throw new Error('Step118-D readiness matrix violation: frontend readiness must remain false.');
  }

  if (matrix.summary.readyForRealSpApi !== false) {
    throw new Error('Step118-D readiness matrix violation: real SP-API readiness must remain false.');
  }

  for (const [key, value] of Object.entries(matrix.finalDecision)) {
    if (key === 'mayContinuePlanOnly') {
      if (value !== true) {
        throw new Error('Step118-D readiness matrix violation: plan-only continuation must remain allowed.');
      }
      continue;
    }

    if (value !== false) {
      throw new Error(`Step118-D readiness matrix violation: finalDecision.${key} must remain false.`);
    }
  }

  return matrix;
}
