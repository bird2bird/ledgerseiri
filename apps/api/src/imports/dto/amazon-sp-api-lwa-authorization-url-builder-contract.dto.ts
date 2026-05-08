import {
  assertAmazonSpApiLwaOAuthStateContract,
  buildAmazonSpApiLwaOAuthStateContract,
  type AmazonSpApiLwaOAuthStateContract,
} from './amazon-sp-api-lwa-oauth-state-contract.dto';

export const AMAZON_SP_API_LWA_AUTHORIZATION_URL_BUILDER_CONTRACT_VERSION =
  'amazon-sp-api-lwa-authorization-url-builder-contract-v1' as const;

export type AmazonSpApiLwaAuthorizationRegion = 'FE' | 'NA' | 'EU';

export type AmazonSpApiLwaAuthorizationConsentEndpoint =
  | 'https://sellercentral.amazon.co.jp/apps/authorize/consent'
  | 'https://sellercentral.amazon.com/apps/authorize/consent'
  | 'https://sellercentral-europe.amazon.com/apps/authorize/consent';

export type AmazonSpApiLwaAuthorizationAppStatus = 'draft' | 'published';

export type AmazonSpApiLwaAuthorizationUrlBuilderContract = {
  version: typeof AMAZON_SP_API_LWA_AUTHORIZATION_URL_BUILDER_CONTRACT_VERSION;
  sourceStep123B: AmazonSpApiLwaOAuthStateContract;

  contractOnly: true;
  implementationNow: false;
  backendRouteAddedNow: false;
  frontendRouteAddedNow: false;
  schemaChangedNow: false;
  tokenPersistenceNow: false;
  realSpApiRequestNow: false;
  writesDatabase: false;

  builderBoundary: {
    purpose: 'construct-lwa-authorization-consent-url-contract';
    inputValidationOnly: true;
    urlConstructionDesignOnly: true;
    browserRedirectExecutionForbiddenNow: true;
    serverRouteExposureForbiddenNow: true;
  };

  regionalEndpointContract: {
    regionRequired: true;
    marketplaceIdRequired: true;
    marketplaceMustMatchRegion: true;
    allowedConsentEndpoints: Record<AmazonSpApiLwaAuthorizationRegion, AmazonSpApiLwaAuthorizationConsentEndpoint>;
    defaultJapanRegion: 'FE';
    defaultJapanMarketplaceId: 'A1VC38T7YXB528';
  };

  queryParameterContract: {
    applicationIdRequired: true;
    stateRequired: true;
    stateMustComeFromStep123B: true;
    redirectUriAllowedOnlyIfRegistered: true;
    redirectUriAllowlistRequired: true;
    versionBetaAllowedForDraftApps: true;
    versionBetaForbiddenForPublishedApps: true;
    unknownQueryParametersRejectedInFuture: true;
  };

  stateBindingContract: {
    companyIdBoundByState: true;
    storeIdBoundByState: true;
    marketplaceIdBoundByState: true;
    regionBoundByState: true;
    nonceBoundByState: true;
    expiresAtBoundByState: true;
    signedStateRequired: true;
    csrfProtectionInheritedFromStep123B: true;
  };

  redirectUriPolicy: {
    externalRedirectForbidden: true;
    registeredRedirectUriRequiredInFuture: true;
    httpsRequiredOutsideLocalDevelopment: true;
    localhostAllowedOnlyForDevelopment: true;
    pathMustBeCallbackSpecificInFuture: true;
  };

  appModePolicy: {
    draftUsesVersionBeta: true;
    publishedOmitsVersionBeta: true;
    privateAppSelfAuthorizationNotImplementedNow: true;
    publicWebsiteAuthorizationDesignOnly: true;
    appstoreAuthorizationDesignOnly: true;
  };

  forbiddenNow: {
    controllerRoute: true;
    frontendAuthorizeButton: true;
    browserRedirect: true;
    oauthCallbackRoute: true;
    tokenExchangeHttpCall: true;
    refreshTokenPersistence: true;
    accessTokenPersistence: true;
    clientSecretPersistence: true;
    oauthStatePersistence: true;
    amazonCredentialSchema: true;
    amazonTokenSchema: true;
    realSpApiHttpCall: true;
    createReportCall: true;
    getReportCall: true;
    getReportDocumentCall: true;
    transactionWrite: true;
    inventoryWrite: true;
  };

  summary: {
    readyForAuthorizationUrlBuilderImplementation: false;
    readyForAuthorizeRouteImplementation: false;
    readyForFrontendAuthorizeButton: false;
    readyForCallbackPreflightContract: true;
    readyForCallbackImplementation: false;
    readyForTokenPersistence: false;
    readyForRealSpApiReportRequest: false;
  };
};

