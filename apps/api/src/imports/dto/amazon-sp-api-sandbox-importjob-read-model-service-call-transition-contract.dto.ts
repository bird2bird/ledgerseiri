import {
  assertAmazonSpApiSandboxImportJobReadModelReadonlyEndpointContract,
  buildAmazonSpApiSandboxImportJobReadModelReadonlyEndpointContract,
  type AmazonSpApiSandboxImportJobReadModelReadonlyEndpointContract,
} from './amazon-sp-api-sandbox-importjob-read-model-readonly-endpoint-contract.dto';

export const AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_SERVICE_CALL_TRANSITION_CONTRACT_VERSION =
  'amazon-sp-api-sandbox-importjob-read-model-service-call-transition-contract-v1' as const;

export type AmazonSpApiSandboxImportJobReadModelServiceCallTransitionContract = {
  version: typeof AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_SERVICE_CALL_TRANSITION_CONTRACT_VERSION;
  sourceReadonlyEndpointContract: AmazonSpApiSandboxImportJobReadModelReadonlyEndpointContract;

  contractOnly: true;
  transitionDesignOnly: true;
  controllerServiceCallImplementedNow: false;
  controllerRowsReturnImplementedNow: false;
  routeStillBlockedNow: true;
  frontendExposedNow: false;
  writesDatabase: false;

  intendedControllerTransition: {
    routeMethod: 'GET';
    routePath: '/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model';
    controllerMethod: 'amazonSpApiSandboxImportJobReadModelEnvGatedBlockedRoute';
    futureServiceMethod: 'listAmazonSpApiSandboxImportJobsReadModelDryRun';
    futureResponse: 'AmazonSpApiSandboxImportJobReadModelDryRunResult';
  };

  serviceCallEnablementChecklist: {
    authContextCompanyIdRequired: true;
    queryCompanyIdMustNotBeAuthority: true;
    internalSandboxEnvGateRequired: true;
    dryRunTrueRequired: true;
    normalizedQueryRequired: true;
    readonlyContractMustBeUpgraded: true;
    blockedRouteContractMustBeUpgraded: true;
    controllerMustRemainGETOnly: true;
    responseMustUseProjectionOnly: true;
  };

  futureControllerCallShape: {
    companyIdSource: 'auth-context-only';
    serviceArgs: {
      companyId: 'resolvedCompanyId';
      filter: 'normalized.filter';
      sort: 'normalized.sort';
      page: 'normalized.page';
      pageSize: 'normalized.pageSize';
      dryRun: true;
    };
    returns: 'AmazonSpApiSandboxImportJobReadModelDryRunResult';
  };

  stillForbiddenNow: {
    controllerCallsService: true;
    controllerReturnsRows: true;
    frontendCallsEndpoint: true;
    rawPayloadProjection: true;
    normalizedPayloadProjection: true;
    dedupeHashProjection: true;
    companyIdProjection: true;
    transactionJoin: true;
    inventoryMovementJoin: true;
    inventoryBalanceJoin: true;
    transactionWrite: true;
    inventoryMovementWrite: true;
    inventoryBalanceWrite: true;
    importJobWrite: true;
    importStagingRowWrite: true;
    schemaMigration: true;
    realSpApi: true;
    oauth: true;
    tokenPersistence: true;
    commitSalesAction: true;
    inventoryExecutionAction: true;
  };

  regressionRequirements: {
    step122KBlockedRouteSmokeMustRemainPassing: true;
    step122LReadonlyContractSmokeMustRemainPassing: true;
    serviceDryRunSmokeMustRemainPassing: true;
    controllerRouteMayExistButOnlyAsBlockedGET: true;
    controllerMustNotReferenceServiceMethodNow: true;
    frontendMustRemainUnwired: true;
  };

  summary: {
    readyForServiceCallTransitionDesign: true;
    readyForControllerServiceCallImplementation: false;
    readyForFrontendExposure: false;
    readyForCommittedSales: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiSandboxImportJobReadModelServiceCallTransitionContract(): AmazonSpApiSandboxImportJobReadModelServiceCallTransitionContract {
  const readonlyContract = assertAmazonSpApiSandboxImportJobReadModelReadonlyEndpointContract(
    buildAmazonSpApiSandboxImportJobReadModelReadonlyEndpointContract(),
  );

  return {
    version: AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_SERVICE_CALL_TRANSITION_CONTRACT_VERSION,
    sourceReadonlyEndpointContract: readonlyContract,

    contractOnly: true,
    transitionDesignOnly: true,
    controllerServiceCallImplementedNow: false,
    controllerRowsReturnImplementedNow: false,
    routeStillBlockedNow: true,
    frontendExposedNow: false,
    writesDatabase: false,

    intendedControllerTransition: {
      routeMethod: 'GET',
      routePath: '/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model',
      controllerMethod: 'amazonSpApiSandboxImportJobReadModelEnvGatedBlockedRoute',
      futureServiceMethod: 'listAmazonSpApiSandboxImportJobsReadModelDryRun',
      futureResponse: 'AmazonSpApiSandboxImportJobReadModelDryRunResult',
    },

    serviceCallEnablementChecklist: {
      authContextCompanyIdRequired: true,
      queryCompanyIdMustNotBeAuthority: true,
      internalSandboxEnvGateRequired: true,
      dryRunTrueRequired: true,
      normalizedQueryRequired: true,
      readonlyContractMustBeUpgraded: true,
      blockedRouteContractMustBeUpgraded: true,
      controllerMustRemainGETOnly: true,
      responseMustUseProjectionOnly: true,
    },

    futureControllerCallShape: {
      companyIdSource: 'auth-context-only',
      serviceArgs: {
        companyId: 'resolvedCompanyId',
        filter: 'normalized.filter',
        sort: 'normalized.sort',
        page: 'normalized.page',
        pageSize: 'normalized.pageSize',
        dryRun: true,
      },
      returns: 'AmazonSpApiSandboxImportJobReadModelDryRunResult',
    },

    stillForbiddenNow: {
      controllerCallsService: true,
      controllerReturnsRows: true,
      frontendCallsEndpoint: true,
      rawPayloadProjection: true,
      normalizedPayloadProjection: true,
      dedupeHashProjection: true,
      companyIdProjection: true,
      transactionJoin: true,
      inventoryMovementJoin: true,
      inventoryBalanceJoin: true,
      transactionWrite: true,
      inventoryMovementWrite: true,
      inventoryBalanceWrite: true,
      importJobWrite: true,
      importStagingRowWrite: true,
      schemaMigration: true,
      realSpApi: true,
      oauth: true,
      tokenPersistence: true,
      commitSalesAction: true,
      inventoryExecutionAction: true,
    },

    regressionRequirements: {
      step122KBlockedRouteSmokeMustRemainPassing: true,
      step122LReadonlyContractSmokeMustRemainPassing: true,
      serviceDryRunSmokeMustRemainPassing: true,
      controllerRouteMayExistButOnlyAsBlockedGET: true,
      controllerMustNotReferenceServiceMethodNow: true,
      frontendMustRemainUnwired: true,
    },

    summary: {
      readyForServiceCallTransitionDesign: true,
      readyForControllerServiceCallImplementation: false,
      readyForFrontendExposure: false,
      readyForCommittedSales: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiSandboxImportJobReadModelServiceCallTransitionContract(
  contract: AmazonSpApiSandboxImportJobReadModelServiceCallTransitionContract,
): AmazonSpApiSandboxImportJobReadModelServiceCallTransitionContract {
  if (contract.version !== AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_SERVICE_CALL_TRANSITION_CONTRACT_VERSION) {
    throw new Error('Step122-M service-call transition contract violation: version mismatch.');
  }

  if (
    contract.contractOnly !== true ||
    contract.transitionDesignOnly !== true ||
    contract.controllerServiceCallImplementedNow !== false ||
    contract.controllerRowsReturnImplementedNow !== false ||
    contract.routeStillBlockedNow !== true ||
    contract.frontendExposedNow !== false ||
    contract.writesDatabase !== false
  ) {
    throw new Error(
      'Step122-M service-call transition contract violation: transition must remain design-only and blocked.',
    );
  }

  if (
    contract.intendedControllerTransition.routeMethod !== 'GET' ||
    contract.intendedControllerTransition.routePath !== '/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model' ||
    contract.intendedControllerTransition.futureServiceMethod !== 'listAmazonSpApiSandboxImportJobsReadModelDryRun'
  ) {
    throw new Error('Step122-M service-call transition contract violation: intended route/service mismatch.');
  }

  for (const [key, required] of Object.entries(contract.serviceCallEnablementChecklist)) {
    if (required !== true) {
      throw new Error(`Step122-M service-call transition contract violation: serviceCallEnablementChecklist.${key} must remain true.`);
    }
  }

  for (const [key, forbidden] of Object.entries(contract.stillForbiddenNow)) {
    if (forbidden !== true) {
      throw new Error(`Step122-M service-call transition contract violation: stillForbiddenNow.${key} must remain true.`);
    }
  }

  for (const [key, required] of Object.entries(contract.regressionRequirements)) {
    if (required !== true) {
      throw new Error(`Step122-M service-call transition contract violation: regressionRequirements.${key} must remain true.`);
    }
  }

  return contract;
}
