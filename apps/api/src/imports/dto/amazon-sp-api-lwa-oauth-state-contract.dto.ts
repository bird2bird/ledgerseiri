import {
  assertAmazonSpApiRealConnectionBoundaryLwaPreparationContract,
  buildAmazonSpApiRealConnectionBoundaryLwaPreparationContract,
  type AmazonSpApiRealConnectionBoundaryLwaPreparationContract,
} from './amazon-sp-api-real-connection-boundary-lwa-preparation-contract.dto';

export const AMAZON_SP_API_LWA_OAUTH_STATE_CONTRACT_VERSION =
  'amazon-sp-api-lwa-oauth-state-contract-v1' as const;

export type AmazonSpApiLwaOAuthStateRegion = 'FE' | 'NA' | 'EU';

export type AmazonSpApiLwaOAuthStateRedirectTarget =
  | '/app/data/import'
  | '/app/settings/integrations'
  | '/app/income/store-orders';

export type AmazonSpApiLwaOAuthStateFailureAction = 'reject';

export type AmazonSpApiLwaOAuthStateContract = {
  version: typeof AMAZON_SP_API_LWA_OAUTH_STATE_CONTRACT_VERSION;
  sourceStep123A: AmazonSpApiRealConnectionBoundaryLwaPreparationContract;

  contractOnly: true;
  implementationNow: false;
  backendRouteAddedNow: false;
  frontendRouteAddedNow: false;
  schemaChangedNow: false;
  tokenPersistenceNow: false;
  realSpApiRequestNow: false;
  writesDatabase: false;

  statePayloadContract: {
    companyIdRequired: true;
    storeIdRequired: true;
    marketplaceIdRequired: true;
    regionRequired: true;
    nonceRequired: true;
    issuedAtRequired: true;
    expiresAtRequired: true;
    redirectAfterConnectRequired: true;
    allowedRedirectTargets: AmazonSpApiLwaOAuthStateRedirectTarget[];
  };

  nonceLifecycleContract: {
    generatedServerSide: true;
    highEntropyRequired: true;
    singleUseRequiredInFuture: true;
    replayDetectionRequiredInFuture: true;
    persistenceForbiddenNow: true;
    ttlRequired: true;
    expiredStateRejectedInFuture: true;
  };

  signingAndCsrfContract: {
    stateParameterRequired: true;
    signedStateRequired: true;
    tamperDetectionRequired: true;
    csrfProtectionRequired: true;
    openRedirectProtectionRequired: true;
    tenantBindingRequired: true;
    storeBindingRequired: true;
    marketplaceBindingRequired: true;
    regionBindingRequired: true;
  };

  futurePersistencePolicy: {
    oauthStatePersistenceRequiresSeparateStep: true;
    oauthStateTableRequiresSeparateStep: true;
    nonceHashStorageRequiredInFuture: true;
    rawNonceStorageForbiddenInFuture: true;
    consumedAtRequiredInFuture: true;
    callbackAuditLogRequiredInFuture: true;
  };

  failurePolicy: {
    missingState: AmazonSpApiLwaOAuthStateFailureAction;
    malformedPayload: AmazonSpApiLwaOAuthStateFailureAction;
    invalidSignature: AmazonSpApiLwaOAuthStateFailureAction;
    expiredState: AmazonSpApiLwaOAuthStateFailureAction;
    nonceReplay: AmazonSpApiLwaOAuthStateFailureAction;
    companyMismatch: AmazonSpApiLwaOAuthStateFailureAction;
    storeMismatch: AmazonSpApiLwaOAuthStateFailureAction;
    marketplaceMismatch: AmazonSpApiLwaOAuthStateFailureAction;
    regionMismatch: AmazonSpApiLwaOAuthStateFailureAction;
    externalRedirect: AmazonSpApiLwaOAuthStateFailureAction;
  };

  forbiddenNow: {
    oauthAuthorizationRoute: true;
    oauthCallbackRoute: true;
    oauthStateSchema: true;
    noncePersistence: true;
    tokenExchangeHttpCall: true;
    refreshTokenPersistence: true;
    accessTokenPersistence: true;
    clientSecretPersistence: true;
    realSpApiHttpCall: true;
    createReportCall: true;
    getReportCall: true;
    getReportDocumentCall: true;
    transactionWrite: true;
    inventoryWrite: true;
  };

  summary: {
    readyForAuthorizationUrlBuilderContract: true;
    readyForOauthRouteImplementation: false;
    readyForCallbackImplementation: false;
    readyForOAuthStatePersistence: false;
    readyForTokenPersistence: false;
    readyForRealSpApiReportRequest: false;
  };
};

