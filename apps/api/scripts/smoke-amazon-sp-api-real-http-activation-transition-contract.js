const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');

const files = {
  contract: path.join(
    root,
    'apps/api/src/imports/dto/amazon-sp-api-real-http-activation-transition-contract.dto.ts',
  ),
  handoff: path.join(
    root,
    'apps/api/src/imports/dto/amazon-sp-api-guarded-lwa-http-activation-handoff-contract.dto.ts',
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
const handoff = read(files.handoff);
const service = read(files.service);
const controller = read(files.controller);
const pkg = JSON.parse(read(files.packageJson));

console.log('========== Step137-L real HTTP activation transition contract smoke ==========');

assertIncludes(
  'package.json',
  JSON.stringify(pkg.scripts || {}),
  'smoke:amazon-sp-api-real-http-activation-transition-contract',
);

for (const marker of [
  "source: 'amazon-sp-api-real-http-activation-transition-contract'",
  "step: 'Step137-L'",
  "phase: 'transition-contract-only'",
  "previousHandoffStep: 'Step137-K'",
  "previousRuntimeStep: 'Step137-J'",
  "currentGuardedTransportMethod:",
  "'AmazonSpApiTokenExchangeService.executeRealLwaTokenExchangeHttpGuardedLater'",
  "currentGuardedTransportSource:",
  "'amazon-sp-api-real-lwa-guarded-http-transport-test-double'",
  "currentGuardedTransportMode: 'test-double-no-network'",
  "defineOnlyNow: true",
  "replaceTestDoubleNow: false",
  "connectControllerNow: false",
  "connectOAuthCallbackNow: false",
  "enableNetworkNow: false",
  "persistTokensNow: false",
  "startsFromTrustedOAuthCallbackState: true",
  "evaluatesServerSideActivationGate: true",
  "requiresConfigValidatorReady: true",
  "requiresHttpsLwaTokenEndpoint: true",
  "requiresRequestBodyBuilderReady: true",
  "requiresSanitizedRequestBodyFingerprint: true",
  "requiresPositiveRequestBodyLength: true",
  "requiresCompanyIdFromTrustedState: true",
  "requiresStoreIdFromTrustedState: true",
  "requiresMarketplaceId: true",
  "requiresRegion: true",
  "requiresEnvironmentAllowRealLwaHttp: true",
  "requiresCompanyStoreAllowlist: true",
  "requiresExplicitOperatorConfirmation: true",
  "requiresDryRunExitInDedicatedStep: true",
  "producesSanitizedHttpResultOnly: true",
  "envFlagAloneCanEnableRealHttp: false",
  "frontendCanEnableRealHttp: false",
  "queryParamCanEnableRealHttp: false",
  "callbackParamCanEnableRealHttp: false",
  "diagnosticEndpointCanEnableRealHttp: false",
  "missingTrustedStateCanEnableRealHttp: false",
  "missingAllowlistCanEnableRealHttp: false",
  "missingOperatorConfirmationCanEnableRealHttp: false",
  "dryRunFalseWithoutDedicatedActivationStep: false",
  "controllerDirectlyCallsRealTransportNow: false",
  "oauthCallbackDirectlyCallsRealTransportNow: false",
  "method: 'POST'",
  "tokenEndpointDefault: 'https://api.amazon.com/auth/o2/token'",
  "contentType: 'application/x-www-form-urlencoded'",
  "timeoutMs: 10000",
  "maxAttemptsInitially: 1",
  "retryInitiallyAllowed: false",
  "maxResponseBytes: 32768",
  "allowedHttpClientLater: 'undici-or-node-fetch-later'",
  "executableHttpClientUsedNow: false",
  "networkCallNow: false",
  "rawAuthorizationCodeMayExistOnlyInLocalFunctionScopeLater: true",
  "rawClientSecretMayExistOnlyInLocalFunctionScopeLater: true",
  "rawRequestBodyMayExistOnlyInLocalFunctionScopeLater: true",
  "rawLwaResponseMayExistOnlyInLocalFunctionScopeLater: true",
  "rawAccessTokenMayExistOnlyInLocalFunctionScopeLater: true",
  "rawRefreshTokenMayExistOnlyInLocalFunctionScopeLater: true",
  "rawAuthorizationCodeMayBeLogged: false",
  "rawClientSecretMayBeLogged: false",
  "rawRequestBodyMayBeLogged: false",
  "rawLwaResponseMayBeLogged: false",
  "rawAccessTokenMayBeLogged: false",
  "rawRefreshTokenMayBeLogged: false",
  "rawRequestBodyMayBeReturned: false",
  "rawLwaResponseMayBeReturned: false",
  "rawAccessTokenMayBeReturned: false",
  "rawRefreshTokenMayBeReturned: false",
  "timeoutReturnsSanitizedError: true",
  "networkErrorReturnsSanitizedError: true",
  "non2xxReturnsSanitizedError: true",
  "malformedJsonReturnsSanitizedError: true",
  "missingAccessTokenReturnsSanitizedError: true",
  "missingRefreshTokenReturnsSanitizedError: true",
  "amazonErrorDescriptionRedacted: true",
  "noRawBodyInError: true",
  "noRawTokenInError: true",
  "tokenPersistenceImplementedNow: false",
  "tokenPersistenceRequiresDedicatedEncryptedBoundary: true",
  "plaintextTokenDatabaseWriteAllowed: false",
  "persistenceSmokeRequiredBeforeOAuthCallbackWiring: true",
  "guardedTransportStillTestDouble: true",
  "allPreconditionsTrueStillNoNetwork: true",
  "controllerWiringChangedNow: false",
  "oauthCallbackRuntimeChangedNow: false",
  "diagnosticEndpointChangedNow: false",
  "realHttpEnabledNow: false",
  "tokenPersistenceChangedNow: false",
  "nextSuggestedStep: 'Step137-M'",
  "nextSuggestedStepGoal:",
  "'define sanitized real LWA HTTP response parser contract before executable network transport'",
]) {
  assertIncludes('contract', contract, marker);
}

for (const regression of [
  "'smoke:amazon-sp-api-real-http-activation-transition-contract'",
  "'smoke:amazon-sp-api-guarded-lwa-http-activation-handoff-contract'",
  "'smoke:amazon-sp-api-guarded-lwa-http-transport-branch-runtime'",
  "'smoke:amazon-sp-api-guarded-lwa-http-transport-test-double'",
  "'smoke:amazon-sp-api-real-lwa-guarded-http-activation-contract'",
  "'smoke:amazon-sp-api-lwa-activation-gate-diagnostic-endpoint'",
  "'smoke:amazon-sp-api-real-lwa-activation-gate-mock-runtime'",
  "'smoke:amazon-sp-api-real-lwa-exchange-chain-mock-runtime'",
]) {
  assertIncludes('contract', contract, regression);
}

for (const forbidden of [
  "replaceTestDoubleNow: true",
  "connectControllerNow: true",
  "connectOAuthCallbackNow: true",
  "enableNetworkNow: true",
  "persistTokensNow: true",
  "envFlagAloneCanEnableRealHttp: true",
  "frontendCanEnableRealHttp: true",
  "queryParamCanEnableRealHttp: true",
  "callbackParamCanEnableRealHttp: true",
  "diagnosticEndpointCanEnableRealHttp: true",
  "missingTrustedStateCanEnableRealHttp: true",
  "missingAllowlistCanEnableRealHttp: true",
  "missingOperatorConfirmationCanEnableRealHttp: true",
  "controllerDirectlyCallsRealTransportNow: true",
  "oauthCallbackDirectlyCallsRealTransportNow: true",
  "executableHttpClientUsedNow: true",
  "networkCallNow: true",
  "rawAuthorizationCodeMayBeLogged: true",
  "rawClientSecretMayBeLogged: true",
  "rawRequestBodyMayBeLogged: true",
  "rawLwaResponseMayBeLogged: true",
  "rawAccessTokenMayBeLogged: true",
  "rawRefreshTokenMayBeLogged: true",
  "rawRequestBodyMayBeReturned: true",
  "rawLwaResponseMayBeReturned: true",
  "rawAccessTokenMayBeReturned: true",
  "rawRefreshTokenMayBeReturned: true",
  "tokenPersistenceImplementedNow: true",
  "plaintextTokenDatabaseWriteAllowed: true",
  "realHttpEnabledNow: true",
  "tokenPersistenceChangedNow: true",
]) {
  assertNotIncludes('contract', contract, forbidden);
}

assertIncludes('handoff', handoff, "source: 'amazon-sp-api-guarded-lwa-http-activation-handoff-contract'");
assertIncludes('handoff', handoff, "step: 'Step137-K'");
assertIncludes('handoff', handoff, "nextSuggestedStep: 'Step137-L'");

assertIncludes('service', service, 'executeRealLwaTokenExchangeHttpGuardedLater');
assertIncludes('service', service, "source: 'amazon-sp-api-real-lwa-guarded-http-transport-test-double'");
assertIncludes('service', service, "transportMode: 'test-double-no-network'");
assertIncludes('service', service, 'networkCallNow: false');
assertIncludes('service', service, 'executableHttpClientUsedNow: false');
assertIncludes('service', service, 'tokenPersistenceDatabaseWriteNow: false');
assertIncludes('service', service, 'rawAccessTokenReturnedNow: false');
assertIncludes('service', service, 'rawRefreshTokenReturnedNow: false');

assertIncludes('controller', controller, 'exchangeAuthorizationCodeDryRunnable');
assertIncludes('controller', controller, "Get('internal/amazon-sp-api/lwa-activation-gate/status')");
assertNotIncludes('controller', controller, 'executeRealLwaTokenExchangeHttpGuardedLater');
assertNotIncludes('controller', controller, 'executeRealLwaTokenExchangeHttpLater');

console.log('========== Step137-L real HTTP activation transition contract smoke passed ==========');
