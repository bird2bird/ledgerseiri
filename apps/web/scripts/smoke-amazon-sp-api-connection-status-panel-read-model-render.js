const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');
const webRoot = path.join(root, 'apps/web');
const apiRoot = path.join(root, 'apps/api');

const files = {
  webPackageJson: path.join(webRoot, 'package.json'),
  panel: path.join(webRoot, 'src/components/app/imports/AmazonSpApiConnectionStatusPanel.tsx'),
  api: path.join(webRoot, 'src/core/imports/api.ts'),
  contract: path.join(
    webRoot,
    'src/components/app/imports/amazon-sp-api-connection-status-frontend-contract.ts',
  ),
  z2Smoke: path.join(webRoot, 'scripts/smoke-amazon-sp-api-connection-status-frontend-api-helper.js'),
  backendY3Smoke: path.join(apiRoot, 'scripts/smoke-amazon-sp-api-connection-status-real-db-runtime.js'),
};

function read(file) {
  if (!fs.existsSync(file)) throw new Error(`Missing file: ${path.relative(root, file)}`);
  return fs.readFileSync(file, 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`[OK] ${message}`);
}

function assertIncludes(source, needle, label) {
  assert(source.includes(needle), `${label} contains ${needle}`);
}

function assertNotIncludes(source, needle, label) {
  assert(!source.includes(needle), `${label} does not contain ${needle}`);
}

function slice(source, startMarker, endMarker, label) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert(start >= 0, `${label} start found`);
  assert(end > start, `${label} end found`);
  return source.slice(start, end);
}

console.log('========== Step139-Z3 Frontend Amazon SP-API status panel read-model render smoke ==========');

const webPkg = JSON.parse(read(files.webPackageJson));
const panel = read(files.panel);
const api = read(files.api);
const contract = read(files.contract);
const z2Smoke = read(files.z2Smoke);
const backendY3Smoke = read(files.backendY3Smoke);

assert(
  webPkg.scripts &&
    webPkg.scripts['smoke:amazon-sp-api-connection-status-panel-read-model-render'] ===
      'node scripts/smoke-amazon-sp-api-connection-status-panel-read-model-render.js',
  'apps/web package.json registers Step139-Z3 smoke',
);

for (const marker of [
  'Step139-Z3-FRONTEND-AMAZON-SP-API-STATUS-READ-MODEL-RENDER',
  'type BackendStatusDetail = AmazonSpApiConnectionStatusResponse | null',
  'backendStatusDetail',
  'setBackendStatusDetail(data)',
  'buildBackendStatusRows',
  'formatNullableDateTime',
  'formatBooleanJa',
  'getReadModelStatusLabel',
  'data-testid="amazon-sp-api-real-db-read-model-details"',
  'data-testid="amazon-sp-api-read-model-status"',
  'data-testid="amazon-sp-api-last-error-message-redacted"',
]) {
  assertIncludes(panel, marker, 'panel real DB read-model render');
}

for (const marker of [
  'readModelMode',
  'readModelStatus',
  'credentialPresent',
  'accessTokenCachePresent',
  'accessTokenExpired',
  'accessTokenExpiresAt',
  'credentialRotatedAt',
  'credentialRevokedAt',
  'lastSyncAt',
  'lastErrorCode',
  'lastErrorMessageRedacted',
]) {
  assertIncludes(panel, marker, 'panel rendered read-model field');
}

for (const marker of [
  'readModelStatus === "connected"',
  'readModelStatus === "needs_reauth"',
  'readModelStatus === "error"',
  'data?.needsReconnect',
  'data?.sanitizedResult?.readModelStatus',
]) {
  assertIncludes(panel, marker, 'panel normalizeBackendStatus uses real read-model');
}

for (const forbidden of [
  'encryptedRefreshToken',
  'encryptedAccessToken',
  'rawAuthorizationCode',
  'rawLwaResponse',
  'rawAccessToken',
  'rawRefreshToken',
]) {
  assertNotIncludes(panel, forbidden, 'panel must not render raw/encrypted token markers');
}

for (const marker of [
  'Step139-Z2-FRONTEND-AMAZON-SP-API-REAL-STATUS-API-HELPER',
  'assertAmazonSpApiConnectionStatusResponseIsSanitized',
  'AmazonSpApiConnectionStatusFrontendResponse &',
]) {
  assertIncludes(api, marker, 'frontend API helper');
}

for (const marker of [
  "step: 'Step139-Z1'",
  "nextSuggestedStep: 'Step139-Z2'",
  'credentialPresent',
  'accessTokenCachePresent',
  'accessTokenExpired',
]) {
  assertIncludes(contract, marker, 'frontend contract');
}

for (const marker of [
  'Step139-Z2 Frontend Amazon SP-API connection status API helper smoke',
  'frontend contract real DB status response type',
]) {
  assertIncludes(z2Smoke, marker, 'Step139-Z2 smoke');
}

for (const marker of [
  'Step139-Y3 Amazon SP-API connection status real DB runtime smoke',
  'connected status',
  'expired cache expired true',
]) {
  assertIncludes(backendY3Smoke, marker, 'backend Step139-Y3 smoke');
}

const renderSlice = slice(
  panel,
  'data-testid="amazon-sp-api-real-db-read-model-details"',
  'data-testid="amazon-sp-api-authorization-url-issued"',
  'panel read-model details render slice',
);

for (const marker of [
  'Connection / Credential / Access Token Cache',
  'buildBackendStatusRows(backendStatusDetail).map',
  'backendStatusDetail?.lastErrorMessageRedacted',
]) {
  assertIncludes(renderSlice, marker, 'panel read-model details render slice');
}

console.log('========== Step139-Z3 Frontend Amazon SP-API status panel read-model render smoke passed ==========');
