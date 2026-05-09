const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');

const files = {
  contract: path.join(
    root,
    'apps/api/src/imports/dto/amazon-sp-api-lwa-http-execution-boundary-contract.dto.ts',
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

console.log('========== Step136-G LWA HTTP execution boundary contract smoke ==========');

assertIncludes('contract', contract, "source: 'amazon-sp-api-lwa-http-execution-boundary-contract'");
assertIncludes('contract', contract, "step: 'Step136-G'");
assertIncludes('contract', contract, "phase: 'contract-only'");
assertIncludes(
  'contract',
  contract,
  "currentRequestBodyBuilderPath:\n      'AmazonSpApiTokenExchangeService.buildRealLwaTokenExchangeRequestBodyLater'",
);
assertIncludes(
  'contract',
  contract,
  "currentHttpPreparationPath:\n      'AmazonSpApiTokenExchangeService.prepareRealLwaHttpExchangeRequestDisabled'",
);
assertIncludes(
  'contract',
  contract,
  "plannedHttpTransportPath:\n      'AmazonSpApiTokenExchangeService.executeRealLwaTokenExchangeHttpLater'",
);
assertIncludes(
  'contract',
  contract,
  "currentCallbackExchangePath:\n      'AmazonSpApiTokenExchangeService.exchangeAuthorizationCodeDryRunnable'",
);

for (const marker of [
  'httpTransportImplementedNow: false',
  'httpExecutedNow: false',
  'callbackRuntimeChangedNow: false',
  'controllerRouteChangedNow: false',
  'tokenPersistenceChangedNow: false',
  'configValidatorStatusMustBeReady: true',
  'requestBodyBuilderMustBeReady: true',
  'rawBodyMayOnlyFlowFromBuilderToTransport: true',
  'serverSideFeatureGateMustBeEnabled: true',
  'envFlagAloneIsNotEnough: true',
  'tokenEndpointMustBeHttps: true',
  'redirectUriMustMatchAuthorizationUrl: true',
  'callbackStateMustBeValidatedBeforeHttp: true',
  'companyIdMustBeResolvedFromTrustedState: true',
  'storeIdMustBeResolvedFromTrustedState: true',
  "method: 'POST'",
  "endpoint: 'https://api.amazon.com/auth/o2/token'",
  "contentType: 'application/x-www-form-urlencoded'",
  'timeoutMs: 10000',
  'maxAttempts: 1',
  'retryNetworkErrorsNow: false',
  'retryLwa4xxNow: false',
  'retryLwa5xxNow: false',
  'idempotencyKeyUsedNow: false',
  "allowedExecutableClientLater: 'node-fetch-or-undici-later'",
  'executableClientUsedNow: false',
  'rawRequestBodyMayBeBuiltInsideTransport: true',
  'rawRequestBodyMayBeLogged: false',
  'rawRequestBodyMayBeReturnedToController: false',
  'rawRequestBodyMayBeReturnedToFrontend: false',
  'rawAuthorizationCodeMayBeLogged: false',
  'rawClientIdMayBeLogged: false',
  'rawClientSecretMayBeLogged: false',
  'sanitizedRequestShapeMayBeLogged: true',
  'rawLwaResponseMayBeParsedInsideTransport: true',
  'rawLwaResponseMayBeLogged: false',
  'rawAccessTokenMayBeLogged: false',
  'rawRefreshTokenMayBeLogged: false',
  'rawAccessTokenMayBeReturnedToController: false',
  'rawRefreshTokenMayBeReturnedToController: false',
  'rawAccessTokenMayBeReturnedToFrontend: false',
  'rawRefreshTokenMayBeReturnedToFrontend: false',
  'sanitizedResponseShapeMayBeReturned: true',
  "'access_token'",
  "'refresh_token'",
  "'token_type'",
  "'expires_in'",
  "source: 'amazon-sp-api-lwa-http-execution'",
  "transportMode: 'real-lwa-http'",
  'sanitizedTokenEnvelopeOnly: true',
  'refreshTokenPersistenceInputEncryptedLater: true',
  'accessTokenCacheInputEncryptedLater: true',
  'rawTokensReturnedNow: false',
  'errorCodeRedacted: true',
  'errorDescriptionRedacted: true',
  'rawErrorBodyLogged: false',
  'rawErrorBodyReturned: false',
  'rawRequestBodyReturned: false',
  'noTokenPersistenceOnFailure: true',
  'tokenPersistenceDatabaseWriteNow: false',
  'plaintextRefreshTokenMayOnlyEnterEncryptionInputLater: true',
  'plaintextAccessTokenMayOnlyEnterEncryptionInputLater: true',
  'encryptedRefreshCredentialRequiredLater: true',
  'encryptedAccessTokenCacheRequiredLater: true',
  'plaintextTokenDatabaseWriteAllowed: false',
  'reportsApiCallNow: false',
  'importJobWriteNow: false',
  'transactionWriteNow: false',
  'inventoryWriteNow: false',
  'implementsHttpTransportNow: false',
  'usesFetchNow: false',
  'usesAxiosNow: false',
  'usesHttpRequestNow: false',
  'sendsLwaHttpNow: false',
  'wiresCallbackToRealLwaNow: false',
  'changesOAuthCallbackRouteNow: false',
  'changesTokenPersistenceNow: false',
  'enablesReportsApiNow: false',
  'createsImportJobNow: false',
  'createsImportStagingRowNow: false',
  'createsTransactionNow: false',
  'createsInventoryMovementNow: false',
  "nextSuggestedStep: 'Step136-H'",
]) {
  assertIncludes('contract', contract, marker);
}

for (const forbidden of [
  'httpTransportImplementedNow: true',
  'httpExecutedNow: true',
  'callbackRuntimeChangedNow: true',
  'controllerRouteChangedNow: true',
  'tokenPersistenceChangedNow: true',
  'executableClientUsedNow: true',
  'rawRequestBodyMayBeLogged: true',
  'rawRequestBodyMayBeReturnedToController: true',
  'rawRequestBodyMayBeReturnedToFrontend: true',
  'rawAuthorizationCodeMayBeLogged: true',
  'rawClientIdMayBeLogged: true',
  'rawClientSecretMayBeLogged: true',
  'rawLwaResponseMayBeLogged: true',
  'rawAccessTokenMayBeLogged: true',
  'rawRefreshTokenMayBeLogged: true',
  'rawAccessTokenMayBeReturnedToController: true',
  'rawRefreshTokenMayBeReturnedToController: true',
  'tokenPersistenceDatabaseWriteNow: true',
  'reportsApiCallNow: true',
  'importJobWriteNow: true',
  'transactionWriteNow: true',
  'inventoryWriteNow: true',
  'implementsHttpTransportNow: true',
  'usesFetchNow: true',
  'usesAxiosNow: true',
  'usesHttpRequestNow: true',
  'sendsLwaHttpNow: true',
  'wiresCallbackToRealLwaNow: true',
  'createsImportJobNow: true',
  'createsTransactionNow: true',
  'createsInventoryMovementNow: true',
]) {
  assertNotIncludes('contract', contract, forbidden);
}

assertIncludes('service', service, 'buildRealLwaTokenExchangeRequestBodyLater');
assertIncludes('service', service, 'prepareRealLwaHttpExchangeRequestDisabled');
assertIncludes('service', service, 'requestBodyConstructedNow: false');
assertIncludes('service', service, 'requestBodyLoggedNow: false');
assertIncludes('service', service, 'rawRequestBodyReturnedNow: false');
assertNotIncludes('service', service, 'executeRealLwaTokenExchangeHttpLater');
assertNotIncludes('service', service, 'fetch(');
assertNotIncludes('service', service, 'axios.');
assertNotIncludes('service', service, 'http.request');
assertNotIncludes('service', service, 'https.request');
assertNotIncludes('service', service, 'request.write(');
assertNotIncludes('service', service, '.post(');

assertIncludes('controller', controller, 'exchangeAuthorizationCodeDryRunnable');
assertNotIncludes('controller', controller, 'executeRealLwaTokenExchangeHttpLater');
assertNotIncludes('controller', controller, 'buildRealLwaTokenExchangeRequestBodyLater');
assertNotIncludes('controller', controller, 'prepareRealLwaHttpExchangeRequestDisabled');
assertNotIncludes('controller', controller, 'exchangeAuthorizationCodeWithLwaLater');

console.log('========== Step136-G LWA HTTP execution boundary contract smoke passed ==========');
