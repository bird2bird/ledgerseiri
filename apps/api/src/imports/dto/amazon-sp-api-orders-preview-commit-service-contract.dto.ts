import {
  assertAmazonSpApiOrdersNormalizedFixturePersistenceReadinessContract,
  buildAmazonSpApiOrdersNormalizedFixturePersistenceReadinessContract,
  type AmazonSpApiOrdersNormalizedFixturePersistenceReadinessContract,
} from './amazon-sp-api-orders-normalized-fixture-persistence-readiness-contract.dto';

export const AMAZON_SP_API_ORDERS_PREVIEW_COMMIT_SERVICE_CONTRACT_VERSION =
  'amazon-sp-api-orders-preview-commit-service-contract-v1' as const;

export type AmazonSpApiOrdersPreviewCommitServiceContract = {
  version: typeof AMAZON_SP_API_ORDERS_PREVIEW_COMMIT_SERVICE_CONTRACT_VERSION;
  sourceStep140F: AmazonSpApiOrdersNormalizedFixturePersistenceReadinessContract;

  step: 'Step140-G';
  contractOnly: true;
  implementationNow: false;
  controllerRouteAddedNow: false;
  frontendRouteAddedNow: false;
  previewServiceImplementationNow: false;
  commitServiceImplementationNow: false;
  rollbackImplementationNow: false;
  importJobWriteNow: false;
  importStagingRowWriteNow: false;
  transactionWriteNow: false;
  inventoryWriteNow: false;
  reconciliationWriteNow: false;
  schemaChangedNow: false;
  migrationAddedNow: false;
  writesDatabase: false;
  realAmazonOrdersApiCallNow: false;
  realNetworkExecutionNow: false;

  aggregateBoundary: {
    purpose: 'design-amazon-sp-api-orders-preview-commit-service-contract-aggregate-only';
    previewServiceDesignOnly: true;
    commitServiceDesignOnly: true;
    rollbackBoundaryDesignOnly: true;
    compensationBoundaryDesignOnly: true;
    importJobWriteGateDesignOnly: true;
    importStagingRowWriteGateDesignOnly: true;
    transactionCommitGateDesignOnly: true;
    inventoryDeductionGateDesignOnly: true;
    unresolvedSkuAuditGateDesignOnly: true;
    reconciliationDeferredGateDesignOnly: true;
    noDatabaseWrite: true;
    noControllerRoute: true;
    noFrontendConsumption: true;
    noAmazonNetworkExecution: true;
  };

  previewServiceContract: {
    acceptsCompanyId: true;
    acceptsStoreId: true;
    acceptsMarketplaceId: true;
    acceptsRegion: true;
    acceptsDateRange: true;
    acceptsOrderStatuses: true;
    acceptsDryRunMode: true;
    returnsNormalizedOrders: true;
    returnsNormalizedOrderItems: true;
    returnsValidationSummary: true;
    returnsDedupeSummary: true;
    returnsSkuResolutionSummary: true;
    returnsInventoryImpactPreview: true;
    returnsTransactionImpactPreview: true;
    returnsWarnings: true;
    writesNothing: true;
  };

  commitServiceContract: {
    requiresPreviewTokenOrStableSnapshotInFuture: true;
    requiresExplicitUserConfirm: true;
    requiresIdempotencyKey: true;
    requiresValidationPass: true;
    requiresSkuResolutionDecision: true;
    requiresInventoryPolicyDecision: true;
    wouldCreateImportJobInFuture: true;
    wouldCreateImportStagingRowsInFuture: true;
    wouldCreateIncomeTransactionsInFuture: true;
    wouldCreateInventoryMovementsInFuture: true;
    wouldNotRunSettlementReconciliationYet: true;
    wouldNotRunBankReconciliationYet: true;
    commitForbiddenNow: true;
  };

  executionSequenceContract: {
    sequenceValidateRequestFirst: true;
    sequenceLoadConnectionStatusSecond: true;
    sequenceFetchOrUseSnapshotThird: true;
    sequenceParseAndNormalizeFourth: true;
    sequenceDedupeFifth: true;
    sequenceSkuResolutionSixth: true;
    sequenceInventoryPreviewSeventh: true;
    sequenceTransactionPreviewEighth: true;
    sequencePersistOnlyAfterExplicitCommitNinth: true;
    sequenceInventoryAfterTransactionLink: true;
    sequenceNoPartialCommitWithoutRollbackPlan: true;
  };

  importJobWriteGateContract: {
    importJobDomainIncomeRequired: true;
    importJobModuleStoreOrdersRequired: true;
    importJobSourceTypeAmazonSpApiRequired: true;
    importJobFilenameSyntheticRequired: true;
    importJobDedupeKeyRequired: true;
    importJobStatusPreviewBeforeCommit: true;
    importJobStatusImportedAfterCommitFuture: true;
    importJobTotalRowsFromNormalizedRows: true;
    importJobSuccessRowsFromCommittedRows: true;
    importJobWriteForbiddenNow: true;
  };

  stagingRowWriteGateContract: {
    stagingRowsUseStoreOrdersModule: true;
    stagingRowsHaveStableRowNo: true;
    stagingRowsCarryBusinessMonth: true;
    stagingRowsCarryDedupeHash: true;
    stagingRowsCarryNormalizedPayloadJson: true;
    stagingRowsCarryValidationErrors: true;
    stagingRowsCarrySkuResolutionStatus: true;
    stagingRowsCarryInventoryResolutionStatus: true;
    stagingRowsLinkImportJob: true;
    stagingRowWriteForbiddenNow: true;
  };

  transactionCommitGateContract: {
    incomeTransactionRequired: true;
    creditDirectionRequired: true;
    amountFromOrderTotalRequired: true;
    currencyRequired: true;
    occurredAtFromPurchaseDateRequired: true;
    businessMonthFromPurchaseDateRequired: true;
    memoIncludesAmazonOrderId: true;
    sourceRowNoStable: true;
    dedupeHashRequired: true;
    transactionWriteForbiddenNow: true;
  };

  inventoryDeductionGateContract: {
    sellerSkuRequired: true;
    skuAliasLookupRequired: true;
    unresolvedSkuAuditRequired: true;
    unresolvedSkuBlocksDeduction: true;
    quantityOrderedRequired: true;
    transactionLinkRequiredBeforeDeduction: true;
    inventoryMovementSalesShipmentRequiredInFuture: true;
    inventoryRollbackCompensationRequired: true;
    inventoryWriteForbiddenNow: true;
  };

  rollbackCompensationContract: {
    rollbackPlanRequiredBeforeCommit: true;
    importJobRollbackRequired: true;
    stagingRowRollbackRequired: true;
    transactionRollbackRequired: true;
    inventoryMovementRollbackRequired: true;
    idempotentRollbackRequired: true;
    compensationLogRequiredInFuture: true;
    partialCommitMarkedFailedInFuture: true;
    rollbackImplementationForbiddenNow: true;
  };

  unresolvedSkuAuditContract: {
    unresolvedSkuRowsCaptured: true;
    unresolvedSkuWarningsReturnedInPreview: true;
    unresolvedSkuRequiresManualMapping: true;
    unresolvedSkuCommitPolicyRequired: true;
    unresolvedSkuCanCommitWithoutInventoryOnlyInFuture: true;
    unresolvedSkuCannotDeductInventory: true;
    asinFallbackRequiresExplicitPolicy: true;
    auditWriteForbiddenNow: true;
  };

  reconciliationDeferredContract: {
    settlementReconciliationDeferred: true;
    bankReconciliationDeferred: true;
    payoutMatchingDeferred: true;
    amazonSettlementIdNullable: true;
    bankTransactionLinkDeferred: true;
    feesAndChargesSplitDeferred: true;
    shippingTaxPreservedForLater: true;
    promotionDiscountTaxPreservedForLater: true;
    reconciliationWriteForbiddenNow: true;
  };

  validationSummaryContract: {
    totalOrdersRequired: true;
    totalOrderItemsRequired: true;
    duplicateOrdersCountRequired: true;
    duplicateItemsCountRequired: true;
    unresolvedSkuCountRequired: true;
    inventoryBlockedCountRequired: true;
    transactionPreviewCountRequired: true;
    validationErrorCountRequired: true;
    warningCountRequired: true;
    commitEligibleCountRequired: true;
  };

  sampleServiceContract: {
    sampleCompanyId: 'step140-g-company';
    sampleStoreId: 'step140-g-store';
    sampleMarketplaceId: 'A1VC38T7YXB528';
    sampleRegion: 'FE';
    samplePreviewMode: 'dry-run';
    sampleCommitMode: 'explicit-confirm-required';
    expectedPreviewWritesDatabase: false;
    expectedCommitWritesDatabaseNow: false;
    expectedRollbackImplementationNow: false;
    expectedInventoryDeductionNow: false;
    expectedReconciliationNow: false;
  };

  forbiddenNow: {
    controllerRoute: true;
    frontendPanel: true;
    previewServiceImplementation: true;
    commitServiceImplementation: true;
    rollbackImplementation: true;
    compensationImplementation: true;
    importJobCreate: true;
    importJobUpdate: true;
    importStagingRowCreate: true;
    importStagingRowCreateMany: true;
    transactionCreate: true;
    transactionCreateMany: true;
    inventoryMovementCreate: true;
    inventoryMovementCreateMany: true;
    inventoryBalanceUpdate: true;
    inventoryBalanceUpsert: true;
    unresolvedSkuAuditWrite: true;
    settlementReconciliationWrite: true;
    bankReconciliationWrite: true;
    realAmazonOrdersHttpCall: true;
    realNetworkExecution: true;
    prismaSchemaChange: true;
    migrationFile: true;
  };

  summary: {
    readyForPreviewServiceImplementation: false;
    readyForCommitServiceImplementation: false;
    readyForRollbackImplementation: false;
    readyForDatabaseWrites: false;
    readyForInventoryDeduction: false;
    readyForSettlementReconciliation: false;
    readyForBankReconciliation: false;
    readyForPreviewServiceImplementationPlan: true;
    readyForDryRunRuntimeFixtureSmoke: true;
    readyForControllerRouteContract: true;
  };
};