export function buildAmazonSpApiLwaAuthorizationUrlBuilderContract(): AmazonSpApiLwaAuthorizationUrlBuilderContract {
  const step123B = assertAmazonSpApiLwaOAuthStateContract(
    buildAmazonSpApiLwaOAuthStateContract(),
  );

  return {
    version: AMAZON_SP_API_LWA_AUTHORIZATION_URL_BUILDER_CONTRACT_VERSION,
    sourceStep123B: step123B,

    contractOnly: true,
    implementationNow: false,
    backendRouteAddedNow: false,
    frontendRouteAddedNow: false,
    schemaChangedNow: false,
    tokenPersistenceNow: false,
    realSpApiRequestNow: false,
    writesDatabase: false,

    builderBoundary: {
      purpose: 'construct-lwa-authorization-consent-url-contract',
      inputValidationOnly: true,
      urlConstructionDesignOnly: true,
      browserRedirectExecutionForbiddenNow: true,
      serverRouteExposureForbiddenNow: true,
    },

    regionalEndpointContract: {
      regionRequired: true,
      marketplaceIdRequired: true,
      marketplaceMustMatchRegion: true,
      allowedConsentEndpoints: {
        FE: 'https://sellercentral.amazon.co.jp/apps/authorize/consent',
        NA: 'https://sellercentral.amazon.com/apps/authorize/consent',
        EU: 'https://sellercentral-europe.amazon.com/apps/authorize/consent',
      },
      defaultJapanRegion: 'FE',
      defaultJapanMarketplaceId: 'A1VC38T7YXB528',
    },

    queryParameterContract: {
      applicationIdRequired: true,
      stateRequired: true,
      stateMustComeFromStep123B: true,
      redirectUriAllowedOnlyIfRegistered: true,
      redirectUriAllowlistRequired: true,
      versionBetaAllowedForDraftApps: true,
      versionBetaForbiddenForPublishedApps: true,
      unknownQueryParametersRejectedInFuture: true,
    },

    stateBindingContract: {
      companyIdBoundByState: true,
      storeIdBoundByState: true,
      marketplaceIdBoundByState: true,
      regionBoundByState: true,
      nonceBoundByState: true,
      expiresAtBoundByState: true,
      signedStateRequired: true,
      csrfProtectionInheritedFromStep123B: true,
    },

    redirectUriPolicy: {
      externalRedirectForbidden: true,
      registeredRedirectUriRequiredInFuture: true,
      httpsRequiredOutsideLocalDevelopment: true,
      localhostAllowedOnlyForDevelopment: true,
      pathMustBeCallbackSpecificInFuture: true,
    },

    appModePolicy: {
      draftUsesVersionBeta: true,
      publishedOmitsVersionBeta: true,
      privateAppSelfAuthorizationNotImplementedNow: true,
      publicWebsiteAuthorizationDesignOnly: true,
      appstoreAuthorizationDesignOnly: true,
    },

    forbiddenNow: {
      controllerRoute: true,
      frontendAuthorizeButton: true,
      browserRedirect: true,
      oauthCallbackRoute: true,
      tokenExchangeHttpCall: true,
      refreshTokenPersistence: true,
      accessTokenPersistence: true,
      clientSecretPersistence: true,
      oauthStatePersistence: true,
      amazonCredentialSchema: true,
      amazonTokenSchema: true,
      realSpApiHttpCall: true,
      createReportCall: true,
      getReportCall: true,
      getReportDocumentCall: true,
      transactionWrite: true,
      inventoryWrite: true,
    },

    summary: {
      readyForAuthorizationUrlBuilderImplementation: false,
      readyForAuthorizeRouteImplementation: false,
      readyForFrontendAuthorizeButton: false,
      readyForCallbackPreflightContract: true,
      readyForCallbackImplementation: false,
      readyForTokenPersistence: false,
      readyForRealSpApiReportRequest: false,
    },
  };
}

