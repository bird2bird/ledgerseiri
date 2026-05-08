import {
  assertAmazonSpApiLwaAuthorizationUrlBuilderContract,
  buildAmazonSpApiLwaAuthorizationUrlBuilderContract,
  type AmazonSpApiLwaAuthorizationUrlBuilderContract,
} from './amazon-sp-api-lwa-authorization-url-builder-contract.dto';

export const AMAZON_SP_API_OAUTH_CALLBACK_PREFLIGHT_CONTRACT_VERSION =
  'amazon-sp-api-oauth-callback-preflight-contract-v1' as const;

export type AmazonSpApiOAuthCallbackOutcome = 'success' | 'error' | 'cancelled';

export type AmazonSpApiOAuthCallbackFailureAction = 'reject';

export type AmazonSpApiOAuthCallbackPreflightContract = {
  version: typeof AMAZON_SP_API_OAUTH_CALLBACK_PREFLIGHT_CONTRACT_VERSION;
  sourceStep123C: AmazonSpApiLwaAuthorizationUrlBuilderContract;

  contractOnly: true;
  implementationNow: false;
  backendRouteAddedNow: false;
  frontendRouteAddedNow: false;
  schemaChangedNow: false;
  tokenPersistenceNow: false;
  realSpApiRequestNow: false;
  writesDatabase: false;

  callbackBoundary: {
    purpose: 'validate-oauth-callback-query-contract-only';
    queryValidationOnly: true;
    stateVerificationDesignOnly: true;
    tokenExchangeForbiddenNow: true;
    callbackRouteExposureForbiddenNow: true;
    browserRedirectHandlingForbiddenNow: true;
  };

  successQueryContract: {
    stateRequired: true;
    spapiOAuthCodeRequired: true;
    sellingPartnerIdRequired: true;
    mwsAuthTokenIgnored: true;
    unknownQueryParametersRejectedInFuture: true;
  };

  errorQueryContract: {
    errorAllowed: true;
    errorDescriptionAllowed: true;
    errorUriAllowed: true;
    stateStillRequiredWhenErrorPresent: true;
    errorCallbackMustNotExchangeToken: true;
    userDeniedAuthorizationTreatedAsCancelled: true;
  };

  statePreflightContract: {
    signedStateRequired: true;
    stateMustComeFromStep123B: true;
    stateMustHaveBeenUsedToBuildStep123CAuthorizationUrl: true;
    companyIdBindingRequired: true;
    storeIdBindingRequired: true;
    marketplaceIdBindingRequired: true;
    regionBindingRequired: true;
    nonceBindingRequired: true;
    expiresAtBindingRequired: true;
    expiredStateRejected: true;
    tamperedStateRejected: true;
    openRedirectRejected: true;
  };

  authorizationCodePolicy: {
    spapiOAuthCodeSingleUseRequiredInFuture: true;
    spapiOAuthCodeMustNotBeLoggedRawInFuture: true;
    spapiOAuthCodeMustNotBePersistedNow: true;
    spapiOAuthCodeExchangeRequiresSeparateStep: true;
    authorizationCodeOneTimeUseInheritedFromStep123A: true;
  };

  sellingPartnerBindingPolicy: {
    sellingPartnerIdRequired: true;
    sellingPartnerIdMustBindToCompanyStoreInFuture: true;
    sellingPartnerMarketplaceCompatibilityRequiredInFuture: true;
    sellingPartnerMismatchRejectedInFuture: true;
  };

  callbackAuditPolicy: {
    auditLogRequiredInFuture: true;
    rawQueryLoggingForbiddenInFuture: true;
    redactedCodeLoggingOnlyInFuture: true;
    callbackOutcomeTrackedInFuture: true;
    companyIdStoreIdMarketplaceIdRegionTrackedInFuture: true;
  };

  failurePolicy: {
    missingState: AmazonSpApiOAuthCallbackFailureAction;
    malformedState: AmazonSpApiOAuthCallbackFailureAction;
    invalidStateSignature: AmazonSpApiOAuthCallbackFailureAction;
    expiredState: AmazonSpApiOAuthCallbackFailureAction;
    missingSpapiOAuthCodeOnSuccess: AmazonSpApiOAuthCallbackFailureAction;
    missingSellingPartnerIdOnSuccess: AmazonSpApiOAuthCallbackFailureAction;
    nonceReplay: AmazonSpApiOAuthCallbackFailureAction;
    companyMismatch: AmazonSpApiOAuthCallbackFailureAction;
    storeMismatch: AmazonSpApiOAuthCallbackFailureAction;
    marketplaceMismatch: AmazonSpApiOAuthCallbackFailureAction;
    regionMismatch: AmazonSpApiOAuthCallbackFailureAction;
    externalRedirect: AmazonSpApiOAuthCallbackFailureAction;
  };

  forbiddenNow: {
    callbackControllerRoute: true;
    frontendCallbackPage: true;
    tokenExchangeHttpCall: true;
    refreshTokenPersistence: true;
    accessTokenPersistence: true;
    clientSecretPersistence: true;
    oauthStatePersistence: true;
    oauthStateSchema: true;
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
    readyForCallbackPreflightImplementation: false;
    readyForCallbackRouteImplementation: false;
    readyForTokenExchangePreflightContract: true;
    readyForTokenExchangeImplementation: false;
    readyForTokenPersistence: false;
    readyForRealSpApiReportRequest: false;
    readyForCommittedSales: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiOAuthCallbackPreflightContract(): AmazonSpApiOAuthCallbackPreflightContract {
  const step123C = assertAmazonSpApiLwaAuthorizationUrlBuilderContract(
    buildAmazonSpApiLwaAuthorizationUrlBuilderContract(),
  );

  return {
    version: AMAZON_SP_API_OAUTH_CALLBACK_PREFLIGHT_CONTRACT_VERSION,
    sourceStep123C: step123C,

    contractOnly: true,
    implementationNow: false,
    backendRouteAddedNow: false,
    frontendRouteAddedNow: false,
    schemaChangedNow: false,
    tokenPersistenceNow: false,
    realSpApiRequestNow: false,
    writesDatabase: false,

    callbackBoundary: {
      purpose: 'validate-oauth-callback-query-contract-only',
      queryValidationOnly: true,
      stateVerificationDesignOnly: true,
      tokenExchangeForbiddenNow: true,
      callbackRouteExposureForbiddenNow: true,
      browserRedirectHandlingForbiddenNow: true,
    },

    successQueryContract: {
      stateRequired: true,
      spapiOAuthCodeRequired: true,
      sellingPartnerIdRequired: true,
      mwsAuthTokenIgnored: true,
      unknownQueryParametersRejectedInFuture: true,
    },

    errorQueryContract: {
      errorAllowed: true,
      errorDescriptionAllowed: true,
      errorUriAllowed: true,
      stateStillRequiredWhenErrorPresent: true,
      errorCallbackMustNotExchangeToken: true,
      userDeniedAuthorizationTreatedAsCancelled: true,
    },

    statePreflightContract: {
      signedStateRequired: true,
      stateMustComeFromStep123B: true,
      stateMustHaveBeenUsedToBuildStep123CAuthorizationUrl: true,
      companyIdBindingRequired: true,
      storeIdBindingRequired: true,
      marketplaceIdBindingRequired: true,
      regionBindingRequired: true,
      nonceBindingRequired: true,
      expiresAtBindingRequired: true,
      expiredStateRejected: true,
      tamperedStateRejected: true,
      openRedirectRejected: true,
    },

    authorizationCodePolicy: {
      spapiOAuthCodeSingleUseRequiredInFuture: true,
      spapiOAuthCodeMustNotBeLoggedRawInFuture: true,
      spapiOAuthCodeMustNotBePersistedNow: true,
      spapiOAuthCodeExchangeRequiresSeparateStep: true,
      authorizationCodeOneTimeUseInheritedFromStep123A: true,
    },

    sellingPartnerBindingPolicy: {
      sellingPartnerIdRequired: true,
      sellingPartnerIdMustBindToCompanyStoreInFuture: true,
      sellingPartnerMarketplaceCompatibilityRequiredInFuture: true,
      sellingPartnerMismatchRejectedInFuture: true,
    },

    callbackAuditPolicy: {
      auditLogRequiredInFuture: true,
      rawQueryLoggingForbiddenInFuture: true,
      redactedCodeLoggingOnlyInFuture: true,
      callbackOutcomeTrackedInFuture: true,
      companyIdStoreIdMarketplaceIdRegionTrackedInFuture: true,
    },

    failurePolicy: {
      missingState: 'reject',
      malformedState: 'reject',
      invalidStateSignature: 'reject',
      expiredState: 'reject',
      missingSpapiOAuthCodeOnSuccess: 'reject',
      missingSellingPartnerIdOnSuccess: 'reject',
      nonceReplay: 'reject',
      companyMismatch: 'reject',
      storeMismatch: 'reject',
      marketplaceMismatch: 'reject',
      regionMismatch: 'reject',
      externalRedirect: 'reject',
    },

    forbiddenNow: {
      callbackControllerRoute: true,
      frontendCallbackPage: true,
      tokenExchangeHttpCall: true,
      refreshTokenPersistence: true,
      accessTokenPersistence: true,
      clientSecretPersistence: true,
      oauthStatePersistence: true,
      oauthStateSchema: true,
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
      readyForCallbackPreflightImplementation: false,
      readyForCallbackRouteImplementation: false,
      readyForTokenExchangePreflightContract: true,
      readyForTokenExchangeImplementation: false,
      readyForTokenPersistence: false,
      readyForRealSpApiReportRequest: false,
      readyForCommittedSales: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiOAuthCallbackPreflightContract(
  contract: AmazonSpApiOAuthCallbackPreflightContract,
): AmazonSpApiOAuthCallbackPreflightContract {
  if (contract.version !== AMAZON_SP_API_OAUTH_CALLBACK_PREFLIGHT_CONTRACT_VERSION) {
    throw new Error('Step123-D OAuth callback preflight contract violation: version mismatch.');
  }

  assertAmazonSpApiLwaAuthorizationUrlBuilderContract(contract.sourceStep123C);

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
    throw new Error('Step123-D OAuth callback preflight contract violation: implementation boundary mismatch.');
  }

  for (const [key, required] of Object.entries(contract.callbackBoundary)) {
    if (key === 'purpose') continue;
    if (required !== true) {
      throw new Error(`Step123-D OAuth callback preflight contract violation: callbackBoundary.${key} must remain true.`);
    }
  }

  for (const [key, required] of Object.entries(contract.successQueryContract)) {
    if (required !== true) {
      throw new Error(`Step123-D OAuth callback preflight contract violation: successQueryContract.${key} must remain true.`);
    }
  }

  for (const [key, required] of Object.entries(contract.errorQueryContract)) {
    if (required !== true) {
      throw new Error(`Step123-D OAuth callback preflight contract violation: errorQueryContract.${key} must remain true.`);
    }
  }

  for (const [key, required] of Object.entries(contract.statePreflightContract)) {
    if (required !== true) {
      throw new Error(`Step123-D OAuth callback preflight contract violation: statePreflightContract.${key} must remain true.`);
    }
  }

  for (const [key, required] of Object.entries(contract.authorizationCodePolicy)) {
    if (required !== true) {
      throw new Error(`Step123-D OAuth callback preflight contract violation: authorizationCodePolicy.${key} must remain true.`);
    }
  }

  for (const [key, required] of Object.entries(contract.sellingPartnerBindingPolicy)) {
    if (required !== true) {
      throw new Error(`Step123-D OAuth callback preflight contract violation: sellingPartnerBindingPolicy.${key} must remain true.`);
    }
  }

  for (const [key, required] of Object.entries(contract.callbackAuditPolicy)) {
    if (required !== true) {
      throw new Error(`Step123-D OAuth callback preflight contract violation: callbackAuditPolicy.${key} must remain true.`);
    }
  }

  for (const [key, action] of Object.entries(contract.failurePolicy)) {
    if (action !== 'reject') {
      throw new Error(`Step123-D OAuth callback preflight contract violation: failurePolicy.${key} must reject.`);
    }
  }

  for (const [key, forbidden] of Object.entries(contract.forbiddenNow)) {
    if (forbidden !== true) {
      throw new Error(`Step123-D OAuth callback preflight contract violation: forbiddenNow.${key} must remain true.`);
    }
  }

  if (
    contract.summary.readyForCallbackPreflightImplementation !== false ||
    contract.summary.readyForCallbackRouteImplementation !== false ||
    contract.summary.readyForTokenExchangePreflightContract !== true ||
    contract.summary.readyForTokenExchangeImplementation !== false ||
    contract.summary.readyForTokenPersistence !== false ||
    contract.summary.readyForRealSpApiReportRequest !== false ||
    contract.summary.readyForCommittedSales !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step123-D OAuth callback preflight contract violation: summary readiness mismatch.');
  }

  return contract;
}
