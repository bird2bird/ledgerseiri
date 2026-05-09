const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');

const files = {
  contract: path.join(
    root,
    'apps/api/src/imports/dto/amazon-sp-api-lwa-request-body-builder-boundary-contract.dto.ts',
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

console.log('========== Step136-D LWA request body builder boundary contract smoke ==========');

assertIncludes('contract', contract, "source: 'amazon-sp-api-lwa-request-body-builder-boundary-contract'");
assertIncludes('contract', contract, "step: 'Step136-D'");
assertIncludes('contract', contract, "phase: 'contract-only'");
assertIncludes(
  'contract',
  contract,
  "currentHttpPreparationPath:\n      'AmazonSpApiTokenExchangeService.prepareRealLwaHttpExchangeRequestDisabled'",
);
assertIncludes(
  'contract',
  contract,
  "plannedRequestBodyBuilderPath:\n      'AmazonSpApiTokenExchangeService.buildRealLwaTokenExchangeRequestBodyLater'",
);
assertIncludes(
  'contract',
  contract,
  "currentCallbackExchangePath:\n      'AmazonSpApiTokenExchangeService.exchangeAuthorizationCodeDryRunnable'",
);

for (const marker of [
  'requestBodyBuilderImplementedNow: false',
  'requestBodyConstructedNow: false',
  'requestBodyLoggedNow: false',
  'requestBodyReturnedToControllerNow: false',
  'requestBodyReturnedToFrontendNow: false',
  'httpExecutedNow: false',
  'callbackRuntimeChangedNow: false',
  "contentType: 'application/x-www-form-urlencoded'",
  "encodingApi: 'URLSearchParams'",
  "method: 'POST'",
  "endpoint: 'https://api.amazon.com/auth/o2/token'",
  'sortedFieldOrderRequired: true',
  "'grant_type'",
  "'code'",
  "'redirect_uri'",
  "'client_id'",
  "'client_secret'",
  "grant_type: 'authorization_code'",
  "code: 'callback authorization code'",
  "redirect_uri: 'must match authorization-url redirect_uri'",
  "client_id: 'server-side LWA client id'",
  "client_secret: 'server-side LWA client secret'",
  'authorizationCodeMayEnterBuilderInput: true',
  'clientSecretMayEnterBuilderInput: true',
  'clientIdMayEnterBuilderInput: true',
  'rawAuthorizationCodeMayBeEncodedIntoRequestBody: true',
  'rawClientSecretMayBeEncodedIntoRequestBody: true',
  'rawClientIdMayBeEncodedIntoRequestBody: true',
  'rawAuthorizationCodeMayBeLogged: false',
  'rawClientSecretMayBeLogged: false',
  'rawClientIdMayBeLogged: false',
  'rawRequestBodyMayBeLogged: false',
  'rawRequestBodyMayBeReturned: false',
  'returnsRawBodyOnlyToHttpTransportLayer: true',
  'returnsSanitizedShapeToCaller: true',
  "'requestBody'",
  "'rawBody'",
  'rejectMissingAuthorizationCode: true',
  'rejectMissingRedirectUri: true',
  'rejectMissingClientId: true',
  'rejectMissingClientSecret: true',
  'rejectNonHttpsTokenEndpoint: true',
  'rejectMismatchedRedirectUri: true',
  'rejectNonReadyConfigValidator: true',
  'rejectDisabledServerFeatureGate: true',
  'buildRequestBodyNow: false',
  'tokenExchangeHttpCallNow: false',
  'lwaHttpCallNow: false',
  'realSpApiRequestNow: false',
  'tokenPersistenceDatabaseWriteNow: false',
  'reportsApiCallNow: false',
  'importJobWriteNow: false',
  'transactionWriteNow: false',
  'inventoryWriteNow: false',
  'rawAuthorizationCodeReturnedNow: false',
  'rawClientIdReturnedNow: false',
  'rawClientSecretReturnedNow: false',
  'rawRefreshTokenReturnedNow: false',
  'rawAccessTokenReturnedNow: false',
  'implementsRequestBodyBuilderNow: false',
  'constructsUrlSearchParamsNow: false',
  'sendsLwaHttpNow: false',
  'wiresCallbackToRealLwaNow: false',
  'changesOAuthCallbackRouteNow: false',
  'changesTokenPersistenceNow: false',
  'enablesReportsApiNow: false',
  'createsImportJobNow: false',
  'createsImportStagingRowNow: false',
  'createsTransactionNow: false',
  'createsInventoryMovementNow: false',
  "nextSuggestedStep: 'Step136-E'",
]) {
  assertIncludes('contract', contract, marker);
}

for (const forbidden of [
  'requestBodyBuilderImplementedNow: true',
  'requestBodyConstructedNow: true',
  'requestBodyLoggedNow: true',
  'requestBodyReturnedToControllerNow: true',
  'requestBodyReturnedToFrontendNow: true',
  'httpExecutedNow: true',
  'callbackRuntimeChangedNow: true',
  'rawAuthorizationCodeMayBeLogged: true',
  'rawClientSecretMayBeLogged: true',
  'rawClientIdMayBeLogged: true',
  'rawRequestBodyMayBeLogged: true',
  'rawRequestBodyMayBeReturned: true',
  'buildRequestBodyNow: true',
  'tokenExchangeHttpCallNow: true',
  'lwaHttpCallNow: true',
  'realSpApiRequestNow: true',
  'tokenPersistenceDatabaseWriteNow: true',
  'reportsApiCallNow: true',
  'importJobWriteNow: true',
  'transactionWriteNow: true',
  'inventoryWriteNow: true',
  'implementsRequestBodyBuilderNow: true',
  'constructsUrlSearchParamsNow: true',
  'sendsLwaHttpNow: true',
  'wiresCallbackToRealLwaNow: true',
  'createsImportJobNow: true',
  'createsTransactionNow: true',
  'createsInventoryMovementNow: true',
]) {
  assertNotIncludes('contract', contract, forbidden);
}

assertIncludes('service', service, 'prepareRealLwaHttpExchangeRequestDisabled');
assertIncludes('service', service, 'requestBodyConstructedNow: false');
assertIncludes('service', service, 'requestBodyLoggedNow: false');
assertIncludes('service', service, 'responseBodyParsedNow: false');
assertIncludes('service', service, "nextImplementationStep: 'Step136-C'");
assertNotIncludes('service', service, 'buildRealLwaTokenExchangeRequestBodyLater');
assertNotIncludes('service', service, 'new URLSearchParams(');
assertNotIncludes('service', service, 'requestBody:');
assertNotIncludes('service', service, 'rawBody:');

assertIncludes('controller', controller, 'exchangeAuthorizationCodeDryRunnable');
assertNotIncludes('controller', controller, 'prepareRealLwaHttpExchangeRequestDisabled');
assertNotIncludes('controller', controller, 'buildRealLwaTokenExchangeRequestBodyLater');

console.log('========== Step136-D LWA request body builder boundary contract smoke passed ==========');
