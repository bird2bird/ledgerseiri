export const AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_HTTP_AUTH_BOUNDARY_PREFLIGHT_VERSION =
  'amazon-sp-api-sandbox-importjob-read-model-http-auth-boundary-preflight-v1' as const;

export type AmazonSpApiSandboxImportJobReadModelHttpAuthBoundaryPreflight = {
  version: typeof AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_HTTP_AUTH_BOUNDARY_PREFLIGHT_VERSION;

  preflightOnly: true;
  endpointAlreadyImplemented: true;
  introducesAuthGuardNow: false;
  frontendExposedNow: false;
  writesDatabase: false;

  endpoint: {
    method: 'GET';
    path: '/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model';
    internalSandboxOnly: true;
    mustRequireInternalSandboxEnvGate: true;
    mustValidateQueryBeforeServiceCall: true;
    mustForceDryRunTrue: true;
    mustReturnProjectionOnly: true;
  };

  currentAuthBoundary: {
    authGuardImplementedNow: false;
    authGuardRequiredBeforeFrontendExposure: true;
    frontendMustRemainUnwired: true;
    queryCompanyIdMustNotBeTrusted: true;
    companyIdProjectionForbidden: true;
  };

  runtimeExpectations: {
    healthPath: '/health';
    validReadonlyRequestReturns200: true;
    invalidPageSizeReturns400: true;
    missingDryRunReturns400: true;
    validationErrorsMustNotReturn500: true;
  };

  forbiddenBehavior: {
    rawPayloadProjection: true;
    normalizedPayloadProjection: true;
    dedupeHashProjection: true;
    companyIdProjection: true;
    transactionJoin: true;
    inventoryMovementJoin: true;
    inventoryBalanceJoin: true;
    writeOperations: true;
    schemaMigration: true;
    realSpApi: true;
    oauth: true;
    tokenPersistence: true;
    commitSalesAction: true;
    inventoryExecutionAction: true;
    frontendExposure: true;
  };

  summary: {
    readyForHttpRuntimeHardening: true;
    readyForAuthGuardImplementation: false;
    readyForFrontendExposure: false;
    readyForCommittedSales: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiSandboxImportJobReadModelHttpAuthBoundaryPreflight(): AmazonSpApiSandboxImportJobReadModelHttpAuthBoundaryPreflight {
  return {
    version: AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_HTTP_AUTH_BOUNDARY_PREFLIGHT_VERSION,

    preflightOnly: true,
    endpointAlreadyImplemented: true,
    introducesAuthGuardNow: false,
    frontendExposedNow: false,
    writesDatabase: false,

    endpoint: {
      method: 'GET',
      path: '/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model',
      internalSandboxOnly: true,
      mustRequireInternalSandboxEnvGate: true,
      mustValidateQueryBeforeServiceCall: true,
      mustForceDryRunTrue: true,
      mustReturnProjectionOnly: true,
    },

    currentAuthBoundary: {
      authGuardImplementedNow: false,
      authGuardRequiredBeforeFrontendExposure: true,
      frontendMustRemainUnwired: true,
      queryCompanyIdMustNotBeTrusted: true,
      companyIdProjectionForbidden: true,
    },

    runtimeExpectations: {
      healthPath: '/health',
      validReadonlyRequestReturns200: true,
      invalidPageSizeReturns400: true,
      missingDryRunReturns400: true,
      validationErrorsMustNotReturn500: true,
    },

    forbiddenBehavior: {
      rawPayloadProjection: true,
      normalizedPayloadProjection: true,
      dedupeHashProjection: true,
      companyIdProjection: true,
      transactionJoin: true,
      inventoryMovementJoin: true,
      inventoryBalanceJoin: true,
      writeOperations: true,
      schemaMigration: true,
      realSpApi: true,
      oauth: true,
      tokenPersistence: true,
      commitSalesAction: true,
      inventoryExecutionAction: true,
      frontendExposure: true,
    },

    summary: {
      readyForHttpRuntimeHardening: true,
      readyForAuthGuardImplementation: false,
      readyForFrontendExposure: false,
      readyForCommittedSales: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiSandboxImportJobReadModelHttpAuthBoundaryPreflight(
  contract: AmazonSpApiSandboxImportJobReadModelHttpAuthBoundaryPreflight,
): AmazonSpApiSandboxImportJobReadModelHttpAuthBoundaryPreflight {
  if (contract.version !== AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_HTTP_AUTH_BOUNDARY_PREFLIGHT_VERSION) {
    throw new Error('Step122-Q auth-boundary preflight violation: version mismatch.');
  }

  if (
    contract.preflightOnly !== true ||
    contract.endpointAlreadyImplemented !== true ||
    contract.introducesAuthGuardNow !== false ||
    contract.frontendExposedNow !== false ||
    contract.writesDatabase !== false
  ) {
    throw new Error('Step122-Q auth-boundary preflight violation: preflight-only boundary mismatch.');
  }

  if (
    contract.endpoint.method !== 'GET' ||
    contract.endpoint.internalSandboxOnly !== true ||
    contract.endpoint.mustRequireInternalSandboxEnvGate !== true ||
    contract.endpoint.mustValidateQueryBeforeServiceCall !== true ||
    contract.endpoint.mustForceDryRunTrue !== true ||
    contract.endpoint.mustReturnProjectionOnly !== true
  ) {
    throw new Error('Step122-Q auth-boundary preflight violation: endpoint policy mismatch.');
  }

  if (
    contract.currentAuthBoundary.authGuardImplementedNow !== false ||
    contract.currentAuthBoundary.authGuardRequiredBeforeFrontendExposure !== true ||
    contract.currentAuthBoundary.frontendMustRemainUnwired !== true ||
    contract.currentAuthBoundary.queryCompanyIdMustNotBeTrusted !== true ||
    contract.currentAuthBoundary.companyIdProjectionForbidden !== true
  ) {
    throw new Error('Step122-Q auth-boundary preflight violation: auth boundary policy mismatch.');
  }

  for (const [key, forbidden] of Object.entries(contract.forbiddenBehavior)) {
    if (forbidden !== true) {
      throw new Error(`Step122-Q auth-boundary preflight violation: forbiddenBehavior.${key} must remain true.`);
    }
  }

  return contract;
}
