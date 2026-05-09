const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');

const files = {
  service: path.join(root, 'apps/api/src/imports/amazon-sp-api-token-exchange.service.ts'),
  controller: path.join(root, 'apps/api/src/imports/imports.controller.ts'),
  contract: path.join(
    root,
    'apps/api/src/imports/dto/amazon-sp-api-lwa-request-body-builder-boundary-contract.dto.ts',
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

console.log('========== Step136-E LWA request body builder disabled implementation smoke ==========');

assertIncludes('service', service, 'export type AmazonSpApiLwaRequestBodyBuilderDisabledInput');
assertIncludes('service', service, 'export type AmazonSpApiLwaRequestBodyBuilderDisabledResult');
assertIncludes('service', service, 'buildRealLwaTokenExchangeRequestBodyLater');
assertIncludes('service', service, "source: 'amazon-sp-api-lwa-request-body-builder-disabled'");
assertIncludes('service', service, 'requestBodyBuilderPreparedNow: true');
assertIncludes('service', service, 'requestBodyConstructedNow: false');
assertIncludes('service', service, 'requestBodyLoggedNow: false');
assertIncludes('service', service, 'requestBodyReturnedToControllerNow: false');
assertIncludes('service', service, 'requestBodyReturnedToFrontendNow: false');
assertIncludes('service', service, 'rawRequestBodyReturnedNow: false');
assertIncludes('service', service, 'rawAuthorizationCodeReturnedNow: false');
assertIncludes('service', service, 'rawClientIdReturnedNow: false');
assertIncludes('service', service, 'rawClientSecretReturnedNow: false');
assertIncludes('service', service, "contentType: 'application/x-www-form-urlencoded'");
assertIncludes('service', service, "encodingApi: 'URLSearchParams'");
assertIncludes('service', service, "method: 'POST'");
assertIncludes('service', service, "'grant_type'");
assertIncludes('service', service, "'code'");
assertIncludes('service', service, "'redirect_uri'");
assertIncludes('service', service, "'client_id'");
assertIncludes('service', service, "'client_secret'");
assertIncludes('service', service, "grantType: 'authorization_code'");
assertIncludes('service', service, 'encodedBodyLength: bodyShapeSeed.length');
assertIncludes('service', service, 'encodedBodySha256: sanitizedBodyFingerprint(bodyShapeSeed)');
assertIncludes('service', service, 'rawBodyAvailableOnlyInsideBuilder: false');
assertIncludes('service', service, "nextImplementationStep: 'Step136-F'");
assertIncludes('service', service, "'request_body_builder_disabled'");
assertIncludes('service', service, "'server_side_feature_gate_disabled'");
assertIncludes('service', service, "'mismatched_redirect_uri'");
assertIncludes('service', service, "'missing_client_secret_fingerprint'");

assertIncludes('service', service, 'prepareRealLwaHttpExchangeRequestDisabled');
assertIncludes('service', service, 'exchangeAuthorizationCodeWithLwaLater');
assertIncludes('service', service, 'exchangeAuthorizationCodeDryRunnable');

assertIncludes('contract', contract, "step: 'Step136-D'");
assertIncludes('contract', contract, 'implementsRequestBodyBuilderNow: false');
assertIncludes('contract', contract, 'rawRequestBodyMayBeLogged: false');

assertIncludes('controller', controller, 'exchangeAuthorizationCodeDryRunnable');
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
  'requestBodyConstructedNow: true',
  'requestBodyLoggedNow: true',
  'requestBodyReturnedToControllerNow: true',
  'requestBodyReturnedToFrontendNow: true',
  'tokenExchangeHttpCallNow: true',
  'lwaHttpCallNow: true',
  'realSpApiRequestNow: true',
  'tokenPersistenceDatabaseWriteNow: true',
  'rawAuthorizationCodeReturnedNow: true',
  'rawClientIdReturnedNow: true',
  'rawClientSecretReturnedNow: true',
  'rawRequestBodyReturnedNow: true',
]) {
  assertNotIncludes('service', service, forbiddenPositive);
}

assertNotIncludes('service', service, 'requestBody:');
assertNotIncludes('service', service, 'rawBody:');
assertNotIncludes('service', service, 'new URLSearchParams(');

console.log('========== Step136-E LWA request body builder disabled implementation smoke passed ==========');
