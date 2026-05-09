const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');

const files = {
  contract: path.join(
    root,
    'apps/api/src/imports/dto/amazon-sp-api-real-lwa-exchange-chain-boundary-contract.dto.ts',
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

console.log('========== Step136-J real LWA exchange chain boundary contract smoke ==========');

assertIncludes('contract', contract, "source: 'amazon-sp-api-real-lwa-exchange-chain-boundary-contract'");
assertIncludes('contract', contract, "step: 'Step136-J'");
assertIncludes('contract', contract, "phase: 'contract-only'");

for (const marker of [
  "currentConfigValidatorPath:\n      'AmazonSpApiLwaEnvConfigValidationService.validateFromProcessEnv'",
  "currentRequestBodyBuilderPath:\n      'AmazonSpApiTokenExchangeService.buildRealLwaTokenExchangeRequestBodyLater'",
  "currentHttpTransportPath:\n      'AmazonSpApiTokenExchangeService.executeRealLwaTokenExchangeHttpLater'",
  "currentDisabledExchangePath:\n      'AmazonSpApiTokenExchangeService.exchangeAuthorizationCodeWithLwaLater'",
  "currentCallbackExchangePath:\n      'AmazonSpApiTokenExchangeService.exchangeAuthorizationCodeDryRunnable'",
  "plannedOrchestratorPath:\n      'AmazonSpApiTokenExchangeService.orchestrateRealLwaExchangeChainDisabledLater'",
  'orchestratorImplementedNow: false',
  'callbackRuntimeChangedNow: false',
  'controllerRouteChangedNow: false',
  'realHttpEnabledNow: false',
  'tokenPersistenceChangedNow: false',
  "'validate-config'",
  "'validate-callback-state'",
  "'build-request-body'",
  "'execute-http-transport'",
  "'sanitize-lwa-response'",
  "'prepare-encrypted-token-persistence-input'",
  'configValidatorMustBeReady: true',
  'callbackStateMustBeTrusted: true',
  'companyIdMustBeResolvedFromTrustedState: true',
  'storeIdMustBeResolvedFromTrustedState: true',
  'authorizationCodeMustBePresent: true',
  'sellingPartnerIdMustBePresent: true',
  'redirectUriMustMatchAuthorizationUrl: true',
  'serverSideFeatureGateMustBeEnabledLater: true',
  'envFlagAloneIsNotEnough: true',
  'mayReadServerEnv: true',
  'mayReturnRawSecret: false',
  'outputMustBeSanitized: true',
  'mayUseAuthorizationCodeInsideBuilderLater: true',
  'mayUseClientSecretInsideBuilderLater: true',
  'mayReturnRawRequestBodyToController: false',
  'mayLogRawRequestBody: false',
  'mayReceiveRawBodyFromBuilderInsideServiceLater: true',
  'mayExecuteHttpNow: false',
  'mayUseFetchNow: false',
  'mayUseAxiosNow: false',
  'mayUseHttpRequestNow: false',
  'mayReturnRawLwaResponse: false',
  'mayLogRawLwaResponse: false',
  'mayParseAccessTokenInsideTransportLater: true',
  'mayParseRefreshTokenInsideTransportLater: true',
  'mayReturnRawAccessToken: false',
  'mayReturnRawRefreshToken: false',
  'mustReturnSanitizedEnvelopeOnly: true',
  'mayPrepareEncryptedPersistenceInputLater: true',
  'tokenPersistenceDatabaseWriteNow: false',
  'plaintextTokenDatabaseWriteAllowed: false',
  "source: 'amazon-sp-api-real-lwa-exchange-chain'",
  "transportMode: 'real-lwa-http'",
  'encryptedRefreshCredentialInputPreparedLater: true',
  'encryptedAccessTokenCacheInputPreparedLater: true',
  'errorStageIncluded: true',
  'errorReasonRedacted: true',
  'rawRequestBodyReturnedNow: false',
  'rawLwaResponseReturnedNow: false',
  'rawAccessTokenReturnedNow: false',
  'rawRefreshTokenReturnedNow: false',
  'orchestratorImplementedNow: false',
  'buildRequestBodyNow: false',
  'httpTransportImplementedNow: false',
  'httpExecutedNow: false',
  'tokenExchangeHttpCallNow: false',
  'lwaHttpCallNow: false',
  'realSpApiRequestNow: false',
  'reportsApiCallNow: false',
  'importJobWriteNow: false',
  'transactionWriteNow: false',
  'inventoryWriteNow: false',
  'implementsOrchestratorNow: false',
  'wiresCallbackToRealLwaNow: false',
  'changesOAuthCallbackRouteNow: false',
  'enablesRealHttpNow: false',
  'writesTokenPersistenceNow: false',
  'enablesReportsApiNow: false',
  'createsImportJobNow: false',
  'createsImportStagingRowNow: false',
  'createsTransactionNow: false',
  'createsInventoryMovementNow: false',
  "'smoke:amazon-sp-api-lwa-http-transport-mock-runtime'",
  "'smoke:amazon-sp-api-lwa-http-transport-disabled'",
  "'smoke:amazon-sp-api-lwa-request-body-builder-mock-runtime'",
  "'smoke:amazon-sp-api-lwa-request-body-builder-disabled'",
  "'smoke:amazon-sp-api-lwa-http-execution-boundary-contract'",
  "'smoke:amazon-sp-api-lwa-request-body-builder-boundary-contract'",
  "nextSuggestedStep: 'Step136-K'",
]) {
  assertIncludes('contract', contract, marker);
}

for (const forbidden of [
  'orchestratorImplementedNow: true',
  'callbackRuntimeChangedNow: true',
  'controllerRouteChangedNow: true',
  'realHttpEnabledNow: true',
  'tokenPersistenceChangedNow: true',
  'mayReturnRawSecret: true',
  'mayReturnRawRequestBodyToController: true',
  'mayLogRawRequestBody: true',
  'mayExecuteHttpNow: true',
  'mayUseFetchNow: true',
  'mayUseAxiosNow: true',
  'mayUseHttpRequestNow: true',
  'mayReturnRawLwaResponse: true',
  'mayLogRawLwaResponse: true',
  'mayReturnRawAccessToken: true',
  'mayReturnRawRefreshToken: true',
  'plaintextTokenDatabaseWriteAllowed: true',
  'rawRequestBodyReturnedNow: true',
  'rawLwaResponseReturnedNow: true',
  'rawAccessTokenReturnedNow: true',
  'rawRefreshTokenReturnedNow: true',
  'buildRequestBodyNow: true',
  'httpExecutedNow: true',
      'realSpApiRequestNow: true',
  'tokenPersistenceDatabaseWriteNow: true',
  'reportsApiCallNow: true',
  'importJobWriteNow: true',
  'transactionWriteNow: true',
  'inventoryWriteNow: true',
  'implementsOrchestratorNow: true',
  'wiresCallbackToRealLwaNow: true',
  'enablesRealHttpNow: true',
  'writesTokenPersistenceNow: true',
  'createsImportJobNow: true',
  'createsTransactionNow: true',
  'createsInventoryMovementNow: true',
]) {
  assertNotIncludes('contract', contract, forbidden);
}

assertIncludes('service', service, 'buildRealLwaTokenExchangeRequestBodyLater');
assertIncludes('service', service, 'executeRealLwaTokenExchangeHttpLater');
assertIncludes('service', service, 'exchangeAuthorizationCodeWithLwaLater');
assertIncludes('service', service, 'exchangeAuthorizationCodeDryRunnable');
assertNotIncludes('service', service, 'orchestrateRealLwaExchangeChainDisabledLater');
assertNotIncludes('service', service, 'runRealLwaExchangeChainLater');
assertNotIncludes('service', service, 'executeRealLwaExchangeChainLater');

// Planned future success envelope may contain tokenExchangeHttpCallNow/lwaHttpCallNow=true.
// Current execution boundary must remain false in safetyFlagsNow.
assertIncludes('contract', contract, 'safetyFlagsNow: {');
assertIncludes('contract', contract, 'tokenExchangeHttpCallNow: false');
assertIncludes('contract', contract, 'lwaHttpCallNow: false');
assertIncludes('contract', contract, 'realSpApiRequestNow: false');
assertIncludes('contract', contract, 'tokenPersistenceDatabaseWriteNow: false');
assertIncludes('contract', contract, 'plannedSanitizedSuccessEnvelope: {');
assertIncludes('contract', contract, 'tokenExchangeHttpCallNow: true');
assertIncludes('contract', contract, 'lwaHttpCallNow: true');

assertIncludes('controller', controller, 'exchangeAuthorizationCodeDryRunnable');
assertNotIncludes('controller', controller, 'orchestrateRealLwaExchangeChainDisabledLater');
assertNotIncludes('controller', controller, 'executeRealLwaTokenExchangeHttpLater');
assertNotIncludes('controller', controller, 'buildRealLwaTokenExchangeRequestBodyLater');
assertNotIncludes('controller', controller, 'exchangeAuthorizationCodeWithLwaLater');

console.log('========== Step136-J real LWA exchange chain boundary contract smoke passed ==========');
