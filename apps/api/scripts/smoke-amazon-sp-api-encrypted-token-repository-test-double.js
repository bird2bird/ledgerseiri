const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '../../..');
const apiRoot = path.join(root, 'apps/api');
const repositorySource = fs.readFileSync(path.join(apiRoot, 'src/imports/amazon-sp-api-credential.repository.ts'), 'utf8');

const files = {
  repository: path.join(apiRoot, 'src/imports/amazon-sp-api-credential.repository.ts'),
  service: path.join(apiRoot, 'src/imports/amazon-sp-api-token-exchange.service.ts'),
  controller: path.join(apiRoot, 'src/imports/imports.controller.ts'),
  packageJson: path.join(apiRoot, 'package.json'),
  repositoryContract: path.join(
    apiRoot,
    'src/imports/dto/amazon-sp-api-encrypted-token-persistence-repository-contract.dto.ts',
  ),
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

function assertEqual(actual, expected, message) {
  assert(
    actual === expected,
    `${message}: expected=${JSON.stringify(expected)} actual=${JSON.stringify(actual)}`,
  );
}

function loadRepositoryClass() {
  const ts = require(path.join(apiRoot, 'node_modules/typescript'));
  const source = read(files.repository);

  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      experimentalDecorators: true,
      emitDecoratorMetadata: false,
      esModuleInterop: true,
    },
    fileName: files.repository,
  }).outputText;

  const module = { exports: {} };
  const sandbox = {
    require,
    module,
    exports: module.exports,
    __dirname: path.dirname(files.repository),
    __filename: files.repository,
    console,
  };

  vm.runInNewContext(output, sandbox, {
    filename: files.repository.replace(/\.ts$/, '.js'),
  });

  return module.exports.AmazonSpApiCredentialRepository;
}

function assertSafe(result, label) {
  assertEqual(result.source, 'amazon-sp-api-encrypted-token-repository-test-double', `${label} source`);
  assertEqual(result.repositoryMode, 'test-double-no-prisma-write', `${label} mode`);

  for (const [key, expected] of [
    ['prismaClientWriteNow', false],
    ['databaseWriteNow', false],
    ['tokenPersistenceDatabaseWriteNow', false],
    ['plaintextTokenDatabaseWriteNow', false],
    ['repositoryMayCallAmazonNow', false],
    ['repositoryMayParseLwaResponseNow', false],
    ['repositoryMayOwnEncryptionNow', false],
    ['rawTokenReturnedNow', false],
  ]) {
    assertEqual(result[key], expected, `${label} ${key}`);
  }

  const serialized = JSON.stringify(result);
  assert(!serialized.includes('PLAINTEXT_ACCESS_TOKEN'), `${label} does not expose plaintext access token`);
  assert(!serialized.includes('PLAINTEXT_REFRESH_TOKEN'), `${label} does not expose plaintext refresh token`);
  assert(!serialized.includes('RAW_LWA_RESPONSE'), `${label} does not expose raw LWA response`);
  assert(!serialized.includes('AUTHORIZATION_CODE_VALUE'), `${label} does not expose authorization code`);
  assert(!serialized.includes('CLIENT_SECRET_VALUE'), `${label} does not expose client secret`);
}

console.log('========== Step137-Y encrypted token repository test-double smoke ==========');

const repoSource = read(files.repository);
const service = read(files.service);
const controller = read(files.controller);
const pkg = JSON.parse(read(files.packageJson));
const repositoryContract = read(files.repositoryContract);

assert(
  JSON.stringify(pkg.scripts || {}).includes('smoke:amazon-sp-api-encrypted-token-repository-test-double'),
  'package.json registers Step137-Y smoke',
);

for (const marker of [
  'export class AmazonSpApiCredentialRepository',
  'upsertEncryptedCredentialTestDouble',
  'findActiveCredentialForStoreTestDouble',
  'markCredentialNeedsReauthTestDouble',
  'revokeCredentialTestDouble',
  'updateAccessTokenCacheTestDouble',
  "repositoryMode: 'test-double-no-prisma-write'",
  "'plaintext_token_field_rejected'",
  "'raw_lwa_response_rejected'",
  "'raw_authorization_code_rejected'",
  "'raw_client_secret_rejected'",
  "'missing_company_id'",
  "'missing_store_id'",
  "'missing_marketplace_id'",
  "'missing_region'",
  "'missing_selling_partner_id'",
  "'missing_encrypted_refresh_token'",
  "'missing_refresh_token_fingerprint'",
  "'missing_encryption_key_id'",
  "'missing_encryption_algorithm'",
  "'invalid_token_version'",
  "'invalid_status'",
  "'revoked_status_requires_revoked_at'",
  'prismaClientWriteNow: false',
  'databaseWriteNow: false',
  'tokenPersistenceDatabaseWriteNow: false',
  'plaintextTokenDatabaseWriteNow: false',
  'repositoryMayCallAmazonNow: false',
  'repositoryMayParseLwaResponseNow: false',
  'repositoryMayOwnEncryptionNow: false',
  'rawTokenReturnedNow: false',
]) {
  assert(repoSource.includes(marker), `repository contains marker: ${marker}`);
}

