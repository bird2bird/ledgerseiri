const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');
const apiRoot = path.join(root, 'apps/api');

const files = {
  packageJson: path.join(apiRoot, 'package.json'),
  contract: path.join(
    apiRoot,
    'src/imports/dto/amazon-sp-api-connection-status-real-read-model-contract.dto.ts',
  ),
  controller: path.join(apiRoot, 'src/imports/imports.controller.ts'),
  service: path.join(apiRoot, 'src/imports/amazon-sp-api-token-persistence.service.ts'),
  repository: path.join(apiRoot, 'src/imports/amazon-sp-api-token-persistence.repository.ts'),
  schema: path.join(apiRoot, 'prisma/schema.prisma'),
  xSmoke: path.join(apiRoot, 'scripts/smoke-amazon-sp-api-oauth-callback-controller-real-db-e2e.js'),
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

console.log('========== Step139-Y1 Amazon SP-API connection status real read-model contract smoke ==========');

const pkg = JSON.parse(read(files.packageJson));
const contract = read(files.contract);
const controller = read(files.controller);
const service = read(files.service);
const repository = read(files.repository);
const schema = read(files.schema);
const xSmoke = read(files.xSmoke);
const statusEndpointStart = controller.indexOf('async amazonSpApiConnectionStatusBackendEndpoint');
const oauthCallbackStart = controller.indexOf('async amazonSpApiOAuthCallbackBoundary', statusEndpointStart);
assert(statusEndpointStart >= 0, 'connection status endpoint slice start found');
assert(oauthCallbackStart > statusEndpointStart, 'connection status endpoint slice end found');
const statusEndpointSlice = controller.slice(statusEndpointStart, oauthCallbackStart);


assert(
  pkg.scripts &&
    pkg.scripts['smoke:amazon-sp-api-connection-status-real-read-model-contract'] ===
      'node scripts/smoke-amazon-sp-api-connection-status-real-read-model-contract.js',
  'package.json registers Step139-Y1 smoke',
);

for (const marker of [
  "source: 'amazon-sp-api-connection-status-real-read-model-contract'",
  "step: 'Step139-Y1'",
  "phase: 'connection-status-real-read-model-contract-only'",
  "previousControllerRealDbE2eStep: 'Step139-X'",
  "previousControllerBranchCoverageStep: 'Step139-W'",
  "previousControllerSchemaAwareSwitchStep: 'Step139-V9'",
  'endpointAlreadyImplementedNow: true',
  "endpointRoute: '/api/imports/amazon-sp-api/connection/status'",
  'endpointGuardedByJwtNow: true',
  "controllerMethodName: 'amazonSpApiConnectionStatusBackendEndpoint'",
  "serviceMethodName: 'readConnectionStatus'",
  "repositoryMethodName: 'readConnectionStatus'",
  'repositoryCurrentlyReadsConnectionOnlyNow: true',
  'repositoryDoesNotIncludeCredentialYetNow: true',
  'repositoryDoesNotIncludeAccessTokenCacheYetNow: true',
  'defineReadModelContractOnlyNow: true',
  'modifyControllerRuntimeNow: false',
  'modifyServiceRuntimeNow: false',
  'modifyRepositoryRuntimeNow: false',
  'includeAmazonSpApiConnection: true',
  'includeAmazonSpApiCredential: true',
  'includeAmazonSpApiAccessTokenCache: true',
  'exposeCredentialPresentBoolean: true',
  'exposeAccessTokenCachePresentBoolean: true',
  'neverExposeEncryptedRefreshToken: true',
  'neverExposeEncryptedAccessToken: true',
  "readModelMode: 'real-db-connection-credential-cache'",
  'credentialPresent',
  'accessTokenCachePresent',
  'accessTokenExpired',
  'accessTokenExpiresAt',
  'credentialRotatedAt',
  'credentialRevokedAt',
  'encryptedRefreshTokenReturnedNow: false',
  'encryptedAccessTokenReturnedNow: false',
  "noConnection: 'disconnected'",
  "connectionConnectedAndCredentialPresent: 'connected'",
  "connectionConnectedButCredentialMissing: 'needs_reauth'",
  "connectionRevokedOrRevokedAtPresent: 'needs_reauth'",
  "connectionHasLastError: 'error'",
  "connectionStatusError: 'error'",
  'accessTokenCacheMissingDoesNotForceReconnect: true',
  "proposedNextStep: 'Step139-Y2'",
  "nextSuggestedStep: 'Step139-Y2'",
]) {
  assertIncludes(contract, marker, 'contract');
}

for (const smoke of [
  'smoke:amazon-sp-api-connection-status-real-read-model-contract',
  'smoke:amazon-sp-api-oauth-callback-controller-real-db-e2e',
  'smoke:amazon-sp-api-oauth-callback-schema-aware-controller-branch-runtime',
  'smoke:amazon-sp-api-token-persistence-orchestrator-schema-aware-real-db',
]) {
  assertIncludes(contract, smoke, 'contract regression smoke list');
}

for (const marker of [
  'AmazonSpApiConnectionStatusEndpointResponse',
  "@Get('amazon-sp-api/connection/status')",
  'amazonSpApiConnectionStatusBackendEndpoint',
  'this.amazonSpApiTokenPersistenceService.readConnectionStatus',
  'mapAmazonSpApiConnectionStatusForEndpoint',
  'tokenPersistenceDatabaseWriteNow: false',
  'realSpApiRequestNow: false',
  'importJobWriteNow: false',
  'transactionWriteNow: false',
  'inventoryWriteNow: false',
]) {
  assertIncludes(controller, marker, 'current controller status endpoint');
}

assertNotIncludes(statusEndpointSlice, 'encryptedRefreshToken', 'current controller status endpoint slice');
assertNotIncludes(statusEndpointSlice, 'encryptedAccessToken', 'current controller status endpoint slice');
assertNotIncludes(statusEndpointSlice, 'rawAccessToken', 'current controller status endpoint slice');
assertNotIncludes(statusEndpointSlice, 'rawRefreshToken', 'current controller status endpoint slice');
assertNotIncludes(statusEndpointSlice, 'rawAuthorizationCode', 'current controller status endpoint slice');

for (const marker of [
  'async readConnectionStatus',
  'return this.repository.readConnectionStatus',
]) {
  assertIncludes(service, marker, 'current token persistence service');
}

for (const marker of [
  'async readConnectionStatus',
  'this.prisma.amazonSpApiConnection.findUnique',
  'findConnectionForScope',
]) {
  assertIncludes(repository, marker, 'current token persistence repository');
}

if (repository.includes('credential: {') && repository.includes('accessTokenCache: {')) {
  for (const marker of [
    'credential: {',
    'accessTokenCache: {',
    'encryptionKeyId: true',
    'tokenVersion: true',
    'expiresAt: true',
  ]) {
    assertIncludes(repository, marker, 'post-Step139-Y2 repository status read-model');
  }
} else {
  assertNotIncludes(repository, 'credential: true', 'repository status read-model currently does not include credential');
  assertNotIncludes(repository, 'accessTokenCache: true', 'repository status read-model currently does not include access token cache');
}

for (const marker of [
  'model AmazonSpApiConnection',
  'model AmazonSpApiCredential',
  'model AmazonSpApiAccessTokenCache',
  '@@unique([companyId, storeId, marketplaceId, region])',
  'connectionId          String   @unique',
]) {
  assertIncludes(schema, marker, 'schema');
}

for (const marker of [
  'Step139-X OAuth callback controller-level real DB E2E smoke',
  'amazonSpApiConnection.findUnique',
  'credential: true',
  'accessTokenCache: true',
]) {
  assertIncludes(xSmoke, marker, 'Step139-X smoke');
}

console.log('========== Step139-Y1 Amazon SP-API connection status real read-model contract smoke passed ==========');
