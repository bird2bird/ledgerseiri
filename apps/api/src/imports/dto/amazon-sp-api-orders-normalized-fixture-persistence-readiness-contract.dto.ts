import {
  assertAmazonSpApiOrdersApiSanitizedResponseParserContract,
  buildAmazonSpApiOrdersApiSanitizedResponseParserContract,
  type AmazonSpApiOrdersApiSanitizedResponseParserContract,
} from './amazon-sp-api-orders-api-sanitized-response-parser-contract.dto';

export const AMAZON_SP_API_ORDERS_NORMALIZED_FIXTURE_PERSISTENCE_READINESS_CONTRACT_VERSION =
  'amazon-sp-api-orders-normalized-fixture-persistence-readiness-contract-v1' as const;

export type AmazonSpApiOrdersNormalizedFixturePersistenceReadinessContract = {
  version: typeof AMAZON_SP_API_ORDERS_NORMALIZED_FIXTURE_PERSISTENCE_READINESS_CONTRACT_VERSION;
  sourceStep140E: AmazonSpApiOrdersApiSanitizedResponseParserContract;

  step: 'Step140-F';
  contractOnly: true;
  implementationNow: false;
  controllerRouteAddedNow: false;
  frontendRouteAddedNow: false;
  serviceMethodAddedNow: false;
  normalizedFixtureImplementationNow: false;
  idempotencyImplementationNow: false;
  persistenceImplementationNow: false;
  skuAliasImplementationNow: false;
  inventoryDeductionImplementationNow: false;
  transactionCommitImplementationNow: false;
  reconciliationImplementationNow: false;
  httpClientImplementationNow: false;
  realNetworkExecutionNow: false;
  realAmazonOrdersApiCallNow: false;
  importJobWriteNow: false;
  importStagingRowWriteNow: false;
  transactionWriteNow: false;
  inventoryWriteNow: false;
  schemaChangedNow: false;
  migrationAddedNow: false;
  writesDatabase: false;

  aggregateBoundary: {
    purpose: 'design-amazon-sp-api-orders-normalized-fixture-persistence-readiness-aggregate-contract-only';
    normalizedFixtureDesignOnly: true;
    idempotencyDesignOnly: true;
    persistenceReadinessDesignOnly: true;
    skuAliasReadinessDesignOnly: true;
    inventoryReadinessDesignOnly: true;
    transactionReadinessDesignOnly: true;
    reconciliationReadinessDesignOnly: true;
    noDatabaseReadOrWrite: true;
    noImportExecution: true;
    noInventoryExecution: true;
    noTransactionCommit: true;
    noAmazonNetworkExecution: true;
  };

  normalizedOrderFixtureContract: {
    fixtureNameRequired: true;
    sourceTypeAmazonSpApiRequired: true;
    marketplaceIdRequired: true;
    regionRequired: true;
    amazonOrderIdRequired: true;
    purchaseDateRequired: true;
    businessMonthRequired: true;
    orderStatusRequired: true;
    fulfillmentChannelNullable: true;
    salesChannelNullable: true;
    currencyCodeRequired: true;
    orderTotalAmountNullable: true;
    itemCountRequired: true;
    dedupeHashRequired: true;
    normalizedPayloadJsonShapeRequired: true;
    rawPayloadForbidden: true;
    buyerPiiForbidden: true;
    shippingAddressForbidden: true;
  };

  normalizedOrderItemFixtureContract: {
    amazonOrderIdRequired: true;
    orderItemIdRequired: true;
    asinRequired: true;
    sellerSkuRequired: true;
    titleNullable: true;
    quantityOrderedRequired: true;
    quantityOrderedPositiveIntegerRequired: true;
    itemPriceAmountNullable: true;
    itemTaxAmountNullable: true;
    shippingPriceAmountNullable: true;
    shippingTaxAmountNullable: true;
    promotionDiscountAmountNullable: true;
    promotionDiscountTaxAmountNullable: true;
    itemCurrencyCodeRequired: true;
    itemLevelDedupeHashRequired: true;
    rawPayloadForbidden: true;
  };

  idempotencyContract: {
    importJobDedupeKeyRequired: true;
    importJobDedupeKeyIncludesCompanyId: true;
    importJobDedupeKeyIncludesStoreId: true;
    importJobDedupeKeyIncludesMarketplaceId: true;
    importJobDedupeKeyIncludesRegion: true;
    importJobDedupeKeyIncludesDateRange: true;
    orderDedupeHashFromAmazonOrderIdRequired: true;
    orderItemDedupeHashFromAmazonOrderIdAndOrderItemIdRequired: true;
    duplicateOrdersMustBeSkippedInFuture: true;
    duplicateItemsMustBeSkippedInFuture: true;
    replaceExistingModeRequiresExplicitUserAction: true;
    noImplicitOverwrite: true;
  };

  importJobPersistenceReadinessContract: {
    domainWouldBeIncomeInFuture: true;
    moduleWouldBeStoreOrdersInFuture: true;
    sourceTypeWouldBeAmazonSpApiInFuture: true;
    filenameSyntheticRequiredInFuture: true;
    statusWouldStartPendingOrPreviewInFuture: true;
    totalRowsWouldEqualNormalizedRowsInFuture: true;
    successRowsDeferredUntilCommit: true;
    failedRowsRequiresValidationResult: true;
    importedAtDeferredUntilCommit: true;
    persistenceForbiddenNow: true;
  };

  stagingRowPersistenceReadinessContract: {
    importStagingRowModuleStoreOrdersRequiredInFuture: true;
    rowNoStableRequired: true;
    businessMonthRequired: true;
    matchStatusRequired: true;
    dedupeHashRequired: true;
    normalizedPayloadJsonRequired: true;
    validationErrorsArrayRequired: true;
    skuResolutionStatusRequired: true;
    inventoryResolutionStatusRequired: true;
    persistenceForbiddenNow: true;
  };

  transactionCommitReadinessContract: {
    transactionTypeIncomeRequiredInFuture: true;
    transactionDirectionCreditRequiredInFuture: true;
    amountFromOrderTotalOrItemAggregationRequired: true;
    currencyRequired: true;
    occurredAtFromPurchaseDateRequired: true;
    businessMonthFromPurchaseDateRequired: true;
    storeIdRequired: true;
    companyIdRequired: true;
    sourceFileNameSyntheticRequired: true;
    sourceRowNoStableRequired: true;
    memoIncludesAmazonOrderIdRequired: true;
    commitForbiddenNow: true;
  };

  skuAliasInventoryReadinessContract: {
    sellerSkuRequiredForInventoryMatching: true;
    asinFallbackDesignOnly: true;
    skuAliasLookupRequiredBeforeDeduction: true;
    requiresSkuAliasContractBeforeInventory: true;
    unresolvedSkuAuditRequired: true;
    unresolvedSkuMustNotDeductInventory: true;
    quantityOrderedRequiredForDeduction: true;
    inventoryMovementWouldBeSalesShipmentInFuture: true;
    inventoryDeductionRequiresTransactionCommitLink: true;
    inventoryCompensationRequiresRollbackContract: true;
    deductionForbiddenNow: true;
  };

  reconciliationReadinessContract: {
    settlementReconciliationDeferred: true;
    bankReconciliationDeferred: true;
    amazonSettlementIdNullable: true;
    bankTransactionLinkDeferred: true;
    feesAndChargesSplitDeferred: true;
    shippingTaxFieldPreserved: true;
    promotionDiscountTaxFieldPreserved: true;
    payoutMatchingRequiresLaterSettlementStep: true;
    cashTransactionExceptionNotApplicable: true;
  };

  validationGateContract: {
    dateRangeRequired: true;
    marketplaceRequired: true;
    regionRequired: true;
    orderStatusAllowedListRequired: true;
    missingAmazonOrderIdRejectedInFuture: true;
    missingPurchaseDateRejectedInFuture: true;
    missingSellerSkuWarnsInFuture: true;
    missingQuantityRejectedForInventoryInFuture: true;
    nonPositiveQuantityRejectedForInventoryInFuture: true;
    invalidCurrencyRejectedInFuture: true;
    piiPresenceRejectedInFuture: true;
  };

  sampleAggregateFixtureContract: {
    sampleCompanyId: 'step140-f-company';
    sampleStoreId: 'step140-f-store';
    sampleRegion: 'FE';
    sampleMarketplaceId: 'A1VC38T7YXB528';
    sampleAmazonOrderId: 'ORDER-STEP140-F-SAMPLE';
    sampleOrderItemId: 'ITEM-STEP140-F-SAMPLE';
    sampleSellerSku: 'SKU-STEP140-F-SAMPLE';
    sampleAsin: 'B0STEP140F';
    sampleBusinessMonth: '2026-05';
    sampleCurrencyCode: 'JPY';
    expectedOrderDedupeHash: 'amazon-sp-api:order:ORDER-STEP140-F-SAMPLE';
    expectedItemDedupeHash: 'amazon-sp-api:item:ORDER-STEP140-F-SAMPLE:ITEM-STEP140-F-SAMPLE';
    expectedPersistenceNow: false;
    expectedInventoryDeductionNow: false;
    expectedTransactionCommitNow: false;
  };

  forbiddenNow: {
    controllerRoute: true;
    frontendPanel: true;
    serviceMethodImplementation: true;
    normalizedFixtureImplementation: true;
    idempotencyImplementation: true;
    persistenceImplementation: true;
    skuAliasImplementation: true;
    inventoryDeductionImplementation: true;
    transactionCommitImplementation: true;
    reconciliationImplementation: true;
    httpClientImplementation: true;
    realNetworkExecution: true;
    realAmazonOrdersHttpCall: true;
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
    settlementReconciliationWrite: true;
    bankReconciliationWrite: true;
    prismaSchemaChange: true;
    migrationFile: true;
  };

  summary: {
    readyForNormalizedFixtureImplementation: false;
    readyForPersistenceImplementation: false;
    readyForImportJobPersistence: false;
    readyForStagingRowPersistence: false;
    readyForTransactionCommit: false;
    readyForInventoryDeduction: false;
    readyForSettlementReconciliation: false;
    readyForBankReconciliation: false;
    readyForOrdersApiPersistenceDesignImplementationPlan: true;
    readyForOrdersApiPreviewServiceContract: true;
    readyForOrdersApiCommitServiceContract: true;
  };
};

