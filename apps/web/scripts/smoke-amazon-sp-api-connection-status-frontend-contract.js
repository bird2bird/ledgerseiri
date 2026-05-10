const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');
const webRoot = path.join(root, 'apps/web');
const apiRoot = path.join(root, 'apps/api');

const files = {
  webPackageJson: path.join(webRoot, 'package.json'),
  apiPackageJson: path.join(apiRoot, 'package.json'),
  contract: path.join(
    webRoot,
    'src/components/app/imports/amazon-sp-api-connection-status-frontend-contract.ts',
  ),
  backendController: path.join(apiRoot, 'src/imports/imports.controller.ts'),
  backendY3Smoke: path.join(apiRoot, 'scripts/smoke-amazon-sp-api-connection-status-real-db-runtime.js'),
  importsDir: path.join(webRoot, 'src/components/app/imports'),
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

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  const stack = [dir];

  while (stack.length) {
    const current = stack.pop();
    for (const name of fs.readdirSync(current)) {
      const full = path.join(current, name);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) stack.push(full);
      else out.push(full);
    }
  }

  return out.sort();
}

console.log('========== Step139-Z1 Frontend Amazon SP-API connection status endpoint contract smoke ==========');

const webPkg = JSON.parse(read(files.webPackageJson));
const apiPkg = JSON.parse(read(files.apiPackageJson));
const contract = read(files.contract);
const backendController = read(files.backendController);
const backendY3Smoke = read(files.backendY3Smoke);

assert(
  webPkg.scripts &&
    webPkg.scripts['smoke:amazon-sp-api-connection-status-frontend-contract'] ===
      'node scripts/smoke-amazon-sp-api-connection-status-frontend-contract.js',
  'apps/web package.json registers Step139-Z1 smoke',
);

assert(
  apiPkg.scripts &&
    apiPkg.scripts['smoke:amazon-sp-api-connection-status-real-db-runtime'] ===
      'node scripts/smoke-amazon-sp-api-connection-status-real-db-runtime.js',
  'apps/api package.json still registers Step139-Y3 smoke',
);

for (const marker of [
  "source: 'amazon-sp-api-connection-status-frontend-contract'",
  "step: 'Step139-Z1'",
  "phase: 'frontend-contract-only'",
  "dependsOnBackendStep: 'Step139-Y3'",
  "backendEndpoint: '/api/imports/amazon-sp-api/connection/status'",
  "route: '/[lang]/app/data/import'",
  "likelyDirectory: 'apps/web/src/components/app/imports'",
  "nextSuggestedStep: 'Step139-Z2'",
  'AmazonSpApiConnectionStatusFrontendResponse',
  'AmazonSpApiConnectionStatusFrontendBackendStatus',
  'AmazonSpApiConnectionStatusFrontendReadModelStatus',
  'mapAmazonSpApiConnectionStatusToUiCopy',
]) {
  assertIncludes(contract, marker, 'frontend contract');
}

for (const field of [
  'readModelMode',
  'status',
  'readModelStatus',
  'connected',
  'needsReconnect',
  'credentialPresent',
  'accessTokenCachePresent',
  'accessTokenExpired',
  'accessTokenExpiresAt',
  'credentialRotatedAt',
  'credentialRevokedAt',
  'lastSyncAt',
  'lastErrorCode',
  'lastErrorMessageRedacted',
  'rawAuthorizationCodeReturnedNow',
  'rawLwaResponseReturnedNow',
  'rawAccessTokenReturnedNow',
  'rawRefreshTokenReturnedNow',
  'encryptedRefreshTokenReturnedNow',
  'encryptedAccessTokenReturnedNow',
]) {
  assertIncludes(contract, field, 'frontend required backend fields');
}

for (const marker of [
  'NOT_CONNECTED',
  'CONNECTED',
  'RECONNECT_REQUIRED',
  'ERROR',
  "labelJa: '未接続'",
  "labelJa: '接続済み'",
  "labelJa: '再接続が必要'",
  "labelJa: 'エラー'",
  "badge: 'not-connected'",
  "badge: 'connected'",
  "badge: 'needs-reconnect'",
  "badge: 'error'",
]) {
  assertIncludes(contract, marker, 'frontend status UI mapping');
}

for (const marker of [
  'neverDisplayEncryptedRefreshToken: true',
  'neverDisplayEncryptedAccessToken: true',
  'neverDisplayRawAuthorizationCode: true',
  'neverDisplayRawAccessToken: true',
  'neverDisplayRawRefreshToken: true',
]) {
  assertIncludes(contract, marker, 'frontend display safety rules');
}

for (const forbidden of [
  'encrypted-refresh-secret',
  'encrypted-access-secret',
  'PLAINTEXT_ACCESS_TOKEN',
  'PLAINTEXT_REFRESH_TOKEN',
]) {
  assertNotIncludes(contract, forbidden, 'frontend contract secret literals');
}

for (const marker of [
  "@Get('amazon-sp-api/connection/status')",
  "readModelMode: 'real-db-connection-credential-cache'",
  'credentialPresent',
  'accessTokenCachePresent',
  'accessTokenExpired',
  'encryptedRefreshTokenReturnedNow: false',
  'encryptedAccessTokenReturnedNow: false',
]) {
  assertIncludes(backendController, marker, 'backend controller real status endpoint');
}

for (const marker of [
  'Step139-Y3 Amazon SP-API connection status real DB runtime smoke',
  'no connection status',
  'connected status',
  'credential revoked reconnect required',
  'expired cache expired true',
]) {
  assertIncludes(backendY3Smoke, marker, 'backend Step139-Y3 runtime smoke');
}

const importFiles = listFiles(files.importsDir).map((file) => path.relative(root, file));
assert(importFiles.length > 0, 'frontend imports component directory contains files');

console.log('[INFO] frontend imports files discovered:');
for (const file of importFiles.slice(0, 30)) {
  console.log(`  - ${file}`);
}

console.log('========== Step139-Z1 Frontend Amazon SP-API connection status endpoint contract smoke passed ==========');
