import {
  assertAmazonSpApiOrdersPreviewCommitServiceContract,
  buildAmazonSpApiOrdersPreviewCommitServiceContract,
  type AmazonSpApiOrdersPreviewCommitServiceContract,
} from './amazon-sp-api-orders-preview-commit-service-contract.dto';

export const AMAZON_SP_API_ORDERS_DRY_RUN_FIXTURE_CONTROLLER_ROUTE_CONTRACT_VERSION =
  'amazon-sp-api-orders-dry-run-fixture-controller-route-contract-v1' as const;

export type AmazonSpApiOrdersDryRunFixtureControllerRouteContract = {
  version: typeof AMAZON_SP_API_ORDERS_DRY_RUN_FIXTURE_CONTROLLER_ROUTE_CONTRACT_VERSION;
  sourceStep140G: AmazonSpApiOrdersPreviewCommitServiceContract;

  step: 'Step140-H';
  contractOnly: true;
  implementationNow: false;
  controllerRouteAddedNow: false;
  frontendRouteAddedNow: false;
  dryRunRuntimeFixtureImplementationNow: false;
  previewRouteImplementationNow: false;
  commitRouteImplementationNow: false;
  importCenterImplementationNow: false;
  frontendTriggerImplementationNow: false;
  importJobWriteNow: false;
  importStagingRowWriteNow: false;
  transactionWriteNow: false;
  inventoryWriteNow: false;
  schemaChangedNow: false;
  migrationAddedNow: false;
  writesDatabase: false;
  realAmazonOrdersApiCallNow: false;
  realNetworkExecutionNow: false;

  aggregateBoundary: {
    purpose: 'design-amazon-sp-api-orders-dry-run-fixture-controller-route-contract-aggregate-only';
    dryRunFixtureSmokeDesignOnly: true;
    previewControllerRouteDesignOnly: true;
    commitControllerRouteDesignOnly: true;
    routeAuthGuardDesignOnly: true;
    tenantStoreMarketplaceGuardDesignOnly: true;
    importCenterVisibilityDesignOnly: true;
    frontendTriggerReadinessDesignOnly: true;
    noRealControllerRoute: true;
    noFrontendImplementation: true;
    noDatabaseWrite: true;
    noAmazonNetworkExecution: true;
  };

  dryRunFixtureSmokeContract: {
    usesSyntheticOrdersFixtureOnly: true;
    usesSyntheticOrderItemsFixtureOnly: true;
    noAmazonCredentialsRequired: true;
    noLwaTokenRequired: true;
    noSigV4Required: true;
    noHttpClientExecution: true;
    validatesNormalizedOrdersShape: true;
    validatesNormalizedOrderItemsShape: true;
    validatesDedupeSummaryShape: true;
    validatesSkuResolutionSummaryShape: true;
    validatesInventoryImpactPreviewShape: true;
    validatesTransactionImpactPreviewShape: true;
    validatesWarningsShape: true;
    validatesNoDatabaseWrites: true;
  };

  previewControllerRouteContract: {
    methodWouldBePost: true;
    pathWouldBeApiImportsAmazonSpApiOrdersPreview: true;
    requiresAuthGuard: true;
    requiresCompanyContext: true;
    requiresStoreId: true;
    requiresMarketplaceId: true;
    requiresRegion: true;
    requiresDateRange: true;
    dryRunDefaultTrue: true;
    returnsPreviewEnvelope: true;
    writesNothing: true;
    routeForbiddenNow: true;
  };

  commitControllerRouteContract: {
    methodWouldBePost: true;
    pathWouldBeApiImportsAmazonSpApiOrdersCommit: true;
    requiresAuthGuard: true;
    requiresCompanyContext: true;
    requiresStoreId: true;
    requiresMarketplaceId: true;
    requiresRegion: true;
    requiresPreviewTokenOrSnapshot: true;
    requiresExplicitConfirm: true;
    requiresIdempotencyKey: true;
    returnsCommitEnvelopeInFuture: true;
    routeForbiddenNow: true;
    databaseWriteForbiddenNow: true;
  };

  routeGuardContract: {
    authRequired: true;
    companyIdFromAuthenticatedUser: true;
    crossCompanyAccessForbidden: true;
    storeMustBelongToCompany: true;
    marketplaceMustMatchStoreConnection: true;
    regionMustMatchMarketplace: true;
    disconnectedSpApiConnectionRejectedInFuture: true;
    invalidDateRangeRejected: true;
    piiNeverReturned: true;
    rawTokenNeverReturned: true;
  };

  importCenterVisibilityContract: {
    importCenterWouldShowAmazonSpApiOrdersSource: true;
    importCenterWouldShowDryRunPreviewStatus: true;
    importCenterWouldShowValidationSummary: true;
    importCenterWouldShowSkuResolutionWarnings: true;
    importCenterWouldShowInventoryImpactPreview: true;
    importCenterWouldShowTransactionImpactPreview: true;
    importCenterWouldShowCommitDisabledUntilConfirmed: true;
    importCenterWouldLinkStoreOrdersPage: true;
    implementationDeferred: true;
  };

  frontendTriggerReadinessContract: {
    dataImportPageWouldExposeAmazonSpApiOrdersAction: true;
    connectionStatusPanelWouldGateAction: true;
    previewButtonWouldUseDryRunRoute: true;
    commitButtonWouldRequireExplicitConfirm: true;
    unresolvedSkuWarningsWouldBlockInventoryDeduction: true;
    dryRunResultWouldBeDisplayedBeforeCommit: true;
    implementationDeferred: true;
  };

  responseEnvelopeContract: {
    requestIdRequired: true;
    sourceRequired: 'amazon-sp-api-orders-dry-run-fixture-design-only';
    dryRunBooleanRequired: true;
    companyIdRequired: true;
    storeIdRequired: true;
    marketplaceIdRequired: true;
    regionRequired: true;
    normalizedOrdersRequired: true;
    normalizedOrderItemsRequired: true;
    validationSummaryRequired: true;
    dedupeSummaryRequired: true;
    skuResolutionSummaryRequired: true;
    inventoryImpactPreviewRequired: true;
    transactionImpactPreviewRequired: true;
    warningsRequired: true;
    rawPayloadForbidden: true;
  };

  sampleDryRunFixtureContract: {
    sampleCompanyId: 'step140-h-company';
    sampleStoreId: 'step140-h-store';
    sampleMarketplaceId: 'A1VC38T7YXB528';
    sampleRegion: 'FE';
    sampleOrderCount: 2;
    sampleOrderItemCount: 3;
    sampleUnresolvedSkuCount: 1;
    sampleInventoryBlockedCount: 1;
    expectedDryRun: true;
    expectedWritesDatabase: false;
    expectedAmazonNetworkCall: false;
    expectedControllerRouteNow: false;
    expectedFrontendNow: false;
  };

  forbiddenNow: {
    controllerRoute: true;
    frontendPanel: true;
    dryRunRuntimeFixtureImplementation: true;
    previewRouteImplementation: true;
    commitRouteImplementation: true;
    importCenterImplementation: true;
    frontendTriggerImplementation: true;
    importJobCreate: true;
    importStagingRowCreate: true;
    importStagingRowCreateMany: true;
    transactionCreate: true;
    inventoryMovementCreate: true;
    inventoryBalanceUpdate: true;
    realAmazonOrdersHttpCall: true;
    realNetworkExecution: true;
    prismaSchemaChange: true;
    migrationFile: true;
  };

  summary: {
    readyForDryRunRuntimeFixtureImplementation: false;
    readyForControllerRouteImplementation: false;
    readyForFrontendImplementation: false;
    readyForDatabaseWrites: false;
    readyForAmazonNetworkRuntime: false;
    readyForDryRunFixtureImplementationPlan: true;
    readyForPreviewControllerImplementationPlan: true;
    readyForImportCenterUiContract: true;
  };
};

