const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');
const webRoot = path.join(root, 'apps/web');
const apiRoot = path.join(root, 'apps/api');

const files = {
  webPackageJson: path.join(webRoot, 'package.json'),
  panel: path.join(webRoot, 'src/components/app/imports/AmazonSpApiConnectionStatusPanel.tsx'),
  z3Smoke: path.join(webRoot, 'scripts/smoke-amazon-sp-api-connection-status-panel-read-model-render.js'),
  z2Smoke: path.join(webRoot, 'scripts/smoke-amazon-sp-api-connection-status-frontend-api-helper.js'),
  z1Smoke: path.join(webRoot, 'scripts/smoke-amazon-sp-api-connection-status-frontend-contract.js'),
  legacyStatusSmoke: path.join(webRoot, 'scripts/smoke-amazon-sp-api-frontend-status-read-implementation.js'),
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

function count(source, needle) {
  return source.split(needle).length - 1;
}

console.log('========== Step139-Z4 Frontend Amazon SP-API connection status panel closeout smoke ==========');

const webPkg = JSON.parse(read(files.webPackageJson));
const panel = read(files.panel);
const z3Smoke = read(files.z3Smoke);
const z2Smoke = read(files.z2Smoke);
const z1Smoke = read(files.z1Smoke);
const legacyStatusSmoke = read(files.legacyStatusSmoke);
const backendY3Smoke = read(files.backendY3Smoke);

assert(
  webPkg.scripts &&
    webPkg.scripts['smoke:amazon-sp-api-connection-status-panel-closeout'] ===
      'node scripts/smoke-amazon-sp-api-connection-status-panel-closeout.js',
  'apps/web package.json registers Step139-Z4 smoke',
);

for (const marker of [
  'Step139-Z4-FRONTEND-AMAZON-SP-API-STATUS-PANEL-CLOSEOUT',
  'Step139-Z3-FRONTEND-AMAZON-SP-API-STATUS-READ-MODEL-RENDER',
  'data-testid="amazon-sp-api-real-db-read-model-details"',
  'Amazon SP-API 接続詳細',
  '接続情報・認証情報・一時トークン状態',
  '読取モード',
  'DB状態',
  '認証情報',
  '一時トークン',
  '一時トークン期限切れ',
  '一時トークン期限',
  '認証情報更新日時',
  '認証情報失効日時',
  '最終同期日時',
  '最終エラーコード',
]) {
  assertIncludes(panel, marker, 'panel closeout UX');
}

assert(
  count(panel, 'setBackendStatusDetail(null);') <= 2,
  'panel does not contain duplicated setBackendStatusDetail(null) calls',
);

for (const forbidden of [
  'Real DB Read Model',
  'Connection / Credential / Access Token Cache',
  'encryptedRefreshToken',
  'encryptedAccessToken',
  'rawAuthorizationCode',
  'rawLwaResponse',
  'rawAccessToken',
  'rawRefreshToken',
  'createReport(',
  'getReport(',
  'getReportDocument(',
]) {
  assertNotIncludes(panel, forbidden, 'panel closeout forbidden marker');
}

for (const marker of [
  '接続情報・認証情報・一時トークン状態',
  'Step139-Z3 Frontend Amazon SP-API status panel read-model render smoke',
]) {
  assertIncludes(z3Smoke, marker, 'Step139-Z3 smoke closeout compatibility');
}

for (const marker of [
  'Step139-Z2 Frontend Amazon SP-API connection status API helper smoke',
  'assertAmazonSpApiConnectionStatusResponseIsSanitized',
]) {
  assertIncludes(z2Smoke, marker, 'Step139-Z2 smoke');
}

for (const marker of [
  'Step139-Z1 Frontend Amazon SP-API connection status endpoint contract smoke',
  'backend controller real status endpoint',
]) {
  assertIncludes(z1Smoke, marker, 'Step139-Z1 smoke');
}

for (const marker of [
  'Step134-B frontend status read smoke',
  'buildAmazonSpApiConnectionStatusUrl',
]) {
  assertIncludes(legacyStatusSmoke, marker, 'legacy frontend status smoke remains compatible');
}

for (const marker of [
  'Step139-Y3 Amazon SP-API connection status real DB runtime smoke',
  'expired cache expired true',
]) {
  assertIncludes(backendY3Smoke, marker, 'backend Y3 regression smoke');
}

console.log('========== Step139-Z4 Frontend Amazon SP-API connection status panel closeout smoke passed ==========');
