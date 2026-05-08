import {
  assertAmazonSpApiOAuthCallbackPreflightContract,
  buildAmazonSpApiOAuthCallbackPreflightContract,
  type AmazonSpApiOAuthCallbackPreflightContract,
} from './amazon-sp-api-oauth-callback-preflight-contract.dto';

export const AMAZON_SP_API_TOKEN_EXCHANGE_PREFLIGHT_CONTRACT_VERSION =
  'amazon-sp-api-token-exchange-preflight-contract-v1' as const;

export type AmazonSpApiTokenExchangeGrantType = 'authorization_code';

export type AmazonSpApiTokenExchangeFailureAction = 'reject';

export type AmazonSpApiTokenExchangePreflightContract = {
  version: typeof AMAZON_SP_API_TOKEN_EXCHANGE_PREFLIGHT_CONTRACT_VERSION;
  sourceStep123D: AmazonSpApiOAuthCallbackPreflightContract;

  contractOnly: true;
  implementationNow: false;
  backendRouteAddedNow: false;
  frontendRouteAddedNow: false;
  schemaChangedNow: false;
  tokenPersistenceNow: false;
  realSpApiRequestNow: false;
  writesDatabase: false;

  tokenExchangeBoundary: {
    purpose: 'validate-token-exchange-request-response-contract-only';
    requestShapeDesignOnly: true;
    responseShapeDesignOnly: true;
    httpCallForbiddenNow: true;
    tokenPersistenceForbiddenNow: true;
    credentialSchemaForbiddenNow: true;
    tokenSchemaForbiddenNow: true;
  };

  tokenEndpointRequestContract: {
    tokenEndpoint: 'https://api.amazon.com/auth/o2/token';
    httpMethod: 'POST';
    contentType: 'application/x-www-form-urlencoded';
    grantType: AmazonSpApiTokenExchangeGrantType;
    grantTypeRequired: true;
    authorizationCodeRequired: true;
    authorizationCodeMustComeFromStep123DSpapiOAuthCode: true;
    authorizationCodeSingleUseRequired: true;
    redirectUriRequired: true;
    redirectUriMustMatchAuthorizationUrlBuilder: true;
    clientIdRequired: true;
    clientSecretRequired: true;
    clientSecretMustComeFromSecureServerConfigInFuture: true;
    browserSideExchangeForbidden: true;
  };

  tokenEndpointResponseContract: {
    accessTokenExpected: true;
    refreshTokenExpected: true;
    tokenTypeExpected: true;
    expiresInExpected: true;
    scopeOptional: true;
    rawResponseLoggingForbidden: true;
    responseValidationRequiredBeforePersistence: true;
  };

  secretHandlingPolicy: {
    clientSecretMustNeverBeExposedToFrontend: true;
    clientSecretMustNeverBeLogged: true;
    authorizationCodeMustBeRedactedInLogs: true;
    accessTokenMustBeRedactedInLogs: true;
    refreshTokenMustBeRedactedInLogs: true;
    encryptedAtRestRequiredBeforePersistence: true;
    keyRotationPolicyRequiredBeforePersistence: true;
  };

  futurePersistencePolicy: {
    amazonCredentialSchemaRequiresSeparateStep: true;
    amazonTokenSchemaRequiresSeparateStep: true;
    tokenPersistenceRequiresSeparateStep: true;
    companyIdRequiredBeforePersistence: true;
    storeIdRequiredBeforePersistence: true;
    marketplaceIdRequiredBeforePersistence: true;
    regionRequiredBeforePersistence: true;
    sellingPartnerIdRequiredBeforePersistence: true;
    refreshTokenEncryptedAtRestRequired: true;
    accessTokenCacheEncryptedAtRestRequired: true;
    revokeDisconnectRequired: true;
    auditLogRequired: true;
  };

  errorResponseContract: {
    invalidGrantRejected: true;
    invalidClientRejected: true;
    invalidRequestRejected: true;
    unauthorizedClientRejected: true;
    serverErrorRetriableInFuture: true;
    throttlingRetriableInFuture: true;
    rawErrorBodyLoggingForbidden: true;
  };

  linkageContract: {
    callbackStateMustBeValidatedBeforeExchange: true;
    sellingPartnerIdMustBeValidatedBeforeExchange: true;
    companyStoreMarketplaceRegionMustBeResolvedBeforeExchange: true;
    tokenExchangeMustNotCreateImportJobNow: true;
    tokenExchangeMustNotCreateTransactionNow: true;
    tokenExchangeMustNotCreateInventoryMovementNow: true;
  };

  forbiddenNow: {
    tokenExchangeHttpCall: true;
    callbackControllerRoute: true;
    authorizationControllerRoute: true;
    frontendConnectionButton: true;
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
    importJobWrite: true;
    transactionWrite: true;
    inventoryWrite: true;
  };

  summary: {
    readyForTokenExchangeImplementation: false;
    readyForTokenPersistenceSchemaContract: true;
    readyForTokenPersistenceImplementation: false;
    readyForConnectionStatusReadModelContract: false;
    readyForRealSpApiReportRequest: false;
    readyForCommittedSales: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiTokenExchangePreflightContract(): AmazonSpApiTokenExchangePreflightContract {
  const step123D = assertAmazonSpApiOAuthCallbackPreflightContract(
    buildAmazonSpApiOAuthCallbackPreflightContract(),
  );

  return {
    version: AMAZON_SP_API_TOKEN_EXCHANGE_PREFLIGHT_CONTRACT_VERSION,
    sourceStep123D: step123D,

    contractOnly: true,
    implementationNow: false,
    backendRouteAddedNow: false,
    frontendRouteAddedNow: false,
    schemaChangedNow: false,
    tokenPersistenceNow: false,
    realSpApiRequestNow: false,
    writesDatabase: false,

    tokenExchangeBoundary: {
      purpose: 'validate-token-exchange-request-response-contract-only',
      requestShapeDesignOnly: true,
      responseShapeDesignOnly: true,
      httpCallForbiddenNow: true,
      tokenPersistenceForbiddenNow: true,
      credentialSchemaForbiddenNow: true,
      tokenSchemaForbiddenNow: true,
    },

    tokenEndpointRequestContract: {
      tokenEndpoint: 'https://api.amazon.com/auth/o2/token',
      httpMethod: 'POST',
      contentType: 'application/x-www-form-urlencoded',
      grantType: 'authorization_code',
      grantTypeRequired: true,
      authorizationCodeRequired: true,
      authorizationCodeMustComeFromStep123DSpapiOAuthCode: true,
      authorizationCodeSingleUseRequired: true,
      redirectUriRequired: true,
      redirectUriMustMatchAuthorizationUrlBuilder: true,
      clientIdRequired: true,
      clientSecretRequired: true,
      clientSecretMustComeFromSecureServerConfigInFuture: true,
      browserSideExchangeForbidden: true,
    },

    tokenEndpointResponseContract: {
      accessTokenExpected: true,
      refreshTokenExpected: true,
      tokenTypeExpected: true,
      expiresInExpected: true,
      scopeOptional: true,
      rawResponseLoggingForbidden: true,
      responseValidationRequiredBeforePersistence: true,
    },

    secretHandlingPolicy: {
      clientSecretMustNeverBeExposedToFrontend: true,
      clientSecretMustNeverBeLogged: true,
      authorizationCodeMustBeRedactedInLogs: true,
      accessTokenMustBeRedactedInLogs: true,
      refreshTokenMustBeRedactedInLogs: true,
      encryptedAtRestRequiredBeforePersistence: true,
      keyRotationPolicyRequiredBeforePersistence: true,
    },

    futurePersistencePolicy: {
      amazonCredentialSchemaRequiresSeparateStep: true,
      amazonTokenSchemaRequiresSeparateStep: true,
      tokenPersistenceRequiresSeparateStep: true,
      companyIdRequiredBeforePersistence: true,
      storeIdRequiredBeforePersistence: true,
      marketplaceIdRequiredBeforePersistence: true,
      regionRequiredBeforePersistence: true,
      sellingPartnerIdRequiredBeforePersistence: true,
      refreshTokenEncryptedAtRestRequired: true,
      accessTokenCacheEncryptedAtRestRequired: true,
      revokeDisconnectRequired: true,
      auditLogRequired: true,
    },

    errorResponseContract: {
      invalidGrantRejected: true,
      invalidClientRejected: true,
      invalidRequestRejected: true,
      unauthorizedClientRejected: true,
      serverErrorRetriableInFuture: true,
      throttlingRetriableInFuture: true,
      rawErrorBodyLoggingForbidden: true,
    },

    linkageContract: {
      callbackStateMustBeValidatedBeforeExchange: true,
      sellingPartnerIdMustBeValidatedBeforeExchange: true,
      companyStoreMarketplaceRegionMustBeResolvedBeforeExchange: true,
      tokenExchangeMustNotCreateImportJobNow: true,
      tokenExchangeMustNotCreateTransactionNow: true,
      tokenExchangeMustNotCreateInventoryMovementNow: true,
    },

    forbiddenNow: {
      tokenExchangeHttpCall: true,
      callbackControllerRoute: true,
      authorizationControllerRoute: true,
      frontendConnectionButton: true,
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
      importJobWrite: true,
      transactionWrite: true,
      inventoryWrite: true,
    },

    summary: {
      readyForTokenExchangeImplementation: false,
      readyForTokenPersistenceSchemaContract: true,
      readyForTokenPersistenceImplementation: false,
      readyForConnectionStatusReadModelContract: false,
      readyForRealSpApiReportRequest: false,
      readyForCommittedSales: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiTokenExchangePreflightContract(
  contract: AmazonSpApiTokenExchangePreflightContract,
): AmazonSpApiTokenExchangePreflightContract {
  if (contract.version !== AMAZON_SP_API_TOKEN_EXCHANGE_PREFLIGHT_CONTRACT_VERSION) {
    throw new Error('Step123-E token exchange preflight contract violation: version mismatch.');
  }

  assertAmazonSpApiOAuthCallbackPreflightContract(contract.sourceStep123D);

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
    throw new Error('Step123-E token exchange preflight contract violation: implementation boundary mismatch.');
  }

  for (const [key, required] of Object.entries(contract.tokenExchangeBoundary)) {
    if (key === 'purpose') continue;
    if (required !== true) {
      throw new Error(`Step123-E token exchange preflight contract violation: tokenExchangeBoundary.${key} must remain true.`);
    }
  }

  if (
    contract.tokenEndpointRequestContract.tokenEndpoint !== 'https://api.amazon.com/auth/o2/token' ||
    contract.tokenEndpointRequestContract.httpMethod !== 'POST' ||
    contract.tokenEndpointRequestContract.contentType !== 'application/x-www-form-urlencoded' ||
    contract.tokenEndpointRequestContract.grantType !== 'authorization_code'
  ) {
    throw new Error('Step123-E token exchange preflight contract violation: token endpoint request static fields mismatch.');
  }

  for (const [key, required] of Object.entries(contract.tokenEndpointRequestContract)) {
    if (['tokenEndpoint', 'httpMethod', 'contentType', 'grantType'].includes(key)) continue;
    if (required !== true) {
      throw new Error(`Step123-E token exchange preflight contract violation: tokenEndpointRequestContract.${key} must remain true.`);
    }
  }

  for (const [key, required] of Object.entries(contract.tokenEndpointResponseContract)) {
    if (required !== true) {
      throw new Error(`Step123-E token exchange preflight contract violation: tokenEndpointResponseContract.${key} must remain true.`);
    }
  }

  for (const [key, required] of Object.entries(contract.secretHandlingPolicy)) {
    if (required !== true) {
      throw new Error(`Step123-E token exchange preflight contract violation: secretHandlingPolicy.${key} must remain true.`);
    }
  }

  for (const [key, required] of Object.entries(contract.futurePersistencePolicy)) {
    if (required !== true) {
      throw new Error(`Step123-E token exchange preflight contract violation: futurePersistencePolicy.${key} must remain true.`);
    }
  }

  for (const [key, required] of Object.entries(contract.errorResponseContract)) {
    if (required !== true) {
      throw new Error(`Step123-E token exchange preflight contract violation: errorResponseContract.${key} must remain true.`);
    }
  }

  for (const [key, required] of Object.entries(contract.linkageContract)) {
    if (required !== true) {
      throw new Error(`Step123-E token exchange preflight contract violation: linkageContract.${key} must remain true.`);
    }
  }

  for (const [key, forbidden] of Object.entries(contract.forbiddenNow)) {
    if (forbidden !== true) {
      throw new Error(`Step123-E token exchange preflight contract violation: forbiddenNow.${key} must remain true.`);
    }
  }

  if (
    contract.summary.readyForTokenExchangeImplementation !== false ||
    contract.summary.readyForTokenPersistenceSchemaContract !== true ||
    contract.summary.readyForTokenPersistenceImplementation !== false ||
    contract.summary.readyForConnectionStatusReadModelContract !== false ||
    contract.summary.readyForRealSpApiReportRequest !== false ||
    contract.summary.readyForCommittedSales !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step123-E token exchange preflight contract violation: summary readiness mismatch.');
  }

  return contract;
}
