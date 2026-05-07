import { assertAmazonSpApiSandboxLifecycleDecision } from './amazon-sp-api-sandbox-lifecycle-decision.dto';

export const AMAZON_SP_API_SANDBOX_IMPORT_CENTER_VISIBILITY_POLICY_VERSION =
  'amazon-sp-api-sandbox-import-center-visibility-policy-v1' as const;

export type AmazonSpApiSandboxImportCenterVisibilityLevel =
  | 'hidden'
  | 'internal-only'
  | 'visible-readonly';

export type AmazonSpApiSandboxImportCenterBadge =
  | 'SANDBOX'
  | 'INTERNAL'
  | 'DRY_RUN_ONLY'
  | 'SP_API'
  | 'NO_TRANSACTION_COMMIT';

export type AmazonSpApiSandboxImportCenterAction =
  | 'view-summary'
  | 'view-staging-rows'
  | 'download-normalized-json'
  | 'commit-transactions'
  | 'deduct-inventory'
  | 'retry-real-sp-api'
  | 'configure-oauth'
  | 'persist-staging';

export type AmazonSpApiSandboxImportCenterVisibilityPolicy = {
  version: typeof AMAZON_SP_API_SANDBOX_IMPORT_CENTER_VISIBILITY_POLICY_VERSION;
  sourceType: 'amazon-sp-api-sandbox';
  normalizedSourceType: 'AMAZON_ORDER_SP_API';
  module: 'store-orders';

  currentVisibility: {
    importCenterListVisible: false;
    importCenterDetailVisible: false;
    internalSmokeOnly: true;
    frontendNavigationAllowed: false;
    controllerRouteAllowed: false;
  };

  futureVisibilityIfPersistenceIsApproved: {
    visibilityLevel: AmazonSpApiSandboxImportCenterVisibilityLevel;
    listLabel: 'Amazon SP-API Sandbox';
    detailTitle: 'Amazon SP-API Sandbox Import';
    sourceTypeFilterValue: 'amazon-sp-api-sandbox';
    moduleFilterValue: 'store-orders';
    statusStrategy: 'reuse-existing-JobStatus-with-sandbox-badges';
    allowedPrismaJobStatuses: readonly ['PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED'];
    virtualLifecycleLabels: readonly ['PREVIEWED', 'STAGED', 'DRY_RUN_ROLLED_BACK'];
    badges: readonly AmazonSpApiSandboxImportCenterBadge[];
  };

  rowDisplayPolicy: {
    showImportJobId: true;
    showSourceType: true;
    showModule: true;
    showFilename: true;
    showBusinessMonths: true;
    showTotalRows: true;
    showSuccessRows: true;
    showFailedRows: true;
    showDryRunOnlyBadge: true;
    showNoTransactionCommitBadge: true;
    showRealSpApiDisabledBadge: true;
  };

  detailDrawerPolicy: {
    allowOpenDrawer: false;
    futureAllowReadonlyDrawer: true;
    showNormalizedPayloadJson: true;
    showRawPayloadJson: true;
    showDedupeHash: true;
    showMatchStatus: true;
    showMatchReason: true;
    showTargetEntityLink: false;
    showTransactionLink: false;
    showInventoryMovementLink: false;
  };

  actionPolicy: Record<AmazonSpApiSandboxImportCenterAction, boolean>;

  warningPolicy: {
    requiredWarning: 'Sandbox dry-run only. No real Amazon SP-API call, no OAuth, no token storage, no transaction commit.';
    japaneseWarning: 'サンドボックス検証専用です。実Amazon SP-API連携、OAuth、トークン保存、取引確定は行われません。';
    requireInternalOnlyCopy: true;
    requireDryRunOnlyCopy: true;
    requireNoCredentialCopy: true;
  };

  routePolicy: {
    apiRouteAllowed: false;
    frontendRouteAllowed: false;
    importCenterQueryParamAllowed: false;
    allowedFutureQueryKeys: readonly ['sourceType', 'module', 'importJobId'];
    blockedQueryKeysNow: readonly ['spApiSandbox', 'amazonSpApiSandbox'];
  };

  persistenceDependency: {
    requiresLifecycleDecision: 'amazon-sp-api-sandbox-lifecycle-decision-v1';
    requiresImportJobPersistenceDecision: true;
    requiresPermissionDecision: true;
    requiresDedupeDecisionAgainstCsv: true;
    requiresControllerContractDecision: true;
  };
};

