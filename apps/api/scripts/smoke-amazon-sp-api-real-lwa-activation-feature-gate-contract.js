const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');

const files = {
  contract: path.join(
    root,
    'apps/api/src/imports/dto/amazon-sp-api-real-lwa-activation-feature-gate-contract.dto.ts',
  ),
  service: path.join(root, 'apps/api/src/imports/amazon-sp-api-token-exchange.service.ts'),
  controller: path.join(root, 'apps/api/src/imports/imports.controller.ts'),
};

function read(file) {
  if (!fs.existsSync(file)) throw new Error(`Missing file: ${path.relative(root, file)}`);
  return fs.readFileSync(file, 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`[OK] ${message}`);
}

function assertIncludes(name, text, marker) {
  assert(text.includes(marker), `${name} contains marker: ${marker}`);
}

function assertNotIncludes(name, text, marker) {
  assert(!text.includes(marker), `${name} does not contain forbidden marker: ${marker}`);
}

const contract = read(files.contract);
const service = read(files.service);
const controller = read(files.controller);

console.log('========== Step137-A real LWA activation feature-gate contract smoke ==========');

for (const marker of [
  "source: 'amazon-sp-api-real-lwa-activation-feature-gate-contract'",
  "step: 'Step137-A'",
  "phase: 'contract-only'",
  "currentDisabledChainPath:\n      'AmazonSpApiTokenExchangeService.orchestrateRealLwaExchangeChainDisabledLater'",
  "currentDisabledHttpTransportPath:\n      'AmazonSpApiTokenExchangeService.executeRealLwaTokenExchangeHttpLater'",
  "currentRequestBodyBuilderPath:\n      'AmazonSpApiTokenExchangeService.buildRealLwaTokenExchangeRequestBodyLater'",
  "currentCallbackPath:\n      'AmazonSpApiTokenExchangeService.exchangeAuthorizationCodeDryRunnable'",
  "plannedActivationGatePath:\n      'AmazonSpApiRealLwaActivationGateService.evaluateRealLwaActivationLater'",
  'activationGateImplementedNow: false',
  'callbackRuntimeChangedNow: false',
  'controllerRouteChangedNow: false',
  'realHttpEnabledNow: false',
  'tokenPersistenceChangedNow: false',
  'configValidatorStatusMustBeReady: true',
  'clientIdPresent: true',
  'clientSecretPresent: true',
  'redirectUriPresent: true',
  'marketplaceIdPresent: true',
  'regionPresent: true',
  'tokenEndpointMustBeHttps: true',
  'callbackStateMustBeTrusted: true',
  'companyIdMustBeResolvedFromTrustedState: true',
  'storeIdMustBeResolvedFromTrustedState: true',
  'sellingPartnerIdMustBePresent: true',
  'authorizationCodeMustBePresent: true',
  'redirectUriMustMatchAuthorizationRequest: true',
  'serverSideRuntimeGateMustBeEnabled: true',
  'environmentMustAllowRealLwaHttp: true',
  'companyStoreAllowlistRequiredInitially: true',
  'explicitOperatorConfirmationRequiredInitially: true',
  'envFlagAloneEnablesRealHttp: false',
  'frontendCanEnableRealHttp: false',
  'queryParamCanEnableRealHttp: false',
  'callbackParamCanEnableRealHttp: false',
  'unauthenticatedUserCanEnableRealHttp: false',
  'missingCompanyScopeCanEnableRealHttp: false',
  'missingStoreScopeCanEnableRealHttp: false',
  "source: 'amazon-sp-api-real-lwa-activation-gate'",
  "gateDecision: 'blocked'",
  'realHttpAllowedNow: false',
  'reasonRedacted: true',
  "nextImplementationStep: 'Step137-B'",
  "method: 'POST'",
  "endpoint: 'https://api.amazon.com/auth/o2/token'",
  "contentType: 'application/x-www-form-urlencoded'",
  'timeoutMs: 10000',
  'retryInitiallyAllowed: false',
  "allowedClientLater: 'undici-or-node-fetch-later'",
  'executableClientUsedNow: false',
  "grantType: 'authorization_code'",
  'includesCode: true',
  'includesRedirectUri: true',
  'includesClientId: true',
  'includesClientSecret: true',
  'rawBodyMayBeBuiltOnlyInsideServiceLater: true',
  'rawBodyMayBeLogged: false',
  'rawBodyMayBeReturnedToController: false',
  'rawBodyMayBeReturnedToFrontend: false',
  'rawLwaResponseMayBeParsedInsideServiceLater: true',
  'rawLwaResponseMayBeLogged: false',
  'rawLwaResponseMayBeReturnedToController: false',
  'rawLwaResponseMayBeReturnedToFrontend: false',
  'rawAccessTokenMayBeLogged: false',
  'rawRefreshTokenMayBeLogged: false',
  'rawAccessTokenMayBeReturned: false',
  'rawRefreshTokenMayBeReturned: false',
  'sanitizedEnvelopeOnly: true',
  'persistenceImplementedNow: false',
  'plaintextRefreshTokenMayOnlyEnterEncryptionInputLater: true',
  'plaintextAccessTokenMayOnlyEnterEncryptionInputLater: true',
  'encryptedRefreshCredentialRequired: true',
  'encryptedAccessTokenCacheRequired: true',
  'plaintextTokenDatabaseWriteAllowed: false',
  'persistenceRequiresSeparateStep: true',
  'tokenExchangeHttpCallNow: false',
  'lwaHttpCallNow: false',
  'realSpApiRequestNow: false',
  'tokenPersistenceDatabaseWriteNow: false',
  'reportsApiCallNow: false',
  'importJobWriteNow: false',
  'importStagingRowWriteNow: false',
  'transactionWriteNow: false',
  'inventoryWriteNow: false',
  'rawAuthorizationCodeReturnedNow: false',
  'rawClientIdReturnedNow: false',
  'rawClientSecretReturnedNow: false',
  'rawRequestBodyReturnedNow: false',
  'rawLwaResponseReturnedNow: false',
  'rawAccessTokenReturnedNow: false',
  'rawRefreshTokenReturnedNow: false',
  'implementsActivationGateNow: false',
  'enablesRealHttpNow: false',
  'wiresCallbackToRealLwaNow: false',
  'changesOAuthCallbackRouteNow: false',
  'writesTokenPersistenceNow: false',
  'enablesReportsApiNow: false',
  'createsImportJobNow: false',
  'createsImportStagingRowNow: false',
  'createsTransactionNow: false',
  'createsInventoryMovementNow: false',
  'changesFrontendNow: false',
  "'smoke:amazon-sp-api-real-lwa-exchange-chain-mock-runtime'",
  "'smoke:amazon-sp-api-real-lwa-exchange-chain-disabled'",
  "'smoke:amazon-sp-api-lwa-http-transport-mock-runtime'",
  "'smoke:amazon-sp-api-lwa-http-transport-disabled'",
  "'smoke:amazon-sp-api-lwa-request-body-builder-mock-runtime'",
  "'smoke:amazon-sp-api-lwa-request-body-builder-disabled'",
  "'smoke:amazon-sp-api-real-lwa-http-client-mock-runtime'",
  "'smoke:amazon-sp-api-real-lwa-http-client-disabled-by-default'",
  "'smoke:amazon-sp-api-real-lwa-token-exchange-enablement-boundary-contract'",
  "nextSuggestedStep: 'Step137-B'",
]) {
  assertIncludes('contract', contract, marker);
}