export function assertAmazonSpApiLwaAuthorizationUrlBuilderContract(
  contract: AmazonSpApiLwaAuthorizationUrlBuilderContract,
): AmazonSpApiLwaAuthorizationUrlBuilderContract {
  if (contract.version !== AMAZON_SP_API_LWA_AUTHORIZATION_URL_BUILDER_CONTRACT_VERSION) {
    throw new Error('Step123-C LWA authorization URL builder contract violation: version mismatch.');
  }

  assertAmazonSpApiLwaOAuthStateContract(contract.sourceStep123B);

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
    throw new Error('Step123-C LWA authorization URL builder contract violation: implementation boundary mismatch.');
  }

  for (const [key, required] of Object.entries(contract.builderBoundary)) {
    if (key === 'purpose') continue;
    if (required !== true) {
      throw new Error(`Step123-C LWA authorization URL builder contract violation: builderBoundary.${key} must remain true.`);
    }
  }

  for (const [key, required] of Object.entries(contract.regionalEndpointContract)) {
    if (key === 'allowedConsentEndpoints' || key === 'defaultJapanRegion' || key === 'defaultJapanMarketplaceId') {
      continue;
    }

    if (required !== true) {
      throw new Error(`Step123-C LWA authorization URL builder contract violation: regionalEndpointContract.${key} must remain true.`);
    }
  }

  if (
    contract.regionalEndpointContract.allowedConsentEndpoints.FE !== 'https://sellercentral.amazon.co.jp/apps/authorize/consent' ||
    contract.regionalEndpointContract.allowedConsentEndpoints.NA !== 'https://sellercentral.amazon.com/apps/authorize/consent' ||
    contract.regionalEndpointContract.allowedConsentEndpoints.EU !== 'https://sellercentral-europe.amazon.com/apps/authorize/consent'
  ) {
    throw new Error('Step123-C LWA authorization URL builder contract violation: regional consent endpoint mismatch.');
  }

  if (
    contract.regionalEndpointContract.defaultJapanRegion !== 'FE' ||
    contract.regionalEndpointContract.defaultJapanMarketplaceId !== 'A1VC38T7YXB528'
  ) {
    throw new Error('Step123-C LWA authorization URL builder contract violation: Japan marketplace defaults mismatch.');
  }

  for (const [key, required] of Object.entries(contract.queryParameterContract)) {
    if (required !== true) {
      throw new Error(`Step123-C LWA authorization URL builder contract violation: queryParameterContract.${key} must remain true.`);
    }
  }

  for (const [key, required] of Object.entries(contract.stateBindingContract)) {
    if (required !== true) {
      throw new Error(`Step123-C LWA authorization URL builder contract violation: stateBindingContract.${key} must remain true.`);
    }
  }

  for (const [key, required] of Object.entries(contract.redirectUriPolicy)) {
    if (required !== true) {
      throw new Error(`Step123-C LWA authorization URL builder contract violation: redirectUriPolicy.${key} must remain true.`);
    }
  }

  for (const [key, required] of Object.entries(contract.appModePolicy)) {
    if (required !== true) {
      throw new Error(`Step123-C LWA authorization URL builder contract violation: appModePolicy.${key} must remain true.`);
    }
  }

  for (const [key, forbidden] of Object.entries(contract.forbiddenNow)) {
    if (forbidden !== true) {
      throw new Error(`Step123-C LWA authorization URL builder contract violation: forbiddenNow.${key} must remain true.`);
    }
  }

  if (
    contract.summary.readyForAuthorizationUrlBuilderImplementation !== false ||
    contract.summary.readyForAuthorizeRouteImplementation !== false ||
    contract.summary.readyForFrontendAuthorizeButton !== false ||
    contract.summary.readyForCallbackPreflightContract !== true ||
    contract.summary.readyForCallbackImplementation !== false ||
    contract.summary.readyForTokenPersistence !== false ||
    contract.summary.readyForRealSpApiReportRequest !== false
  ) {
    throw new Error('Step123-C LWA authorization URL builder contract violation: summary readiness mismatch.');
  }

  return contract;
}
