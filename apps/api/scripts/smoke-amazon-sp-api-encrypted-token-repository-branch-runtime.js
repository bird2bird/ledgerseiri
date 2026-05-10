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
  for (const secret of [
    'PLAINTEXT_ACCESS_TOKEN',
    'PLAINTEXT_REFRESH_TOKEN',
    'RAW_LWA_RESPONSE',
    'AUTHORIZATION_CODE_VALUE',
    'CLIENT_SECRET_VALUE',
  ]) {
    assert(!serialized.includes(secret), `${label} does not expose ${secret}`);
  }
}

console.log('========== Step137-Z encrypted token repository branch runtime smoke ==========');

const repoSource = read(files.repository);
const service = read(files.service);
const controller = read(files.controller);
const pkg = JSON.parse(read(files.packageJson));

assert(
  JSON.stringify(pkg.scripts || {}).includes('smoke:amazon-sp-api-encrypted-token-repository-branch-runtime'),
  'package.json registers Step137-Z smoke',
);

for (const marker of [
  'export class AmazonSpApiCredentialRepository',
  'upsertEncryptedCredentialTestDouble',
  'findActiveCredentialForStoreTestDouble',
  'markCredentialNeedsReauthTestDouble',
  'revokeCredentialTestDouble',
  'updateAccessTokenCacheTestDouble',
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
  "'plaintext_token_field_rejected'",
  "'raw_lwa_response_rejected'",
  "'raw_authorization_code_rejected'",
  "'raw_client_secret_rejected'",
  "'revoked_status_requires_revoked_at'",
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
]) {
  assert(!repoSource.includes(forbidden), `repository does not contain forbidden marker: ${forbidden}`);
}

assert(!service.includes('AmazonSpApiCredentialRepository'), 'service does not wire repository');
assert(!service.includes('amazonSpApiCredential'), 'service does not access prisma credential delegate');
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

const normalized = repository.upsertEncryptedCredentialTestDouble({
  ...baseInput,
  companyId: '  company-123  ',
  storeId: '  store-456  ',
  marketplaceId: '  A1VC38T7YXB528  ',
  region: '  fe  ',
  sellingPartnerId: '  A_SELLING_PARTNER_ID  ',
  encryptedRefreshToken: '  encrypted-refresh-token  ',
  encryptedAccessTokenCache: '',
  accessTokenFingerprint: '',
  tokenVersion: 2.9,
});

assertEqual(normalized.accepted, true, 'normalized accepted');
assertEqual(normalized.reason, 'ready', 'normalized reason');
assertEqual(normalized.encryptedAccessTokenCachePresent, false, 'blank access token cache allowed');
assertEqual(normalized.accessTokenFingerprintPresent, false, 'blank access fingerprint allowed');
assertEqual(normalized.tokenVersion, 2, 'token version floored');
assertSafe(normalized, 'normalized');

const revokedSuccess = repository.upsertEncryptedCredentialTestDouble({
  ...baseInput,
  status: 'revoked',
  revokedAt: '2026-05-09T12:00:00.000Z',
});

assertEqual(revokedSuccess.accepted, true, 'revoked success accepted');
assertEqual(revokedSuccess.status, 'revoked', 'revoked success status');
assertSafe(revokedSuccess, 'revoked success');

const statuses = ['active', 'needs_reauth', 'error'];
for (const status of statuses) {
  const result = repository.upsertEncryptedCredentialTestDouble({
    ...baseInput,
    status,
  });
  assertEqual(result.accepted, true, `${status} accepted`);
  assertEqual(result.status, status, `${status} status`);
  assertSafe(result, `${status} status`);
}

