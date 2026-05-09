const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');

const files = {
  contract: path.join(
    root,
    'apps/api/src/imports/dto/amazon-sp-api-lwa-activation-gate-diagnostic-endpoint-contract.dto.ts',
  ),
  controller: path.join(root, 'apps/api/src/imports/imports.controller.ts'),
  gateService: path.join(root, 'apps/api/src/imports/amazon-sp-api-real-lwa-activation-gate.service.ts'),
  module: path.join(root, 'apps/api/src/imports/imports.module.ts'),
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
const gateService = read(files.gateService);
const moduleFile = read(files.module);

console.log('========== Step137-D LWA activation gate diagnostic endpoint contract smoke ==========');

for (const marker of [
  "source: 'amazon-sp-api-lwa-activation-gate-diagnostic-endpoint-contract'",
  "step: 'Step137-D'",
  "phase: 'contract-only'",
  "plannedControllerRoute:\n      '/api/imports/internal/amazon-sp-api/lwa-activation-gate/status'",
  "plannedControllerMethod: 'amazonSpApiLwaActivationGateDiagnosticEndpoint'",
  "plannedServiceCall:\n      'AmazonSpApiRealLwaActivationGateService.evaluateRealLwaActivationLater'",
  "plannedGuard: 'JwtAuthGuard'",
  'endpointImplementedNow: false',
  'controllerInjectedActivationGateNow: false',
  'frontendExposedNow: false',
  'callbackRuntimeChangedNow: false',
  'oauthCallbackRouteChangedNow: false',
  'realHttpEnabledNow: false',
  'tokenPersistenceChangedNow: false',
  "storeId: 'required-later'",
  "marketplaceId: 'optional-default-A1VC38T7YXB528'",
  "region: 'optional-default-JP'",
  "dryRun: 'always-true'",
  'guardedByJwtAuthGuard: true',
  'companyIdRequiredFromAuthenticatedUser: true',
  'userProvidedCompanyIdAccepted: false',
  'companyScoped: true',
  'internalEndpointOnly: true',
  "source: 'amazon-sp-api-lwa-activation-gate-diagnostic'",
  'endpointImplementedNow: true',
  "route: '/api/imports/internal/amazon-sp-api/lwa-activation-gate/status'",
  "guardedBy: 'JwtAuthGuard'",
  'realHttpAllowedNow: false',
  'gateDecision: \'blocked\'',
  'activationGatePreparedNow: true',
  'activationGateImplementedNow: true',
  'rawSecretReturnedNow: false',
  'rawAuthorizationCodeReturnedNow: false',
  'rawRequestBodyReturnedNow: false',
  'rawLwaResponseReturnedNow: false',
  'rawAccessTokenReturnedNow: false',
  'rawRefreshTokenReturnedNow: false',
  'configValidatorStatusFromServerConfig: true',
  'clientIdPresenceFromServerConfig: true',
  'clientSecretPresenceFromServerConfig: true',
  'redirectUriPresenceFromServerConfig: true',
  'tokenEndpointHttpsFromServerConfig: true',
  'marketplaceIdFromQueryOrDefault: true',
  'regionFromQueryOrDefault: true',
  'storeIdFromQueryRequired: true',
  'callbackStateTrustedForDiagnostic: false',
  'authorizationCodePresentForDiagnostic: false',
  'sellingPartnerIdPresentForDiagnostic: false',
  'serverSideRuntimeGateEnabledNow: false',
  'environmentAllowsRealLwaHttpNow: false',
  'companyStoreAllowlistedNow: false',
  'explicitOperatorConfirmedNow: false',
  'tokenExchangeHttpCallNow: false',
  'lwaHttpCallNow: false',
  'realSpApiRequestNow: false',
  'tokenPersistenceDatabaseWriteNow: false',
  'reportsApiCallNow: false',
  'importJobWriteNow: false',
  'importStagingRowWriteNow: false',
  'transactionWriteNow: false',
  'inventoryWriteNow: false',
  'implementsEndpointNow: false',
  'injectsActivationGateIntoControllerNow: false',
  'wiresOAuthCallbackToActivationGateNow: false',
  'enablesRealHttpNow: false',
  'writesTokenPersistenceNow: false',
  'enablesReportsApiNow: false',
  'createsImportJobNow: false',
  'createsImportStagingRowNow: false',
  'createsTransactionNow: false',
  'createsInventoryMovementNow: false',
  'changesFrontendNow: false',
  "'smoke:amazon-sp-api-real-lwa-activation-gate-mock-runtime'",
  "'smoke:amazon-sp-api-real-lwa-activation-gate-service'",
  "'smoke:amazon-sp-api-real-lwa-activation-feature-gate-contract'",
  "'smoke:amazon-sp-api-real-lwa-exchange-chain-mock-runtime'",
  "'smoke:amazon-sp-api-real-lwa-exchange-chain-disabled'",
  "nextSuggestedStep: 'Step137-E'",
]) {
  assertIncludes('contract', contract, marker);
}

for (const forbidden of [
  'endpointImplementedNow: true as const',
  'controllerInjectedActivationGateNow: true',
  'frontendExposedNow: true',
  'callbackRuntimeChangedNow: true',
  'oauthCallbackRouteChangedNow: true',
  'realHttpAllowedNow: true',
  'realHttpEnabledNow: true',
  'tokenExchangeHttpCallNow: true',
  'lwaHttpCallNow: true',
  'realSpApiRequestNow: true',
  'tokenPersistenceDatabaseWriteNow: true',
  'reportsApiCallNow: true',
  'importJobWriteNow: true',
  'importStagingRowWriteNow: true',
  'transactionWriteNow: true',
  'inventoryWriteNow: true',
  'rawSecretReturnedNow: true',
  'rawAuthorizationCodeReturnedNow: true',
  'rawClientIdReturnedNow: true',
  'rawClientSecretReturnedNow: true',
  'rawRequestBodyReturnedNow: true',
  'rawLwaResponseReturnedNow: true',
  'rawAccessTokenReturnedNow: true',
  'rawRefreshTokenReturnedNow: true',
  'implementsEndpointNow: true',
  'injectsActivationGateIntoControllerNow: true',
  'wiresOAuthCallbackToActivationGateNow: true',
  'enablesRealHttpNow: true',
  'writesTokenPersistenceNow: true',
  'enablesReportsApiNow: true',
  'createsImportJobNow: true',
  'createsImportStagingRowNow: true',
  'createsTransactionNow: true',
  'createsInventoryMovementNow: true',
  'changesFrontendNow: true',
]) {
  assertNotIncludes('contract', contract, forbidden);
}

assertIncludes('gateService', gateService, 'export class AmazonSpApiRealLwaActivationGateService');
assertIncludes('gateService', gateService, 'evaluateRealLwaActivationLater');
assertIncludes('gateService', gateService, 'realHttpAllowedNow: false');

assertIncludes('module', moduleFile, 'AmazonSpApiRealLwaActivationGateService');

assertIncludes('controller', controller, "Get('internal/amazon-sp-api/lwa-config/status')");
assertIncludes('controller', controller, 'exchangeAuthorizationCodeDryRunnable');
assertNotIncludes('controller', controller, "Get('internal/amazon-sp-api/lwa-activation-gate/status')");
assertNotIncludes('controller', controller, 'amazonSpApiLwaActivationGateDiagnosticEndpoint');
assertNotIncludes('controller', controller, 'AmazonSpApiRealLwaActivationGateService');
assertNotIncludes('controller', controller, 'evaluateRealLwaActivationLater');

console.log('========== Step137-D LWA activation gate diagnostic endpoint contract smoke passed ==========');
