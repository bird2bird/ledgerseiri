const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');

const files = {
  service: path.join(root, 'apps/api/src/imports/amazon-sp-api-token-exchange.service.ts'),
  controller: path.join(root, 'apps/api/src/imports/imports.controller.ts'),
  contract: path.join(
    root,
    'apps/api/src/imports/dto/amazon-sp-api-real-lwa-token-exchange-enablement-boundary-contract.dto.ts',
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

console.log('========== Step136-B real LWA HTTP client disabled-by-default smoke ==========');

assertIncludes('service', service, 'export type AmazonSpApiRealLwaHttpClientDisabledInput');
assertIncludes('service', service, 'export type AmazonSpApiRealLwaHttpClientDisabledResult');
assertIncludes('service', service, 'prepareRealLwaHttpExchangeRequestDisabled');
assertIncludes('service', service, "source: 'amazon-sp-api-real-lwa-http-client-disabled-by-default'");
assertIncludes('service', service, "transportMode: 'real-lwa-http-disabled'");
assertIncludes('service', service, 'httpClientPreparedNow: true');
assertIncludes('service', service, 'serverSideFeatureGateEnabled: false');
assertIncludes('service', service, 'enableRealLwaHttpTransport: false');
assertIncludes('service', service, 'envFlagAloneAccepted: false');
assertIncludes('service', service, 'realLwaHttpTransportEnabled: false');
assertIncludes('service', service, "method: 'POST'");
assertIncludes('service', service, "contentType: 'application/x-www-form-urlencoded'");
assertIncludes('service', service, "grantType: 'authorization_code'");
assertIncludes('service', service, 'requestBodyConstructedNow: false');
assertIncludes('service', service, 'requestBodyLoggedNow: false');
assertIncludes('service', service, 'responseBodyParsedNow: false');
assertIncludes('service', service, "nextImplementationStep: 'Step136-I'");
assertIncludes('service', service, 'tokenExchangeHttpCallNow: false');
assertIncludes('service', service, 'lwaHttpCallNow: false');
assertIncludes('service', service, 'tokenPersistenceDatabaseWriteNow: false');
assertIncludes('service', service, 'realSpApiRequestNow: false');
assertIncludes('service', service, 'rawAuthorizationCodeReturnedNow: false');
assertIncludes('service', service, 'rawClientIdReturnedNow: false');
assertIncludes('service', service, 'rawClientSecretReturnedNow: false');
assertIncludes('service', service, 'rawRefreshTokenReturnedNow: false');
assertIncludes('service', service, 'rawAccessTokenReturnedNow: false');
assertIncludes('service', service, "'server_side_feature_gate_disabled'");
assertIncludes('service', service, "'real_lwa_http_disabled'");
assertIncludes('service', service, "'config_validator_not_ready'");
assertIncludes('service', service, "'invalid_token_endpoint'");
assertIncludes('service', service, 'parseHttpsEndpointShape');

assertIncludes('service', service, 'exchangeAuthorizationCodeWithLwaLater');
assertIncludes('service', service, 'exchangeAuthorizationCodeDryRunnable');
assertIncludes('service', service, "transportMode: 'fake'");

assertIncludes('contract', contract, "step: 'Step136-A'");
assertIncludes('contract', contract, 'realHttpMustRemainDisabledInStep136A: true');
assertIncludes('contract', contract, 'envFlagAloneIsNotEnough: true');

assertIncludes('controller', controller, 'exchangeAuthorizationCodeDryRunnable');
assertNotIncludes('controller', controller, 'exchangeAuthorizationCodeWithLwaLater');
assertNotIncludes('controller', controller, 'prepareRealLwaHttpExchangeRequestDisabled');

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
  'tokenExchangeHttpCallNow: true',
  'lwaHttpCallNow: true',
  'tokenPersistenceDatabaseWriteNow: true',
  'realSpApiRequestNow: true',
  'rawAuthorizationCodeReturnedNow: true',
  'rawClientIdReturnedNow: true',
  'rawClientSecretReturnedNow: true',
  'rawRefreshTokenReturnedNow: true',
  'rawAccessTokenReturnedNow: true',
]) {
  assertNotIncludes('service', service, forbiddenPositive);
}

console.log('========== Step136-B real LWA HTTP client disabled-by-default smoke passed ==========');
