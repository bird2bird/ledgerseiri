const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');

const files = {
  service: path.join(root, 'apps/api/src/imports/amazon-sp-api-token-exchange.service.ts'),
  controller: path.join(root, 'apps/api/src/imports/imports.controller.ts'),
  contract: path.join(
    root,
    'apps/api/src/imports/dto/amazon-sp-api-oauth-token-exchange-boundary-contract.dto.ts',
  ),
};

function read(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing file: ${path.relative(root, file)}`);
  }
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

console.log('========== Step135-B token exchange service skeleton smoke ==========');

assertIncludes('service', service, 'export type AmazonSpApiRealLwaTokenExchangeDisabledInput');
assertIncludes('service', service, 'export type AmazonSpApiRealLwaTokenExchangeDisabledResult');
assertIncludes('service', service, 'exchangeAuthorizationCodeWithLwaLater');
assertIncludes('service', service, "source: 'amazon-sp-api-token-exchange-real-lwa-disabled-skeleton'");
assertIncludes('service', service, "transportMode: 'real-lwa-disabled'");
assertIncludes('service', service, 'enableRealLwaHttpTransport: false');
assertIncludes('service', service, 'tokenExchangeHttpCallNow: false');
assertIncludes('service', service, 'lwaHttpCallNow: false');
assertIncludes('service', service, 'tokenPersistenceDatabaseWriteNow: false');
assertIncludes('service', service, 'realSpApiRequestNow: false');
assertIncludes('service', service, 'rawRefreshTokenReturnedNow: false');
assertIncludes('service', service, 'rawAccessTokenReturnedNow: false');
assertIncludes('service', service, 'clientSecretReturnedNow: false');
assertIncludes('service', service, "nextImplementationStep: 'Step136-F'");
assertIncludes('service', service, "'real_lwa_transport_disabled'");
assertIncludes(
  'service',
  service,
  'Real Amazon LWA token exchange transport is intentionally disabled until Step136-F.',
);

assertIncludes('service', service, 'exchangeAuthorizationCodeDryRunnable');
assertIncludes('service', service, "transportMode: 'fake'");
assertIncludes('service', service, 'dryRun: true');

assertIncludes(
  'contract',
  contract,
  "futureExchangeService:\n      'AmazonSpApiTokenExchangeService.exchangeAuthorizationCodeWithLwaLater'",
);
assertIncludes('contract', contract, "nextTransport: 'real-lwa-http-client-later'");
assertIncludes('contract', contract, 'implementsRealLwaHttpClientNow: false');
assertIncludes('contract', contract, 'callsLwaTokenEndpointNow: false');

assertIncludes('controller', controller, 'exchangeAuthorizationCodeDryRunnable');
assertNotIncludes('controller', controller, 'exchangeAuthorizationCodeWithLwaLater');

const forbiddenTransportMarkers = [
  'fetch(',
  'axios.',
  'http.request',
  'https.request',
  'request.write(',
  '.post(',
  'api.amazon.com/auth/o2/token',
  'Authorization: ',
  'Bearer ',
];

for (const marker of forbiddenTransportMarkers) {
  assertNotIncludes('service', service, marker);
}

assertNotIncludes('service', service, 'createReport(');
assertNotIncludes('service', service, 'getReport(');
assertNotIncludes('service', service, 'getReportDocument(');
assertNotIncludes('service', service, 'prisma.importJob');
assertNotIncludes('service', service, 'prisma.importStagingRow');
assertNotIncludes('service', service, 'prisma.transaction');
assertNotIncludes('service', service, 'prisma.inventory');

console.log('========== Step135-B token exchange service skeleton smoke passed ==========');
