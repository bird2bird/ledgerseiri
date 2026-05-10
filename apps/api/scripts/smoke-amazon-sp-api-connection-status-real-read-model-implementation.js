const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');
const apiRoot = path.join(root, 'apps/api');

const files = {
  packageJson: path.join(apiRoot, 'package.json'),
  controller: path.join(apiRoot, 'src/imports/imports.controller.ts'),
  service: path.join(apiRoot, 'src/imports/amazon-sp-api-token-persistence.service.ts'),
  repository: path.join(apiRoot, 'src/imports/amazon-sp-api-token-persistence.repository.ts'),
  schema: path.join(apiRoot, 'prisma/schema.prisma'),
  y1Contract: path.join(apiRoot, 'src/imports/dto/amazon-sp-api-connection-status-real-read-model-contract.dto.ts'),
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
  const end = source.indexOf(endMarker, start);
  assert(start >= 0, `${label} start found`);
  assert(end > start, `${label} end found`);
  return source.slice(start, end);
}

console.log('========== Step139-Y2 Amazon SP-API connection status real read-model implementation smoke ==========');

const pkg = JSON.parse(read(files.packageJson));
const controller = read(files.controller);
const service = read(files.service);
const repository = read(files.repository);
const schema = read(files.schema);
const y1Contract = read(files.y1Contract);

assert(
  pkg.scripts &&
    pkg.scripts['smoke:amazon-sp-api-connection-status-real-read-model-implementation'] ===
      'node scripts/smoke-amazon-sp-api-connection-status-real-read-model-implementation.js',
  'package.json registers Step139-Y2 smoke',
);

for (const marker of [
  "step: 'Step139-Y1'",
  "proposedNextStep: 'Step139-Y2'",
  'includeAmazonSpApiCredential: true',
  'includeAmazonSpApiAccessTokenCache: true',
  'neverExposeEncryptedRefreshToken: true',
  'neverExposeEncryptedAccessToken: true',
]) {
  assertIncludes(y1Contract, marker, 'Y1 contract');
}

for (const marker of [
  'async readConnectionStatus',
  'return this.repository.readConnectionStatus',
]) {
  assertIncludes(service, marker, 'service readConnectionStatus');
}

const repoFindSlice = slice(
  repository,
  'private async findConnectionForScope',
  'private async appendAudit',
  'repository findConnectionForScope slice',
);

for (const marker of [
  'include: {',
  'credential: {',
  'accessTokenCache: {',
  'select: {',
  'encryptionKeyId: true',
  'encryptionAlgorithm: true',
  'tokenVersion: true',
  'rotatedAt: true',
  'revokedAt: true',
  'tokenType: true',
  'scope: true',
  'expiresAt: true',
]) {
  assertIncludes(repoFindSlice, marker, 'repository real read-model include slice');
}

for (const forbidden of [
  'encryptedRefreshToken',
  'encryptedAccessToken',
]) {
  assertNotIncludes(repoFindSlice, forbidden, 'repository real read-model include slice');
}

for (const marker of [
  'credential: connection.credential ?? null',
  'accessTokenCache: connection.accessTokenCache ?? null',
  "credential?: AmazonSpApiConnectionReadModel['credential']",
  "accessTokenCache?: AmazonSpApiConnectionReadModel['accessTokenCache']",
]) {
  assertIncludes(repository, marker, 'repository toReadModel');
}

const responseTypeSlice = slice(
  controller,
  'type AmazonSpApiConnectionStatusEndpointResponse = {',
  'function redactSellingPartnerIdForConnectionStatus',
  'controller response type slice',
);

for (const marker of [
  "readModelMode: 'real-db-connection-credential-cache'",
  "readModelStatus: 'disconnected' | 'connected' | 'needs_reauth' | 'error'",
  'credentialPresent: boolean',
  'accessTokenCachePresent: boolean',
  'accessTokenExpired: boolean',
  'accessTokenExpiresAt: string | null',
  'credentialRotatedAt: string | null',
  'credentialRevokedAt: string | null',
  'rawAuthorizationCodeReturnedNow: false',
  'rawLwaResponseReturnedNow: false',
  'rawAccessTokenReturnedNow: false',
  'rawRefreshTokenReturnedNow: false',
  'encryptedRefreshTokenReturnedNow: false',
  'encryptedAccessTokenReturnedNow: false',
]) {
  assertIncludes(responseTypeSlice, marker, 'controller response type');
}

const mapperSlice = slice(
  controller,
  'function mapAmazonSpApiConnectionStatusForEndpoint',
  "@Controller('api/imports')",
  'controller mapper slice',
);

for (const marker of [
  "readModelMode: 'real-db-connection-credential-cache'",
  "readModelStatus: 'disconnected'",
  'credentialPresent',
  'accessTokenCachePresent',
  'accessTokenExpired',
  "rawStatus === 'ERROR'",
  "rawStatus === 'REVOKED'",
  "rawStatus === 'EXPIRED'",
  "!credentialPresent",
  "readModelStatus === 'connected'",
  "readModelStatus === 'needs_reauth'",
  'accessTokenExpiresAt?.toISOString?.() ?? null',
  'credentialRotatedAt',
  'credentialRevokedAt',
]) {
  assertIncludes(mapperSlice, marker, 'controller mapper');
}

// Do not assert encrypted token strings against the broad mapper slice.
// The controller file also contains OAuth callback persistence code where encrypted token field
// names legitimately appear. The status endpoint slice is the real leakage boundary.

const statusEndpointSlice = slice(
  controller,
  'async amazonSpApiConnectionStatusBackendEndpoint',
  'async amazonSpApiOAuthCallbackBoundary',
  'controller status endpoint slice',
);

for (const marker of [
  'this.amazonSpApiTokenPersistenceService.readConnectionStatus',
  'mapAmazonSpApiConnectionStatusForEndpoint',
]) {
  assertIncludes(statusEndpointSlice, marker, 'controller status endpoint');
}

for (const forbidden of [
  'encryptedRefreshToken',
  'encryptedAccessToken',
  'rawAccessToken',
  'rawRefreshToken',
  'rawAuthorizationCode',
  'rawLwaResponse',
]) {
  assertNotIncludes(statusEndpointSlice, forbidden, 'controller status endpoint');
}


for (const marker of [
  'model AmazonSpApiConnection',
  'credential               AmazonSpApiCredential?',
  'accessTokenCache         AmazonSpApiAccessTokenCache?',
  'model AmazonSpApiCredential',
  'model AmazonSpApiAccessTokenCache',
]) {
  assertIncludes(schema, marker, 'schema');
}

console.log('========== Step139-Y2 Amazon SP-API connection status real read-model implementation smoke passed ==========');
