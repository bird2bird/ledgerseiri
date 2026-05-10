const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '../../..');
const apiRoot = path.join(root, 'apps/api');

const files = {
  packageJson: path.join(apiRoot, 'package.json'),
  repository: path.join(apiRoot, 'src/imports/amazon-sp-api-credential.repository.ts'),
  controller: path.join(apiRoot, 'src/imports/imports.controller.ts'),
  contract: path.join(
    apiRoot,
    'src/imports/dto/amazon-sp-api-encrypted-token-persistence-real-write-repository-contract.dto.ts',
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

function assertSafe(result, label) {
  assertEqual(result.source, 'amazon-sp-api-credential-repository-real-write', `${label} source`);
  assertEqual(result.repositoryMode, 'mocked-prisma-delegate-real-write-contract', `${label} mode`);
  assertEqual(result.operation, 'upsertEncryptedCredentialRealWrite', `${label} operation`);
  assertEqual(result.prismaClientWriteNow, true, `${label} prisma flag true`);
  assertEqual(result.databaseWriteNow, true, `${label} database flag true`);
  assertEqual(result.tokenPersistenceDatabaseWriteNow, true, `${label} token persistence flag true`);
  assertEqual(result.plaintextTokenDatabaseWriteNow, false, `${label} plaintext flag false`);
  assertEqual(result.repositoryMayCallAmazonNow, false, `${label} no Amazon call`);
  assertEqual(result.repositoryMayParseLwaResponseNow, false, `${label} no parser ownership`);
  assertEqual(result.repositoryMayOwnEncryptionNow, false, `${label} no encryption ownership`);
  assertEqual(result.rawTokenReturnedNow, false, `${label} no raw token returned`);

  const serialized = JSON.stringify(result);
  for (const secret of [
    'ACCESS_TOKEN_SECRET_VALUE',
    'REFRESH_TOKEN_SECRET_VALUE',
    'RAW_LWA_RESPONSE_SECRET',
    'AUTHORIZATION_CODE_SECRET',
    'CLIENT_SECRET_VALUE',
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

function makeDelegate({ throwOnUpsert = false } = {}) {
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
          id: 'credential-123',
          ...args.create,
        };
      },
    },
  };
}

console.log('========== Step139-I encrypted token repository real-write mocked Prisma smoke ==========');

const pkg = JSON.parse(read(files.packageJson));
const repositorySource = read(files.repository);
const controllerSource = read(files.controller);
const contract = read(files.contract);

assert(
  JSON.stringify(pkg.scripts || {}).includes('smoke:amazon-sp-api-encrypted-token-repository-real-write-mocked-prisma'),
  'package.json registers Step139-I smoke',
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
  "hasOwn(unsafeInput, 'plaintextAccessToken')",
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

assert(contract.includes("nextSuggestedStep: 'Step139-I'"), 'Step139-H contract points to Step139-I');

const RepositoryClass = loadRepositoryClass();
const repository = new RepositoryClass();

(async () => {
  {
    const { delegate, calls } = makeDelegate();
    const result = await repository.upsertEncryptedCredentialRealWrite(baseInput(), delegate);
    assertSafe(result, 'success');
    assertEqual(result.accepted, true, 'success accepted');
    assertEqual(result.reason, 'ready', 'success reason');
    assertEqual(result.mockedPrismaDelegateUsedNow, true, 'success delegate used');
    assertEqual(calls.length, 1, 'success upsert called once');

    const upsertArgs = calls[0];
    assertEqual(upsertArgs.where.companyId_storeId_marketplaceId_region.companyId, 'company-123', 'where company trimmed');
    assertEqual(upsertArgs.where.companyId_storeId_marketplaceId_region.storeId, 'store-456', 'where store trimmed');
    assertEqual(upsertArgs.where.companyId_storeId_marketplaceId_region.marketplaceId, 'A1VC38T7YXB528', 'where marketplace trimmed');
    assertEqual(upsertArgs.where.companyId_storeId_marketplaceId_region.region, 'JP', 'where region trimmed');

    assertEqual(upsertArgs.create.encryptedRefreshToken, 'encrypted-refresh-token', 'create encrypted refresh');
    assertEqual(upsertArgs.create.encryptedAccessTokenCache, 'encrypted-access-token', 'create encrypted access cache');
    assertEqual(upsertArgs.create.refreshTokenFingerprint, 'refresh-fingerprint', 'create refresh fingerprint');
    assertEqual(upsertArgs.create.accessTokenFingerprint, 'access-fingerprint', 'create access fingerprint');
    assertEqual(upsertArgs.create.tokenVersion, 1, 'create token version');
    assertEqual(upsertArgs.create.status, 'active', 'create status');
    assert(!('plaintextAccessToken' in upsertArgs.create), 'create has no plaintext access token');
    assert(!('plaintextRefreshToken' in upsertArgs.create), 'create has no plaintext refresh token');
    assert(!('rawLwaResponse' in upsertArgs.create), 'create has no raw LWA response');

    assertEqual(upsertArgs.update.encryptedRefreshToken, 'encrypted-refresh-token', 'update encrypted refresh');
    assertEqual(upsertArgs.update.encryptedAccessTokenCache, 'encrypted-access-token', 'update encrypted access cache');
    assert(!('plaintextAccessToken' in upsertArgs.update), 'update has no plaintext access token');

    assertEqual(result.persistedCredentialShape.id, 'credential-123', 'persisted id');
    assertEqual(result.persistedCredentialShape.companyId, 'company-123', 'persisted company');
    assertEqual(result.persistedCredentialShape.sellingPartnerIdRedacted, 'SELL****', 'seller id redacted');
  }

  {
    const result = await repository.upsertEncryptedCredentialRealWrite(baseInput(), null);
    assertSafe(result, 'missing delegate');
    assertEqual(result.accepted, false, 'missing delegate rejected');
    assertEqual(result.reason, 'missing_prisma_delegate', 'missing delegate reason');
    assertEqual(result.mockedPrismaDelegateUsedNow, false, 'missing delegate flag');
  }

  {
    const { delegate, calls } = makeDelegate();
    const result = await repository.upsertEncryptedCredentialRealWrite(baseInput({ companyId: '' }), delegate);
    assertSafe(result, 'missing company');
    assertEqual(result.accepted, false, 'missing company rejected');
    assertEqual(result.reason, 'missing_company_id', 'missing company reason');
    assertEqual(calls.length, 0, 'missing company did not call upsert');
  }

  {
    const { delegate, calls } = makeDelegate();
    const result = await repository.upsertEncryptedCredentialRealWrite(
      {
        ...baseInput(),
        plaintextAccessToken: 'ACCESS_TOKEN_SECRET_VALUE',
      },
      delegate,
    );
    assertSafe(result, 'plaintext access rejected');
    assertEqual(result.accepted, false, 'plaintext access rejected');
    assertEqual(result.reason, 'plaintext_token_field_rejected', 'plaintext access reason');
    assertEqual(calls.length, 0, 'plaintext access did not call upsert');
  }

  {
    const { delegate, calls } = makeDelegate();
    const result = await repository.upsertEncryptedCredentialRealWrite(
      {
        ...baseInput(),
        rawLwaResponse: 'RAW_LWA_RESPONSE_SECRET',
      },
      delegate,
    );
    assertSafe(result, 'raw LWA rejected');
    assertEqual(result.accepted, false, 'raw LWA rejected');
    assertEqual(result.reason, 'raw_lwa_response_rejected', 'raw LWA reason');
    assertEqual(calls.length, 0, 'raw LWA did not call upsert');
  }

  {
    const { delegate, calls } = makeDelegate({ throwOnUpsert: true });
    const result = await repository.upsertEncryptedCredentialRealWrite(baseInput(), delegate);
    assertSafe(result, 'upsert exception');
    assertEqual(result.accepted, false, 'upsert exception rejected');
    assertEqual(result.reason, 'prisma_upsert_exception', 'upsert exception reason');
    assertEqual(calls.length, 1, 'upsert exception called once');
  }

  console.log('========== Step139-I encrypted token repository real-write mocked Prisma smoke passed ==========');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
