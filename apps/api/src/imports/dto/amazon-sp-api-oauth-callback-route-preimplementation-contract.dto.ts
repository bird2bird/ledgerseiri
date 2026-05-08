import {
  assertAmazonSpApiOauthStatePersistenceBridgeRuntimeSmokeRecordHandoffContract,
  buildAmazonSpApiOauthStatePersistenceBridgeRuntimeSmokeRecordHandoffContract,
  type AmazonSpApiOauthStatePersistenceBridgeRuntimeSmokeRecordHandoffContract,
} from './amazon-sp-api-oauth-state-persistence-bridge-runtime-smoke-record-handoff-contract.dto';

export const AMAZON_SP_API_OAUTH_CALLBACK_ROUTE_PREIMPLEMENTATION_CONTRACT_VERSION =
  'amazon-sp-api-oauth-callback-route-preimplementation-contract-v1' as const;

export type AmazonSpApiOauthCallbackRoutePreimplementationContract = {
  version: typeof AMAZON_SP_API_OAUTH_CALLBACK_ROUTE_PREIMPLEMENTATION_CONTRACT_VERSION;
  sourceStep126D: AmazonSpApiOauthStatePersistenceBridgeRuntimeSmokeRecordHandoffContract;

  contractOnly: true;
  preImplementationOnly: true;
  routeDesignOnlyNow: true;

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

  callbackRoutePlan: {
    httpMethodGet: true;
    routePathPlanned: '/api/imports/amazon-sp-api/oauth/callback';
    queryStateRequired: true;
    queryCodeOrSpapiOauthCodeRequiredUnlessError: true;
    querySellingPartnerIdRequiredBeforePersistence: true;
    queryErrorShortCircuits: true;
    idempotentCallbackHandlingRequired: true;
    redirectsOrSanitizedResponseOnly: true;
  };

  inputBoundaryPlan: {
    state: true;
    code: true;
    spapi_oauth_code: true;
    selling_partner_id: true;
    error: true;
    error_description: true;
    mws_auth_tokenIgnored: true;
  };

  dependencyBoundaryPlan: {
    callbackQueryValidatorRequired: true;
    oauthStateSignatureVerifierRequired: true;
    oauthStatePersistenceBridgeRequired: true;
    tokenExchangeServiceRequiredLater: true;
    tokenPersistenceServiceRequiredLater: true;
    companyStoreScopeValidationRequiredBeforePersistence: true;
  };

  callbackProcessingSequencePlan: {
    parseQuery: true;
    validateCallbackQueryShape: true;
    shortCircuitAmazonErrorBeforeStateUse: true;
    verifySignedStateBeforeTokenExchange: true;
    validateStateExpiryAndNonceBeforeTokenExchange: true;
    validateCompanyStoreMarketplaceRegionAppScopeBeforeTokenExchange: true;
    exchangeAuthorizationCodeForTokensLater: true;
    encryptTokensBeforePersistenceLater: true;
    callPersistenceBridgeBeforeTokenPersistenceLater: true;
    persistTokensOnlyAfterBridgeAcceptsLater: true;
    returnSanitizedResultOnly: true;
  };

  errorBoundaryPlan: {
    callbackErrorReturnedByAmazon: true;
    missingState: true;
    invalidStateSignature: true;
    expiredState: true;
    nonceMismatch: true;
    missingAuthorizationCode: true;
    missingSellingPartnerId: true;
    companyNotFound: true;
    storeNotFound: true;
    storeCompanyMismatch: true;
    marketplaceMismatch: true;
    regionMismatch: true;
    appIdMismatch: true;
    tokenExchangeFailedLater: true;
    tokenEncryptionFailedLater: true;
    tokenPersistenceFailedLater: true;
  };

  securityPlan: {
    noPlaintextAuthorizationCodeInLogs: true;
    noPlaintextRefreshTokenInLogs: true;
    noPlaintextAccessTokenInLogs: true;
    noPlaintextTokenInResponse: true;
    noEncryptedTokenReturnedToFrontend: true;
    auditMessagesMustBeRedacted: true;
    callbackErrorMessagesSanitized: true;
    stateReplayProtectionRequired: true;
  };

  routeResponsePlan: {
    successRedirectAllowedLater: true;
    failureRedirectAllowedLater: true;
    sanitizedJsonAllowedForSmokeLater: true;
    noAuthorizationCodeReturned: true;
    noRefreshTokenReturned: true;
    noAccessTokenReturned: true;
    noEncryptedTokenReturned: true;
    includeConnectionStatusOnlyAfterPersistenceLater: true;
  };

  stillForbidden: {
    oauthCallbackRouteImplementation: true;
    authorizationRouteImplementation: true;
    lwaTokenExchangeHttpCall: true;
    tokenPersistenceDatabaseWriteFromCallback: true;
    realAmazonSpApiHttpCall: true;
    frontendConnectionPanel: true;
    committedSalesImport: true;
    inventoryExecution: true;
  };

  nextAllowedWork: {
    oauthCallbackRouteImplementation: true;
    tokenExchangeServicePreimplementationContract: true;
    authorizationRouteImplementation: false;
    tokenExchangeHttpImplementation: false;
    frontendConnectionPanelImplementation: false;
    realSpApiReportRequestImplementation: false;
  };

  summary: {
    readyForStep127BOauthCallbackRouteImplementation: true;
    readyForTokenExchangeServicePreimplementationContract: true;
    readyForAuthorizationRouteImplementation: false;
    readyForTokenExchangeHttpImplementation: false;
    readyForFrontendConnectionPanelImplementation: false;
    readyForRealSpApiReportRequest: false;
    readyForCommittedSalesImport: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiOauthCallbackRoutePreimplementationContract(): AmazonSpApiOauthCallbackRoutePreimplementationContract {
  const step126D = assertAmazonSpApiOauthStatePersistenceBridgeRuntimeSmokeRecordHandoffContract(
    buildAmazonSpApiOauthStatePersistenceBridgeRuntimeSmokeRecordHandoffContract(),
  );

  return {
    version: AMAZON_SP_API_OAUTH_CALLBACK_ROUTE_PREIMPLEMENTATION_CONTRACT_VERSION,
    sourceStep126D: step126D,

    contractOnly: true,
    preImplementationOnly: true,
    routeDesignOnlyNow: true,

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

    callbackRoutePlan: {
      httpMethodGet: true,
      routePathPlanned: '/api/imports/amazon-sp-api/oauth/callback',
      queryStateRequired: true,
      queryCodeOrSpapiOauthCodeRequiredUnlessError: true,
      querySellingPartnerIdRequiredBeforePersistence: true,
      queryErrorShortCircuits: true,
      idempotentCallbackHandlingRequired: true,
      redirectsOrSanitizedResponseOnly: true,
    },

    inputBoundaryPlan: {
      state: true,
      code: true,
      spapi_oauth_code: true,
      selling_partner_id: true,
      error: true,
      error_description: true,
      mws_auth_tokenIgnored: true,
    },

    dependencyBoundaryPlan: {
      callbackQueryValidatorRequired: true,
      oauthStateSignatureVerifierRequired: true,
      oauthStatePersistenceBridgeRequired: true,
      tokenExchangeServiceRequiredLater: true,
      tokenPersistenceServiceRequiredLater: true,
      companyStoreScopeValidationRequiredBeforePersistence: true,
    },

    callbackProcessingSequencePlan: {
      parseQuery: true,
      validateCallbackQueryShape: true,
      shortCircuitAmazonErrorBeforeStateUse: true,
      verifySignedStateBeforeTokenExchange: true,
      validateStateExpiryAndNonceBeforeTokenExchange: true,
      validateCompanyStoreMarketplaceRegionAppScopeBeforeTokenExchange: true,
      exchangeAuthorizationCodeForTokensLater: true,
      encryptTokensBeforePersistenceLater: true,
      callPersistenceBridgeBeforeTokenPersistenceLater: true,
      persistTokensOnlyAfterBridgeAcceptsLater: true,
      returnSanitizedResultOnly: true,
    },

    errorBoundaryPlan: {
      callbackErrorReturnedByAmazon: true,
      missingState: true,
      invalidStateSignature: true,
      expiredState: true,
      nonceMismatch: true,
      missingAuthorizationCode: true,
      missingSellingPartnerId: true,
      companyNotFound: true,
      storeNotFound: true,
      storeCompanyMismatch: true,
      marketplaceMismatch: true,
      regionMismatch: true,
      appIdMismatch: true,
      tokenExchangeFailedLater: true,
      tokenEncryptionFailedLater: true,
      tokenPersistenceFailedLater: true,
    },

    securityPlan: {
      noPlaintextAuthorizationCodeInLogs: true,
      noPlaintextRefreshTokenInLogs: true,
      noPlaintextAccessTokenInLogs: true,
      noPlaintextTokenInResponse: true,
      noEncryptedTokenReturnedToFrontend: true,
      auditMessagesMustBeRedacted: true,
      callbackErrorMessagesSanitized: true,
      stateReplayProtectionRequired: true,
    },

    routeResponsePlan: {
      successRedirectAllowedLater: true,
      failureRedirectAllowedLater: true,
      sanitizedJsonAllowedForSmokeLater: true,
      noAuthorizationCodeReturned: true,
      noRefreshTokenReturned: true,
      noAccessTokenReturned: true,
      noEncryptedTokenReturned: true,
      includeConnectionStatusOnlyAfterPersistenceLater: true,
    },

    stillForbidden: {
      oauthCallbackRouteImplementation: true,
      authorizationRouteImplementation: true,
      lwaTokenExchangeHttpCall: true,
      tokenPersistenceDatabaseWriteFromCallback: true,
      realAmazonSpApiHttpCall: true,
      frontendConnectionPanel: true,
      committedSalesImport: true,
      inventoryExecution: true,
    },

    nextAllowedWork: {
      oauthCallbackRouteImplementation: true,
      tokenExchangeServicePreimplementationContract: true,
      authorizationRouteImplementation: false,
      tokenExchangeHttpImplementation: false,
      frontendConnectionPanelImplementation: false,
      realSpApiReportRequestImplementation: false,
    },

    summary: {
      readyForStep127BOauthCallbackRouteImplementation: true,
      readyForTokenExchangeServicePreimplementationContract: true,
      readyForAuthorizationRouteImplementation: false,
      readyForTokenExchangeHttpImplementation: false,
      readyForFrontendConnectionPanelImplementation: false,
      readyForRealSpApiReportRequest: false,
      readyForCommittedSalesImport: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiOauthCallbackRoutePreimplementationContract(
  contract: AmazonSpApiOauthCallbackRoutePreimplementationContract,
): AmazonSpApiOauthCallbackRoutePreimplementationContract {
  if (contract.version !== AMAZON_SP_API_OAUTH_CALLBACK_ROUTE_PREIMPLEMENTATION_CONTRACT_VERSION) {
    throw new Error('Step127-A OAuth callback route preimplementation contract violation: version mismatch.');
  }

  assertAmazonSpApiOauthStatePersistenceBridgeRuntimeSmokeRecordHandoffContract(contract.sourceStep126D);

  if (
    contract.contractOnly !== true ||
    contract.preImplementationOnly !== true ||
    contract.routeDesignOnlyNow !== true ||
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
    throw new Error('Step127-A OAuth callback route preimplementation contract violation: boundary mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    inputBoundaryPlan: contract.inputBoundaryPlan,
    dependencyBoundaryPlan: contract.dependencyBoundaryPlan,
    callbackProcessingSequencePlan: contract.callbackProcessingSequencePlan,
    errorBoundaryPlan: contract.errorBoundaryPlan,
    securityPlan: contract.securityPlan,
    routeResponsePlan: contract.routeResponsePlan,
    stillForbidden: contract.stillForbidden,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (value !== true) {
        throw new Error(`Step127-A OAuth callback route preimplementation contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.callbackRoutePlan.httpMethodGet !== true ||
    contract.callbackRoutePlan.routePathPlanned !== '/api/imports/amazon-sp-api/oauth/callback' ||
    contract.callbackRoutePlan.queryStateRequired !== true ||
    contract.callbackRoutePlan.queryCodeOrSpapiOauthCodeRequiredUnlessError !== true ||
    contract.callbackRoutePlan.querySellingPartnerIdRequiredBeforePersistence !== true ||
    contract.callbackRoutePlan.queryErrorShortCircuits !== true ||
    contract.callbackRoutePlan.idempotentCallbackHandlingRequired !== true ||
    contract.callbackRoutePlan.redirectsOrSanitizedResponseOnly !== true
  ) {
    throw new Error('Step127-A OAuth callback route preimplementation contract violation: callback route plan mismatch.');
  }

  if (
    contract.nextAllowedWork.oauthCallbackRouteImplementation !== true ||
    contract.nextAllowedWork.tokenExchangeServicePreimplementationContract !== true ||
    contract.nextAllowedWork.authorizationRouteImplementation !== false ||
    contract.nextAllowedWork.tokenExchangeHttpImplementation !== false ||
    contract.nextAllowedWork.frontendConnectionPanelImplementation !== false ||
    contract.nextAllowedWork.realSpApiReportRequestImplementation !== false ||
    contract.summary.readyForStep127BOauthCallbackRouteImplementation !== true ||
    contract.summary.readyForTokenExchangeServicePreimplementationContract !== true ||
    contract.summary.readyForAuthorizationRouteImplementation !== false ||
    contract.summary.readyForTokenExchangeHttpImplementation !== false ||
    contract.summary.readyForFrontendConnectionPanelImplementation !== false ||
    contract.summary.readyForRealSpApiReportRequest !== false ||
    contract.summary.readyForCommittedSalesImport !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step127-A OAuth callback route preimplementation contract violation: summary mismatch.');
  }

  return contract;
}