export function buildAmazonSpApiOrdersNormalizedFixturePersistenceReadinessContract(): AmazonSpApiOrdersNormalizedFixturePersistenceReadinessContract {
  const sourceStep140E = assertAmazonSpApiOrdersApiSanitizedResponseParserContract(
    buildAmazonSpApiOrdersApiSanitizedResponseParserContract(),
  );

  return {
    version: AMAZON_SP_API_ORDERS_NORMALIZED_FIXTURE_PERSISTENCE_READINESS_CONTRACT_VERSION,
    sourceStep140E,

    step: 'Step140-F',
    contractOnly: true,
    implementationNow: false,
    controllerRouteAddedNow: false,
    frontendRouteAddedNow: false,
    serviceMethodAddedNow: false,
    normalizedFixtureImplementationNow: false,
    idempotencyImplementationNow: false,
    persistenceImplementationNow: false,
    skuAliasImplementationNow: false,
    inventoryDeductionImplementationNow: false,
    transactionCommitImplementationNow: false,
    reconciliationImplementationNow: false,
    httpClientImplementationNow: false,
    realNetworkExecutionNow: false,
    realAmazonOrdersApiCallNow: false,
    importJobWriteNow: false,
    importStagingRowWriteNow: false,
    transactionWriteNow: false,
    inventoryWriteNow: false,
    schemaChangedNow: false,
    migrationAddedNow: false,
    writesDatabase: false,

    aggregateBoundary: {
      purpose: 'design-amazon-sp-api-orders-normalized-fixture-persistence-readiness-aggregate-contract-only',
      normalizedFixtureDesignOnly: true,
      idempotencyDesignOnly: true,
      persistenceReadinessDesignOnly: true,
      skuAliasReadinessDesignOnly: true,
      inventoryReadinessDesignOnly: true,
      transactionReadinessDesignOnly: true,
      reconciliationReadinessDesignOnly: true,
      noDatabaseReadOrWrite: true,
      noImportExecution: true,
      noInventoryExecution: true,
      noTransactionCommit: true,
      noAmazonNetworkExecution: true,
    },

    normalizedOrderFixtureContract: {
      fixtureNameRequired: true,
      sourceTypeAmazonSpApiRequired: true,
      marketplaceIdRequired: true,
      regionRequired: true,
      amazonOrderIdRequired: true,
      purchaseDateRequired: true,
      businessMonthRequired: true,
      orderStatusRequired: true,
      fulfillmentChannelNullable: true,
      salesChannelNullable: true,
      currencyCodeRequired: true,
      orderTotalAmountNullable: true,
      itemCountRequired: true,
      dedupeHashRequired: true,
      normalizedPayloadJsonShapeRequired: true,
      rawPayloadForbidden: true,
      buyerPiiForbidden: true,
      shippingAddressForbidden: true,
    },

    normalizedOrderItemFixtureContract: {
      amazonOrderIdRequired: true,
      orderItemIdRequired: true,
      asinRequired: true,
      sellerSkuRequired: true,
      titleNullable: true,
      quantityOrderedRequired: true,
      quantityOrderedPositiveIntegerRequired: true,
      itemPriceAmountNullable: true,
      itemTaxAmountNullable: true,
      shippingPriceAmountNullable: true,
      shippingTaxAmountNullable: true,
      promotionDiscountAmountNullable: true,
      promotionDiscountTaxAmountNullable: true,
      itemCurrencyCodeRequired: true,
      itemLevelDedupeHashRequired: true,
      rawPayloadForbidden: true,
    },

    idempotencyContract: {
      importJobDedupeKeyRequired: true,
      importJobDedupeKeyIncludesCompanyId: true,
      importJobDedupeKeyIncludesStoreId: true,
      importJobDedupeKeyIncludesMarketplaceId: true,
      importJobDedupeKeyIncludesRegion: true,
      importJobDedupeKeyIncludesDateRange: true,
      orderDedupeHashFromAmazonOrderIdRequired: true,
      orderItemDedupeHashFromAmazonOrderIdAndOrderItemIdRequired: true,
      duplicateOrdersMustBeSkippedInFuture: true,
      duplicateItemsMustBeSkippedInFuture: true,
      replaceExistingModeRequiresExplicitUserAction: true,
      noImplicitOverwrite: true,
    },

    importJobPersistenceReadinessContract: {
      domainWouldBeIncomeInFuture: true,
      moduleWouldBeStoreOrdersInFuture: true,
      sourceTypeWouldBeAmazonSpApiInFuture: true,
      filenameSyntheticRequiredInFuture: true,
      statusWouldStartPendingOrPreviewInFuture: true,
      totalRowsWouldEqualNormalizedRowsInFuture: true,
      successRowsDeferredUntilCommit: true,
      failedRowsRequiresValidationResult: true,
      importedAtDeferredUntilCommit: true,
      persistenceForbiddenNow: true,
    },

    stagingRowPersistenceReadinessContract: {
      importStagingRowModuleStoreOrdersRequiredInFuture: true,
      rowNoStableRequired: true,
      businessMonthRequired: true,
      matchStatusRequired: true,
      dedupeHashRequired: true,
      normalizedPayloadJsonRequired: true,
      validationErrorsArrayRequired: true,
      skuResolutionStatusRequired: true,
      inventoryResolutionStatusRequired: true,
      persistenceForbiddenNow: true,
    },

    transactionCommitReadinessContract: {
      transactionTypeIncomeRequiredInFuture: true,
      transactionDirectionCreditRequiredInFuture: true,
      amountFromOrderTotalOrItemAggregationRequired: true,
      currencyRequired: true,
      occurredAtFromPurchaseDateRequired: true,
      businessMonthFromPurchaseDateRequired: true,
      storeIdRequired: true,
      companyIdRequired: true,
      sourceFileNameSyntheticRequired: true,
      sourceRowNoStableRequired: true,
      memoIncludesAmazonOrderIdRequired: true,
      commitForbiddenNow: true,
    },

    skuAliasInventoryReadinessContract: {
      sellerSkuRequiredForInventoryMatching: true,
      asinFallbackDesignOnly: true,
      skuAliasLookupRequiredBeforeDeduction: true,
      requiresSkuAliasContractBeforeInventory: true,
      unresolvedSkuAuditRequired: true,
      unresolvedSkuMustNotDeductInventory: true,
      quantityOrderedRequiredForDeduction: true,
      inventoryMovementWouldBeSalesShipmentInFuture: true,
      inventoryDeductionRequiresTransactionCommitLink: true,
      inventoryCompensationRequiresRollbackContract: true,
      deductionForbiddenNow: true,
    },

    reconciliationReadinessContract: {
      settlementReconciliationDeferred: true,
      bankReconciliationDeferred: true,
      amazonSettlementIdNullable: true,
      bankTransactionLinkDeferred: true,
      feesAndChargesSplitDeferred: true,
      shippingTaxFieldPreserved: true,
      promotionDiscountTaxFieldPreserved: true,
      payoutMatchingRequiresLaterSettlementStep: true,
      cashTransactionExceptionNotApplicable: true,
    },

    validationGateContract: {
      dateRangeRequired: true,
      marketplaceRequired: true,
      regionRequired: true,
      orderStatusAllowedListRequired: true,
      missingAmazonOrderIdRejectedInFuture: true,
      missingPurchaseDateRejectedInFuture: true,
      missingSellerSkuWarnsInFuture: true,
      missingQuantityRejectedForInventoryInFuture: true,
      nonPositiveQuantityRejectedForInventoryInFuture: true,
      invalidCurrencyRejectedInFuture: true,
      piiPresenceRejectedInFuture: true,
    },

    sampleAggregateFixtureContract: {
      sampleCompanyId: 'step140-f-company',
      sampleStoreId: 'step140-f-store',
      sampleRegion: 'FE',
      sampleMarketplaceId: 'A1VC38T7YXB528',
      sampleAmazonOrderId: 'ORDER-STEP140-F-SAMPLE',
      sampleOrderItemId: 'ITEM-STEP140-F-SAMPLE',
      sampleSellerSku: 'SKU-STEP140-F-SAMPLE',
      sampleAsin: 'B0STEP140F',
      sampleBusinessMonth: '2026-05',
      sampleCurrencyCode: 'JPY',
      expectedOrderDedupeHash: 'amazon-sp-api:order:ORDER-STEP140-F-SAMPLE',
      expectedItemDedupeHash: 'amazon-sp-api:item:ORDER-STEP140-F-SAMPLE:ITEM-STEP140-F-SAMPLE',
      expectedPersistenceNow: false,
      expectedInventoryDeductionNow: false,
      expectedTransactionCommitNow: false,
    },

    forbiddenNow: {
      controllerRoute: true,
      frontendPanel: true,
      serviceMethodImplementation: true,
      normalizedFixtureImplementation: true,
      idempotencyImplementation: true,
      persistenceImplementation: true,
      skuAliasImplementation: true,
      inventoryDeductionImplementation: true,
      transactionCommitImplementation: true,
      reconciliationImplementation: true,
      httpClientImplementation: true,
      realNetworkExecution: true,
      realAmazonOrdersHttpCall: true,
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
      settlementReconciliationWrite: true,
      bankReconciliationWrite: true,
      prismaSchemaChange: true,
      migrationFile: true,
    },

    summary: {
      readyForNormalizedFixtureImplementation: false,
      readyForPersistenceImplementation: false,
      readyForImportJobPersistence: false,
      readyForStagingRowPersistence: false,
      readyForTransactionCommit: false,
      readyForInventoryDeduction: false,
      readyForSettlementReconciliation: false,
      readyForBankReconciliation: false,
      readyForOrdersApiPersistenceDesignImplementationPlan: true,
      readyForOrdersApiPreviewServiceContract: true,
      readyForOrdersApiCommitServiceContract: true,
    },
  };
}

