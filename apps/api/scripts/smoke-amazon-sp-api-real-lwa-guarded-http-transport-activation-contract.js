const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');

const files = {
  contract: path.join(
    root,
    'apps/api/src/imports/dto/amazon-sp-api-real-lwa-guarded-http-transport-activation-contract.dto.ts',
  ),
  tokenService: path.join(root, 'apps/api/src/imports/amazon-sp-api-token-exchange.service.ts'),
  gateService: path.join(root, 'apps/api/src/imports/amazon-sp-api-real-lwa-activation-gate.service.ts'),
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
const tokenService = read(files.tokenService);
const gateService = read(files.gateService);
const controller = read(files.controller);

console.log('========== Step137-H real LWA guarded HTTP transport activation contract smoke ==========');

for (const marker of [
  "source: 'amazon-sp-api-real-lwa-guarded-http-transport-activation-contract'",
  "step: 'Step137-H'",
  "phase: 'contract-only'",
  "currentHttpTransportPath:\n      'AmazonSpApiTokenExchangeService.executeRealLwaTokenExchangeHttpLater'",
  "currentActivationGatePath:\n      'AmazonSpApiRealLwaActivationGateService.evaluateRealLwaActivationLater'",
  "currentDiagnosticEndpoint:\n      '/api/imports/internal/amazon-sp-api/lwa-activation-gate/status'",
  "currentOAuthCallbackPath:\n      'AmazonSpApiTokenExchangeService.exchangeAuthorizationCodeDryRunnable'",
  "plannedGuardedTransportPath:\n      'AmazonSpApiTokenExchangeService.executeRealLwaTokenExchangeHttpGuardedLater'",
  'guardedHttpTransportImplementedNow: false',
  'existingHttpTransportChangedNow: false',
  'oauthCallbackRouteChangedNow: false',
  'diagnosticEndpointChangedNow: false',
  'realHttpEnabledNow: false',
  'tokenPersistenceChangedNow: false',
  'activationGateDecisionMustAllowRealHttp: true',
  'configValidatorStatusMustBeReady: true',
  'tokenEndpointMustBeHttps: true',
  'requestBodyBuilderMustBeReady: true',
  'requestBodyFingerprintRequired: true',
  'requestBodyLengthMustBePositive: true',
  'contentTypeMustBeFormUrlEncoded: true',
  'methodMustBePost: true',
  'callbackStateMustBeTrusted: true',
  'companyIdMustBeResolvedFromTrustedState: true',
  'storeIdMustBeResolvedFromTrustedState: true',
  'marketplaceIdMustBeResolved: true',
  'regionMustBeResolved: true',
  'environmentMustAllowRealLwaHttp: true',
  'companyStoreAllowlistRequired: true',
  'explicitOperatorConfirmationRequired: true',
  'dryRunMustBeFalseOnlyInLaterActivationStep: true',
  'envFlagAloneEnablesHttp: false',
  'diagnosticEndpointCanEnableHttp: false',
  'frontendCanEnableHttp: false',
  'queryParamCanEnableHttp: false',
  'callbackParamCanEnableHttp: false',
  'missingTrustedStateCanEnableHttp: false',
  'missingAllowlistCanEnableHttp: false',
  'missingOperatorConfirmationCanEnableHttp: false',
  "method: 'POST'",
  "tokenEndpointDefault: 'https://api.amazon.com/auth/o2/token'",
  "contentType: 'application/x-www-form-urlencoded'",
  'timeoutMs: 10000',
  'retryInitiallyAllowed: false',
  'maxResponseBytes: 32768',
  "allowedHttpClientLater: 'undici-or-node-fetch-later'",
  'executableHttpClientUsedNow: false',
  'networkCallNow: false',
  "grantType: 'authorization_code'",
  'rawAuthorizationCodeMayEnterRequestBodyBuilderLater: true',
  'rawClientSecretMayEnterRequestBodyBuilderLater: true',
  'rawRequestBodyMayExistOnlyInLocalFunctionScopeLater: true',
  'rawRequestBodyMayBeLogged: false',
  'rawRequestBodyMayBeReturned: false',
  'rawRequestBodyMayBeStored: false',
  'rawLwaResponseMayExistOnlyInLocalFunctionScopeLater: true',
  'rawLwaResponseMayBeLogged: false',
  'rawLwaResponseMayBeReturned: false',
  'rawLwaResponseMayBeStored: false',
  'rawAccessTokenMayBeReturned: false',
  'rawRefreshTokenMayBeReturned: false',
  'sanitizedEnvelopeRequired: true',
  'responseParserRequiresSeparateStep: true',
  'timeoutReturnsSanitizedError: true',
  'non2xxReturnsSanitizedError: true',
  'malformedJsonReturnsSanitizedError: true',
  'noRawBodyInError: true',
  'tokenPersistenceImplementedNow: false',
  'persistenceRequiresSeparateEncryptedBoundary: true',
  'plaintextTokenDatabaseWriteAllowed: false',
  'guardedHttpTransportImplementedNow: false',
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
  'rawClientSecretReturnedNow: false',
  'rawRequestBodyReturnedNow: false',
  'rawLwaResponseReturnedNow: false',
  'rawAccessTokenReturnedNow: false',
  'rawRefreshTokenReturnedNow: false',
  'implementsGuardedHttpTransportNow: false',
  'changesExistingHttpTransportNow: false',
  'enablesRealHttpNow: false',
  'wiresOAuthCallbackToRealLwaNow: false',
  'changesDiagnosticEndpointNow: false',
  'parsesLwaResponseNow: false',
  'writesTokenPersistenceNow: false',
  'callsReportsApiNow: false',
  'createsImportJobNow: false',
  'createsTransactionNow: false',
  'createsInventoryMovementNow: false',
  "'smoke:amazon-sp-api-lwa-activation-gate-diagnostic-endpoint-runtime'",
  "'smoke:amazon-sp-api-lwa-activation-gate-diagnostic-endpoint'",
  "'smoke:amazon-sp-api-real-lwa-activation-gate-mock-runtime'",
  "'smoke:amazon-sp-api-real-lwa-activation-feature-gate-contract'",
  "'smoke:amazon-sp-api-real-lwa-exchange-chain-mock-runtime'",
  "'smoke:amazon-sp-api-real-lwa-exchange-chain-disabled'",
  "nextSuggestedStep: 'Step137-I'",
]) {
  assertIncludes('contract', contract, marker);
}

for (const forbidden of [
  'guardedHttpTransportImplementedNow: true',
  'existingHttpTransportChangedNow: true',
  'oauthCallbackRouteChangedNow: true',
  'diagnosticEndpointChangedNow: true',
  'realHttpEnabledNow: true',
  'tokenPersistenceChangedNow: true',
  'envFlagAloneEnablesHttp: true',
  'diagnosticEndpointCanEnableHttp: true',
  'frontendCanEnableHttp: true',
  'queryParamCanEnableHttp: true',
  'callbackParamCanEnableHttp: true',
  'missingTrustedStateCanEnableHttp: true',
  'missingAllowlistCanEnableHttp: true',
  'missingOperatorConfirmationCanEnableHttp: true',
  'executableHttpClientUsedNow: true',
  'networkCallNow: true',
  'rawRequestBodyMayBeLogged: true',
  'rawRequestBodyMayBeReturned: true',
  'rawRequestBodyMayBeStored: true',
  'rawLwaResponseMayBeLogged: true',
  'rawLwaResponseMayBeReturned: true',
  'rawLwaResponseMayBeStored: true',
  'rawAccessTokenMayBeReturned: true',
  'rawRefreshTokenMayBeReturned: true',
  'tokenPersistenceImplementedNow: true',
  'plaintextTokenDatabaseWriteAllowed: true',
  'tokenExchangeHttpCallNow: true',
  'lwaHttpCallNow: true',
  'realSpApiRequestNow: true',
  'tokenPersistenceDatabaseWriteNow: true',
  'reportsApiCallNow: true',
  'importJobWriteNow: true',
  'transactionWriteNow: true',
  'inventoryWriteNow: true',
  'implementsGuardedHttpTransportNow: true',
  'enablesRealHttpNow: true',
  'wiresOAuthCallbackToRealLwaNow: true',
  'writesTokenPersistenceNow: true',
  'callsReportsApiNow: true',
  'createsImportJobNow: true',
  'createsTransactionNow: true',
  'createsInventoryMovementNow: true',
]) {
  assertNotIncludes('contract', contract, forbidden);
}

assertIncludes('tokenService', tokenService, 'executeRealLwaTokenExchangeHttpLater');
assertIncludes('tokenService', tokenService, 'tokenExchangeHttpCallNow: false');
assertIncludes('tokenService', tokenService, 'lwaHttpCallNow: false');
// Step137-I intentionally implements the planned guarded transport method.
// Keep this legacy Step137-H contract smoke focused on the contract DTO and
// the still-forbidden controller wiring / real HTTP activation boundaries.
assertIncludes('tokenService', tokenService, 'executeRealLwaTokenExchangeHttpGuardedLater');
assertIncludes('tokenService', tokenService, "source: 'amazon-sp-api-real-lwa-guarded-http-transport-test-double'");
assertIncludes('tokenService', tokenService, "transportMode: 'test-double-no-network'");
assertIncludes('tokenService', tokenService, 'networkCallNow: false');
assertIncludes('tokenService', tokenService, 'executableHttpClientUsedNow: false');
assertIncludes('tokenService', tokenService, 'tokenPersistenceDatabaseWriteNow: false');
assertIncludes('tokenService', tokenService, 'rawAccessTokenReturnedNow: false');
assertIncludes('tokenService', tokenService, 'rawRefreshTokenReturnedNow: false');

assertIncludes('gateService', gateService, 'evaluateRealLwaActivationLater');
assertIncludes('gateService', gateService, 'realHttpAllowedNow: false');

assertIncludes('controller', controller, 'exchangeAuthorizationCodeDryRunnable');
assertIncludes('controller', controller, "Get('internal/amazon-sp-api/lwa-activation-gate/status')");
assertNotIncludes('controller', controller, 'executeRealLwaTokenExchangeHttpGuardedLater');
assertNotIncludes('controller', controller, 'executeRealLwaTokenExchangeHttpLater');

console.log('========== Step137-H real LWA guarded HTTP transport activation contract smoke passed ==========');