export function getAmazonSpApiSandboxImportCenterVisibilityPolicy(): AmazonSpApiSandboxImportCenterVisibilityPolicy {
  assertAmazonSpApiSandboxLifecycleDecision();

  return {
    version: AMAZON_SP_API_SANDBOX_IMPORT_CENTER_VISIBILITY_POLICY_VERSION,
    sourceType: 'amazon-sp-api-sandbox',
    normalizedSourceType: 'AMAZON_ORDER_SP_API',
    module: 'store-orders',

    currentVisibility: {
      importCenterListVisible: false,
      importCenterDetailVisible: false,
      internalSmokeOnly: true,
      frontendNavigationAllowed: false,
      controllerRouteAllowed: false,
    },

    futureVisibilityIfPersistenceIsApproved: {
      visibilityLevel: 'internal-only',
      listLabel: 'Amazon SP-API Sandbox',
      detailTitle: 'Amazon SP-API Sandbox Import',
      sourceTypeFilterValue: 'amazon-sp-api-sandbox',
      moduleFilterValue: 'store-orders',
      statusStrategy: 'reuse-existing-JobStatus-with-sandbox-badges',
      allowedPrismaJobStatuses: ['PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED'],
      virtualLifecycleLabels: ['PREVIEWED', 'STAGED', 'DRY_RUN_ROLLED_BACK'],
      badges: ['SANDBOX', 'INTERNAL', 'DRY_RUN_ONLY', 'SP_API', 'NO_TRANSACTION_COMMIT'],
    },

    rowDisplayPolicy: {
      showImportJobId: true,
      showSourceType: true,
      showModule: true,
      showFilename: true,
      showBusinessMonths: true,
      showTotalRows: true,
      showSuccessRows: true,
      showFailedRows: true,
      showDryRunOnlyBadge: true,
      showNoTransactionCommitBadge: true,
      showRealSpApiDisabledBadge: true,
    },

    detailDrawerPolicy: {
      allowOpenDrawer: false,
      futureAllowReadonlyDrawer: true,
      showNormalizedPayloadJson: true,
      showRawPayloadJson: true,
      showDedupeHash: true,
      showMatchStatus: true,
      showMatchReason: true,
      showTargetEntityLink: false,
      showTransactionLink: false,
      showInventoryMovementLink: false,
    },

    actionPolicy: {
      'view-summary': false,
      'view-staging-rows': false,
      'download-normalized-json': false,
      'commit-transactions': false,
      'deduct-inventory': false,
      'retry-real-sp-api': false,
      'configure-oauth': false,
      'persist-staging': false,
    },

    warningPolicy: {
      requiredWarning:
        'Sandbox dry-run only. No real Amazon SP-API call, no OAuth, no token storage, no transaction commit.',
      japaneseWarning:
        'サンドボックス検証専用です。実Amazon SP-API連携、OAuth、トークン保存、取引確定は行われません。',
      requireInternalOnlyCopy: true,
      requireDryRunOnlyCopy: true,
      requireNoCredentialCopy: true,
    },

    routePolicy: {
      apiRouteAllowed: false,
      frontendRouteAllowed: false,
      importCenterQueryParamAllowed: false,
      allowedFutureQueryKeys: ['sourceType', 'module', 'importJobId'],
      blockedQueryKeysNow: ['spApiSandbox', 'amazonSpApiSandbox'],
    },

    persistenceDependency: {
      requiresLifecycleDecision: 'amazon-sp-api-sandbox-lifecycle-decision-v1',
      requiresImportJobPersistenceDecision: true,
      requiresPermissionDecision: true,
      requiresDedupeDecisionAgainstCsv: true,
      requiresControllerContractDecision: true,
    },
  };
}

export function assertAmazonSpApiSandboxImportCenterVisibilityPolicy(): AmazonSpApiSandboxImportCenterVisibilityPolicy {
  const policy = getAmazonSpApiSandboxImportCenterVisibilityPolicy();

  if (policy.currentVisibility.importCenterListVisible !== false) {
    throw new Error('Step117-B visibility violation: Import Center list visibility must remain disabled.');
  }

  if (policy.currentVisibility.importCenterDetailVisible !== false) {
    throw new Error('Step117-B visibility violation: Import Center detail visibility must remain disabled.');
  }

  if (policy.currentVisibility.internalSmokeOnly !== true) {
    throw new Error('Step117-B visibility violation: sandbox must remain internal smoke only.');
  }

  if (policy.currentVisibility.frontendNavigationAllowed !== false) {
    throw new Error('Step117-B visibility violation: frontend navigation must remain disabled.');
  }

  if (policy.currentVisibility.controllerRouteAllowed !== false) {
    throw new Error('Step117-B visibility violation: controller route must remain disabled.');
  }

  if (policy.detailDrawerPolicy.allowOpenDrawer !== false) {
    throw new Error('Step117-B visibility violation: drawer opening must remain disabled now.');
  }

  if (policy.actionPolicy['commit-transactions'] !== false) {
    throw new Error('Step117-B visibility violation: transaction commit action must remain disabled.');
  }

  if (policy.actionPolicy['deduct-inventory'] !== false) {
    throw new Error('Step117-B visibility violation: inventory deduction action must remain disabled.');
  }

  if (policy.actionPolicy['retry-real-sp-api'] !== false) {
    throw new Error('Step117-B visibility violation: real SP-API retry action must remain disabled.');
  }

  if (policy.actionPolicy['configure-oauth'] !== false) {
    throw new Error('Step117-B visibility violation: OAuth configuration action must remain disabled.');
  }

  if (policy.actionPolicy['persist-staging'] !== false) {
    throw new Error('Step117-B visibility violation: staging persistence action must remain disabled.');
  }

  if (policy.routePolicy.apiRouteAllowed !== false) {
    throw new Error('Step117-B visibility violation: API route must remain disabled.');
  }

  if (policy.routePolicy.frontendRouteAllowed !== false) {
    throw new Error('Step117-B visibility violation: frontend route must remain disabled.');
  }

  if (policy.routePolicy.importCenterQueryParamAllowed !== false) {
    throw new Error('Step117-B visibility violation: Import Center query params must remain disabled.');
  }

  return policy;
}