export function assertAmazonSpApiOrdersNormalizedFixturePersistenceReadinessContract(
  contract: AmazonSpApiOrdersNormalizedFixturePersistenceReadinessContract,
): AmazonSpApiOrdersNormalizedFixturePersistenceReadinessContract {
  if (contract.version !== AMAZON_SP_API_ORDERS_NORMALIZED_FIXTURE_PERSISTENCE_READINESS_CONTRACT_VERSION) {
    throw new Error('Step140-F orders normalized fixture persistence readiness contract violation: version mismatch.');
  }

  assertAmazonSpApiOrdersApiSanitizedResponseParserContract(contract.sourceStep140E);

  if (
    contract.step !== 'Step140-F' ||
    contract.contractOnly !== true ||
    contract.implementationNow !== false ||
    contract.controllerRouteAddedNow !== false ||
    contract.frontendRouteAddedNow !== false ||
    contract.serviceMethodAddedNow !== false ||
    contract.normalizedFixtureImplementationNow !== false ||
    contract.idempotencyImplementationNow !== false ||
    contract.persistenceImplementationNow !== false ||
    contract.skuAliasImplementationNow !== false ||
    contract.inventoryDeductionImplementationNow !== false ||
    contract.transactionCommitImplementationNow !== false ||
    contract.reconciliationImplementationNow !== false ||
    contract.httpClientImplementationNow !== false ||
    contract.realNetworkExecutionNow !== false ||
    contract.realAmazonOrdersApiCallNow !== false ||
    contract.importJobWriteNow !== false ||
    contract.importStagingRowWriteNow !== false ||
    contract.transactionWriteNow !== false ||
    contract.inventoryWriteNow !== false ||
    contract.schemaChangedNow !== false ||
    contract.migrationAddedNow !== false ||
    contract.writesDatabase !== false
  ) {
    throw new Error('Step140-F orders normalized fixture persistence readiness contract violation: implementation boundary mismatch.');
  }

  if (contract.aggregateBoundary.purpose !== 'design-amazon-sp-api-orders-normalized-fixture-persistence-readiness-aggregate-contract-only') {
    throw new Error('Step140-F orders normalized fixture persistence readiness contract violation: purpose mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    aggregateBoundary: contract.aggregateBoundary,
    normalizedOrderFixtureContract: contract.normalizedOrderFixtureContract,
    normalizedOrderItemFixtureContract: contract.normalizedOrderItemFixtureContract,
    idempotencyContract: contract.idempotencyContract,
    importJobPersistenceReadinessContract: contract.importJobPersistenceReadinessContract,
    stagingRowPersistenceReadinessContract: contract.stagingRowPersistenceReadinessContract,
    transactionCommitReadinessContract: contract.transactionCommitReadinessContract,
    skuAliasInventoryReadinessContract: contract.skuAliasInventoryReadinessContract,
    reconciliationReadinessContract: contract.reconciliationReadinessContract,
    validationGateContract: contract.validationGateContract,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (key === 'purpose') continue;
      if (value !== true) {
        throw new Error(`Step140-F orders normalized fixture persistence readiness contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.sampleAggregateFixtureContract.sampleMarketplaceId !== 'A1VC38T7YXB528' ||
    contract.sampleAggregateFixtureContract.sampleCurrencyCode !== 'JPY' ||
    contract.sampleAggregateFixtureContract.expectedOrderDedupeHash !== 'amazon-sp-api:order:ORDER-STEP140-F-SAMPLE' ||
    contract.sampleAggregateFixtureContract.expectedItemDedupeHash !== 'amazon-sp-api:item:ORDER-STEP140-F-SAMPLE:ITEM-STEP140-F-SAMPLE' ||
    contract.sampleAggregateFixtureContract.expectedPersistenceNow !== false ||
    contract.sampleAggregateFixtureContract.expectedInventoryDeductionNow !== false ||
    contract.sampleAggregateFixtureContract.expectedTransactionCommitNow !== false
  ) {
    throw new Error('Step140-F orders normalized fixture persistence readiness contract violation: sample mismatch.');
  }

  for (const [key, forbidden] of Object.entries(contract.forbiddenNow)) {
    if (forbidden !== true) {
      throw new Error(`Step140-F orders normalized fixture persistence readiness contract violation: forbiddenNow.${key} must remain true.`);
    }
  }

  if (
    contract.summary.readyForNormalizedFixtureImplementation !== false ||
    contract.summary.readyForPersistenceImplementation !== false ||
    contract.summary.readyForImportJobPersistence !== false ||
    contract.summary.readyForStagingRowPersistence !== false ||
    contract.summary.readyForTransactionCommit !== false ||
    contract.summary.readyForInventoryDeduction !== false ||
    contract.summary.readyForSettlementReconciliation !== false ||
    contract.summary.readyForBankReconciliation !== false ||
    contract.summary.readyForOrdersApiPersistenceDesignImplementationPlan !== true ||
    contract.summary.readyForOrdersApiPreviewServiceContract !== true ||
    contract.summary.readyForOrdersApiCommitServiceContract !== true
  ) {
    throw new Error('Step140-F orders normalized fixture persistence readiness contract violation: summary readiness mismatch.');
  }

  if (
    contract.sourceStep140E.summary.readyForOrdersApiNormalizedFixtureContract !== true ||
    contract.sourceStep140E.summary.readyForOrdersApiPersistenceReadinessContract !== true
  ) {
    throw new Error('Step140-F orders normalized fixture persistence readiness contract violation: Step140-E does not allow this aggregate contract.');
  }

  return contract;
}
