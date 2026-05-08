import {
  assertAmazonSpApiTokenPersistenceRuntimeSmokeRecordHandoffContract,
  buildAmazonSpApiTokenPersistenceRuntimeSmokeRecordHandoffContract,
  type AmazonSpApiTokenPersistenceRuntimeSmokeRecordHandoffContract,
} from './amazon-sp-api-token-persistence-runtime-smoke-record-handoff-contract.dto';

export const AMAZON_SP_API_OAUTH_STATE_PERSISTENCE_BRIDGE_PREIMPLEMENTATION_CONTRACT_VERSION =
  'amazon-sp-api-oauth-state-persistence-bridge-preimplementation-contract-v1' as const;

export type AmazonSpApiOauthStatePersistenceBridgePreimplementationContract = {
  version: typeof AMAZON_SP_API_OAUTH_STATE_PERSISTENCE_BRIDGE_PREIMPLEMENTATION_CONTRACT_VERSION;
  sourceStep125D: AmazonSpApiTokenPersistenceRuntimeSmokeRecordHandoffContract;

  contractOnly: true;
  preImplementationOnly: true;
  bridgeDesignOnlyNow: true;

  oauthCallbackRouteAddedNow: false;
  authorizationRouteAddedNow: false;
  tokenExchangeHttpCallNow: false;
  lwaHttpCallNow: false;
  tokenPersistenceDatabaseWriteNow: false;
  frontendAddedNow: false;
  realSpApiRequestNow: false;
  importJobWriteNow: false;
  transactionWriteNow: false;
  inventoryWriteNow: false;

  bridgeInputsAvailable: {
    authorizationUrlBuilderImplementationPreflight: true;
    oauthStateSigningImplementationPreflight: true;
    callbackQueryValidatorImplementationPreflight: true;
    tokenPersistenceServiceRuntimeVerified: true;
    tokenPersistenceHandoffCompleted: true;
  };

  oauthStatePayloadPlan: {
    companyId: true;
    storeId: true;
    marketplaceId: true;
    region: true;
    appId: true;
    nonce: true;
    issuedAt: true;
    expiresAt: true;
    returnTo: true;
    stateVersion: true;
  };

  callbackToPersistenceMappingPlan: {
    callbackStateCompanyIdMapsToTokenPersistenceCompanyId: true;
    callbackStateStoreIdMapsToTokenPersistenceStoreId: true;
    callbackStateMarketplaceIdMapsToTokenPersistenceMarketplaceId: true;
    callbackStateRegionMapsToTokenPersistenceRegion: true;
    callbackStateAppIdMapsToTokenPersistenceAppId: true;
    sellingPartnerIdFromCallbackOrTokenResponseMapsToPersistenceInput: true;
    refreshTokenFromTokenExchangeMustBeEncryptedBeforePersistence: true;
    accessTokenFromTokenExchangeMustBeEncryptedBeforeCachePersistence: true;
  };

  validationBoundaryPlan: {
    signedStateRequired: true;
    stateSignatureMustVerifyBeforeCallbackUse: true;
    stateExpiryMustBeChecked: true;
    stateNonceMustBeChecked: true;
    callbackErrorMustShortCircuitBeforeTokenExchange: true;
    callbackCodeRequiredBeforeTokenExchange: true;
    callbackSellingPartnerIdRequiredBeforePersistence: true;
    companyIdMustExistBeforePersistence: true;
    storeIdMustBelongToCompanyBeforePersistence: true;
    marketplaceRegionMustMatchStateBeforePersistence: true;
    appIdMustMatchStateBeforePersistence: true;
  };

  errorBoundaryPlan: {
    invalidStateSignature: true;
    expiredState: true;
    replayedOrMissingNonce: true;
    callbackErrorReturnedByAmazon: true;
    missingAuthorizationCode: true;
    missingSellingPartnerId: true;
    companyNotFound: true;
    storeNotFound: true;
    storeCompanyMismatch: true;
    marketplaceMismatch: true;
    regionMismatch: true;
    appIdMismatch: true;
    tokenEncryptionFailed: true;
    tokenPersistenceFailed: true;
  };

  auditPlan: {
    oauthStateIssued: true;
    oauthStateValidated: true;
    oauthCallbackRejected: true;
    oauthCallbackAcceptedForTokenExchange: true;
    tokenPersistencePlannedAfterSuccessfulTokenExchange: true;
    auditMessageMustBeRedacted: true;
    noPlaintextAuthorizationCodeInAudit: true;
    noPlaintextRefreshTokenInAudit: true;
    noPlaintextAccessTokenInAudit: true;
  };

  persistenceBridgeOutputPlan: {
    sanitizedConnectionStatusReadModel: true;
    connectionIdReturnedAfterPersistence: true;
    statusReturnedAfterPersistence: true;
    marketplaceIdReturnedAfterPersistence: true;
    regionReturnedAfterPersistence: true;
    storeIdReturnedAfterPersistence: true;
    noAuthorizationCodeReturned: true;
    noRefreshTokenReturned: true;
    noAccessTokenReturned: true;
    noEncryptedTokenReturnedToFrontend: true;
  };

  stillForbidden: {
    oauthCallbackRouteImplementation: true;
    authorizationRouteImplementation: true;
    lwaTokenExchangeHttpCall: true;
    tokenPersistenceDatabaseWriteFromBridge: true;
    realAmazonSpApiHttpCall: true;
    frontendConnectionPanel: true;
    committedSalesImport: true;
    inventoryExecution: true;
  };

  nextAllowedWork: {
    oauthStatePersistenceBridgeImplementation: true;
    oauthCallbackRouteImplementation: false;
    authorizationRouteImplementation: false;
    tokenExchangeHttpImplementation: false;
    frontendConnectionPanelImplementation: false;
    realSpApiReportRequestImplementation: false;
  };

  summary: {
    readyForStep126BOauthStatePersistenceBridgeImplementation: true;
    readyForOauthCallbackRouteImplementation: false;
    readyForAuthorizationRouteImplementation: false;
    readyForTokenExchangeHttpImplementation: false;
    readyForFrontendConnectionPanelImplementation: false;
    readyForRealSpApiReportRequest: false;
    readyForCommittedSalesImport: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiOauthStatePersistenceBridgePreimplementationContract(): AmazonSpApiOauthStatePersistenceBridgePreimplementationContract {
  const step125D = assertAmazonSpApiTokenPersistenceRuntimeSmokeRecordHandoffContract(
    buildAmazonSpApiTokenPersistenceRuntimeSmokeRecordHandoffContract(),
  );

  return {
    version: AMAZON_SP_API_OAUTH_STATE_PERSISTENCE_BRIDGE_PREIMPLEMENTATION_CONTRACT_VERSION,
    sourceStep125D: step125D,

    contractOnly: true,
    preImplementationOnly: true,
    bridgeDesignOnlyNow: true,

    oauthCallbackRouteAddedNow: false,
    authorizationRouteAddedNow: false,
    tokenExchangeHttpCallNow: false,
    lwaHttpCallNow: false,
    tokenPersistenceDatabaseWriteNow: false,
    frontendAddedNow: false,
    realSpApiRequestNow: false,
    importJobWriteNow: false,
    transactionWriteNow: false,
    inventoryWriteNow: false,

    bridgeInputsAvailable: {
      authorizationUrlBuilderImplementationPreflight: true,
      oauthStateSigningImplementationPreflight: true,
      callbackQueryValidatorImplementationPreflight: true,
      tokenPersistenceServiceRuntimeVerified: true,
      tokenPersistenceHandoffCompleted: true,
    },

    oauthStatePayloadPlan: {
      companyId: true,
      storeId: true,
      marketplaceId: true,
      region: true,
      appId: true,
      nonce: true,
      issuedAt: true,
      expiresAt: true,
      returnTo: true,
      stateVersion: true,
    },

    callbackToPersistenceMappingPlan: {
      callbackStateCompanyIdMapsToTokenPersistenceCompanyId: true,
      callbackStateStoreIdMapsToTokenPersistenceStoreId: true,
      callbackStateMarketplaceIdMapsToTokenPersistenceMarketplaceId: true,
      callbackStateRegionMapsToTokenPersistenceRegion: true,
      callbackStateAppIdMapsToTokenPersistenceAppId: true,
      sellingPartnerIdFromCallbackOrTokenResponseMapsToPersistenceInput: true,
      refreshTokenFromTokenExchangeMustBeEncryptedBeforePersistence: true,
      accessTokenFromTokenExchangeMustBeEncryptedBeforeCachePersistence: true,
    },

    validationBoundaryPlan: {
      signedStateRequired: true,
      stateSignatureMustVerifyBeforeCallbackUse: true,
      stateExpiryMustBeChecked: true,
      stateNonceMustBeChecked: true,
      callbackErrorMustShortCircuitBeforeTokenExchange: true,
      callbackCodeRequiredBeforeTokenExchange: true,
      callbackSellingPartnerIdRequiredBeforePersistence: true,
      companyIdMustExistBeforePersistence: true,
      storeIdMustBelongToCompanyBeforePersistence: true,
      marketplaceRegionMustMatchStateBeforePersistence: true,
      appIdMustMatchStateBeforePersistence: true,
    },

    errorBoundaryPlan: {
      invalidStateSignature: true,
      expiredState: true,
      replayedOrMissingNonce: true,
      callbackErrorReturnedByAmazon: true,
      missingAuthorizationCode: true,
      missingSellingPartnerId: true,
      companyNotFound: true,
      storeNotFound: true,
      storeCompanyMismatch: true,
      marketplaceMismatch: true,
      regionMismatch: true,
      appIdMismatch: true,
      tokenEncryptionFailed: true,
      tokenPersistenceFailed: true,
    },

    auditPlan: {
      oauthStateIssued: true,
      oauthStateValidated: true,
      oauthCallbackRejected: true,
      oauthCallbackAcceptedForTokenExchange: true,
      tokenPersistencePlannedAfterSuccessfulTokenExchange: true,
      auditMessageMustBeRedacted: true,
      noPlaintextAuthorizationCodeInAudit: true,
      noPlaintextRefreshTokenInAudit: true,
      noPlaintextAccessTokenInAudit: true,
    },

    persistenceBridgeOutputPlan: {
      sanitizedConnectionStatusReadModel: true,
      connectionIdReturnedAfterPersistence: true,
      statusReturnedAfterPersistence: true,
      marketplaceIdReturnedAfterPersistence: true,
      regionReturnedAfterPersistence: true,
      storeIdReturnedAfterPersistence: true,
      noAuthorizationCodeReturned: true,
      noRefreshTokenReturned: true,
      noAccessTokenReturned: true,
      noEncryptedTokenReturnedToFrontend: true,
    },

    stillForbidden: {
      oauthCallbackRouteImplementation: true,
      authorizationRouteImplementation: true,
      lwaTokenExchangeHttpCall: true,
      tokenPersistenceDatabaseWriteFromBridge: true,
      realAmazonSpApiHttpCall: true,
      frontendConnectionPanel: true,
      committedSalesImport: true,
      inventoryExecution: true,
    },

    nextAllowedWork: {
      oauthStatePersistenceBridgeImplementation: true,
      oauthCallbackRouteImplementation: false,
      authorizationRouteImplementation: false,
      tokenExchangeHttpImplementation: false,
      frontendConnectionPanelImplementation: false,
      realSpApiReportRequestImplementation: false,
    },

    summary: {
      readyForStep126BOauthStatePersistenceBridgeImplementation: true,
      readyForOauthCallbackRouteImplementation: false,
      readyForAuthorizationRouteImplementation: false,
      readyForTokenExchangeHttpImplementation: false,
      readyForFrontendConnectionPanelImplementation: false,
      readyForRealSpApiReportRequest: false,
      readyForCommittedSalesImport: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiOauthStatePersistenceBridgePreimplementationContract(
  contract: AmazonSpApiOauthStatePersistenceBridgePreimplementationContract,
): AmazonSpApiOauthStatePersistenceBridgePreimplementationContract {
  if (contract.version !== AMAZON_SP_API_OAUTH_STATE_PERSISTENCE_BRIDGE_PREIMPLEMENTATION_CONTRACT_VERSION) {
    throw new Error('Step126-A OAuth state persistence bridge preimplementation contract violation: version mismatch.');
  }

  assertAmazonSpApiTokenPersistenceRuntimeSmokeRecordHandoffContract(contract.sourceStep125D);

  if (
    contract.contractOnly !== true ||
    contract.preImplementationOnly !== true ||
    contract.bridgeDesignOnlyNow !== true ||
    contract.oauthCallbackRouteAddedNow !== false ||
    contract.authorizationRouteAddedNow !== false ||
    contract.tokenExchangeHttpCallNow !== false ||
    contract.lwaHttpCallNow !== false ||
    contract.tokenPersistenceDatabaseWriteNow !== false ||
    contract.frontendAddedNow !== false ||
    contract.realSpApiRequestNow !== false ||
    contract.importJobWriteNow !== false ||
    contract.transactionWriteNow !== false ||
    contract.inventoryWriteNow !== false
  ) {
    throw new Error('Step126-A OAuth state persistence bridge preimplementation contract violation: boundary mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    bridgeInputsAvailable: contract.bridgeInputsAvailable,
    oauthStatePayloadPlan: contract.oauthStatePayloadPlan,
    callbackToPersistenceMappingPlan: contract.callbackToPersistenceMappingPlan,
    validationBoundaryPlan: contract.validationBoundaryPlan,
    errorBoundaryPlan: contract.errorBoundaryPlan,
    auditPlan: contract.auditPlan,
    persistenceBridgeOutputPlan: contract.persistenceBridgeOutputPlan,
    stillForbidden: contract.stillForbidden,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (value !== true) {
        throw new Error(`Step126-A OAuth state persistence bridge preimplementation contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.nextAllowedWork.oauthStatePersistenceBridgeImplementation !== true ||
    contract.nextAllowedWork.oauthCallbackRouteImplementation !== false ||
    contract.nextAllowedWork.authorizationRouteImplementation !== false ||
    contract.nextAllowedWork.tokenExchangeHttpImplementation !== false ||
    contract.nextAllowedWork.frontendConnectionPanelImplementation !== false ||
    contract.nextAllowedWork.realSpApiReportRequestImplementation !== false ||
    contract.summary.readyForStep126BOauthStatePersistenceBridgeImplementation !== true ||
    contract.summary.readyForOauthCallbackRouteImplementation !== false ||
    contract.summary.readyForAuthorizationRouteImplementation !== false ||
    contract.summary.readyForTokenExchangeHttpImplementation !== false ||
    contract.summary.readyForFrontendConnectionPanelImplementation !== false ||
    contract.summary.readyForRealSpApiReportRequest !== false ||
    contract.summary.readyForCommittedSalesImport !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step126-A OAuth state persistence bridge preimplementation contract violation: summary mismatch.');
  }

  return contract;
}