for (const forbidden of [
  'activationGateImplementedNow: true',
  'callbackRuntimeChangedNow: true',
  'controllerRouteChangedNow: true',
  'realHttpEnabledNow: true',
  'tokenPersistenceChangedNow: true',
  'envFlagAloneEnablesRealHttp: true',
  'frontendCanEnableRealHttp: true',
  'queryParamCanEnableRealHttp: true',
  'callbackParamCanEnableRealHttp: true',
  'unauthenticatedUserCanEnableRealHttp: true',
  'missingCompanyScopeCanEnableRealHttp: true',
  'missingStoreScopeCanEnableRealHttp: true',
  'realHttpAllowedNow: true',
  'executableClientUsedNow: true',
  'rawBodyMayBeLogged: true',
  'rawBodyMayBeReturnedToController: true',
  'rawBodyMayBeReturnedToFrontend: true',
  'rawLwaResponseMayBeLogged: true',
  'rawLwaResponseMayBeReturnedToController: true',
  'rawLwaResponseMayBeReturnedToFrontend: true',
  'rawAccessTokenMayBeLogged: true',
  'rawRefreshTokenMayBeLogged: true',
  'rawAccessTokenMayBeReturned: true',
  'rawRefreshTokenMayBeReturned: true',
  'persistenceImplementedNow: true',
  'plaintextTokenDatabaseWriteAllowed: true',
  'tokenExchangeHttpCallNow: true',
  'lwaHttpCallNow: true',
  'realSpApiRequestNow: true',
  'tokenPersistenceDatabaseWriteNow: true',
  'reportsApiCallNow: true',
  'importJobWriteNow: true',
  'importStagingRowWriteNow: true',
  'transactionWriteNow: true',
  'inventoryWriteNow: true',
  'implementsActivationGateNow: true',
  'enablesRealHttpNow: true',
  'wiresCallbackToRealLwaNow: true',
  'writesTokenPersistenceNow: true',
  'createsImportJobNow: true',
  'createsImportStagingRowNow: true',
  'createsTransactionNow: true',
  'createsInventoryMovementNow: true',
]) {
  assertNotIncludes('contract', contract, forbidden);
}

assertIncludes('service', service, 'orchestrateRealLwaExchangeChainDisabledLater');
assertIncludes('service', service, 'executeRealLwaTokenExchangeHttpLater');
assertIncludes('service', service, 'buildRealLwaTokenExchangeRequestBodyLater');
assertNotIncludes('service', service, 'AmazonSpApiRealLwaActivationGateService');
assertNotIncludes('service', service, 'evaluateRealLwaActivationLater');

assertIncludes('controller', controller, 'exchangeAuthorizationCodeDryRunnable');
assertNotIncludes('controller', controller, 'orchestrateRealLwaExchangeChainDisabledLater');
assertNotIncludes('controller', controller, 'executeRealLwaTokenExchangeHttpLater');
assertNotIncludes('controller', controller, 'buildRealLwaTokenExchangeRequestBodyLater');
assertNotIncludes('controller', controller, 'exchangeAuthorizationCodeWithLwaLater');

console.log('========== Step137-A real LWA activation feature-gate contract smoke passed ==========');