const failureCases = [
  ['plaintext access rejected', { plaintextAccessToken: 'PLAINTEXT_ACCESS_TOKEN' }, 'plaintext_token_field_rejected'],
  ['plaintext refresh rejected', { plaintextRefreshToken: 'PLAINTEXT_REFRESH_TOKEN' }, 'plaintext_token_field_rejected'],
  ['raw response rejected', { rawLwaResponse: 'RAW_LWA_RESPONSE' }, 'raw_lwa_response_rejected'],
  ['auth code rejected', { rawAuthorizationCode: 'AUTHORIZATION_CODE_VALUE' }, 'raw_authorization_code_rejected'],
  ['client secret rejected', { rawClientSecret: 'CLIENT_SECRET_VALUE' }, 'raw_client_secret_rejected'],
  ['missing company whitespace', { companyId: '   ' }, 'missing_company_id'],
  ['missing store whitespace', { storeId: '   ' }, 'missing_store_id'],
  ['missing marketplace whitespace', { marketplaceId: '   ' }, 'missing_marketplace_id'],
  ['missing region whitespace', { region: '   ' }, 'missing_region'],
  ['missing selling partner whitespace', { sellingPartnerId: '   ' }, 'missing_selling_partner_id'],
  ['missing encrypted refresh whitespace', { encryptedRefreshToken: '   ' }, 'missing_encrypted_refresh_token'],
  ['missing refresh fingerprint whitespace', { refreshTokenFingerprint: '   ' }, 'missing_refresh_token_fingerprint'],
  ['missing encryption key whitespace', { encryptionKeyId: '   ' }, 'missing_encryption_key_id'],
  ['missing encryption algorithm whitespace', { encryptionAlgorithm: '   ' }, 'missing_encryption_algorithm'],
  ['invalid token version zero', { tokenVersion: 0 }, 'invalid_token_version'],
  ['invalid token version negative', { tokenVersion: -1 }, 'invalid_token_version'],
  ['invalid token version non-number', { tokenVersion: '1' }, 'invalid_token_version'],
  ['invalid status null', { status: null }, 'invalid_status'],
  ['invalid status unknown', { status: 'pending' }, 'invalid_status'],
  ['revoked without revokedAt', { status: 'revoked', revokedAt: null }, 'revoked_status_requires_revoked_at'],
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

const scopedOperationInputs = [
  ['find active missing company', 'findActiveCredentialForStoreTestDouble', { companyId: '', storeId: 's', marketplaceId: 'm', region: 'r' }, 'missing_company_id'],
  ['find active missing store', 'findActiveCredentialForStoreTestDouble', { companyId: 'c', storeId: '', marketplaceId: 'm', region: 'r' }, 'missing_store_id'],
  ['find active missing marketplace', 'findActiveCredentialForStoreTestDouble', { companyId: 'c', storeId: 's', marketplaceId: '', region: 'r' }, 'missing_marketplace_id'],
  ['find active missing region', 'findActiveCredentialForStoreTestDouble', { companyId: 'c', storeId: 's', marketplaceId: 'm', region: '' }, 'missing_region'],
  ['needs reauth missing company', 'markCredentialNeedsReauthTestDouble', { companyId: '', storeId: 's', marketplaceId: 'm', region: 'r' }, 'missing_company_id'],
  ['revoke missing revokedAt', 'revokeCredentialTestDouble', { companyId: 'c', storeId: 's', marketplaceId: 'm', region: 'r', revokedAt: '' }, 'revoked_status_requires_revoked_at'],
  ['cache update missing company', 'updateAccessTokenCacheTestDouble', { companyId: '', storeId: 's', marketplaceId: 'm', region: 'r', encryptedAccessTokenCache: 'e', accessTokenFingerprint: 'f', accessTokenExpiresAt: '2026-05-09T12:00:00.000Z' }, 'missing_company_id'],
];

for (const [label, methodName, input, reason] of scopedOperationInputs) {
  const result = repository[methodName](input);
  assertEqual(result.accepted, false, `${label} accepted false`);
  assertEqual(result.reason, reason, `${label} reason`);
  assertSafe(result, label);
}

const scopedSuccessCases = [
  ['find active success', 'findActiveCredentialForStoreTestDouble', { companyId: 'c', storeId: 's', marketplaceId: 'm', region: 'r' }, 'findActiveCredentialForStore'],
  ['needs reauth success', 'markCredentialNeedsReauthTestDouble', { companyId: 'c', storeId: 's', marketplaceId: 'm', region: 'r' }, 'markCredentialNeedsReauth'],
  ['revoke success', 'revokeCredentialTestDouble', { companyId: 'c', storeId: 's', marketplaceId: 'm', region: 'r', revokedAt: '2026-05-09T12:00:00.000Z' }, 'revokeCredential'],
  ['cache update success', 'updateAccessTokenCacheTestDouble', { companyId: 'c', storeId: 's', marketplaceId: 'm', region: 'r', encryptedAccessTokenCache: 'encrypted-cache', accessTokenFingerprint: 'fingerprint', accessTokenExpiresAt: '2026-05-09T12:00:00.000Z' }, 'updateAccessTokenCache'],
];

for (const [label, methodName, input, operation] of scopedSuccessCases) {
  const result = repository[methodName](input);
  assertEqual(result.accepted, true, `${label} accepted`);
  assertEqual(result.operation, operation, `${label} operation`);
  assertSafe(result, label);
}


// Step139-I compatibility: repository now has a mocked Prisma real-write method.
// This does not connect controller persistence and does not allow plaintext/raw token exposure.
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

console.log('========== Step137-Z encrypted token repository branch runtime smoke passed ==========');
