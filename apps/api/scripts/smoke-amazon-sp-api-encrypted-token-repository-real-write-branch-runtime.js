const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '../../..');
const apiRoot = path.join(root, 'apps/api');

const files = {
  packageJson: path.join(apiRoot, 'package.json'),
  repository: path.join(apiRoot, 'src/imports/amazon-sp-api-credential.repository.ts'),
  controller: path.join(apiRoot, 'src/imports/imports.controller.ts'),
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

function assertSafe(result, label) {
  assertEqual(result.source, 'amazon-sp-api-credential-repository-real-write', `${label} source`);
  assertEqual(result.repositoryMode, 'mocked-prisma-delegate-real-write-contract', `${label} mode`);
  assertEqual(result.operation, 'upsertEncryptedCredentialRealWrite', `${label} operation`);
  assertEqual(result.prismaClientWriteNow, true, `${label} prisma flag true`);
  assertEqual(result.databaseWriteNow, true, `${label} database flag true`);
  assertEqual(result.tokenPersistenceDatabaseWriteNow, true, `${label} token persistence flag true`);
  assertEqual(result.plaintextTokenDatabaseWriteNow, false, `${label} plaintext token DB write false`);
  assertEqual(result.repositoryMayCallAmazonNow, false, `${label} no Amazon call`);
  assertEqual(result.repositoryMayParseLwaResponseNow, false, `${label} no LWA parser ownership`);
  assertEqual(result.repositoryMayOwnEncryptionNow, false, `${label} no encryption ownership`);
  assertEqual(result.rawTokenReturnedNow, false, `${label} no raw token returned`);

  const serialized = JSON.stringify(result);
  for (const secret of [
    'ACCESS_TOKEN_SECRET_VALUE',
    'REFRESH_TOKEN_SECRET_VALUE',
    'RAW_LWA_RESPONSE_SECRET',
    'AUTHORIZATION_CODE_SECRET',
    'CLIENT_SECRET_VALUE',
    'PLAINTEXT_ACCESS_TOKEN',
    'PLAINTEXT_REFRESH_TOKEN',
  ]) {
    assert(!serialized.includes(secret), `${label} does not expose ${secret}`);
  }
}

function loadRepositoryClass() {
  const ts = require(path.join(apiRoot, 'node_modules/typescript'));
  const source = read(files.repository);
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: files.repository,
  }).outputText;

  const module = { exports: {} };
  vm.runInNewContext(
    output,
    {
      require,
      module,
      exports: module.exports,
      __dirname: path.dirname(files.repository),
      __filename: files.repository,
      console,
      Date,
      Number,
      Object,
      String,
      JSON,
    },
    { filename: files.repository.replace(/\.ts$/, '.js') },
  );

  return module.exports.AmazonSpApiCredentialRepository;
}

function baseInput(patch = {}) {
  return {
    companyId: ' company-123 ',
    storeId: ' store-456 ',
    marketplaceId: ' A1VC38T7YXB528 ',
    region: ' JP ',
    sellingPartnerId: ' SELLER123456789 ',
    encryptedRefreshToken: ' encrypted-refresh-token ',
    encryptedAccessTokenCache: ' encrypted-access-token ',
    accessTokenExpiresAt: '2026-05-10T01:00:00.000Z',
    refreshTokenFingerprint: ' refresh-fingerprint ',
    accessTokenFingerprint: ' access-fingerprint ',
    encryptionKeyId: ' kms-key-id ',
    encryptionAlgorithm: ' envelope-v1 ',
    tokenVersion: 1,
    status: 'active',
    lastValidatedAt: '2026-05-10T00:00:00.000Z',
    revokedAt: null,
    ...patch,
  };
}

function makeDelegate({ throwOnUpsert = false, id = 'credential-123' } = {}) {
  const calls = [];

  return {
    calls,
    delegate: {
      upsert: async (args) => {
        calls.push(args);

        if (throwOnUpsert) {
          throw new Error('mock upsert failed');
        }

        return {
          id,
          ...args.create,
        };
      },
    },
  };
}