export function buildAmazonSpApiOrdersPreviewCommitServiceContract(): AmazonSpApiOrdersPreviewCommitServiceContract {
  const sourceStep140F = assertAmazonSpApiOrdersNormalizedFixturePersistenceReadinessContract(
    buildAmazonSpApiOrdersNormalizedFixturePersistenceReadinessContract(),
  );

  return {
    version: AMAZON_SP_API_ORDERS_PREVIEW_COMMIT_SERVICE_CONTRACT_VERSION,
    sourceStep140F,

    step: 'Step140-G',
    contractOnly: true,
    implementationNow: false,
    controllerRouteAddedNow: false,
    frontendRouteAddedNow: false,
    previewServiceImplementationNow: false,
    commitServiceImplementationNow: false,
    rollbackImplementationNow: false,
    importJobWriteNow: false,
    importStagingRowWriteNow: false,
    transactionWriteNow: false,
    inventoryWriteNow: false,
    reconciliationWriteNow: false,
    schemaChangedNow: false,
    migrationAddedNow: false,
    writesDatabase: false,
    realAmazonOrdersApiCallNow: false,
    realNetworkExecutionNow: false,

    aggregateBoundary: {
      purpose: 'design-amazon-sp-api-orders-preview-commit-service-contract-aggregate-only',
      previewServiceDesignOnly: true,
      commitServiceDesignOnly: true,
      rollbackBoundaryDesignOnly: true,
      compensationBoundaryDesignOnly: true,
      importJobWriteGateDesignOnly: true,
      importStagingRowWriteGateDesignOnly: true,
      transactionCommitGateDesignOnly: true,
      inventoryDeductionGateDesignOnly: true,
      unresolvedSkuAuditGateDesignOnly: true,
      reconciliationDeferredGateDesignOnly: true,
      noDatabaseWrite: true,
      noControllerRoute: true,
      noFrontendConsumption: true,
      noAmazonNetworkExecution: true,
    },

    previewServiceContract: {
      acceptsCompanyId: true,
      acceptsStoreId: true,
      acceptsMarketplaceId: true,
      acceptsRegion: true,
      acceptsDateRange: true,
      acceptsOrderStatuses: true,
      acceptsDryRunMode: true,
      returnsNormalizedOrders: true,
      returnsNormalizedOrderItems: true,
      returnsValidationSummary: true,
      returnsDedupeSummary: true,
      returnsSkuResolutionSummary: true,
      returnsInventoryImpactPreview: true,
      returnsTransactionImpactPreview: true,
      returnsWarnings: true,
      writesNothing: true,
    },

    commitServiceContract: {
      requiresPreviewTokenOrStableSnapshotInFuture: true,
      requiresExplicitUserConfirm: true,
      requiresIdempotencyKey: true,
      requiresValidationPass: true,
      requiresSkuResolutionDecision: true,
      requiresInventoryPolicyDecision: true,
      wouldCreateImportJobInFuture: true,
      wouldCreateImportStagingRowsInFuture: true,
      wouldCreateIncomeTransactionsInFuture: true,
      wouldCreateInventoryMovementsInFuture: true,
      wouldNotRunSettlementReconciliationYet: true,
      wouldNotRunBankReconciliationYet: true,
      commitForbiddenNow: true,
    },

    executionSequenceContract: {
      sequenceValidateRequestFirst: true,
      sequenceLoadConnectionStatusSecond: true,
      sequenceFetchOrUseSnapshotThird: true,
      sequenceParseAndNormalizeFourth: true,
      sequenceDedupeFifth: true,
      sequenceSkuResolutionSixth: true,
      sequenceInventoryPreviewSeventh: true,
      sequenceTransactionPreviewEighth: true,
      sequencePersistOnlyAfterExplicitCommitNinth: true,
      sequenceInventoryAfterTransactionLink: true,
      sequenceNoPartialCommitWithoutRollbackPlan: true,
    },

    importJobWriteGateContract: {
      importJobDomainIncomeRequired: true,
      importJobModuleStoreOrdersRequired: true,
      importJobSourceTypeAmazonSpApiRequired: true,
      importJobFilenameSyntheticRequired: true,
      importJobDedupeKeyRequired: true,
      importJobStatusPreviewBeforeCommit: true,
      importJobStatusImportedAfterCommitFuture: true,
      importJobTotalRowsFromNormalizedRows: true,
      importJobSuccessRowsFromCommittedRows: true,
      importJobWriteForbiddenNow: true,
    },

    stagingRowWriteGateContract: {
      stagingRowsUseStoreOrdersModule: true,
      stagingRowsHaveStableRowNo: true,
      stagingRowsCarryBusinessMonth: true,
      stagingRowsCarryDedupeHash: true,
      stagingRowsCarryNormalizedPayloadJson: true,
      stagingRowsCarryValidationErrors: true,
      stagingRowsCarrySkuResolutionStatus: true,
      stagingRowsCarryInventoryResolutionStatus: true,
      stagingRowsLinkImportJob: true,
      stagingRowWriteForbiddenNow: true,
    },

    transactionCommitGateContract: {
      incomeTransactionRequired: true,
      creditDirectionRequired: true,
      amountFromOrderTotalRequired: true,
      currencyRequired: true,
      occurredAtFromPurchaseDateRequired: true,
      businessMonthFromPurchaseDateRequired: true,
      memoIncludesAmazonOrderId: true,
      sourceRowNoStable: true,
      dedupeHashRequired: true,
      transactionWriteForbiddenNow: true,
    },

    inventoryDeductionGateContract: {
      sellerSkuRequired: true,
      skuAliasLookupRequired: true,
      unresolvedSkuAuditRequired: true,
      unresolvedSkuBlocksDeduction: true,
      quantityOrderedRequired: true,
      transactionLinkRequiredBeforeDeduction: true,
      inventoryMovementSalesShipmentRequiredInFuture: true,
      inventoryRollbackCompensationRequired: true,
      inventoryWriteForbiddenNow: true,
    },

    rollbackCompensationContract: {
      rollbackPlanRequiredBeforeCommit: true,
      importJobRollbackRequired: true,
      stagingRowRollbackRequired: true,
      transactionRollbackRequired: true,
      inventoryMovementRollbackRequired: true,
      idempotentRollbackRequired: true,
      compensationLogRequiredInFuture: true,
      partialCommitMarkedFailedInFuture: true,
      rollbackImplementationForbiddenNow: true,
    },

    unresolvedSkuAuditContract: {
      unresolvedSkuRowsCaptured: true,
      unresolvedSkuWarningsReturnedInPreview: true,
      unresolvedSkuRequiresManualMapping: true,
      unresolvedSkuCommitPolicyRequired: true,
      unresolvedSkuCanCommitWithoutInventoryOnlyInFuture: true,
      unresolvedSkuCannotDeductInventory: true,
      asinFallbackRequiresExplicitPolicy: true,
      auditWriteForbiddenNow: true,
    },

    reconciliationDeferredContract: {
      settlementReconciliationDeferred: true,
      bankReconciliationDeferred: true,
      payoutMatchingDeferred: true,
      amazonSettlementIdNullable: true,
      bankTransactionLinkDeferred: true,
      feesAndChargesSplitDeferred: true,
      shippingTaxPreservedForLater: true,
      promotionDiscountTaxPreservedForLater: true,
      reconciliationWriteForbiddenNow: true,
    },

    validationSummaryContract: {
      totalOrdersRequired: true,
      totalOrderItemsRequired: true,
      duplicateOrdersCountRequired: true,
      duplicateItemsCountRequired: true,
      unresolvedSkuCountRequired: true,
      inventoryBlockedCountRequired: true,
      transactionPreviewCountRequired: true,
      validationErrorCountRequired: true,
      warningCountRequired: true,
      commitEligibleCountRequired: true,
    },

    sampleServiceContract: {
      sampleCompanyId: 'step140-g-company',
      sampleStoreId: 'step140-g-store',
      sampleMarketplaceId: 'A1VC38T7YXB528',
      sampleRegion: 'FE',
      samplePreviewMode: 'dry-run',
      sampleCommitMode: 'explicit-confirm-required',
      expectedPreviewWritesDatabase: false,
      expectedCommitWritesDatabaseNow: false,
      expectedRollbackImplementationNow: false,
      expectedInventoryDeductionNow: false,
      expectedReconciliationNow: false,
    },

    forbiddenNow: {
      controllerRoute: true,
      frontendPanel: true,
      previewServiceImplementation: true,
      commitServiceImplementation: true,
      rollbackImplementation: true,
      compensationImplementation: true,
      importJobCreate: true,
      importJobUpdate: true,
      importStagingRowCreate: true,
      importStagingRowCreateMany: true,
      transactionCreate: true,
      transactionCreateMany: true,
      inventoryMovementCreate: true,
      inventoryMovementCreateMany: true,
      inventoryBalanceUpdate: true,
      inventoryBalanceUpsert: true,
      unresolvedSkuAuditWrite: true,
      settlementReconciliationWrite: true,
      bankReconciliationWrite: true,
      realAmazonOrdersHttpCall: true,
      realNetworkExecution: true,
      prismaSchemaChange: true,
      migrationFile: true,
    },

    summary: {
      readyForPreviewServiceImplementation: false,
      readyForCommitServiceImplementation: false,
      readyForRollbackImplementation: false,
      readyForDatabaseWrites: false,
      readyForInventoryDeduction: false,
      readyForSettlementReconciliation: false,
      readyForBankReconciliation: false,
      readyForPreviewServiceImplementationPlan: true,
      readyForDryRunRuntimeFixtureSmoke: true,
      readyForControllerRouteContract: true,
    },
  };
}

