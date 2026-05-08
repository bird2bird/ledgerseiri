import {
  assertAmazonSpApiOauthStatePersistenceBridgePreimplementationContract,
  buildAmazonSpApiOauthStatePersistenceBridgePreimplementationContract,
  type AmazonSpApiOauthStatePersistenceBridgePreimplementationContract,
} from './amazon-sp-api-oauth-state-persistence-bridge-preimplementation-contract.dto';

export const AMAZON_SP_API_OAUTH_STATE_PERSISTENCE_BRIDGE_IMPLEMENTATION_CONTRACT_VERSION =
  'amazon-sp-api-oauth-state-persistence-bridge-implementation-contract-v2' as const;

export type AmazonSpApiOauthStatePersistenceBridgeImplementationContract = {
  version: typeof AMAZON_SP_API_OAUTH_STATE_PERSISTENCE_BRIDGE_IMPLEMENTATION_CONTRACT_VERSION;
  sourceStep126A: AmazonSpApiOauthStatePersistenceBridgePreimplementationContract;

  bridgeServiceImplementedNow: true;
  bridgeMappingImplementedNow: true;

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

  implementedFiles: {
    bridgeService: 'apps/api/src/imports/amazon-sp-api-oauth-state-persistence-bridge.service.ts';
    module: 'apps/api/src/imports/imports.module.ts';
  };

  implementedMethods: {
    buildPersistencePlan: true;
    validateStatePayload: true;
  };

  implementedValidation: {
    callbackErrorShortCircuit: true;
    authorizationCodeRequired: true;
    sellingPartnerIdRequired: true;
    stateExpiryRequired: true;
    nonceValidation: true;
    companyValidation: true;
    storeValidation: true;
    marketplaceValidation: true;
    regionValidation: true;
    appIdValidation: true;
    encryptionMetadataValidation: true;
  };

  implementedMapping: {
    stateCompanyIdToRefreshCredentialInput: true;
    stateStoreIdToRefreshCredentialInput: true;
    stateMarketplaceIdToRefreshCredentialInput: true;
    stateRegionToRefreshCredentialInput: true;
    stateAppIdToRefreshCredentialInput: true;
    sellingPartnerIdToRefreshCredentialInput: true;
    encryptedRefreshTokenToRefreshCredentialInput: true;
    encryptedAccessTokenToAccessTokenCacheInput: true;
    scopeToAccessTokenCacheInput: true;
    expiresInSecondsToAccessTokenExpiresAt: true;
  };

  regressionCompatibility: {
    step125BRegressionSmokeAcceptsMultilineModuleExports: true;
    importsModuleCanExportTokenPersistenceAndBridgeServicesTogether: true;
    step125BRegressionSmokeUsesStructuredProvidersExportsBlockParsing: true;
  };

  securityBoundary: {
    noAuthorizationCodeReturned: true;
    noRefreshTokenReturned: true;
    noAccessTokenReturned: true;
    noEncryptedTokenReturnedToFrontend: true;
    noHttpFetch: true;
    noLwaEndpoint: true;
    noControllerRoute: true;
    noDatabaseWrite: true;
  };

  nextAllowedWork: {
    oauthStatePersistenceBridgeRuntimeSmoke: true;
    oauthCallbackRouteImplementation: false;
    authorizationRouteImplementation: false;
    tokenExchangeHttpImplementation: false;
    frontendConnectionPanelImplementation: false;
    realSpApiReportRequestImplementation: false;
  };

  summary: {
    readyForStep126COauthStatePersistenceBridgeRuntimeSmoke: true;
    readyForOauthCallbackRouteImplementation: false;
    readyForAuthorizationRouteImplementation: false;
    readyForTokenExchangeHttpImplementation: false;
    readyForFrontendConnectionPanelImplementation: false;
    readyForRealSpApiReportRequest: false;
    readyForCommittedSalesImport: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiOauthStatePersistenceBridgeImplementationContract(): AmazonSpApiOauthStatePersistenceBridgeImplementationContract {
  const step126A = assertAmazonSpApiOauthStatePersistenceBridgePreimplementationContract(
    buildAmazonSpApiOauthStatePersistenceBridgePreimplementationContract(),
  );

  return {
    version: AMAZON_SP_API_OAUTH_STATE_PERSISTENCE_BRIDGE_IMPLEMENTATION_CONTRACT_VERSION,
    sourceStep126A: step126A,

    bridgeServiceImplementedNow: true,
    bridgeMappingImplementedNow: true,

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

    implementedFiles: {
      bridgeService: 'apps/api/src/imports/amazon-sp-api-oauth-state-persistence-bridge.service.ts',
      module: 'apps/api/src/imports/imports.module.ts',
    },

    implementedMethods: {
      buildPersistencePlan: true,
      validateStatePayload: true,
    },

    implementedValidation: {
      callbackErrorShortCircuit: true,
      authorizationCodeRequired: true,
      sellingPartnerIdRequired: true,
      stateExpiryRequired: true,
      nonceValidation: true,
      companyValidation: true,
      storeValidation: true,
      marketplaceValidation: true,
      regionValidation: true,
      appIdValidation: true,
      encryptionMetadataValidation: true,
    },

    implementedMapping: {
      stateCompanyIdToRefreshCredentialInput: true,
      stateStoreIdToRefreshCredentialInput: true,
      stateMarketplaceIdToRefreshCredentialInput: true,
      stateRegionToRefreshCredentialInput: true,
      stateAppIdToRefreshCredentialInput: true,
      sellingPartnerIdToRefreshCredentialInput: true,
      encryptedRefreshTokenToRefreshCredentialInput: true,
      encryptedAccessTokenToAccessTokenCacheInput: true,
      scopeToAccessTokenCacheInput: true,
      expiresInSecondsToAccessTokenExpiresAt: true,
    },

    regressionCompatibility: {
      step125BRegressionSmokeAcceptsMultilineModuleExports: true,
      importsModuleCanExportTokenPersistenceAndBridgeServicesTogether: true,
      step125BRegressionSmokeUsesStructuredProvidersExportsBlockParsing: true,
    },

    securityBoundary: {
      noAuthorizationCodeReturned: true,
      noRefreshTokenReturned: true,
      noAccessTokenReturned: true,
      noEncryptedTokenReturnedToFrontend: true,
      noHttpFetch: true,
      noLwaEndpoint: true,
      noControllerRoute: true,
      noDatabaseWrite: true,
    },

    nextAllowedWork: {
      oauthStatePersistenceBridgeRuntimeSmoke: true,
      oauthCallbackRouteImplementation: false,
      authorizationRouteImplementation: false,
      tokenExchangeHttpImplementation: false,
      frontendConnectionPanelImplementation: false,
      realSpApiReportRequestImplementation: false,
    },

    summary: {
      readyForStep126COauthStatePersistenceBridgeRuntimeSmoke: true,
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

export function assertAmazonSpApiOauthStatePersistenceBridgeImplementationContract(
  contract: AmazonSpApiOauthStatePersistenceBridgeImplementationContract,
): AmazonSpApiOauthStatePersistenceBridgeImplementationContract {
  if (contract.version !== AMAZON_SP_API_OAUTH_STATE_PERSISTENCE_BRIDGE_IMPLEMENTATION_CONTRACT_VERSION) {
    throw new Error('Step126-B OAuth state persistence bridge implementation contract violation: version mismatch.');
  }

  assertAmazonSpApiOauthStatePersistenceBridgePreimplementationContract(contract.sourceStep126A);

  if (
    contract.bridgeServiceImplementedNow !== true ||
    contract.bridgeMappingImplementedNow !== true ||
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
    throw new Error('Step126-B OAuth state persistence bridge implementation contract violation: boundary mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    implementedMethods: contract.implementedMethods,
    implementedValidation: contract.implementedValidation,
    implementedMapping: contract.implementedMapping,
    regressionCompatibility: contract.regressionCompatibility,
    securityBoundary: contract.securityBoundary,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (value !== true) {
        throw new Error(`Step126-B OAuth state persistence bridge implementation contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.nextAllowedWork.oauthStatePersistenceBridgeRuntimeSmoke !== true ||
    contract.nextAllowedWork.oauthCallbackRouteImplementation !== false ||
    contract.nextAllowedWork.authorizationRouteImplementation !== false ||
    contract.nextAllowedWork.tokenExchangeHttpImplementation !== false ||
    contract.nextAllowedWork.frontendConnectionPanelImplementation !== false ||
    contract.nextAllowedWork.realSpApiReportRequestImplementation !== false ||
    contract.summary.readyForStep126COauthStatePersistenceBridgeRuntimeSmoke !== true ||
    contract.summary.readyForOauthCallbackRouteImplementation !== false ||
    contract.summary.readyForAuthorizationRouteImplementation !== false ||
    contract.summary.readyForTokenExchangeHttpImplementation !== false ||
    contract.summary.readyForFrontendConnectionPanelImplementation !== false ||
    contract.summary.readyForRealSpApiReportRequest !== false ||
    contract.summary.readyForCommittedSalesImport !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step126-B OAuth state persistence bridge implementation contract violation: summary mismatch.');
  }

  return contract;
}
