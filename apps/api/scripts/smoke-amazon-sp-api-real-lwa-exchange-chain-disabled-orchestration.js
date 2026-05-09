const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');

const files = {
  service: path.join(root, 'apps/api/src/imports/amazon-sp-api-token-exchange.service.ts'),
  controller: path.join(root, 'apps/api/src/imports/imports.controller.ts'),
  contract: path.join(
    root,
    'apps/api/src/imports/dto/amazon-sp-api-real-lwa-exchange-chain-boundary-contract.dto.ts',
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
const controller = read(files.controller);
const contract = read(files.contract);

console.log('========== Step136-K real LWA exchange chain disabled orchestration smoke ==========');

assertIncludes('service', service, 'export type AmazonSpApiRealLwaExchangeChainDisabledInput');
assertIncludes('service', service, 'export type AmazonSpApiRealLwaExchangeChainDisabledResult');
assertIncludes('service', service, 'orchestrateRealLwaExchangeChainDisabledLater');
assertIncludes('service', service, "source: 'amazon-sp-api-real-lwa-exchange-chain-disabled'");
assertIncludes('service', service, 'orchestratorPreparedNow: true');
assertIncludes('service', service, 'orchestratorImplementedNow: true');
assertIncludes('service', service, 'callbackRuntimeChangedNow: false');
assertIncludes('service', service, 'controllerRouteChangedNow: false');
assertIncludes('service', service, 'realHttpEnabledNow: false');
assertIncludes('service', service, 'tokenExchangeHttpCallNow: false');
assertIncludes('service', service, 'lwaHttpCallNow: false');
assertIncludes('service', service, 'realSpApiRequestNow: false');
assertIncludes('service', service, 'tokenPersistenceDatabaseWriteNow: false');
assertIncludes('service', service, 'requestBodyConstructedNow: false');
assertIncludes('service', service, 'requestBodyLoggedNow: false');
assertIncludes('service', service, 'rawAuthorizationCodeReturnedNow: false');
assertIncludes('service', service, 'rawClientIdReturnedNow: false');
assertIncludes('service', service, 'rawClientSecretReturnedNow: false');
assertIncludes('service', service, 'rawRequestBodyReturnedNow: false');
assertIncludes('service', service, 'rawLwaResponseReturnedNow: false');
assertIncludes('service', service, 'rawAccessTokenReturnedNow: false');
assertIncludes('service', service, 'rawRefreshTokenReturnedNow: false');
assertIncludes('service', service, "nextImplementationStep: 'Step136-L'");
assertIncludes('service', service, "'validate-config'");
assertIncludes('service', service, "'validate-callback-state'");
assertIncludes('service', service, "'build-request-body'");
assertIncludes('service', service, "'execute-http-transport'");
assertIncludes('service', service, "'prepare-token-persistence-input'");
assertIncludes('service', service, 'buildRealLwaTokenExchangeRequestBodyLater');
assertIncludes('service', service, 'executeRealLwaTokenExchangeHttpLater');
assertIncludes('service', service, "'server_side_feature_gate_disabled'");
assertIncludes('service', service, "'exchange_chain_disabled'");
assertIncludes('service', service, "'request_body_builder_not_ready'");
assertIncludes('service', service, "'http_transport_not_ready'");

assertIncludes('contract', contract, "step: 'Step136-J'");
assertIncludes('contract', contract, 'orchestratorImplementedNow: false');
assertIncludes('contract', contract, "plannedOrchestratorPath:\n      'AmazonSpApiTokenExchangeService.orchestrateRealLwaExchangeChainDisabledLater'");

assertIncludes('controller', controller, 'exchangeAuthorizationCodeDryRunnable');
assertNotIncludes('controller', controller, 'orchestrateRealLwaExchangeChainDisabledLater');
assertNotIncludes('controller', controller, 'executeRealLwaTokenExchangeHttpLater');
assertNotIncludes('controller', controller, 'buildRealLwaTokenExchangeRequestBodyLater');
assertNotIncludes('controller', controller, 'exchangeAuthorizationCodeWithLwaLater');

for (const forbidden of [
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
]) {
  assertNotIncludes('service', service, forbidden);
}

for (const forbiddenPositive of [
  'callbackRuntimeChangedNow: true',
  'controllerRouteChangedNow: true',
  'realHttpEnabledNow: true',
  'tokenExchangeHttpCallNow: true',
  'lwaHttpCallNow: true',
  'realSpApiRequestNow: true',
  'tokenPersistenceDatabaseWriteNow: true',
  'requestBodyConstructedNow: true',
  'requestBodyLoggedNow: true',
  'rawAuthorizationCodeReturnedNow: true',
  'rawClientIdReturnedNow: true',
  'rawClientSecretReturnedNow: true',
  'rawRequestBodyReturnedNow: true',
  'rawLwaResponseReturnedNow: true',
  'rawAccessTokenReturnedNow: true',
  'rawRefreshTokenReturnedNow: true',
]) {
  assertNotIncludes('service', service, forbiddenPositive);
}

assertNotIncludes('service', service, 'rawResponseBody:');
assertNotIncludes('service', service, 'rawRequestBody:');
assertNotIncludes('service', service, 'access_token:');
assertNotIncludes('service', service, 'refresh_token:');

console.log('========== Step136-K real LWA exchange chain disabled orchestration smoke passed ==========');
