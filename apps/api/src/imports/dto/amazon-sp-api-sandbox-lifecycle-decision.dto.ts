export const AMAZON_SP_API_SANDBOX_LIFECYCLE_DECISION_VERSION =
  'amazon-sp-api-sandbox-lifecycle-decision-v1' as const;

export type AmazonSpApiSandboxLifecyclePhase =
  | 'ADAPTER_NORMALIZED'
  | 'PREVIEW_ONLY'
  | 'STAGING_DRY_RUN'
  | 'STAGING_PERSIST_BLOCKED'
  | 'TRANSACTION_COMMIT_BLOCKED'
  | 'REAL_SP_API_BLOCKED';

export type AmazonSpApiSandboxLifecycleDecision = {
  version: typeof AMAZON_SP_API_SANDBOX_LIFECYCLE_DECISION_VERSION;
  sourceType: 'amazon-sp-api-sandbox';
  normalizedSourceType: 'AMAZON_ORDER_SP_API';
  module: 'store-orders';

  importJobLifecycle: {
    previewCreatesImportJob: false;
    dryRunCreatesImportJobInsideRollback: true;
    persistImportJobAllowed: false;
    persistImportStagingRowsAllowed: false;
    commitTransactionAllowed: false;
    inventoryDeductionAllowed: false;
    importJobStatusStrategy: 'reuse-existing-job-status-enum';
    allowedPrismaJobStatuses: readonly ['PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED'];
    proposedFutureVirtualStatuses: readonly [
      'PREVIEWED',
      'STAGED',
      'COMMITTED',
      'ABORTED',
    ];
  };

  gatePolicy: {
    requiresInternalSandboxEnv: true;
    requiredEnv: 'AMAZON_SP_API_SANDBOX_INTERNAL_ENABLED=true';
    realSpApiEnvMustRemainFalse: 'AMAZON_SP_API_REAL_ENABLED=false';
    oauthEnvMustRemainFalse: 'AMAZON_SP_API_OAUTH_ENABLED=false';
    tokenPersistenceEnvMustRemainFalse: 'AMAZON_SP_API_TOKEN_PERSISTENCE_ENABLED=false';
  };

  controllerPolicy: {
    controllerRouteAllowed: false;
    frontendRouteAllowed: false;
    publicApiAllowed: false;
  };

  persistencePolicy: {
    dryRunOnly: true;
    nonDryRunBlockedCode: 'STEP116_H_SP_API_SANDBOX_NON_DRY_RUN_BLOCKED';
    tokenTableAllowed: false;
    credentialStorageAllowed: false;
    backgroundSyncAllowed: false;
    queueWorkerAllowed: false;
  };

  nextDecisionRequiredBeforeOpening: readonly [
    'ImportJob persistence semantics',
    'ImportStagingRow lifecycle status mapping',
    'dedupe policy against AMAZON_ORDER_CSV',
    'Import Center visibility policy',
    'admin/internal permission boundary',
    'controller route contract',
    'token security model',
  ];
};

export function getAmazonSpApiSandboxLifecycleDecision(): AmazonSpApiSandboxLifecycleDecision {
  return {
    version: AMAZON_SP_API_SANDBOX_LIFECYCLE_DECISION_VERSION,
    sourceType: 'amazon-sp-api-sandbox',
    normalizedSourceType: 'AMAZON_ORDER_SP_API',
    module: 'store-orders',

    importJobLifecycle: {
      previewCreatesImportJob: false,
      dryRunCreatesImportJobInsideRollback: true,
      persistImportJobAllowed: false,
      persistImportStagingRowsAllowed: false,
      commitTransactionAllowed: false,
      inventoryDeductionAllowed: false,
      importJobStatusStrategy: 'reuse-existing-job-status-enum',
      allowedPrismaJobStatuses: ['PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED'],
      proposedFutureVirtualStatuses: ['PREVIEWED', 'STAGED', 'COMMITTED', 'ABORTED'],
    },

    gatePolicy: {
      requiresInternalSandboxEnv: true,
      requiredEnv: 'AMAZON_SP_API_SANDBOX_INTERNAL_ENABLED=true',
      realSpApiEnvMustRemainFalse: 'AMAZON_SP_API_REAL_ENABLED=false',
      oauthEnvMustRemainFalse: 'AMAZON_SP_API_OAUTH_ENABLED=false',
      tokenPersistenceEnvMustRemainFalse: 'AMAZON_SP_API_TOKEN_PERSISTENCE_ENABLED=false',
    },

    controllerPolicy: {
      controllerRouteAllowed: false,
      frontendRouteAllowed: false,
      publicApiAllowed: false,
    },

    persistencePolicy: {
      dryRunOnly: true,
      nonDryRunBlockedCode: 'STEP116_H_SP_API_SANDBOX_NON_DRY_RUN_BLOCKED',
      tokenTableAllowed: false,
      credentialStorageAllowed: false,
      backgroundSyncAllowed: false,
      queueWorkerAllowed: false,
    },

    nextDecisionRequiredBeforeOpening: [
      'ImportJob persistence semantics',
      'ImportStagingRow lifecycle status mapping',
      'dedupe policy against AMAZON_ORDER_CSV',
      'Import Center visibility policy',
      'admin/internal permission boundary',
      'controller route contract',
      'token security model',
    ],
  };
}

export function assertAmazonSpApiSandboxLifecycleDecision(): AmazonSpApiSandboxLifecycleDecision {
  const decision = getAmazonSpApiSandboxLifecycleDecision();

  if (decision.importJobLifecycle.previewCreatesImportJob !== false) {
    throw new Error('Step117-A decision violation: preview must not create ImportJob.');
  }

  if (decision.importJobLifecycle.persistImportJobAllowed !== false) {
    throw new Error('Step117-A decision violation: ImportJob persistence must remain blocked.');
  }

  if (decision.importJobLifecycle.persistImportStagingRowsAllowed !== false) {
    throw new Error('Step117-A decision violation: ImportStagingRow persistence must remain blocked.');
  }

  if (decision.importJobLifecycle.commitTransactionAllowed !== false) {
    throw new Error('Step117-A decision violation: Transaction commit must remain blocked.');
  }

  if (decision.importJobLifecycle.inventoryDeductionAllowed !== false) {
    throw new Error('Step117-A decision violation: inventory deduction must remain blocked.');
  }

  if (decision.persistencePolicy.dryRunOnly !== true) {
    throw new Error('Step117-A decision violation: sandbox staging must remain dryRunOnly.');
  }

  if (
    decision.persistencePolicy.nonDryRunBlockedCode !==
    'STEP116_H_SP_API_SANDBOX_NON_DRY_RUN_BLOCKED'
  ) {
    throw new Error('Step117-A decision violation: non-dry-run blocked code mismatch.');
  }

  if (decision.controllerPolicy.controllerRouteAllowed !== false) {
    throw new Error('Step117-A decision violation: controller route must remain blocked.');
  }

  if (decision.controllerPolicy.frontendRouteAllowed !== false) {
    throw new Error('Step117-A decision violation: frontend route must remain blocked.');
  }

  if (decision.controllerPolicy.publicApiAllowed !== false) {
    throw new Error('Step117-A decision violation: public API must remain blocked.');
  }

  if (decision.persistencePolicy.tokenTableAllowed !== false) {
    throw new Error('Step117-A decision violation: token table must remain blocked.');
  }

  if (decision.persistencePolicy.credentialStorageAllowed !== false) {
    throw new Error('Step117-A decision violation: credential storage must remain blocked.');
  }

  return decision;
}