export function assertAmazonSpApiOrdersPreviewCommitServiceContract(
  contract: AmazonSpApiOrdersPreviewCommitServiceContract,
): AmazonSpApiOrdersPreviewCommitServiceContract {
  if (contract.version !== AMAZON_SP_API_ORDERS_PREVIEW_COMMIT_SERVICE_CONTRACT_VERSION) {
    throw new Error('Step140-G orders preview commit service contract violation: version mismatch.');
  }

  assertAmazonSpApiOrdersNormalizedFixturePersistenceReadinessContract(contract.sourceStep140F);

  if (
    contract.step !== 'Step140-G' ||
    contract.contractOnly !== true ||
    contract.implementationNow !== false ||
    contract.controllerRouteAddedNow !== false ||
    contract.frontendRouteAddedNow !== false ||
    contract.previewServiceImplementationNow !== false ||
    contract.commitServiceImplementationNow !== false ||
    contract.rollbackImplementationNow !== false ||
    contract.importJobWriteNow !== false ||
    contract.importStagingRowWriteNow !== false ||
    contract.transactionWriteNow !== false ||
    contract.inventoryWriteNow !== false ||
    contract.reconciliationWriteNow !== false ||
    contract.schemaChangedNow !== false ||
    contract.migrationAddedNow !== false ||
    contract.writesDatabase !== false ||
    contract.realAmazonOrdersApiCallNow !== false ||
    contract.realNetworkExecutionNow !== false
  ) {
    throw new Error('Step140-G orders preview commit service contract violation: implementation boundary mismatch.');
  }

  if (contract.aggregateBoundary.purpose !== 'design-amazon-sp-api-orders-preview-commit-service-contract-aggregate-only') {
    throw new Error('Step140-G orders preview commit service contract violation: purpose mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    aggregateBoundary: contract.aggregateBoundary,
    previewServiceContract: contract.previewServiceContract,
    commitServiceContract: contract.commitServiceContract,
    executionSequenceContract: contract.executionSequenceContract,
    importJobWriteGateContract: contract.importJobWriteGateContract,
    stagingRowWriteGateContract: contract.stagingRowWriteGateContract,
    transactionCommitGateContract: contract.transactionCommitGateContract,
    inventoryDeductionGateContract: contract.inventoryDeductionGateContract,
    rollbackCompensationContract: contract.rollbackCompensationContract,
    unresolvedSkuAuditContract: contract.unresolvedSkuAuditContract,
    reconciliationDeferredContract: contract.reconciliationDeferredContract,
    validationSummaryContract: contract.validationSummaryContract,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (key === 'purpose') continue;
      if (value !== true) {
        throw new Error(`Step140-G orders preview commit service contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.sampleServiceContract.sampleMarketplaceId !== 'A1VC38T7YXB528' ||
    contract.sampleServiceContract.sampleRegion !== 'FE' ||
    contract.sampleServiceContract.samplePreviewMode !== 'dry-run' ||
    contract.sampleServiceContract.sampleCommitMode !== 'explicit-confirm-required' ||
    contract.sampleServiceContract.expectedPreviewWritesDatabase !== false ||
    contract.sampleServiceContract.expectedCommitWritesDatabaseNow !== false ||
    contract.sampleServiceContract.expectedRollbackImplementationNow !== false ||
    contract.sampleServiceContract.expectedInventoryDeductionNow !== false ||
    contract.sampleServiceContract.expectedReconciliationNow !== false
  ) {
    throw new Error('Step140-G orders preview commit service contract violation: sample mismatch.');
  }

  for (const [key, forbidden] of Object.entries(contract.forbiddenNow)) {
    if (forbidden !== true) {
      throw new Error(`Step140-G orders preview commit service contract violation: forbiddenNow.${key} must remain true.`);
    }
  }

  if (
    contract.summary.readyForPreviewServiceImplementation !== false ||
    contract.summary.readyForCommitServiceImplementation !== false ||
    contract.summary.readyForRollbackImplementation !== false ||
    contract.summary.readyForDatabaseWrites !== false ||
    contract.summary.readyForInventoryDeduction !== false ||
    contract.summary.readyForSettlementReconciliation !== false ||
    contract.summary.readyForBankReconciliation !== false ||
    contract.summary.readyForPreviewServiceImplementationPlan !== true ||
    contract.summary.readyForDryRunRuntimeFixtureSmoke !== true ||
    contract.summary.readyForControllerRouteContract !== true
  ) {
    throw new Error('Step140-G orders preview commit service contract violation: summary readiness mismatch.');
  }

  if (
    contract.sourceStep140F.summary.readyForOrdersApiPreviewServiceContract !== true ||
    contract.sourceStep140F.summary.readyForOrdersApiCommitServiceContract !== true
  ) {
    throw new Error('Step140-G orders preview commit service contract violation: Step140-F does not allow this aggregate contract.');
  }

  return contract;
}