for (const forbidden of [
  'prisma.',
  'amazonSpApiCredential.',
  'fetch(',
  'axios.',
  'http.request',
  'https.request',
  'plaintextTokenDatabaseWriteNow: true',
  'repositoryMayCallAmazonNow: true',
  'repositoryMayParseLwaResponseNow: true',
  'repositoryMayOwnEncryptionNow: true',
  'rawTokenReturnedNow: true',
  'PLAINTEXT_ACCESS_TOKEN',
  'PLAINTEXT_REFRESH_TOKEN',
  'RAW_LWA_RESPONSE',
  'AUTHORIZATION_CODE_VALUE',
  'CLIENT_SECRET_VALUE',
]) {
  assert(!repoSource.includes(forbidden), `repository does not contain forbidden marker: ${forbidden}`);
}

assert(repositoryContract.includes("nextSuggestedStep: 'Step137-Y'"), 'repository contract points to Step137-Y');
assert(!service.includes('AmazonSpApiCredentialRepository'), 'service does not wire repository');
assert(!controller.includes('AmazonSpApiCredentialRepository'), 'controller does not wire repository');
assert(!controller.includes('amazonSpApiCredential'), 'controller does not access prisma credential delegate');

const RepositoryClass = loadRepositoryClass();
const repository = new RepositoryClass();

const baseInput = {
  companyId: 'company-123',
  storeId: 'store-456',
  marketplaceId: 'A1VC38T7YXB528',
  region: 'fe',
  sellingPartnerId: 'A_SELLING_PARTNER_ID',
  encryptedRefreshToken: 'encrypted-refresh-token',
  encryptedAccessTokenCache: 'encrypted-access-token-cache',
  accessTokenExpiresAt: '2026-05-09T12:00:00.000Z',
  refreshTokenFingerprint: 'refresh-fingerprint',
  accessTokenFingerprint: 'access-fingerprint',
  encryptionKeyId: 'kms-key-id',
  encryptionAlgorithm: 'test-double-envelope-v1',
  tokenVersion: 1,
  status: 'active',
  lastValidatedAt: '2026-05-09T12:00:00.000Z',
};

const success = repository.upsertEncryptedCredentialTestDouble(baseInput);
assertEqual(success.accepted, true, 'success accepted');
assertEqual(success.reason, 'ready', 'success reason');
assertEqual(success.operation, 'upsertEncryptedCredential', 'success operation');
assertEqual(success.scopedIdentityReady, true, 'success scoped identity ready');
assertEqual(success.encryptedCredentialPayloadReady, true, 'success encrypted payload ready');
assertEqual(success.companyIdPresent, true, 'success company present');
assertEqual(success.storeIdPresent, true, 'success store present');
assertEqual(success.marketplaceIdPresent, true, 'success marketplace present');
assertEqual(success.regionPresent, true, 'success region present');
assertEqual(success.encryptedRefreshTokenPresent, true, 'success encrypted refresh token present');
assertEqual(success.encryptedAccessTokenCachePresent, true, 'success encrypted access token present');
assertEqual(success.tokenVersion, 1, 'success token version');
assertEqual(success.status, 'active', 'success status');
assertSafe(success, 'success');

const failureCases = [
  ['plaintext access rejected', { plaintextAccessToken: 'PLAINTEXT_ACCESS_TOKEN' }, 'plaintext_token_field_rejected'],
  ['plaintext refresh rejected', { plaintextRefreshToken: 'PLAINTEXT_REFRESH_TOKEN' }, 'plaintext_token_field_rejected'],
  ['raw response rejected', { rawLwaResponse: 'RAW_LWA_RESPONSE' }, 'raw_lwa_response_rejected'],
  ['auth code rejected', { rawAuthorizationCode: 'AUTHORIZATION_CODE_VALUE' }, 'raw_authorization_code_rejected'],
  ['client secret rejected', { rawClientSecret: 'CLIENT_SECRET_VALUE' }, 'raw_client_secret_rejected'],
  ['missing company', { companyId: '' }, 'missing_company_id'],
  ['missing store', { storeId: '' }, 'missing_store_id'],
  ['missing marketplace', { marketplaceId: '' }, 'missing_marketplace_id'],
  ['missing region', { region: '' }, 'missing_region'],
  ['missing selling partner', { sellingPartnerId: '' }, 'missing_selling_partner_id'],
  ['missing encrypted refresh', { encryptedRefreshToken: '' }, 'missing_encrypted_refresh_token'],
  ['missing refresh fingerprint', { refreshTokenFingerprint: '' }, 'missing_refresh_token_fingerprint'],
  ['missing encryption key', { encryptionKeyId: '' }, 'missing_encryption_key_id'],
  ['missing encryption algorithm', { encryptionAlgorithm: '' }, 'missing_encryption_algorithm'],
  ['invalid token version', { tokenVersion: 0 }, 'invalid_token_version'],
  ['invalid status', { status: 'pending' }, 'invalid_status'],
  ['revoked without revokedAt', { status: 'revoked' }, 'revoked_status_requires_revoked_at'],
];

