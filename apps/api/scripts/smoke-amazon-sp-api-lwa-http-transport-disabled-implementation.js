const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');

const files = {
  service: path.join(root, 'apps/api/src/imports/amazon-sp-api-token-exchange.service.ts'),
  controller: path.join(root, 'apps/api/src/imports/imports.controller.ts'),
  contract: path.join(
    root,
    'apps/api/src/imports/dto/amazon-sp-api-lwa-http-execution-boundary-contract.dto.ts',
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

console.log('========== Step136-H LWA HTTP transport disabled implementation smoke ==========');

assertIncludes('service', service, 'export type AmazonSpApiLwaHttpTransportDisabledInput');
assertIncludes('service', service, 'export type AmazonSpApiLwaHttpTransportDisabledResult');
assertIncludes('service', service, 'executeRealLwaTokenExchangeHttpLater');
assertIncludes('service', service, "source: 'amazon-sp-api-lwa-http-transport-disabled'");
assertIncludes('service', service, 'httpTransportPreparedNow: true');
assertIncludes('service', service, 'httpTransportImplementedNow: true');
assertIncludes('service', service, 'httpExecutedNow: false');
assertIncludes('service', service, 'requestBodyConstructedNow: false');
assertIncludes('service', service, 'requestBodyLoggedNow: false');
assertIncludes('service', service, 'rawRequestBodyReturnedNow: false');
assertIncludes('service', service, 'rawLwaResponseParsedNow: false');
assertIncludes('service', service, 'rawLwaResponseLoggedNow: false');
assertIncludes('service', service, 'rawLwaResponseReturnedNow: false');
assertIncludes('service', service, 'tokenExchangeHttpCallNow: false');
assertIncludes('service', service, 'lwaHttpCallNow: false');
assertIncludes('service', service, 'realSpApiRequestNow: false');
assertIncludes('service', service, 'tokenPersistenceDatabaseWriteNow: false');
assertIncludes('service', service, 'rawAccessTokenReturnedNow: false');
assertIncludes('service', service, 'rawRefreshTokenReturnedNow: false');
assertIncludes('service', service, "method: 'POST'");
assertIncludes('service', service, "contentType: 'application/x-www-form-urlencoded'");
assertIncludes('service', service, 'timeoutMs: 10000');
assertIncludes('service', service, 'maxAttempts: 1');
assertIncludes('service', service, 'executableClientUsedNow: false');
assertIncludes('service', service, 'responseBodyParsedNow: false');
assertIncludes('service', service, "nextImplementationStep: 'Step136-I'");
assertIncludes('service', service, "'http_transport_disabled'");
assertIncludes('service', service, "'server_side_feature_gate_disabled'");
assertIncludes('service', service, "'request_body_builder_not_ready'");
assertIncludes('service', service, "'invalid_token_endpoint'");
assertIncludes('service', service, "'missing_request_body_fingerprint'");
assertIncludes('service', service, "'invalid_request_body_length'");
assertIncludes('service', service, "'invalid_content_type'");
assertIncludes('service', service, "'invalid_method'");

assertIncludes('service', service, 'buildRealLwaTokenExchangeRequestBodyLater');
assertIncludes('service', service, 'prepareRealLwaHttpExchangeRequestDisabled');
assertIncludes('service', service, 'exchangeAuthorizationCodeWithLwaLater');
assertIncludes('service', service, 'exchangeAuthorizationCodeDryRunnable');

assertIncludes('contract', contract, "step: 'Step136-G'");
assertIncludes('contract', contract, 'implementsHttpTransportNow: false');
assertIncludes('contract', contract, 'sendsLwaHttpNow: false');

assertIncludes('controller', controller, 'exchangeAuthorizationCodeDryRunnable');
assertNotIncludes('controller', controller, 'executeRealLwaTokenExchangeHttpLater');
assertNotIncludes('controller', controller, 'buildRealLwaTokenExchangeRequestBodyLater');
assertNotIncludes('controller', controller, 'prepareRealLwaHttpExchangeRequestDisabled');
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
  'httpExecutedNow: true',
  'requestBodyLoggedNow: true',
  'rawRequestBodyReturnedNow: true',
  'rawLwaResponseParsedNow: true',
  'rawLwaResponseLoggedNow: true',
  'rawLwaResponseReturnedNow: true',
  'tokenExchangeHttpCallNow: true',
  'lwaHttpCallNow: true',
  'realSpApiRequestNow: true',
  'tokenPersistenceDatabaseWriteNow: true',
  'rawAccessTokenReturnedNow: true',
  'rawRefreshTokenReturnedNow: true',
]) {
  assertNotIncludes('service', service, forbiddenPositive);
}

assertNotIncludes('service', service, 'rawResponseBody:');
assertNotIncludes('service', service, 'rawRequestBody:');
assertNotIncludes('service', service, 'access_token:');
assertNotIncludes('service', service, 'refresh_token:');

console.log('========== Step136-H LWA HTTP transport disabled implementation smoke passed ==========');