async function runRejectedCase(label, patch, expectedReason) {
  const { delegate, calls } = makeDelegate();
  const result = await repository.upsertEncryptedCredentialRealWrite(baseInput(patch), delegate);

  assertSafe(result, label);
  assertEqual(result.accepted, false, `${label} rejected`);
  assertEqual(result.reason, expectedReason, `${label} reason`);
  assertEqual(result.persistedCredentialShape, null, `${label} no persisted shape`);
  assertEqual(calls.length, 0, `${label} did not call upsert`);
}

console.log('========== Step139-J encrypted token repository real-write branch runtime smoke ==========');

const pkg = JSON.parse(read(files.packageJson));
const repositorySource = read(files.repository);
const controllerSource = read(files.controller);

assert(
  JSON.stringify(pkg.scripts || {}).includes('smoke:amazon-sp-api-encrypted-token-repository-real-write-branch-runtime'),
  'package.json registers Step139-J smoke',
);

for (const marker of [
  'upsertEncryptedCredentialRealWrite(',
  'AmazonSpApiCredentialPrismaDelegate',
  'AmazonSpApiEncryptedCredentialRepositoryRealWriteResult',
  "source: 'amazon-sp-api-credential-repository-real-write'",
  "repositoryMode: 'mocked-prisma-delegate-real-write-contract'",
  "operation: 'upsertEncryptedCredentialRealWrite'",
  "'missing_prisma_delegate'",
  "'prisma_upsert_exception'",
  'plaintextAccessToken?: never',
  'plaintextRefreshToken?: never',
  "hasOwn(unsafeInput, 'plaintextAccessToken')",
  "hasOwn(unsafeInput, 'plaintextRefreshToken')",
  'prismaClientWriteNow: true',
  'databaseWriteNow: true',
  'tokenPersistenceDatabaseWriteNow: true',
  'plaintextTokenDatabaseWriteNow: false',
  'repositoryMayCallAmazonNow: false',
  'repositoryMayParseLwaResponseNow: false',
  'repositoryMayOwnEncryptionNow: false',
  'rawTokenReturnedNow: false',
]) {
  assert(repositorySource.includes(marker), `repository contains marker: ${marker}`);
}

for (const forbidden of [
  'plaintextTokenDatabaseWriteNow: true',
  'repositoryMayCallAmazonNow: true',
  'repositoryMayParseLwaResponseNow: true',
  'repositoryMayOwnEncryptionNow: true',
  'rawTokenReturnedNow: true',
  'ACCESS_TOKEN_SECRET_VALUE',
  'REFRESH_TOKEN_SECRET_VALUE',
]) {
  assert(!repositorySource.includes(forbidden), `repository does not contain forbidden marker: ${forbidden}`);
}

for (const forbidden of [
  'AmazonSpApiCredentialRepository',
  'persistEncryptedRefreshCredential',
  'persistEncryptedAccessTokenCache',
  'tokenPersistenceDatabaseWriteNow: true',
  'databaseWriteNow: true',
  'prismaClientWriteNow: true',
]) {
  assert(!controllerSource.includes(forbidden), `controller still does not contain forbidden marker: ${forbidden}`);
}

const RepositoryClass = loadRepositoryClass();
const repository = new RepositoryClass();

