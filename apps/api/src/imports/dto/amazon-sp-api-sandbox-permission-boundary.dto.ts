import { assertAmazonSpApiSandboxCsvDedupeBoundary } from './amazon-sp-api-sandbox-csv-dedupe-boundary.dto';
import { assertAmazonSpApiSandboxImportCenterVisibilityPolicy } from './amazon-sp-api-sandbox-import-center-visibility-policy.dto';
import { assertAmazonSpApiSandboxLifecycleDecision } from './amazon-sp-api-sandbox-lifecycle-decision.dto';

export const AMAZON_SP_API_SANDBOX_PERMISSION_BOUNDARY_VERSION =
  'amazon-sp-api-sandbox-permission-boundary-v1' as const;

export type AmazonSpApiSandboxActorRole =
  | 'platform-admin'
  | 'workspace-owner'
  | 'workspace-admin'
  | 'accountant'
  | 'viewer'
  | 'system-worker'
  | 'public-user';

export type AmazonSpApiSandboxPermission =
  | 'amazon-sp-api:sandbox:read-contract'
  | 'amazon-sp-api:sandbox:preview'
  | 'amazon-sp-api:sandbox:commit-staging-dry-run'
  | 'amazon-sp-api:sandbox:view-import-center-internal'
  | 'amazon-sp-api:sandbox:view-dedupe-conflicts'
  | 'amazon-sp-api:sandbox:approve-persistence'
  | 'amazon-sp-api:sandbox:override-existing-order'
  | 'amazon-sp-api:real:connect'
  | 'amazon-sp-api:real:oauth'
  | 'amazon-sp-api:real:sync'
  | 'amazon-sp-api:token:persist';

export type AmazonSpApiSandboxPermissionBoundary = {
  version: typeof AMAZON_SP_API_SANDBOX_PERMISSION_BOUNDARY_VERSION;
  module: 'store-orders';
  sourceType: 'amazon-sp-api-sandbox';
  normalizedSourceType: 'AMAZON_ORDER_SP_API';

  currentAccessPolicy: {
    internalOnly: true;
    publicAccessAllowed: false;
    controllerRouteAllowed: false;
    frontendRouteAllowed: false;
    realSpApiAllowed: false;
    oauthAllowed: false;
    tokenPersistenceAllowed: false;
    nonDryRunAllowed: false;
  };

  rolePolicy: Record<
    AmazonSpApiSandboxActorRole,
    {
      canReadContract: boolean;
      canPreviewSandbox: boolean;
      canCommitStagingDryRun: boolean;
      canViewImportCenterInternal: boolean;
      canViewDedupeConflicts: boolean;
      canApprovePersistence: boolean;
      canOverrideExistingOrderWithSpApi: boolean;
      canConnectRealSpApi: boolean;
      canPersistToken: boolean;
    }
  >;

  requiredPermissions: {
    preview: readonly ['amazon-sp-api:sandbox:preview'];
    commitStagingDryRun: readonly ['amazon-sp-api:sandbox:commit-staging-dry-run'];
    viewImportCenterInternal: readonly ['amazon-sp-api:sandbox:view-import-center-internal'];
    viewDedupeConflicts: readonly ['amazon-sp-api:sandbox:view-dedupe-conflicts'];
    futurePersistenceApproval: readonly ['amazon-sp-api:sandbox:approve-persistence'];
    futureOverrideExistingOrder: readonly [
      'amazon-sp-api:sandbox:approve-persistence',
      'amazon-sp-api:sandbox:override-existing-order',
    ];
  };

  apiPriorityPolicy: {
    futureSpApiDataPriority: true;
    currentOverwriteAllowed: false;
    futureOverwriteExistingOrderAllowedAfterApproval: true;
    authoritativeSourceWhenSameCanonicalOrderItem: 'AMAZON_ORDER_SP_API';
    lowerPrioritySources: readonly ['AMAZON_ORDER_CSV', 'MANUAL_DB_EXISTING'];
    conflictResolution: 'SP_API_OVERWRITES_EXISTING_ORDER_AFTER_EXPLICIT_PERMISSION_AND_AUDIT';
    requiresCanonicalDedupeKey: true;
    requiresBeforeAfterSnapshot: true;
    requiresAuditLog: true;
    requiresManualReviewForAmountOrQuantityMismatch: true;
    requiresInventoryCompensationPlanBeforeInventoryOverwrite: true;
    requiresNoSilentOverwrite: true;
  };

  blockedNow: {
    persistImportJob: true;
    persistImportStagingRows: true;
    commitTransactions: true;
    overwriteExistingTransaction: true;
    overwriteExistingInventoryMovement: true;
    realSpApiSync: true;
    oauth: true;
    tokenStorage: true;
    backgroundSync: true;
    queueWorker: true;
  };
};