export function buildAmazonSpApiLwaOAuthStateContract(): AmazonSpApiLwaOAuthStateContract {
  const step123A = assertAmazonSpApiRealConnectionBoundaryLwaPreparationContract(
    buildAmazonSpApiRealConnectionBoundaryLwaPreparationContract(),
  );

  return {
    version: AMAZON_SP_API_LWA_OAUTH_STATE_CONTRACT_VERSION,
    sourceStep123A: step123A,

    contractOnly: true,
    implementationNow: false,
    backendRouteAddedNow: false,
    frontendRouteAddedNow: false,
    schemaChangedNow: false,
    tokenPersistenceNow: false,
    realSpApiRequestNow: false,
    writesDatabase: false,

    statePayloadContract: {
      companyIdRequired: true,
      storeIdRequired: true,
      marketplaceIdRequired: true,
      regionRequired: true,
      nonceRequired: true,
      issuedAtRequired: true,
      expiresAtRequired: true,
      redirectAfterConnectRequired: true,
      allowedRedirectTargets: [
        '/app/data/import',
        '/app/settings/integrations',
        '/app/income/store-orders',
      ],
    },

    nonceLifecycleContract: {
      generatedServerSide: true,
      highEntropyRequired: true,
      singleUseRequiredInFuture: true,
      replayDetectionRequiredInFuture: true,
      persistenceForbiddenNow: true,
      ttlRequired: true,
      expiredStateRejectedInFuture: true,
    },

    signingAndCsrfContract: {
      stateParameterRequired: true,
      signedStateRequired: true,
      tamperDetectionRequired: true,
      csrfProtectionRequired: true,
      openRedirectProtectionRequired: true,
      tenantBindingRequired: true,
      storeBindingRequired: true,
      marketplaceBindingRequired: true,
      regionBindingRequired: true,
    },

    futurePersistencePolicy: {
      oauthStatePersistenceRequiresSeparateStep: true,
      oauthStateTableRequiresSeparateStep: true,
      nonceHashStorageRequiredInFuture: true,
      rawNonceStorageForbiddenInFuture: true,
      consumedAtRequiredInFuture: true,
      callbackAuditLogRequiredInFuture: true,
    },

    failurePolicy: {
      missingState: 'reject',
      malformedPayload: 'reject',
      invalidSignature: 'reject',
      expiredState: 'reject',
      nonceReplay: 'reject',
      companyMismatch: 'reject',
      storeMismatch: 'reject',
      marketplaceMismatch: 'reject',
      regionMismatch: 'reject',
      externalRedirect: 'reject',
    },

    forbiddenNow: {
      oauthAuthorizationRoute: true,
      oauthCallbackRoute: true,
      oauthStateSchema: true,
      noncePersistence: true,
      tokenExchangeHttpCall: true,
      refreshTokenPersistence: true,
      accessTokenPersistence: true,
      clientSecretPersistence: true,
      realSpApiHttpCall: true,
      createReportCall: true,
      getReportCall: true,
      getReportDocumentCall: true,
      transactionWrite: true,
      inventoryWrite: true,
    },

    summary: {
      readyForAuthorizationUrlBuilderContract: true,
      readyForOauthRouteImplementation: false,
      readyForCallbackImplementation: false,
      readyForOAuthStatePersistence: false,
      readyForTokenPersistence: false,
      readyForRealSpApiReportRequest: false,
    },
  };
}

export function assertAmazonSpApiLwaOAuthStateContract(
  contract: AmazonSpApiLwaOAuthStateContract,
): AmazonSpApiLwaOAuthStateContract {
  if (contract.version !== AMAZON_SP_API_LWA_OAUTH_STATE_CONTRACT_VERSION) {
    throw new Error('Step123-B LWA OAuth state contract violation: version mismatch.');
  }

  assertAmazonSpApiRealConnectionBoundaryLwaPreparationContract(contract.sourceStep123A);

  if (
    contract.contractOnly !== true ||
    contract.implementationNow !== false ||
    contract.backendRouteAddedNow !== false ||
    contract.frontendRouteAddedNow !== false ||
    contract.schemaChangedNow !== false ||
    contract.tokenPersistenceNow !== false ||
    contract.realSpApiRequestNow !== false ||
    contract.writesDatabase !== false
  ) {
    throw new Error('Step123-B LWA OAuth state contract violation: implementation boundary mismatch.');
  }

  for (const [key, required] of Object.entries(contract.statePayloadContract)) {
    if (key === 'allowedRedirectTargets') continue;
    if (required !== true) {
      throw new Error(`Step123-B LWA OAuth state contract violation: statePayloadContract.${key} must remain true.`);
    }
  }

  if (
    !contract.statePayloadContract.allowedRedirectTargets.includes('/app/data/import') ||
    !contract.statePayloadContract.allowedRedirectTargets.includes('/app/settings/integrations') ||
    !contract.statePayloadContract.allowedRedirectTargets.includes('/app/income/store-orders')
  ) {
    throw new Error('Step123-B LWA OAuth state contract violation: allowed redirect targets mismatch.');
  }

  for (const [key, required] of Object.entries(contract.nonceLifecycleContract)) {
    if (required !== true) {
      throw new Error(`Step123-B LWA OAuth state contract violation: nonceLifecycleContract.${key} must remain true.`);
    }
  }

  for (const [key, required] of Object.entries(contract.signingAndCsrfContract)) {
    if (required !== true) {
      throw new Error(`Step123-B LWA OAuth state contract violation: signingAndCsrfContract.${key} must remain true.`);
    }
  }

  for (const [key, required] of Object.entries(contract.futurePersistencePolicy)) {
    if (required !== true) {
      throw new Error(`Step123-B LWA OAuth state contract violation: futurePersistencePolicy.${key} must remain true.`);
    }
  }

  for (const [key, action] of Object.entries(contract.failurePolicy)) {
    if (action !== 'reject') {
      throw new Error(`Step123-B LWA OAuth state contract violation: failurePolicy.${key} must reject.`);
    }
  }

  for (const [key, forbidden] of Object.entries(contract.forbiddenNow)) {
    if (forbidden !== true) {
      throw new Error(`Step123-B LWA OAuth state contract violation: forbiddenNow.${key} must remain true.`);
    }
  }

  return contract;
}