export function buildAmazonSpApiOrdersDryRunFixtureControllerRouteContract(): AmazonSpApiOrdersDryRunFixtureControllerRouteContract {
  const sourceStep140G = assertAmazonSpApiOrdersPreviewCommitServiceContract(
    buildAmazonSpApiOrdersPreviewCommitServiceContract(),
  );

  return {
    version: AMAZON_SP_API_ORDERS_DRY_RUN_FIXTURE_CONTROLLER_ROUTE_CONTRACT_VERSION,
    sourceStep140G,

    step: 'Step140-H',
    contractOnly: true,
    implementationNow: false,
    controllerRouteAddedNow: false,
    frontendRouteAddedNow: false,
    dryRunRuntimeFixtureImplementationNow: false,
    previewRouteImplementationNow: false,
    commitRouteImplementationNow: false,
    importCenterImplementationNow: false,
    frontendTriggerImplementationNow: false,
    importJobWriteNow: false,
    importStagingRowWriteNow: false,
    transactionWriteNow: false,
    inventoryWriteNow: false,
    schemaChangedNow: false,
    migrationAddedNow: false,
    writesDatabase: false,
    realAmazonOrdersApiCallNow: false,
    realNetworkExecutionNow: false,

    aggregateBoundary: {
      purpose: 'design-amazon-sp-api-orders-dry-run-fixture-controller-route-contract-aggregate-only',
      dryRunFixtureSmokeDesignOnly: true,
      previewControllerRouteDesignOnly: true,
      commitControllerRouteDesignOnly: true,
      routeAuthGuardDesignOnly: true,
      tenantStoreMarketplaceGuardDesignOnly: true,
      importCenterVisibilityDesignOnly: true,
      frontendTriggerReadinessDesignOnly: true,
      noRealControllerRoute: true,
      noFrontendImplementation: true,
      noDatabaseWrite: true,
      noAmazonNetworkExecution: true,
    },

    dryRunFixtureSmokeContract: {
      usesSyntheticOrdersFixtureOnly: true,
      usesSyntheticOrderItemsFixtureOnly: true,
      noAmazonCredentialsRequired: true,
      noLwaTokenRequired: true,
      noSigV4Required: true,
      noHttpClientExecution: true,
      validatesNormalizedOrdersShape: true,
      validatesNormalizedOrderItemsShape: true,
      validatesDedupeSummaryShape: true,
      validatesSkuResolutionSummaryShape: true,
      validatesInventoryImpactPreviewShape: true,
      validatesTransactionImpactPreviewShape: true,
      validatesWarningsShape: true,
      validatesNoDatabaseWrites: true,
    },

    previewControllerRouteContract: {
      methodWouldBePost: true,
      pathWouldBeApiImportsAmazonSpApiOrdersPreview: true,
      requiresAuthGuard: true,
      requiresCompanyContext: true,
      requiresStoreId: true,
      requiresMarketplaceId: true,
      requiresRegion: true,
      requiresDateRange: true,
      dryRunDefaultTrue: true,
      returnsPreviewEnvelope: true,
      writesNothing: true,
      routeForbiddenNow: true,
    },

    commitControllerRouteContract: {
      methodWouldBePost: true,
      pathWouldBeApiImportsAmazonSpApiOrdersCommit: true,
      requiresAuthGuard: true,
      requiresCompanyContext: true,
      requiresStoreId: true,
      requiresMarketplaceId: true,
      requiresRegion: true,
      requiresPreviewTokenOrSnapshot: true,
      requiresExplicitConfirm: true,
      requiresIdempotencyKey: true,
      returnsCommitEnvelopeInFuture: true,
      routeForbiddenNow: true,
      databaseWriteForbiddenNow: true,
    },

    routeGuardContract: {
      authRequired: true,
      companyIdFromAuthenticatedUser: true,
      crossCompanyAccessForbidden: true,
      storeMustBelongToCompany: true,
      marketplaceMustMatchStoreConnection: true,
      regionMustMatchMarketplace: true,
      disconnectedSpApiConnectionRejectedInFuture: true,
      invalidDateRangeRejected: true,
      piiNeverReturned: true,
      rawTokenNeverReturned: true,
    },

    importCenterVisibilityContract: {
      importCenterWouldShowAmazonSpApiOrdersSource: true,
      importCenterWouldShowDryRunPreviewStatus: true,
      importCenterWouldShowValidationSummary: true,
      importCenterWouldShowSkuResolutionWarnings: true,
      importCenterWouldShowInventoryImpactPreview: true,
      importCenterWouldShowTransactionImpactPreview: true,
      importCenterWouldShowCommitDisabledUntilConfirmed: true,
      importCenterWouldLinkStoreOrdersPage: true,
      implementationDeferred: true,
    },

    frontendTriggerReadinessContract: {
      dataImportPageWouldExposeAmazonSpApiOrdersAction: true,
      connectionStatusPanelWouldGateAction: true,
      previewButtonWouldUseDryRunRoute: true,
      commitButtonWouldRequireExplicitConfirm: true,
      unresolvedSkuWarningsWouldBlockInventoryDeduction: true,
      dryRunResultWouldBeDisplayedBeforeCommit: true,
      implementationDeferred: true,
    },

    responseEnvelopeContract: {
      requestIdRequired: true,
      sourceRequired: 'amazon-sp-api-orders-dry-run-fixture-design-only',
      dryRunBooleanRequired: true,
      companyIdRequired: true,
      storeIdRequired: true,
      marketplaceIdRequired: true,
      regionRequired: true,
      normalizedOrdersRequired: true,
      normalizedOrderItemsRequired: true,
      validationSummaryRequired: true,
      dedupeSummaryRequired: true,
      skuResolutionSummaryRequired: true,
      inventoryImpactPreviewRequired: true,
      transactionImpactPreviewRequired: true,
      warningsRequired: true,
      rawPayloadForbidden: true,
    },

    sampleDryRunFixtureContract: {
      sampleCompanyId: 'step140-h-company',
      sampleStoreId: 'step140-h-store',
      sampleMarketplaceId: 'A1VC38T7YXB528',
      sampleRegion: 'FE',
      sampleOrderCount: 2,
      sampleOrderItemCount: 3,
      sampleUnresolvedSkuCount: 1,
      sampleInventoryBlockedCount: 1,
      expectedDryRun: true,
      expectedWritesDatabase: false,
      expectedAmazonNetworkCall: false,
      expectedControllerRouteNow: false,
      expectedFrontendNow: false,
    },

    forbiddenNow: {
      controllerRoute: true,
      frontendPanel: true,
      dryRunRuntimeFixtureImplementation: true,
      previewRouteImplementation: true,
      commitRouteImplementation: true,
      importCenterImplementation: true,
      frontendTriggerImplementation: true,
      importJobCreate: true,
      importStagingRowCreate: true,
      importStagingRowCreateMany: true,
      transactionCreate: true,
      inventoryMovementCreate: true,
      inventoryBalanceUpdate: true,
      realAmazonOrdersHttpCall: true,
      realNetworkExecution: true,
      prismaSchemaChange: true,
      migrationFile: true,
    },

    summary: {
      readyForDryRunRuntimeFixtureImplementation: false,
      readyForControllerRouteImplementation: false,
      readyForFrontendImplementation: false,
      readyForDatabaseWrites: false,
      readyForAmazonNetworkRuntime: false,
      readyForDryRunFixtureImplementationPlan: true,
      readyForPreviewControllerImplementationPlan: true,
      readyForImportCenterUiContract: true,
    },
  };
}

