const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');

const files = {
  contract: path.join(
    root,
    'apps/api/src/imports/dto/amazon-sp-api-executable-real-lwa-http-transport-replacement-contract.dto.ts',
  ),
  preHandoff: path.join(
    root,
    'apps/api/src/imports/dto/amazon-sp-api-real-lwa-integration-pre-activation-handoff-contract.dto.ts',
  ),
  transition: path.join(
    root,
    'apps/api/src/imports/dto/amazon-sp-api-real-http-activation-transition-contract.dto.ts',
  ),
  service: path.join(root, 'apps/api/src/imports/amazon-sp-api-token-exchange.service.ts'),
  controller: path.join(root, 'apps/api/src/imports/imports.controller.ts'),
  packageJson: path.join(root, 'apps/api/package.json'),
};

function read(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing file: ${path.relative(root, file)}`);
  }
  return fs.readFileSync(file, 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
  console.log(`[OK] ${message}`);
}

function assertIncludes(name, text, marker) {
  assert(text.includes(marker), `${name} contains marker: ${marker}`);
}

function assertNotIncludes(name, text, marker) {
  assert(!text.includes(marker), `${name} does not contain forbidden marker: ${marker}`);
}

const contract = read(files.contract);
const preHandoff = read(files.preHandoff);
const transition = read(files.transition);
const service = read(files.service);
const controller = read(files.controller);
const pkg = JSON.parse(read(files.packageJson));

console.log('========== Step137-T executable real LWA HTTP transport replacement contract smoke ==========');

assertIncludes(
  'package.json',
  JSON.stringify(pkg.scripts || {}),
  'smoke:amazon-sp-api-executable-real-lwa-http-transport-replacement-contract',
);

for (const marker of [
  "source: 'amazon-sp-api-executable-real-lwa-http-transport-replacement-contract'",
  "step: 'Step137-T'",
  "phase: 'replacement-contract-only'",
  "previousPreActivationHandoffStep: 'Step137-S'",
  "currentGuardedTransportMethod:",
  "'AmazonSpApiTokenExchangeService.executeRealLwaTokenExchangeHttpGuardedLater'",
  "currentTransportMode: 'test-double-no-network'",
  "futureExecutableTransportMode: 'server-gated-real-lwa-http'",
  "defineReplacementContractOnlyNow: true",
  "implementExecutableHttpNow: false",
  "replaceTestDoubleNow: false",
  "wireControllerNow: false",
  "wireOAuthCallbackNow: false",
  "writeDatabaseNow: false",
  "addPrismaModelNow: false",
  "addMigrationNow: false",
  "serverSideActivationGateRequired: true",
  "activationGateDecisionMustBeEligibleLater: true",
  "realHttpAllowedNowMustBeTrueInsideServerBoundary: true",
  "configValidatorStatusMustBeReady: true",
  "tokenEndpointMustBeHttps: true",
  "methodMustBePost: true",
  "contentTypeMustBeFormUrlEncoded: true",
  "requestBodyBuilderMustBeReady: true",
  "requestBodyFingerprintMustBePresent: true",
  "requestBodyLengthMustBePositive: true",
  "callbackStateMustBeTrusted: true",
  "companyIdMustBeResolvedFromTrustedState: true",
  "storeIdMustBeResolvedFromTrustedState: true",
  "marketplaceIdMustBePresent: true",
  "regionMustBePresent: true",
  "environmentMustAllowRealLwaHttp: true",
  "companyStoreMustBeAllowlisted: true",
  "explicitOperatorConfirmationMustBePresent: true",
  "tokenEndpointDefault: 'https://api.amazon.com/auth/o2/token'",
  "timeoutMs: 10000",
  "maxAttemptsInitially: 1",
  "retryInitiallyAllowed: false",
  "maxResponseBytes: 32768",
  "allowedHttpMethod: 'POST'",
  "allowedContentType: 'application/x-www-form-urlencoded'",
  "allowedHttpClientLater: 'undici-or-node-fetch-later'",
  "redirectsAllowed: false",
  "proxyAllowedByDefault: false",
  "successMustGoThroughSanitizedParser: true",
  "non2xxMustReturnSanitizedFailureEnvelope: true",
  "timeoutMustReturnSanitizedFailureEnvelope: true",
  "networkErrorMustReturnSanitizedFailureEnvelope: true",
  "malformedResponseMustReturnSanitizedFailureEnvelope: true",
  "rawRequestBodyMayBeReturned: false",
  "rawLwaResponseMayBeReturned: false",
  "rawAccessTokenMayBeReturned: false",
  "rawRefreshTokenMayBeReturned: false",
  "rawClientSecretMayBeReturned: false",
  "rawAuthorizationCodeMayBeReturned: false",
  "tokenPersistenceMayHappenInsideTransport: false",
  "executableHttpClientUsedNow: false",
  "networkCallNow: false",
  "lwaHttpCallNow: false",
  "realSpApiRequestNow: false",
  "tokenPersistenceDatabaseWriteNow: false",
  "plaintextTokenDatabaseWriteNow: false",
  "controllerMayCallTransportNow: false",
  "oauthCallbackMayCallTransportNow: false",
  "diagnosticEndpointMayEnableTransportNow: false",
  "envFlagAloneMayEnableTransportNow: false",
  "queryParamMayEnableTransportNow: false",
  "frontendMayEnableTransportNow: false",
  "'add executable transport helper behind existing guarded method'",
  "'keep all activation gate checks before creating HTTP client'",
  "'build request body only inside local function scope'",
  "'execute one POST request with timeout and response size cap'",
  "'pass raw local response only into sanitized parser'",
  "'return sanitized parser envelope or sanitized transport failure'",
  "'do not persist tokens inside transport'",
  "'do not wire controller or OAuth callback in the same step'",
  "'smoke:amazon-sp-api-executable-real-lwa-http-transport-replacement-contract'",
  "'smoke:amazon-sp-api-real-lwa-integration-pre-activation-handoff-contract'",
  "'smoke:amazon-sp-api-token-persistence-builder-branch-runtime'",
  "'smoke:amazon-sp-api-token-persistence-input-builder-test-double'",
  "'smoke:amazon-sp-api-token-persistence-encrypted-boundary-contract'",
  "'smoke:amazon-sp-api-sanitized-lwa-parser-branch-runtime'",
  "'smoke:amazon-sp-api-sanitized-lwa-http-response-parser-test-double'",
  "'smoke:amazon-sp-api-sanitized-lwa-http-response-parser-contract'",
  "'smoke:amazon-sp-api-real-http-activation-transition-contract'",
  "'smoke:amazon-sp-api-guarded-lwa-http-activation-handoff-contract'",
  "'smoke:amazon-sp-api-guarded-lwa-http-transport-branch-runtime'",
  "'smoke:amazon-sp-api-guarded-lwa-http-transport-test-double'",
  "nextSuggestedStep: 'Step137-U'",
]) {
  assertIncludes('contract', contract, marker);
}

for (const forbidden of [
  "implementExecutableHttpNow: true",
  "replaceTestDoubleNow: true",
  "wireControllerNow: true",
  "wireOAuthCallbackNow: true",
  "writeDatabaseNow: true",
  "addPrismaModelNow: true",
  "addMigrationNow: true",
  "rawRequestBodyMayBeReturned: true",
  "rawLwaResponseMayBeReturned: true",
  "rawAccessTokenMayBeReturned: true",
  "rawRefreshTokenMayBeReturned: true",
  "rawClientSecretMayBeReturned: true",
  "rawAuthorizationCodeMayBeReturned: true",
  "tokenPersistenceMayHappenInsideTransport: true",
  "executableHttpClientUsedNow: true",  "tokenPersistenceDatabaseWriteNow: true",
  "plaintextTokenDatabaseWriteNow: true",
  "controllerMayCallTransportNow: true",
  "oauthCallbackMayCallTransportNow: true",
  "diagnosticEndpointMayEnableTransportNow: true",
  "envFlagAloneMayEnableTransportNow: true",
  "queryParamMayEnableTransportNow: true",
  "frontendMayEnableTransportNow: true",
]) {
  assertNotIncludes('contract', contract, forbidden);
}

assertIncludes('preHandoff', preHandoff, "source: 'amazon-sp-api-real-lwa-integration-pre-activation-handoff-contract'");
assertIncludes('preHandoff', preHandoff, "nextSuggestedStep: 'Step137-T'");
assertIncludes('transition', transition, "source: 'amazon-sp-api-real-http-activation-transition-contract'");
assertIncludes('transition', transition, "tokenEndpointDefault: 'https://api.amazon.com/auth/o2/token'");
assertIncludes('transition', transition, "timeoutMs: 10000");
assertIncludes('transition', transition, "maxResponseBytes: 32768");

assertIncludes('service', service, 'executeRealLwaTokenExchangeHttpGuardedLater');

// Step137-U executable helper source markers are allowed in service.
// Legacy smokes must continue to prove controller non-wiring and no raw token / DB exposure.
assert(service.includes('executeRealLwaTokenExchangeHttpExecutableGuardedLater'), 'service contains Step137-U executable helper');

assertIncludes('service', service, "transportMode: 'test-double-no-network'");
assertIncludes('service', service, 'networkCallNow: false');
assertIncludes('service', service, 'executableHttpClientUsedNow: false');
assertIncludes('service', service, 'tokenPersistenceDatabaseWriteNow: false');

assertIncludes('controller', controller, 'exchangeAuthorizationCodeDryRunnable');
assertNotIncludes('controller', controller, 'executeRealLwaTokenExchangeHttpGuardedLater');
assertNotIncludes('controller', controller, 'parseRealLwaHttpResponseSanitizedLater');
assertNotIncludes('controller', controller, 'prepareEncryptedTokenPersistenceInputLater');

console.log('========== Step137-T executable real LWA HTTP transport replacement contract smoke passed ==========');
