const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');

const files = {
  contract: path.join(
    root,
    'apps/api/src/imports/dto/amazon-sp-api-real-lwa-token-exchange-enablement-boundary-contract.dto.ts',
  ),
  controller: path.join(root, 'apps/api/src/imports/imports.controller.ts'),
  exchangeService: path.join(root, 'apps/api/src/imports/amazon-sp-api-token-exchange.service.ts'),
  configValidator: path.join(root, 'apps/api/src/imports/amazon-sp-api-lwa-env-config-validation.service.ts'),
  packageJson: path.join(root, 'apps/api/package.json'),
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
const controller = read(files.controller);
const exchangeService = read(files.exchangeService);
const configValidator = read(files.configValidator);

console.log('========== Step136-A real LWA token exchange enablement boundary contract smoke ==========');

assertIncludes('contract', contract, "source: 'amazon-sp-api-real-lwa-token-exchange-enablement-boundary-contract'");
assertIncludes('contract', contract, "step: 'Step136-A'");
assertIncludes('contract', contract, "phase: 'contract-only'");
assertIncludes(
  'contract',
  contract,
  "currentCallbackExchangePath:\n      'AmazonSpApiTokenExchangeService.exchangeAuthorizationCodeDryRunnable'",
);
assertIncludes(
  'contract',
  contract,
  "futureRealExchangePath:\n      'AmazonSpApiTokenExchangeService.exchangeAuthorizationCodeWithLwaLater'",
);
assertIncludes(
  'contract',
  contract,
  "currentConfigValidator:\n      'AmazonSpApiLwaEnvConfigValidationService.validateFromProcessEnv'",
);
assertIncludes(
  'contract',
  contract,
  "currentDiagnosticEndpoint:\n      '/api/imports/internal/amazon-sp-api/lwa-config/status'",
);

for (const marker of [
  'realLwaExchangeEnabledNow: false',
  'callbackRuntimeChangedNow: false',
  'controllerRouteChangedNow: false',
  'tokenExchangeServiceRuntimeChangedNow: false',
  'configValidatorStatusMustBeReady: true',
  'clientIdMustBePresent: true',
  'clientSecretMustBePresent: true',
  'redirectUriMustBePresent: true',
  'tokenEndpointMustBeHttps: true',
  'callbackStateMustBeValidatedBeforeExchange: true',
  'authorizationCodeMustBePresent: true',
  'sellingPartnerIdMustBePresent: true',
  'companyIdMustBeResolvedFromTrustedState: true',
  'storeIdMustBeResolvedFromTrustedState: true',
  'redirectUriMustMatchAuthorizationUrl: true',
  'requiresServerSideFeatureGate: true',
  'requiresReadyConfigValidator: true',
  'envFlagAloneIsNotEnough: true',
  'realHttpMustRemainDisabledInStep136A: true',
  "method: 'POST'",
  "tokenEndpoint: 'https://api.amazon.com/auth/o2/token'",
  "contentType: 'application/x-www-form-urlencoded'",
  "grantType: 'authorization_code'",
  "'grant_type'",
  "'code'",
  "'redirect_uri'",
  "'client_id'",
  "'client_secret'",
  'authorizationHeaderUsed: false',
  'requestLoggedWithSecretRedaction: true',
  'responseLoggedWithTokenRedaction: true',
  'plaintextRefreshTokenMayOnlyEnterEncryptionInput: true',
  'plaintextAccessTokenMayOnlyEnterEncryptionInput: true',
  'encryptedRefreshCredentialRequired: true',
  'encryptedAccessTokenCacheRequired: true',
  'plaintextTokenDatabaseWriteAllowed: false',
  'rawTokenLogAllowed: false',
  'rawTokenFrontendReturnAllowed: false',
  'tokenExchangeHttpCallNow: false',
  'lwaHttpCallNow: false',
  'realSpApiRequestNow: false',
  'tokenPersistenceDatabaseWriteNow: false',
  'importJobWriteNow: false',
  'transactionWriteNow: false',
  'inventoryWriteNow: false',
  'reportsApiCallNow: false',
  'rawRefreshTokenReturnedNow: false',
  'rawAccessTokenReturnedNow: false',
  'rawClientSecretReturnedNow: false',
  'rawAuthorizationCodeReturnedNow: false',
  'implementsRealLwaHttpNow: false',
  'wiresCallbackToRealLwaNow: false',
  'changesOAuthCallbackRouteNow: false',
  'changesTokenPersistenceNow: false',
  'enablesReportsApiNow: false',
  'createsImportJobNow: false',
  'createsImportStagingRowNow: false',
  'createsTransactionNow: false',
  'createsInventoryMovementNow: false',
  "nextSuggestedStep: 'Step136-B'",
]) {
  assertIncludes('contract', contract, marker);
}

for (const forbidden of [
  'realLwaExchangeEnabledNow: true',
  'callbackRuntimeChangedNow: true',
  'controllerRouteChangedNow: true',
  'tokenExchangeServiceRuntimeChangedNow: true',
  'realHttpMustRemainDisabledInStep136A: false',
  'plaintextTokenDatabaseWriteAllowed: true',
  'rawTokenLogAllowed: true',
  'rawTokenFrontendReturnAllowed: true',
  'tokenExchangeHttpCallNow: true',
  'lwaHttpCallNow: true',
  'realSpApiRequestNow: true',
  'tokenPersistenceDatabaseWriteNow: true',
  'importJobWriteNow: true',
  'transactionWriteNow: true',
  'inventoryWriteNow: true',
  'reportsApiCallNow: true',
  'implementsRealLwaHttpNow: true',
  'wiresCallbackToRealLwaNow: true',
  'changesOAuthCallbackRouteNow: true',
  'changesTokenPersistenceNow: true',
  'enablesReportsApiNow: true',
  'createsImportJobNow: true',
  'createsTransactionNow: true',
  'createsInventoryMovementNow: true',
]) {
  assertNotIncludes('contract', contract, forbidden);
}

assertIncludes('controller', controller, 'exchangeAuthorizationCodeDryRunnable');
assertNotIncludes('controller', controller, 'exchangeAuthorizationCodeWithLwaLater');

assertIncludes('exchangeService', exchangeService, 'exchangeAuthorizationCodeWithLwaLater');
assertIncludes('exchangeService', exchangeService, 'enableRealLwaHttpTransport: false');
assertIncludes('exchangeService', exchangeService, 'lwaHttpCallNow: false');
assertIncludes('exchangeService', exchangeService, 'realSpApiRequestNow: false');

assertIncludes('configValidator', configValidator, 'validateFromProcessEnv');
assertIncludes('configValidator', configValidator, 'realHttpEnabled: false');
assertIncludes('configValidator', configValidator, 'rawClientSecretReturnedNow: false');

console.log('========== Step136-A real LWA token exchange enablement boundary contract smoke passed ==========');