export function assertAmazonSpApiOrdersDryRunFixtureControllerRouteContract(
  contract: AmazonSpApiOrdersDryRunFixtureControllerRouteContract,
): AmazonSpApiOrdersDryRunFixtureControllerRouteContract {
  if (contract.version !== AMAZON_SP_API_ORDERS_DRY_RUN_FIXTURE_CONTROLLER_ROUTE_CONTRACT_VERSION) {
    throw new Error('Step140-H orders dry-run fixture controller route contract violation: version mismatch.');
  }

  assertAmazonSpApiOrdersPreviewCommitServiceContract(contract.sourceStep140G);

  if (
    contract.step !== 'Step140-H' ||
    contract.contractOnly !== true ||
    contract.implementationNow !== false ||
    contract.controllerRouteAddedNow !== false ||
    contract.frontendRouteAddedNow !== false ||
    contract.dryRunRuntimeFixtureImplementationNow !== false ||
    contract.previewRouteImplementationNow !== false ||
    contract.commitRouteImplementationNow !== false ||
    contract.importCenterImplementationNow !== false ||
    contract.frontendTriggerImplementationNow !== false ||
    contract.importJobWriteNow !== false ||
    contract.importStagingRowWriteNow !== false ||
    contract.transactionWriteNow !== false ||
    contract.inventoryWriteNow !== false ||
    contract.schemaChangedNow !== false ||
    contract.migrationAddedNow !== false ||
    contract.writesDatabase !== false ||
    contract.realAmazonOrdersApiCallNow !== false ||
    contract.realNetworkExecutionNow !== false
  ) {
    throw new Error('Step140-H orders dry-run fixture controller route contract violation: implementation boundary mismatch.');
  }

  if (contract.aggregateBoundary.purpose !== 'design-amazon-sp-api-orders-dry-run-fixture-controller-route-contract-aggregate-only') {
    throw new Error('Step140-H orders dry-run fixture controller route contract violation: purpose mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    aggregateBoundary: contract.aggregateBoundary,
    dryRunFixtureSmokeContract: contract.dryRunFixtureSmokeContract,
    previewControllerRouteContract: contract.previewControllerRouteContract,
    commitControllerRouteContract: contract.commitControllerRouteContract,
    routeGuardContract: contract.routeGuardContract,
    importCenterVisibilityContract: contract.importCenterVisibilityContract,
    frontendTriggerReadinessContract: contract.frontendTriggerReadinessContract,
    responseEnvelopeContract: contract.responseEnvelopeContract,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (key === 'purpose' || key === 'sourceRequired') continue;
      if (typeof value === 'string') continue;
      if (value !== true) {
        throw new Error(`Step140-H orders dry-run fixture controller route contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.sampleDryRunFixtureContract.sampleMarketplaceId !== 'A1VC38T7YXB528' ||
    contract.sampleDryRunFixtureContract.sampleRegion !== 'FE' ||
    contract.sampleDryRunFixtureContract.sampleOrderCount !== 2 ||
    contract.sampleDryRunFixtureContract.sampleOrderItemCount !== 3 ||
    contract.sampleDryRunFixtureContract.sampleUnresolvedSkuCount !== 1 ||
    contract.sampleDryRunFixtureContract.sampleInventoryBlockedCount !== 1 ||
    contract.sampleDryRunFixtureContract.expectedDryRun !== true ||
    contract.sampleDryRunFixtureContract.expectedWritesDatabase !== false ||
    contract.sampleDryRunFixtureContract.expectedAmazonNetworkCall !== false ||
    contract.sampleDryRunFixtureContract.expectedControllerRouteNow !== false ||
    contract.sampleDryRunFixtureContract.expectedFrontendNow !== false
  ) {
    throw new Error('Step140-H orders dry-run fixture controller route contract violation: sample mismatch.');
  }

  for (const [key, forbidden] of Object.entries(contract.forbiddenNow)) {
    if (forbidden !== true) {
      throw new Error(`Step140-H orders dry-run fixture controller route contract violation: forbiddenNow.${key} must remain true.`);
    }
  }

  if (
    contract.summary.readyForDryRunRuntimeFixtureImplementation !== false ||
    contract.summary.readyForControllerRouteImplementation !== false ||
    contract.summary.readyForFrontendImplementation !== false ||
    contract.summary.readyForDatabaseWrites !== false ||
    contract.summary.readyForAmazonNetworkRuntime !== false ||
    contract.summary.readyForDryRunFixtureImplementationPlan !== true ||
    contract.summary.readyForPreviewControllerImplementationPlan !== true ||
    contract.summary.readyForImportCenterUiContract !== true
  ) {
    throw new Error('Step140-H orders dry-run fixture controller route contract violation: summary readiness mismatch.');
  }

  if (
    contract.sourceStep140G.summary.readyForDryRunRuntimeFixtureSmoke !== true ||
    contract.sourceStep140G.summary.readyForControllerRouteContract !== true
  ) {
    throw new Error('Step140-H orders dry-run fixture controller route contract violation: Step140-G does not allow this aggregate contract.');
  }

  return contract;
}
