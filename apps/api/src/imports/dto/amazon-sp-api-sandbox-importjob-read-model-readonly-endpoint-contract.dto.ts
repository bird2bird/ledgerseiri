import {
  assertAmazonSpApiSandboxImportJobReadModelControllerBlockedRouteContract,
  buildAmazonSpApiSandboxImportJobReadModelControllerBlockedRouteContract,
  type AmazonSpApiSandboxImportJobReadModelControllerBlockedRouteContract,
} from './amazon-sp-api-sandbox-importjob-read-model-controller-blocked-route-contract.dto';

export const AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_READONLY_ENDPOINT_CONTRACT_VERSION =
  'amazon-sp-api-sandbox-importjob-read-model-readonly-endpoint-contract-v1' as const;

export type AmazonSpApiSandboxImportJobReadModelReadonlyEndpointContract = {
  version: typeof AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_READONLY_ENDPOINT_CONTRACT_VERSION;
  sourceBlockedRouteContract: AmazonSpApiSandboxImportJobReadModelControllerBlockedRouteContract;

  contractOnly: true;
  readonlyEndpointImplementedNow: false;
  routeCurrentlyBlocked: true;
  controllerMayCallServiceNow: false;
  controllerMayReturnRowsNow: false;
  frontendExposedNow: false;
  writesDatabase: false;

  futureReadonlyEndpoint: {
    method: 'GET';
    path: '/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model';
    mayReuseExistingBlockedRoute: true;
    mustRequireAuth: true;
    mustResolveCompanyIdFromAuthContext: true;
    mustIgnoreCompanyIdQueryAsAuthority: true;
    mustRequireInternalSandboxEnvGate: true;
    mustRequireDryRunTrue: true;
    mustValidateFilterSortPagination: true;
    mayCallServiceOnlyAfterContractUpgrade: true;
  };

  futureServiceCallPolicy: {
    serviceMethod: 'listAmazonSpApiSandboxImportJobsReadModelDryRun';
    allowedWhen: {
      readonlyEndpointImplementedNow: true;
      routeCurrentlyBlocked: false;
      controllerMayCallServiceNow: true;
      controllerMayReturnRowsNow: true;
      frontendExposedNow: false;
      writesDatabase: false;
      dryRun: true;
      internalSandboxEnvGate: true;
      companyIdFromAuthContext: true;
    };
    blockedNowReason:
      'Step122-L only defines readonly endpoint contract; controller service call remains blocked until a later explicit implementation step.';
  };

  allowedReadonlyProjection: {
    dryRun: true;
    displayOnly: true;
    sourceType: 'amazon-sp-api-sandbox';
    rows: 'AmazonSpApiSandboxImportJobListProjectedRow[]';
    page: 'number';
    pageSize: '20|50|100';
    totalRows: 'number';
    totalPages: 'number';
  };

  forbiddenReadonlyBehavior: {
    rawPayloadProjection: true;
    normalizedPayloadProjection: true;
    dedupeHashProjection: true;
    companyIdProjection: true;
    conflictMonthsJsonProjection: true;
    fileMonthsJsonProjection: true;
    transactionJoin: true;
    inventoryMovementJoin: true;
    inventoryBalanceJoin: true;
    writesTransaction: true;
    writesInventoryMovement: true;
    writesInventoryBalance: true;
    createsImportJob: true;
    updatesImportJob: true;
    createsImportStagingRow: true;
    updatesImportStagingRow: true;
    schemaMigration: true;
    realSpApi: true;
    oauth: true;
    tokenPersistence: true;
    commitSalesAction: true;
    inventoryExecutionAction: true;
    frontendExposure: true;
  };

  blockedNow: {
    controllerServiceCall: true;
    controllerRowsReturn: true;
    frontendRoute: true;
    commitSales: true;
    executeInventory: true;
    realSpApi: true;
    oauth: true;
    tokenPersistence: true;
    schemaMigration: true;
  };

  summary: {
    readyForReadonlyEndpointContract: true;
    readyForReadonlyControllerImplementation: false;
    readyForFrontendExposure: false;
    readyForCommittedSales: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiSandboxImportJobReadModelReadonlyEndpointContract(): AmazonSpApiSandboxImportJobReadModelReadonlyEndpointContract {
  const blockedRouteContract = assertAmazonSpApiSandboxImportJobReadModelControllerBlockedRouteContract(
    buildAmazonSpApiSandboxImportJobReadModelControllerBlockedRouteContract(),
  );

  return {
    version: AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_READONLY_ENDPOINT_CONTRACT_VERSION,
    sourceBlockedRouteContract: blockedRouteContract,

    contractOnly: true,
    readonlyEndpointImplementedNow: false,
    routeCurrentlyBlocked: true,
    controllerMayCallServiceNow: false,
    controllerMayReturnRowsNow: false,
    frontendExposedNow: false,
    writesDatabase: false,

    futureReadonlyEndpoint: {
      method: 'GET',
      path: '/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model',
      mayReuseExistingBlockedRoute: true,
      mustRequireAuth: true,
      mustResolveCompanyIdFromAuthContext: true,
      mustIgnoreCompanyIdQueryAsAuthority: true,
      mustRequireInternalSandboxEnvGate: true,
      mustRequireDryRunTrue: true,
      mustValidateFilterSortPagination: true,
      mayCallServiceOnlyAfterContractUpgrade: true,
    },

    futureServiceCallPolicy: {
      serviceMethod: 'listAmazonSpApiSandboxImportJobsReadModelDryRun',
      allowedWhen: {
        readonlyEndpointImplementedNow: true,
        routeCurrentlyBlocked: false,
        controllerMayCallServiceNow: true,
        controllerMayReturnRowsNow: true,
        frontendExposedNow: false,
        writesDatabase: false,
        dryRun: true,
        internalSandboxEnvGate: true,
        companyIdFromAuthContext: true,
      },
      blockedNowReason:
        'Step122-L only defines readonly endpoint contract; controller service call remains blocked until a later explicit implementation step.',
    },

    allowedReadonlyProjection: {
      dryRun: true,
      displayOnly: true,
      sourceType: 'amazon-sp-api-sandbox',
      rows: 'AmazonSpApiSandboxImportJobListProjectedRow[]',
      page: 'number',
      pageSize: '20|50|100',
      totalRows: 'number',
      totalPages: 'number',
    },

    forbiddenReadonlyBehavior: {
      rawPayloadProjection: true,
      normalizedPayloadProjection: true,
      dedupeHashProjection: true,
      companyIdProjection: true,
      conflictMonthsJsonProjection: true,
      fileMonthsJsonProjection: true,
      transactionJoin: true,
      inventoryMovementJoin: true,
      inventoryBalanceJoin: true,
      writesTransaction: true,
      writesInventoryMovement: true,
      writesInventoryBalance: true,
      createsImportJob: true,
      updatesImportJob: true,
      createsImportStagingRow: true,
      updatesImportStagingRow: true,
      schemaMigration: true,
      realSpApi: true,
      oauth: true,
      tokenPersistence: true,
      commitSalesAction: true,
      inventoryExecutionAction: true,
      frontendExposure: true,
    },

    blockedNow: {
      controllerServiceCall: true,
      controllerRowsReturn: true,
      frontendRoute: true,
      commitSales: true,
      executeInventory: true,
      realSpApi: true,
      oauth: true,
      tokenPersistence: true,
      schemaMigration: true,
    },

    summary: {
      readyForReadonlyEndpointContract: true,
      readyForReadonlyControllerImplementation: false,
      readyForFrontendExposure: false,
      readyForCommittedSales: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiSandboxImportJobReadModelReadonlyEndpointContract(
  contract: AmazonSpApiSandboxImportJobReadModelReadonlyEndpointContract,
): AmazonSpApiSandboxImportJobReadModelReadonlyEndpointContract {
  if (contract.version !== AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_READONLY_ENDPOINT_CONTRACT_VERSION) {
    throw new Error('Step122-L readonly endpoint contract violation: version mismatch.');
  }

  if (
    contract.contractOnly !== true ||
    contract.readonlyEndpointImplementedNow !== false ||
    contract.routeCurrentlyBlocked !== true ||
    contract.controllerMayCallServiceNow !== false ||
    contract.controllerMayReturnRowsNow !== false ||
    contract.frontendExposedNow !== false ||
    contract.writesDatabase !== false
  ) {
    throw new Error(
      'Step122-L readonly endpoint contract violation: contract-only blocked readonly transition required.',
    );
  }

  if (
    contract.futureReadonlyEndpoint.method !== 'GET' ||
    contract.futureReadonlyEndpoint.mustRequireAuth !== true ||
    contract.futureReadonlyEndpoint.mustResolveCompanyIdFromAuthContext !== true ||
    contract.futureReadonlyEndpoint.mustIgnoreCompanyIdQueryAsAuthority !== true ||
    contract.futureReadonlyEndpoint.mustRequireInternalSandboxEnvGate !== true ||
    contract.futureReadonlyEndpoint.mustRequireDryRunTrue !== true ||
    contract.futureReadonlyEndpoint.mustValidateFilterSortPagination !== true
  ) {
    throw new Error('Step122-L readonly endpoint contract violation: future endpoint safety policy mismatch.');
  }

  if (
    contract.futureServiceCallPolicy.serviceMethod !== 'listAmazonSpApiSandboxImportJobsReadModelDryRun' ||
    contract.futureServiceCallPolicy.allowedWhen.frontendExposedNow !== false ||
    contract.futureServiceCallPolicy.allowedWhen.writesDatabase !== false ||
    contract.futureServiceCallPolicy.allowedWhen.dryRun !== true ||
    contract.futureServiceCallPolicy.allowedWhen.internalSandboxEnvGate !== true ||
    contract.futureServiceCallPolicy.allowedWhen.companyIdFromAuthContext !== true
  ) {
    throw new Error('Step122-L readonly endpoint contract violation: future service call policy mismatch.');
  }

  for (const [key, blocked] of Object.entries(contract.forbiddenReadonlyBehavior)) {
    if (blocked !== true) {
      throw new Error(`Step122-L readonly endpoint contract violation: forbiddenReadonlyBehavior.${key} must remain true.`);
    }
  }

  for (const [key, blocked] of Object.entries(contract.blockedNow)) {
    if (blocked !== true) {
      throw new Error(`Step122-L readonly endpoint contract violation: blockedNow.${key} must remain true.`);
    }
  }

  return contract;
}
