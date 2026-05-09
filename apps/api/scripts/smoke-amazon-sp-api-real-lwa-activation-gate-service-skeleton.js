const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');

const files = {
  service: path.join(root, 'apps/api/src/imports/amazon-sp-api-real-lwa-activation-gate.service.ts'),
  module: path.join(root, 'apps/api/src/imports/imports.module.ts'),
  controller: path.join(root, 'apps/api/src/imports/imports.controller.ts'),
  contract: path.join(
    root,
    'apps/api/src/imports/dto/amazon-sp-api-real-lwa-activation-feature-gate-contract.dto.ts',
  ),
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

const service = read(files.service);
const moduleFile = read(files.module);
const controller = read(files.controller);
const contract = read(files.contract);

console.log('========== Step137-B real LWA activation gate service skeleton smoke ==========');

for (const marker of [
  'export type AmazonSpApiRealLwaActivationGateInput',
  'export type AmazonSpApiRealLwaActivationGateResult',
  'export class AmazonSpApiRealLwaActivationGateService',
  'evaluateRealLwaActivationLater',
  "source: 'amazon-sp-api-real-lwa-activation-gate-service-skeleton'",
  "gateDecision: 'blocked'",
  'activationGatePreparedNow: true',
  'activationGateImplementedNow: true',
  'realHttpAllowedNow: false',
  'realHttpEnabledNow: false',
  'tokenExchangeHttpCallNow: false',
  'lwaHttpCallNow: false',
  'realSpApiRequestNow: false',
  'tokenPersistenceDatabaseWriteNow: false',
  'callbackRuntimeChangedNow: false',
  'controllerRouteChangedNow: false',
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
  'envFlagAloneAccepted: false',
  'frontendCanEnableRealHttp: false',
  'queryParamCanEnableRealHttp: false',
  'callbackParamCanEnableRealHttp: false',
  "nextImplementationStep: 'Step137-C'",
  "'config_not_ready'",
  "'client_id_missing'",
  "'client_secret_missing'",
  "'redirect_uri_missing'",
  "'marketplace_id_missing'",
  "'region_missing'",
  "'token_endpoint_not_https'",
  "'callback_state_not_trusted'",
  "'company_id_not_resolved'",
  "'store_id_not_resolved'",
  "'selling_partner_id_missing'",
  "'authorization_code_missing'",
  "'redirect_uri_mismatch'",
  "'server_side_runtime_gate_disabled'",
  "'environment_not_allowed'",
  "'company_store_not_allowlisted'",
  "'operator_confirmation_missing'",
  "'activation_gate_skeleton'",
]) {
  assertIncludes('service', service, marker);
}

for (const forbidden of [
  'realHttpAllowedNow: true',
  'realHttpEnabledNow: true',
  'tokenExchangeHttpCallNow: true',
  'lwaHttpCallNow: true',
  'realSpApiRequestNow: true',
  'tokenPersistenceDatabaseWriteNow: true',
  'callbackRuntimeChangedNow: true',
  'controllerRouteChangedNow: true',
  'reportsApiCallNow: true',
  'importJobWriteNow: true',
  'importStagingRowWriteNow: true',
  'transactionWriteNow: true',
  'inventoryWriteNow: true',
  'rawAuthorizationCodeReturnedNow: true',
  'rawClientIdReturnedNow: true',
  'rawClientSecretReturnedNow: true',
  'rawRequestBodyReturnedNow: true',
  'rawLwaResponseReturnedNow: true',
  'rawAccessTokenReturnedNow: true',
  'rawRefreshTokenReturnedNow: true',
  'envFlagAloneAccepted: true',
  'frontendCanEnableRealHttp: true',
  'queryParamCanEnableRealHttp: true',
  'callbackParamCanEnableRealHttp: true',
  'fetch(',
  'axios.',
  'http.request',
  'https.request',
  'request.write(',
  '.post(',
  'createReport(',
  'getReport(',
  'getReportDocument(',
  'prisma.importJob',
  'prisma.importStagingRow',
  'prisma.transaction',
  'prisma.inventory',
  'clientSecret:',
  'access_token:',
  'refresh_token:',
  'rawRequestBody:',
  'rawLwaResponse:',
]) {
  assertNotIncludes('service', service, forbidden);
}

assertIncludes(
  'module',
  moduleFile,
  "import { AmazonSpApiRealLwaActivationGateService } from './amazon-sp-api-real-lwa-activation-gate.service';",
);
assertIncludes('module', moduleFile, 'AmazonSpApiRealLwaActivationGateService,');

assertIncludes('contract', contract, "step: 'Step137-A'");
assertIncludes('contract', contract, "plannedActivationGatePath:\n      'AmazonSpApiRealLwaActivationGateService.evaluateRealLwaActivationLater'");
assertIncludes('contract', contract, 'activationGateImplementedNow: false');

assertIncludes('controller', controller, 'exchangeAuthorizationCodeDryRunnable');
assertNotIncludes('controller', controller, 'AmazonSpApiRealLwaActivationGateService');
assertNotIncludes('controller', controller, 'evaluateRealLwaActivationLater');
assertNotIncludes('controller', controller, 'orchestrateRealLwaExchangeChainDisabledLater');

console.log('========== Step137-B real LWA activation gate service skeleton smoke passed ==========');