export function getAmazonSpApiSandboxPermissionBoundary(): AmazonSpApiSandboxPermissionBoundary {
  assertAmazonSpApiSandboxLifecycleDecision();
  assertAmazonSpApiSandboxImportCenterVisibilityPolicy();
  assertAmazonSpApiSandboxCsvDedupeBoundary();

  return {
    version: AMAZON_SP_API_SANDBOX_PERMISSION_BOUNDARY_VERSION,
    module: 'store-orders',
    sourceType: 'amazon-sp-api-sandbox',
    normalizedSourceType: 'AMAZON_ORDER_SP_API',

    currentAccessPolicy: {
      internalOnly: true,
      publicAccessAllowed: false,
      controllerRouteAllowed: false,
      frontendRouteAllowed: false,
      realSpApiAllowed: false,
      oauthAllowed: false,
      tokenPersistenceAllowed: false,
      nonDryRunAllowed: false,
    },

    rolePolicy: {
      'platform-admin': {
        canReadContract: true,
        canPreviewSandbox: true,
        canCommitStagingDryRun: true,
        canViewImportCenterInternal: true,
        canViewDedupeConflicts: true,
        canApprovePersistence: false,
        canOverrideExistingOrderWithSpApi: false,
        canConnectRealSpApi: false,
        canPersistToken: false,
      },
      'workspace-owner': {
        canReadContract: true,
        canPreviewSandbox: false,
        canCommitStagingDryRun: false,
        canViewImportCenterInternal: false,
        canViewDedupeConflicts: false,
        canApprovePersistence: false,
        canOverrideExistingOrderWithSpApi: false,
        canConnectRealSpApi: false,
        canPersistToken: false,
      },
      'workspace-admin': {
        canReadContract: true,
        canPreviewSandbox: false,
        canCommitStagingDryRun: false,
        canViewImportCenterInternal: false,
        canViewDedupeConflicts: false,
        canApprovePersistence: false,
        canOverrideExistingOrderWithSpApi: false,
        canConnectRealSpApi: false,
        canPersistToken: false,
      },
      accountant: {
        canReadContract: true,
        canPreviewSandbox: false,
        canCommitStagingDryRun: false,
        canViewImportCenterInternal: false,
        canViewDedupeConflicts: false,
        canApprovePersistence: false,
        canOverrideExistingOrderWithSpApi: false,
        canConnectRealSpApi: false,
        canPersistToken: false,
      },
      viewer: {
        canReadContract: false,
        canPreviewSandbox: false,
        canCommitStagingDryRun: false,
        canViewImportCenterInternal: false,
        canViewDedupeConflicts: false,
        canApprovePersistence: false,
        canOverrideExistingOrderWithSpApi: false,
        canConnectRealSpApi: false,
        canPersistToken: false,
      },
      'system-worker': {
        canReadContract: true,
        canPreviewSandbox: false,
        canCommitStagingDryRun: false,
        canViewImportCenterInternal: false,
        canViewDedupeConflicts: false,
        canApprovePersistence: false,
        canOverrideExistingOrderWithSpApi: false,
        canConnectRealSpApi: false,
        canPersistToken: false,
      },
      'public-user': {
        canReadContract: false,
        canPreviewSandbox: false,
        canCommitStagingDryRun: false,
        canViewImportCenterInternal: false,
        canViewDedupeConflicts: false,
        canApprovePersistence: false,
        canOverrideExistingOrderWithSpApi: false,
        canConnectRealSpApi: false,
        canPersistToken: false,
      },
    },

    requiredPermissions: {
      preview: ['amazon-sp-api:sandbox:preview'],
      commitStagingDryRun: ['amazon-sp-api:sandbox:commit-staging-dry-run'],
      viewImportCenterInternal: ['amazon-sp-api:sandbox:view-import-center-internal'],
      viewDedupeConflicts: ['amazon-sp-api:sandbox:view-dedupe-conflicts'],
      futurePersistenceApproval: ['amazon-sp-api:sandbox:approve-persistence'],
      futureOverrideExistingOrder: [
        'amazon-sp-api:sandbox:approve-persistence',
        'amazon-sp-api:sandbox:override-existing-order',
      ],
    },

    apiPriorityPolicy: {
      futureSpApiDataPriority: true,
      currentOverwriteAllowed: false,
      futureOverwriteExistingOrderAllowedAfterApproval: true,
      authoritativeSourceWhenSameCanonicalOrderItem: 'AMAZON_ORDER_SP_API',
      lowerPrioritySources: ['AMAZON_ORDER_CSV', 'MANUAL_DB_EXISTING'],
      conflictResolution: 'SP_API_OVERWRITES_EXISTING_ORDER_AFTER_EXPLICIT_PERMISSION_AND_AUDIT',
      requiresCanonicalDedupeKey: true,
      requiresBeforeAfterSnapshot: true,
      requiresAuditLog: true,
      requiresManualReviewForAmountOrQuantityMismatch: true,
      requiresInventoryCompensationPlanBeforeInventoryOverwrite: true,
      requiresNoSilentOverwrite: true,
    },

    blockedNow: {
      persistImportJob: true,
      persistImportStagingRows: true,
      commitTransactions: true,
      overwriteExistingTransaction: true,
      overwriteExistingInventoryMovement: true,
      realSpApiSync: true,
      oauth: true,
      tokenStorage: true,
      backgroundSync: true,
      queueWorker: true,
    },
  };
}

