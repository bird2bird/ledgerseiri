import {
  assertAmazonSpApiSandboxImportJobReadModelServiceCallTransitionContract,
  buildAmazonSpApiSandboxImportJobReadModelServiceCallTransitionContract,
  type AmazonSpApiSandboxImportJobReadModelServiceCallTransitionContract,
} from './amazon-sp-api-sandbox-importjob-read-model-service-call-transition-contract.dto';

export const AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_READONLY_CONTROLLER_PREFLIGHT_VERSION =
  'amazon-sp-api-sandbox-importjob-read-model-readonly-controller-preflight-v1' as const;

export type AmazonSpApiSandboxImportJobReadModelReadonlyControllerPreflight = {
  version: typeof AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_READONLY_CONTROLLER_PREFLIGHT_VERSION;
  sourceServiceCallTransitionContract: AmazonSpApiSandboxImportJobReadModelServiceCallTransitionContract;

  preflightOnly: true;
  controllerImplementationAllowedNow: false;
  controllerServiceCallAllowedNow: false;
  controllerRowsReturnAllowedNow: false;
  routeStillBlockedNow: true;
  frontendExposedNow: false;
  writesDatabase: false;

  requiredImplementationInputs: {
    authContextCompanyIdResolver: 'required-before-service-call';
    queryNormalizer: 'normalizeAmazonSpApiSandboxImportJobReadModelControllerQuery';
    envGate: 'assertAmazonSpApiSandboxEnvironmentGate';
    serviceMethod: 'listAmazonSpApiSandboxImportJobsReadModelDryRun';
    responseType: 'AmazonSpApiSandboxImportJobReadModelDryRunResult';
  };

  controllerPreflightChecklist: {
    routeIsGetOnly: true;
    routePathStable: true;
    internalSandboxEnvGatePresent: true;
    dryRunRequired: true;
    filterSortPaginationNormalized: true;
    companyIdMustComeFromAuthContext: true;
    queryCompanyIdMustNotBeTrusted: true;
    serviceMethodExists: true;
    serviceMethodIsComputedNameGuarded: true;
    blockedRouteStillBlocksNow: true;
    noRowsReturnedNow: true;
    frontendStillUnwired: true;
    schemaStillUnchanged: true;
  };

  futureImplementationPlan: {
    replaceBlockedErrorWithServiceCall: false;
    resolveCompanyIdFromAuthContextFirst: true;
    callServiceWithNormalizedQuery: true;
    preserveDryRunTrue: true;
    returnProjectionOnly: true;
    keepFrontendDisabledInitially: true;
  };

  forbiddenUntilImplementationStep: {
    controllerCallsService: true;
    controllerReturnsRows: true;
    frontendCallsEndpoint: true;
    queryCompanyIdAuthority: true;
    rawPayloadProjection: true;
    normalizedPayloadProjection: true;
    dedupeHashProjection: true;
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
  };

  summary: {
    readyForReadonlyControllerPreflight: true;
    readyForControllerServiceCallImplementation: false;
    readyForFrontendExposure: false;
    readyForCommittedSales: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiSandboxImportJobReadModelReadonlyControllerPreflight(): AmazonSpApiSandboxImportJobReadModelReadonlyControllerPreflight {
  const transitionContract = assertAmazonSpApiSandboxImportJobReadModelServiceCallTransitionContract(
    buildAmazonSpApiSandboxImportJobReadModelServiceCallTransitionContract(),
  );

  return {
    version: AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_READONLY_CONTROLLER_PREFLIGHT_VERSION,
    sourceServiceCallTransitionContract: transitionContract,

    preflightOnly: true,
    controllerImplementationAllowedNow: false,
    controllerServiceCallAllowedNow: false,
    controllerRowsReturnAllowedNow: false,
    routeStillBlockedNow: true,
    frontendExposedNow: false,
    writesDatabase: false,

    requiredImplementationInputs: {
      authContextCompanyIdResolver: 'required-before-service-call',
      queryNormalizer: 'normalizeAmazonSpApiSandboxImportJobReadModelControllerQuery',
      envGate: 'assertAmazonSpApiSandboxEnvironmentGate',
      serviceMethod: 'listAmazonSpApiSandboxImportJobsReadModelDryRun',
      responseType: 'AmazonSpApiSandboxImportJobReadModelDryRunResult',
    },

    controllerPreflightChecklist: {
      routeIsGetOnly: true,
      routePathStable: true,
      internalSandboxEnvGatePresent: true,
      dryRunRequired: true,
      filterSortPaginationNormalized: true,
      companyIdMustComeFromAuthContext: true,
      queryCompanyIdMustNotBeTrusted: true,
      serviceMethodExists: true,
      serviceMethodIsComputedNameGuarded: true,
      blockedRouteStillBlocksNow: true,
      noRowsReturnedNow: true,
      frontendStillUnwired: true,
      schemaStillUnchanged: true,
    },

    futureImplementationPlan: {
      replaceBlockedErrorWithServiceCall: false,
      resolveCompanyIdFromAuthContextFirst: true,
      callServiceWithNormalizedQuery: true,
      preserveDryRunTrue: true,
      returnProjectionOnly: true,
      keepFrontendDisabledInitially: true,
    },

    forbiddenUntilImplementationStep: {
      controllerCallsService: true,
      controllerReturnsRows: true,
      frontendCallsEndpoint: true,
      queryCompanyIdAuthority: true,
      rawPayloadProjection: true,
      normalizedPayloadProjection: true,
      dedupeHashProjection: true,
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
    },

    summary: {
      readyForReadonlyControllerPreflight: true,
      readyForControllerServiceCallImplementation: false,
      readyForFrontendExposure: false,
      readyForCommittedSales: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiSandboxImportJobReadModelReadonlyControllerPreflight(
  preflight: AmazonSpApiSandboxImportJobReadModelReadonlyControllerPreflight,
): AmazonSpApiSandboxImportJobReadModelReadonlyControllerPreflight {
  if (preflight.version !== AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_READONLY_CONTROLLER_PREFLIGHT_VERSION) {
    throw new Error('Step122-N readonly controller preflight violation: version mismatch.');
  }

  if (
    preflight.preflightOnly !== true ||
    preflight.controllerImplementationAllowedNow !== false ||
    preflight.controllerServiceCallAllowedNow !== false ||
    preflight.controllerRowsReturnAllowedNow !== false ||
    preflight.routeStillBlockedNow !== true ||
    preflight.frontendExposedNow !== false ||
    preflight.writesDatabase !== false
  ) {
    throw new Error('Step122-N readonly controller preflight violation: preflight must remain blocked.');
  }

  for (const [key, required] of Object.entries(preflight.controllerPreflightChecklist)) {
    if (required !== true) {
      throw new Error(`Step122-N readonly controller preflight violation: controllerPreflightChecklist.${key} must remain true.`);
    }
  }

  for (const [key, forbidden] of Object.entries(preflight.forbiddenUntilImplementationStep)) {
    if (forbidden !== true) {
      throw new Error(`Step122-N readonly controller preflight violation: forbiddenUntilImplementationStep.${key} must remain true.`);
    }
  }

  return preflight;
}
