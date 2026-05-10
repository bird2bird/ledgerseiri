const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');
const webRoot = path.join(root, 'apps/web');
const apiRoot = path.join(root, 'apps/api');

const files = {
  webPackageJson: path.join(webRoot, 'package.json'),
  api: path.join(webRoot, 'src/core/imports/api.ts'),
  panel: path.join(webRoot, 'src/components/app/imports/AmazonSpApiConnectionStatusPanel.tsx'),
  frontendContract: path.join(
    webRoot,
    'src/components/app/imports/amazon-sp-api-connection-status-frontend-contract.ts',
  ),
  z1Smoke: path.join(webRoot, 'scripts/smoke-amazon-sp-api-connection-status-frontend-contract.js'),
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

console.log('========== Step139-Z2 Frontend Amazon SP-API connection status API helper smoke ==========');

const webPkg = JSON.parse(read(files.webPackageJson));
const api = read(files.api);
const panel = read(files.panel);
const contract = read(files.frontendContract);
const z1Smoke = read(files.z1Smoke);
const backendY3Smoke = read(files.backendY3Smoke);

assert(
  webPkg.scripts &&
    webPkg.scripts['smoke:amazon-sp-api-connection-status-frontend-api-helper'] ===
      'node scripts/smoke-amazon-sp-api-connection-status-frontend-api-helper.js',
  'apps/web package.json registers Step139-Z2 smoke',
);

assert(
  webPkg.scripts &&
    webPkg.scripts['smoke:amazon-sp-api-connection-status-frontend-contract'] ===
      'node scripts/smoke-amazon-sp-api-connection-status-frontend-contract.js',
  'apps/web package.json keeps Step139-Z1 smoke',
);

for (const marker of [
  "step: 'Step139-Z1'",
  "nextSuggestedStep: 'Step139-Z2'",
  "backendEndpoint: '/api/imports/amazon-sp-api/connection/status'",
  'AmazonSpApiConnectionStatusFrontendResponse',
  'AmazonSpApiConnectionStatusFrontendBackendStatus',
  'AmazonSpApiConnectionStatusFrontendReadModelStatus',
]) {
  assertIncludes(contract, marker, 'frontend contract');
}

for (const marker of [
  'Step139-Z2-FRONTEND-AMAZON-SP-API-REAL-STATUS-API-HELPER',
  'AmazonSpApiConnectionStatusFrontendResponse',
  'AmazonSpApiConnectionStatusFrontendBackendStatus',
  'AmazonSpApiConnectionStatusFrontendReadModelStatus',
  'AMAZON_SP_API_CONNECTION_STATUS_ENDPOINT',
  'AMAZON_SP_API_DEFAULT_MARKETPLACE_ID',
  'AMAZON_SP_API_DEFAULT_REGION',
  'AMAZON_SP_API_DEFAULT_STORE_ID',
  'buildAmazonSpApiConnectionStatusUrl',
  'assertAmazonSpApiConnectionStatusResponseIsSanitized',
  'export async function readAmazonSpApiConnectionStatus',
  '/api/imports/amazon-sp-api/connection/status',
  'credentials: "include"',
  'cache: "no-store"',
  'method: "GET"',
  'params.set("storeId", args.storeId || AMAZON_SP_API_DEFAULT_STORE_ID)',
  'params.set("marketplaceId", args.marketplaceId || AMAZON_SP_API_DEFAULT_MARKETPLACE_ID)',
  'params.set("region", args.region || AMAZON_SP_API_DEFAULT_REGION)',
]) {
  assertIncludes(api, marker, 'frontend API helper');
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
  'lastErrorCode',
  'lastErrorMessageRedacted',
  'rawAuthorizationCodeReturnedNow',
  'rawLwaResponseReturnedNow',
  'rawAccessTokenReturnedNow',
  'rawRefreshTokenReturnedNow',
  'encryptedRefreshTokenReturnedNow',
  'encryptedAccessTokenReturnedNow',
]) {
  assertIncludes(contract, marker, 'frontend contract real DB status response type');
}

for (const marker of [
  'export type AmazonSpApiConnectionStatusResponse =',
  'AmazonSpApiConnectionStatusFrontendResponse &',
  'sanitizedResult?: {',
  'credentialPresent?: boolean',
  'accessTokenCachePresent?: boolean',
  'accessTokenExpired?: boolean',
]) {
  assertIncludes(api, marker, 'frontend API helper contract-backed response type');
}

for (const marker of [
  'rawAuthorizationCodeReturnedNow !== false',
  'rawLwaResponseReturnedNow !== false',
  'rawAccessTokenReturnedNow !== false',
  'rawRefreshTokenReturnedNow !== false',
  'encryptedRefreshTokenReturnedNow !== false',
  'encryptedAccessTokenReturnedNow !== false',
]) {
  assertIncludes(api, marker, 'frontend response safety assertion');
}

const helperSlice = slice(
  api,
  'Step139-Z2-FRONTEND-AMAZON-SP-API-REAL-STATUS-API-HELPER',
  'export async function readAmazonSpApiConnectionStatus',
  'frontend API helper type/safety slice',
);

for (const forbidden of [
  'localStorage.setItem',
  'sessionStorage.setItem',
  'createReport(',
  'getReport(',
  'getReportDocument(',
]) {
  assertNotIncludes(helperSlice, forbidden, 'frontend API helper slice');
}

for (const marker of [
  'readAmazonSpApiConnectionStatus',
  'type AmazonSpApiConnectionStatusResponse',
  'normalizeBackendStatus',
  'initialReadConnectionStatus',
  'refreshBackendStatus',
]) {
  assertIncludes(panel, marker, 'existing frontend status panel remains wired');
}

for (const marker of [
  'Step139-Z1 Frontend Amazon SP-API connection status endpoint contract smoke',
  'backend controller real status endpoint',
]) {
  assertIncludes(z1Smoke, marker, 'Step139-Z1 smoke');
}

for (const marker of [
  'Step139-Y3 Amazon SP-API connection status real DB runtime smoke',
  'no connection status',
  'connected status',
  'expired cache expired true',
]) {
  assertIncludes(backendY3Smoke, marker, 'backend Step139-Y3 smoke');
}

console.log('========== Step139-Z2 Frontend Amazon SP-API connection status API helper smoke passed ==========');
