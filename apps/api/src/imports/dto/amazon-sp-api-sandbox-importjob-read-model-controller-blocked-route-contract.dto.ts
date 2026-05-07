import {
  assertAmazonSpApiSandboxImportJobReadModelControllerContract,
  buildAmazonSpApiSandboxImportJobReadModelControllerContract,
  type AmazonSpApiSandboxImportJobReadModelControllerContract,
} from './amazon-sp-api-sandbox-importjob-read-model-controller-contract.dto';

export const AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_CONTROLLER_BLOCKED_ROUTE_CONTRACT_VERSION =
  'amazon-sp-api-sandbox-importjob-read-model-controller-blocked-route-contract-v1' as const;

export type AmazonSpApiSandboxImportJobReadModelControllerBlockedRouteContract = {
  version: typeof AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_CONTROLLER_BLOCKED_ROUTE_CONTRACT_VERSION;
  sourceControllerContract: AmazonSpApiSandboxImportJobReadModelControllerContract;

  designOnly: true;
  routeImplementedNow: false;
  routeCallableNow: false;
  serviceCallAllowedNow: false;
  frontendExposedNow: false;
  writesDatabase: false;

  futureBlockedRoute: {
    method: 'GET';
    path: '/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model';
    mustRequireAuth: true;
    mustResolveCompanyIdFromAuthContext: true;
    mustRequireInternalSandboxEnvGate: true;
    mustRequireDryRunTrue: true;
    mustReturnBlockedBeforeServiceCall: true;
  };

  requiredBlockedError: {
    code: 'STEP122_J_CONTROLLER_BLOCKED_ROUTE_NOT_OPEN';
    httpStatus: 400;
    messageIncludes: 'Amazon SP-API sandbox ImportJob read-model controller route is not open yet';
  };

  allowedTransitionChecks: {
    mayParseQuery: true;
    mayValidateDryRun: true;
    mayValidateFilterSortPagination: true;
    mayCheckEnvGate: true;
    mayCallReadModelService: false;
    mayReturnRows: false;
  };

  forbiddenRouteBehavior: {
    postOrPatchOrDeleteRoute: true;
    dryRunFalse: true;
    anonymousAccess: true;
    companyIdFromQueryAsAuthority: true;
    rawPayloadProjection: true;
    normalizedPayloadProjection: true;
    dedupeHashProjection: true;
    transactionJoin: true;
    inventoryJoin: true;
    schemaMigration: true;
    realSpApi: true;
    oauth: true;
    tokenPersistence: true;
    commitSalesAction: true;
    inventoryExecutionAction: true;
  };

  blockedNow: {
    routeDecorator: true;
    controllerServiceCall: true;
    frontendRoute: true;
    commitSales: true;
    executeInventory: true;
    realSpApi: true;
    oauth: true;
    tokenPersistence: true;
    schemaMigration: true;
  };

  summary: {
    readyForBlockedRouteContract: true;
    readyForRouteImplementation: false;
    readyForServiceCallFromController: false;
    readyForFrontendExposure: false;
    readyForCommittedSales: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiSandboxImportJobReadModelControllerBlockedRouteContract(): AmazonSpApiSandboxImportJobReadModelControllerBlockedRouteContract {
  const controllerContract = assertAmazonSpApiSandboxImportJobReadModelControllerContract(
    buildAmazonSpApiSandboxImportJobReadModelControllerContract(),
  );

  return {
    version: AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_CONTROLLER_BLOCKED_ROUTE_CONTRACT_VERSION,
    sourceControllerContract: controllerContract,

    designOnly: true,
    routeImplementedNow: false,
    routeCallableNow: false,
    serviceCallAllowedNow: false,
    frontendExposedNow: false,
    writesDatabase: false,

    futureBlockedRoute: {
      method: 'GET',
      path: '/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model',
      mustRequireAuth: true,
      mustResolveCompanyIdFromAuthContext: true,
      mustRequireInternalSandboxEnvGate: true,
      mustRequireDryRunTrue: true,
      mustReturnBlockedBeforeServiceCall: true,
    },

    requiredBlockedError: {
      code: 'STEP122_J_CONTROLLER_BLOCKED_ROUTE_NOT_OPEN',
      httpStatus: 400,
      messageIncludes:
        'Amazon SP-API sandbox ImportJob read-model controller route is not open yet',
    },

    allowedTransitionChecks: {
      mayParseQuery: true,
      mayValidateDryRun: true,
      mayValidateFilterSortPagination: true,
      mayCheckEnvGate: true,
      mayCallReadModelService: false,
      mayReturnRows: false,
    },

    forbiddenRouteBehavior: {
      postOrPatchOrDeleteRoute: true,
      dryRunFalse: true,
      anonymousAccess: true,
      companyIdFromQueryAsAuthority: true,
      rawPayloadProjection: true,
      normalizedPayloadProjection: true,
      dedupeHashProjection: true,
      transactionJoin: true,
      inventoryJoin: true,
      schemaMigration: true,
      realSpApi: true,
      oauth: true,
      tokenPersistence: true,
      commitSalesAction: true,
      inventoryExecutionAction: true,
    },

    blockedNow: {
      routeDecorator: true,
      controllerServiceCall: true,
      frontendRoute: true,
      commitSales: true,
      executeInventory: true,
      realSpApi: true,
      oauth: true,
      tokenPersistence: true,
      schemaMigration: true,
    },

    summary: {
      readyForBlockedRouteContract: true,
      readyForRouteImplementation: false,
      readyForServiceCallFromController: false,
      readyForFrontendExposure: false,
      readyForCommittedSales: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiSandboxImportJobReadModelControllerBlockedRouteContract(
  contract: AmazonSpApiSandboxImportJobReadModelControllerBlockedRouteContract,
): AmazonSpApiSandboxImportJobReadModelControllerBlockedRouteContract {
  if (
    contract.version !==
    AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_CONTROLLER_BLOCKED_ROUTE_CONTRACT_VERSION
  ) {
    throw new Error('Step122-J blocked route contract violation: version mismatch.');
  }

  if (
    contract.designOnly !== true ||
    contract.routeImplementedNow !== false ||
    contract.routeCallableNow !== false ||
    contract.serviceCallAllowedNow !== false ||
    contract.frontendExposedNow !== false ||
    contract.writesDatabase !== false
  ) {
    throw new Error(
      'Step122-J blocked route contract violation: route must remain design-only and disabled.',
    );
  }

  if (
    contract.futureBlockedRoute.method !== 'GET' ||
    contract.futureBlockedRoute.mustRequireAuth !== true ||
    contract.futureBlockedRoute.mustResolveCompanyIdFromAuthContext !== true ||
    contract.futureBlockedRoute.mustRequireInternalSandboxEnvGate !== true ||
    contract.futureBlockedRoute.mustRequireDryRunTrue !== true ||
    contract.futureBlockedRoute.mustReturnBlockedBeforeServiceCall !== true
  ) {
    throw new Error('Step122-J blocked route contract violation: future route safety policy mismatch.');
  }

  if (
    contract.allowedTransitionChecks.mayCallReadModelService !== false ||
    contract.allowedTransitionChecks.mayReturnRows !== false
  ) {
    throw new Error(
      'Step122-J blocked route contract violation: service call and row return must remain disabled.',
    );
  }

  for (const [key, blocked] of Object.entries(contract.forbiddenRouteBehavior)) {
    if (blocked !== true) {
      throw new Error(`Step122-J blocked route contract violation: forbiddenRouteBehavior.${key} must remain true.`);
    }
  }

  for (const [key, blocked] of Object.entries(contract.blockedNow)) {
    if (blocked !== true) {
      throw new Error(`Step122-J blocked route contract violation: blockedNow.${key} must remain true.`);
    }
  }

  return contract;
}