export function assertAmazonSpApiSandboxPermissionBoundary(): AmazonSpApiSandboxPermissionBoundary {
  const boundary = getAmazonSpApiSandboxPermissionBoundary();

  if (boundary.currentAccessPolicy.internalOnly !== true) {
    throw new Error('Step117-D permission violation: sandbox must remain internal-only.');
  }

  if (boundary.currentAccessPolicy.publicAccessAllowed !== false) {
    throw new Error('Step117-D permission violation: public access must remain disabled.');
  }

  if (boundary.currentAccessPolicy.controllerRouteAllowed !== false) {
    throw new Error('Step117-D permission violation: controller route must remain disabled.');
  }

  if (boundary.currentAccessPolicy.frontendRouteAllowed !== false) {
    throw new Error('Step117-D permission violation: frontend route must remain disabled.');
  }

  if (boundary.currentAccessPolicy.nonDryRunAllowed !== false) {
    throw new Error('Step117-D permission violation: non-dry-run must remain disabled.');
  }

  if (boundary.apiPriorityPolicy.futureSpApiDataPriority !== true) {
    throw new Error('Step117-D permission violation: future SP-API data priority must be explicit.');
  }

  if (boundary.apiPriorityPolicy.currentOverwriteAllowed !== false) {
    throw new Error('Step117-D permission violation: current overwrite must remain disabled.');
  }

  if (boundary.apiPriorityPolicy.futureOverwriteExistingOrderAllowedAfterApproval !== true) {
    throw new Error('Step117-D permission violation: future SP-API overwrite policy missing.');
  }

  if (
    boundary.apiPriorityPolicy.authoritativeSourceWhenSameCanonicalOrderItem !==
    'AMAZON_ORDER_SP_API'
  ) {
    throw new Error('Step117-D permission violation: SP-API must be future authoritative source.');
  }

  if (boundary.apiPriorityPolicy.requiresNoSilentOverwrite !== true) {
    throw new Error('Step117-D permission violation: overwrite must never be silent.');
  }

  if (boundary.rolePolicy['platform-admin'].canPreviewSandbox !== true) {
    throw new Error('Step117-D permission violation: platform-admin must be able to run internal preview.');
  }

  if (boundary.rolePolicy['platform-admin'].canCommitStagingDryRun !== true) {
    throw new Error('Step117-D permission violation: platform-admin must be able to run dry-run staging.');
  }

  if (boundary.rolePolicy['platform-admin'].canOverrideExistingOrderWithSpApi !== false) {
    throw new Error('Step117-D permission violation: even platform-admin must not override now.');
  }

  for (const role of ['workspace-owner', 'workspace-admin', 'accountant', 'viewer', 'public-user'] as const) {
    if (boundary.rolePolicy[role].canPreviewSandbox !== false) {
      throw new Error(`Step117-D permission violation: ${role} must not preview sandbox now.`);
    }

    if (boundary.rolePolicy[role].canCommitStagingDryRun !== false) {
      throw new Error(`Step117-D permission violation: ${role} must not commit staging dry-run now.`);
    }

    if (boundary.rolePolicy[role].canOverrideExistingOrderWithSpApi !== false) {
      throw new Error(`Step117-D permission violation: ${role} must not override existing orders.`);
    }
  }

  for (const [key, blocked] of Object.entries(boundary.blockedNow)) {
    if (blocked !== true) {
      throw new Error(`Step117-D permission violation: blockedNow.${key} must be true.`);
    }
  }

  return boundary;
}

export function canAmazonSpApiSandboxRole(
  role: AmazonSpApiSandboxActorRole,
  permission: AmazonSpApiSandboxPermission,
): boolean {
  const boundary = assertAmazonSpApiSandboxPermissionBoundary();
  const policy = boundary.rolePolicy[role];

  if (!policy) return false;

  switch (permission) {
    case 'amazon-sp-api:sandbox:read-contract':
      return policy.canReadContract;
    case 'amazon-sp-api:sandbox:preview':
      return policy.canPreviewSandbox;
    case 'amazon-sp-api:sandbox:commit-staging-dry-run':
      return policy.canCommitStagingDryRun;
    case 'amazon-sp-api:sandbox:view-import-center-internal':
      return policy.canViewImportCenterInternal;
    case 'amazon-sp-api:sandbox:view-dedupe-conflicts':
      return policy.canViewDedupeConflicts;
    case 'amazon-sp-api:sandbox:approve-persistence':
      return policy.canApprovePersistence;
    case 'amazon-sp-api:sandbox:override-existing-order':
      return policy.canOverrideExistingOrderWithSpApi;
    case 'amazon-sp-api:real:connect':
    case 'amazon-sp-api:real:oauth':
    case 'amazon-sp-api:real:sync':
      return policy.canConnectRealSpApi;
    case 'amazon-sp-api:token:persist':
      return policy.canPersistToken;
    default:
      return false;
  }
}
