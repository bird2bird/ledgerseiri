const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');

const files = {
  contract: path.join(
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
const service = read(files.service);
const controller = read(files.controller);
const pkg = JSON.parse(read(files.packageJson));

console.log('========== Step137-K guarded LWA HTTP activation handoff contract smoke ==========');

assertIncludes(
  'package.json',
  JSON.stringify(pkg.scripts || {}),
  'smoke:amazon-sp-api-guarded-lwa-http-activation-handoff-contract',
);

for (const marker of [
  "source: 'amazon-sp-api-guarded-lwa-http-activation-handoff-contract'",
  "step: 'Step137-K'",
  "phase: 'handoff-contract-only'",
  "latestCompletedRuntimeStep: 'Step137-J'",
  "guardedTransportMethod:",
  "'AmazonSpApiTokenExchangeService.executeRealLwaTokenExchangeHttpGuardedLater'",
  "guardedTransportSource:",
  "'amazon-sp-api-real-lwa-guarded-http-transport-test-double'",
  "guardedTransportMode: 'test-double-no-network'",
  "branchRuntimeSmoke:",
  "'smoke:amazon-sp-api-guarded-lwa-http-transport-branch-runtime'",
  "implementationSmoke:",
  "'smoke:amazon-sp-api-guarded-lwa-http-transport-test-double'",
  "guardedHttpTransportPreparedNow: true",
  "guardedHttpTransportImplementedNow: true",
  "branchCoverageSmokeImplementedNow: true",
  "allPreconditionsTrueStillNoNetwork: true",
  "controllerWiringChangedNow: false",
  "oauthCallbackRuntimeChangedNow: false",
  "diagnosticEndpointChangedNow: false",
  "realHttpEnabledNow: false",
  "tokenPersistenceChangedNow: false",
  "controllerMayCallGuardedTransportNow: false",
  "controllerMayCallLegacyTransportNow: false",
  "oauthCallbackMayCallRealLwaNow: false",
  "diagnosticEndpointMayEnableRealHttpNow: false",
  "frontendMayEnableRealHttpNow: false",
  "queryParamMayEnableRealHttpNow: false",
  "callbackParamMayEnableRealHttpNow: false",
  "envFlagAloneMayEnableRealHttpNow: false",
  "testDoubleMayUseExecutableHttpClientNow: false",
  "testDoubleMayMakeNetworkCallNow: false",
  "testDoubleMayReturnRawRequestBodyNow: false",
  "testDoubleMayReturnRawLwaResponseNow: false",
  "testDoubleMayReturnRawAccessTokenNow: false",
  "testDoubleMayReturnRawRefreshTokenNow: false",
  "tokenPersistenceMayWriteDatabaseNow: false",
  "reportsApiMayBeCalledNow: false",
  "importJobMayBeCreatedNow: false",
  "transactionMayBeCreatedNow: false",
  "inventoryMovementMayBeCreatedNow: false",
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
  "dryRunMustRemainTrueUntilRealActivationStep: true",
  "'activation_gate_not_allowed'",
  "'config_not_ready'",
  "'token_endpoint_not_https'",
  "'request_body_builder_not_ready'",
  "'missing_request_body_fingerprint'",
  "'invalid_request_body_length'",
  "'invalid_content_type'",
  "'invalid_method'",
  "'callback_state_not_trusted'",
  "'company_id_not_resolved'",
  "'store_id_not_resolved'",
  "'missing_marketplace_id'",
  "'missing_region'",
  "'environment_not_allowed'",
  "'company_store_not_allowlisted'",
  "'operator_confirmation_missing'",
  "'dry_run_required'",
  "'guarded_http_test_double'",
  "accepted: false",
  "gateDecision: 'blocked'",
  "realHttpAllowedNow: false",
  "realHttpEnabledNow: false",
  "executableHttpClientUsedNow: false",
  "networkCallNow: false",
  "tokenExchangeHttpCallNow: false",
  "lwaHttpCallNow: false",
  "realSpApiRequestNow: false",
  "tokenPersistenceDatabaseWriteNow: false",
  "rawRequestBodyReturnedNow: false",
  "rawLwaResponseReturnedNow: false",
  "rawAccessTokenReturnedNow: false",
  "rawRefreshTokenReturnedNow: false",
  "nextSuggestedStep: 'Step137-L'",
]) {
  assertIncludes('contract', contract, marker);
}

for (const forbidden of [
  "controllerMayCallGuardedTransportNow: true",
  "controllerMayCallLegacyTransportNow: true",
  "oauthCallbackMayCallRealLwaNow: true",
  "diagnosticEndpointMayEnableRealHttpNow: true",
  "frontendMayEnableRealHttpNow: true",
  "queryParamMayEnableRealHttpNow: true",
  "callbackParamMayEnableRealHttpNow: true",
  "envFlagAloneMayEnableRealHttpNow: true",
  "testDoubleMayUseExecutableHttpClientNow: true",
  "testDoubleMayMakeNetworkCallNow: true",
  "testDoubleMayReturnRawRequestBodyNow: true",
  "testDoubleMayReturnRawLwaResponseNow: true",
  "testDoubleMayReturnRawAccessTokenNow: true",
  "testDoubleMayReturnRawRefreshTokenNow: true",
  "tokenPersistenceMayWriteDatabaseNow: true",
  "reportsApiMayBeCalledNow: true",
  "importJobMayBeCreatedNow: true",
  "transactionMayBeCreatedNow: true",
  "inventoryMovementMayBeCreatedNow: true",
  "realHttpEnabledNow: true",
  "networkCallNow: true",
  "executableHttpClientUsedNow: true",
  "tokenPersistenceDatabaseWriteNow: true",
  "rawAccessTokenReturnedNow: true",
  "rawRefreshTokenReturnedNow: true",
]) {
  assertNotIncludes('contract', contract, forbidden);
}

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

console.log('========== Step137-K guarded LWA HTTP activation handoff contract smoke passed ==========');
