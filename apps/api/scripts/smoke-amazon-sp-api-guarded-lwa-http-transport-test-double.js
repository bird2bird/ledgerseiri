const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');

const files = {
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

const service = read(files.service);
const controller = read(files.controller);
const pkg = JSON.parse(read(files.packageJson));

console.log('========== Step137-I guarded LWA HTTP transport test-double smoke ==========');

assertIncludes(
  'package.json',
  JSON.stringify(pkg.scripts || {}),
  'smoke:amazon-sp-api-guarded-lwa-http-transport-test-double',
);

for (const marker of [
  'export type AmazonSpApiGuardedLwaHttpTransportInput',
  'export type AmazonSpApiGuardedLwaHttpTransportResult',
  'executeRealLwaTokenExchangeHttpGuardedLater',
  "source: 'amazon-sp-api-real-lwa-guarded-http-transport-test-double'",
  "transportMode: 'test-double-no-network'",
  "gateDecision: 'blocked'",
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
  'guardedHttpTransportPreparedNow: true',
  'guardedHttpTransportImplementedNow: true',
  'realHttpAllowedNow: false',
  'realHttpEnabledNow: false',
  'executableHttpClientUsedNow: false',
  'networkCallNow: false',
  'tokenExchangeHttpCallNow: false',
  'lwaHttpCallNow: false',
  'realSpApiRequestNow: false',
  'tokenPersistenceDatabaseWriteNow: false',
  'rawRequestBodyReturnedNow: false',
  'rawLwaResponseReturnedNow: false',
  'rawAccessTokenReturnedNow: false',
  'rawRefreshTokenReturnedNow: false',
  "nextImplementationStep: 'Step137-J'",
]) {
  assertIncludes('service', service, marker);
}

const forbiddenServiceMarkers = [
  'fetch(',
  'axios.',
  'http.request',
  'https.request',
  'api.amazon.com/auth/o2/token',
  'rawLwaResponseReturnedNow: true',
  'rawAccessTokenReturnedNow: true',
  'rawRefreshTokenReturnedNow: true',
  'ACCESS_TOKEN_SECRET_VALUE',
  'REFRESH_TOKEN_SECRET_VALUE',
  'networkCallNow: true',
  'executableHttpClientUsedNow: true',
  'tokenPersistenceDatabaseWriteNow: true',
  'realSpApiRequestNow: true',
];

for (const marker of forbiddenServiceMarkers) {
  assertNotIncludes('service', service, marker);
}

assertIncludes('controller', controller, 'exchangeAuthorizationCodeDryRunnable');
assertIncludes('controller', controller, "Get('internal/amazon-sp-api/lwa-activation-gate/status')");
assertNotIncludes('controller', controller, 'executeRealLwaTokenExchangeHttpGuardedLater');
assertNotIncludes('controller', controller, 'executeRealLwaTokenExchangeHttpLater');

console.log('========== Step137-I guarded LWA HTTP transport test-double smoke passed ==========');