(async () => {
  {
    const result = await repository.upsertEncryptedCredentialRealWrite(baseInput(), null);
    assertSafe(result, 'missing delegate null');
    assertEqual(result.accepted, false, 'missing delegate null rejected');
    assertEqual(result.reason, 'missing_prisma_delegate', 'missing delegate null reason');
    assertEqual(result.mockedPrismaDelegateUsedNow, false, 'missing delegate null flag');
    assertEqual(result.persistedCredentialShape, null, 'missing delegate null no shape');
  }

  {
    const result = await repository.upsertEncryptedCredentialRealWrite(baseInput(), {});
    assertSafe(result, 'missing delegate upsert');
    assertEqual(result.accepted, false, 'missing delegate upsert rejected');
    assertEqual(result.reason, 'missing_prisma_delegate', 'missing delegate upsert reason');
  }

  await runRejectedCase('missing company', { companyId: '   ' }, 'missing_company_id');
  await runRejectedCase('missing store', { storeId: '   ' }, 'missing_store_id');
  await runRejectedCase('missing marketplace', { marketplaceId: '   ' }, 'missing_marketplace_id');
  await runRejectedCase('missing region', { region: '   ' }, 'missing_region');
  await runRejectedCase('missing selling partner', { sellingPartnerId: '   ' }, 'missing_selling_partner_id');
  await runRejectedCase('missing encrypted refresh token', { encryptedRefreshToken: '   ' }, 'missing_encrypted_refresh_token');
  await runRejectedCase('missing refresh fingerprint', { refreshTokenFingerprint: '   ' }, 'missing_refresh_token_fingerprint');
  await runRejectedCase('missing encryption key', { encryptionKeyId: '   ' }, 'missing_encryption_key_id');
  await runRejectedCase('missing encryption algorithm', { encryptionAlgorithm: '   ' }, 'missing_encryption_algorithm');
  await runRejectedCase('invalid token version zero', { tokenVersion: 0 }, 'invalid_token_version');
  await runRejectedCase('invalid token version negative', { tokenVersion: -1 }, 'invalid_token_version');
  await runRejectedCase('invalid token version string', { tokenVersion: 'abc' }, 'invalid_token_version');
  await runRejectedCase('invalid status', { status: 'unknown' }, 'invalid_status');
  await runRejectedCase('revoked without revokedAt', { status: 'revoked', revokedAt: null }, 'revoked_status_requires_revoked_at');

  await runRejectedCase(
    'plaintext access rejected',
    { plaintextAccessToken: 'ACCESS_TOKEN_SECRET_VALUE' },
    'plaintext_token_field_rejected',
  );

  await runRejectedCase(
    'plaintext refresh rejected',
    { plaintextRefreshToken: 'REFRESH_TOKEN_SECRET_VALUE' },
    'plaintext_token_field_rejected',
  );

  await runRejectedCase(
    'raw LWA response rejected',
    { rawLwaResponse: 'RAW_LWA_RESPONSE_SECRET' },
    'raw_lwa_response_rejected',
  );

  await runRejectedCase(
    'raw authorization code rejected',
    { rawAuthorizationCode: 'AUTHORIZATION_CODE_SECRET' },
    'raw_authorization_code_rejected',
  );

  await runRejectedCase(
    'raw client secret rejected',
    { rawClientSecret: 'CLIENT_SECRET_VALUE' },
    'raw_client_secret_rejected',
  );

  {
    const { delegate, calls } = makeDelegate({ throwOnUpsert: true });
    const result = await repository.upsertEncryptedCredentialRealWrite(baseInput(), delegate);

    assertSafe(result, 'upsert exception');
    assertEqual(result.accepted, false, 'upsert exception rejected');
    assertEqual(result.reason, 'prisma_upsert_exception', 'upsert exception reason');
    assertEqual(result.mockedPrismaDelegateUsedNow, true, 'upsert exception delegate used');
    assertEqual(result.persistedCredentialShape, null, 'upsert exception no persisted shape');
    assertEqual(calls.length, 1, 'upsert exception called once');
  }

  {
    const { delegate, calls } = makeDelegate();
    const result = await repository.upsertEncryptedCredentialRealWrite(baseInput(), delegate);

    assertSafe(result, 'success full access cache');
    assertEqual(result.accepted, true, 'success full access cache accepted');
    assertEqual(result.reason, 'ready', 'success full access cache reason');
    assertEqual(result.mockedPrismaDelegateUsedNow, true, 'success full access cache delegate used');
    assertEqual(calls.length, 1, 'success full access cache called once');

    const args = calls[0];
    assertEqual(args.where.companyId_storeId_marketplaceId_region.companyId, 'company-123', 'success where company trimmed');
    assertEqual(args.where.companyId_storeId_marketplaceId_region.storeId, 'store-456', 'success where store trimmed');
    assertEqual(args.where.companyId_storeId_marketplaceId_region.marketplaceId, 'A1VC38T7YXB528', 'success where marketplace trimmed');
    assertEqual(args.where.companyId_storeId_marketplaceId_region.region, 'JP', 'success where region trimmed');

    assertEqual(args.create.encryptedRefreshToken, 'encrypted-refresh-token', 'success create encrypted refresh');
    assertEqual(args.create.encryptedAccessTokenCache, 'encrypted-access-token', 'success create encrypted access');
    assertEqual(args.create.refreshTokenFingerprint, 'refresh-fingerprint', 'success create refresh fingerprint');
    assertEqual(args.create.accessTokenFingerprint, 'access-fingerprint', 'success create access fingerprint');
    assertEqual(args.create.encryptionKeyId, 'kms-key-id', 'success create encryption key');
    assertEqual(args.create.encryptionAlgorithm, 'envelope-v1', 'success create encryption algorithm');
    assertEqual(args.create.tokenVersion, 1, 'success create token version');
    assertEqual(args.create.status, 'active', 'success create status');
    assert(!('plaintextAccessToken' in args.create), 'success create has no plaintext access token');
    assert(!('plaintextRefreshToken' in args.create), 'success create has no plaintext refresh token');
    assert(!('rawLwaResponse' in args.create), 'success create has no raw LWA response');

    assertEqual(args.update.encryptedRefreshToken, 'encrypted-refresh-token', 'success update encrypted refresh');
    assertEqual(args.update.encryptedAccessTokenCache, 'encrypted-access-token', 'success update encrypted access');
    assert(!('plaintextAccessToken' in args.update), 'success update has no plaintext access token');
    assert(!('plaintextRefreshToken' in args.update), 'success update has no plaintext refresh token');

    assertEqual(result.persistedCredentialShape.id, 'credential-123', 'success persisted id');
    assertEqual(result.persistedCredentialShape.companyId, 'company-123', 'success persisted company');
    assertEqual(result.persistedCredentialShape.storeId, 'store-456', 'success persisted store');
    assertEqual(result.persistedCredentialShape.marketplaceId, 'A1VC38T7YXB528', 'success persisted marketplace');
    assertEqual(result.persistedCredentialShape.region, 'JP', 'success persisted region');
    assertEqual(result.persistedCredentialShape.status, 'active', 'success persisted status');
    assertEqual(result.persistedCredentialShape.sellingPartnerIdRedacted, 'SELL****', 'success seller redacted');
    assertEqual(result.persistedCredentialShape.tokenVersion, 1, 'success persisted token version');
  }

  {
    const { delegate, calls } = makeDelegate({ id: '' });
    const result = await repository.upsertEncryptedCredentialRealWrite(
      baseInput({
        encryptedAccessTokenCache: ' ',
        accessTokenFingerprint: ' ',
        accessTokenExpiresAt: null,
      }),
      delegate,
    );

    assertSafe(result, 'success without access cache');
    assertEqual(result.accepted, true, 'success without access cache accepted');
    assertEqual(result.reason, 'ready', 'success without access cache reason');
    assertEqual(calls.length, 1, 'success without access cache called once');

    const args = calls[0];
    assertEqual(args.create.encryptedAccessTokenCache, null, 'success without cache create access null');
    assertEqual(args.create.accessTokenFingerprint, null, 'success without cache create fingerprint null');
    assertEqual(args.update.encryptedAccessTokenCache, null, 'success without cache update access null');
    assertEqual(args.update.accessTokenFingerprint, null, 'success without cache update fingerprint null');
    assertEqual(result.persistedCredentialShape.id, null, 'success without cache empty id normalized null');
  }

  console.log('========== Step139-J encrypted token repository real-write branch runtime smoke passed ==========');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