for (const [label, patch, reason] of failureCases) {
  const result = repository.upsertEncryptedCredentialTestDouble({
    ...baseInput,
    ...patch,
  });

  assertEqual(result.accepted, false, `${label} accepted false`);
  assertEqual(result.reason, reason, `${label} reason`);
  assertEqual(result.encryptedCredentialPayloadReady, false, `${label} payload not ready`);
  assertSafe(result, label);
}

const readScope = repository.findActiveCredentialForStoreTestDouble({
  companyId: 'company-123',
  storeId: 'store-456',
  marketplaceId: 'A1VC38T7YXB528',
  region: 'fe',
});
assertEqual(readScope.accepted, true, 'read scope accepted');
assertEqual(readScope.operation, 'findActiveCredentialForStore', 'read operation');
assertSafe(readScope, 'read scope');

const needsReauth = repository.markCredentialNeedsReauthTestDouble({
  companyId: 'company-123',
  storeId: 'store-456',
  marketplaceId: 'A1VC38T7YXB528',
  region: 'fe',
});
assertEqual(needsReauth.accepted, true, 'needs reauth accepted');
assertEqual(needsReauth.operation, 'markCredentialNeedsReauth', 'needs reauth operation');
assertEqual(needsReauth.status, 'needs_reauth', 'needs reauth status');
assertSafe(needsReauth, 'needs reauth');

const revoke = repository.revokeCredentialTestDouble({
  companyId: 'company-123',
  storeId: 'store-456',
  marketplaceId: 'A1VC38T7YXB528',
  region: 'fe',
  revokedAt: '2026-05-09T12:00:00.000Z',
});
assertEqual(revoke.accepted, true, 'revoke accepted');
assertEqual(revoke.operation, 'revokeCredential', 'revoke operation');
assertEqual(revoke.status, 'revoked', 'revoke status');
assertSafe(revoke, 'revoke');

const cacheUpdate = repository.updateAccessTokenCacheTestDouble({
  companyId: 'company-123',
  storeId: 'store-456',
  marketplaceId: 'A1VC38T7YXB528',
  region: 'fe',
  encryptedAccessTokenCache: 'encrypted-access-token-cache',
  accessTokenFingerprint: 'access-fingerprint',
  accessTokenExpiresAt: '2026-05-09T12:00:00.000Z',
});
assertEqual(cacheUpdate.accepted, true, 'cache update accepted');
assertEqual(cacheUpdate.operation, 'updateAccessTokenCache', 'cache update operation');
assertEqual(cacheUpdate.encryptedAccessTokenCachePresent, true, 'cache update encrypted token present');
assertSafe(cacheUpdate, 'cache update');


// Step139-I compatibility: repository now includes a mocked Prisma real-write method.
// Test-double methods must still stay no-prisma-write, while the mocked real-write method
// may expose real-write flags for isolated delegate verification only.
assert(repositorySource.includes('upsertEncryptedCredentialRealWrite'), 'repository contains Step139-I mocked Prisma real-write method');
assert(repositorySource.includes("repositoryMode: 'mocked-prisma-delegate-real-write-contract'"), 'repository contains Step139-I mocked Prisma repository mode');
assert(repositorySource.includes('mockedPrismaDelegateUsedNow'), 'repository contains Step139-I mocked Prisma delegate flag');
assert(repositorySource.includes('prismaClientWriteNow: true'), 'repository may mark mocked Prisma write inside Step139-I method');
assert(repositorySource.includes('databaseWriteNow: true'), 'repository may mark mocked DB write inside Step139-I method');
assert(repositorySource.includes('tokenPersistenceDatabaseWriteNow: true'), 'repository may mark mocked token persistence write inside Step139-I method');
assert(repositorySource.includes('plaintextTokenDatabaseWriteNow: false'), 'repository keeps plaintext token DB write disabled');
assert(!repositorySource.includes('plaintextTokenDatabaseWriteNow: true'), 'repository does not enable plaintext token DB write');
assert(!repositorySource.includes('repositoryMayCallAmazonNow: true'), 'repository still cannot call Amazon');
assert(!repositorySource.includes('repositoryMayParseLwaResponseNow: true'), 'repository still cannot parse LWA response');
assert(!repositorySource.includes('repositoryMayOwnEncryptionNow: true'), 'repository still cannot own encryption');
assert(!repositorySource.includes('rawTokenReturnedNow: true'), 'repository still cannot return raw token');

console.log('========== Step137-Y encrypted token repository test-double smoke passed ==========');
