const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '../../..');
const apiRoot = path.join(root, 'apps/api');

const files = {
  packageJson: path.join(apiRoot, 'package.json'),
  orchestrator: path.join(apiRoot, 'src/imports/amazon-sp-api-token-persistence.orchestrator.ts'),
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
  assertEqual(result.source, 'amazon-sp-api-token-persistence-orchestrator-real-write', `${label} source`);
  assertEqual(result.orchestratorMode, 'repository-real-write-wiring-mocked-prisma', `${label} mode`);
  assertEqual(result.controllerWiringNow, false, `${label} no controller wiring`);
  assertEqual(result.oauthCallbackWiringNow, false, `${label} no callback wiring`);
  assertEqual(result.oauthCallbackPersistenceWiringNow, false, `${label} no callback persistence`);
  assertEqual(result.amazonNetworkCallNow, false, `${label} no Amazon call`);
  assertEqual(result.prismaClientWriteNow, true, `${label} mocked Prisma flag true`);
  assertEqual(result.databaseWriteNow, true, `${label} mocked DB flag true`);
  assertEqual(result.tokenPersistenceDatabaseWriteNow, true, `${label} mocked token DB flag true`);
  assertEqual(result.plaintextTokenDatabaseWriteNow, false, `${label} plaintext token DB flag false`);
  assertEqual(result.rawTokenReturnedNow, false, `${label} no raw token`);
  assertEqual(result.rawLwaResponseReturnedNow, false, `${label} no raw LWA response`);
  assertEqual(result.rawAccessTokenReturnedNow, false, `${label} no raw access token`);
  assertEqual(result.rawRefreshTokenReturnedNow, false, `${label} no raw refresh token`);

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

function loadModuleFromTs(file, mocks = {}) {
  const ts = require(path.join(apiRoot, 'node_modules/typescript'));
  const source = read(file);
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: file,
  }).outputText;

  const module = { exports: {} };

  vm.runInNewContext(
    output,
    {
      require: (request) => {
        if (mocks[request]) {
          return mocks[request];
        }
        return require(request);
      },
      module,
      exports: module.exports,
      __dirname: path.dirname(file),
      __filename: file,
      console,
      Date,
      Number,
      Object,
      String,
      JSON,
    },
    { filename: file.replace(/\.ts$/, '.js') },
  );

  return module.exports;
}

function loadOrchestratorClass() {
  const repositoryExports = loadModuleFromTs(files.repository);
  const orchestratorExports = loadModuleFromTs(files.orchestrator, {
    './amazon-sp-api-credential.repository': repositoryExports,
  });

  return orchestratorExports.AmazonSpApiTokenPersistenceOrchestrator;
}

function baseInput(patch = {}) {
  return {
    companyId: ' company-123 ',
    storeId: ' store-456 ',
    marketplaceId: ' A1VC38T7YXB528 ',
    region: ' JP ',
    sellingPartnerId: ' SELLER123456789 ',
    transportAccepted: true,
    parserAccepted: true,
    persistenceInputAccepted: true,
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

async function runRejectedCase(label, patch, expectedReason, expectedRepositoryCalls = 0) {
  const { delegate, calls } = makeDelegate();
  const result = await orchestrator.persistEncryptedTokensRealWrite(baseInput(patch), delegate);

  assertSafe(result, label);
  assertEqual(result.accepted, false, `${label} rejected`);
  assertEqual(result.reason, expectedReason, `${label} reason`);
  assertEqual(result.persistedCredentialShape, null, `${label} no persisted shape`);
  assertEqual(calls.length, expectedRepositoryCalls, `${label} repository call count`);
  return result;
}

console.log('========== Step139-M token persistence orchestrator real-write branch runtime smoke ==========');

const pkg = JSON.parse(read(files.packageJson));
const orchestratorSource = read(files.orchestrator);
const repositorySource = read(files.repository);
const controllerSource = read(files.controller);

assert(
  JSON.stringify(pkg.scripts || {}).includes('smoke:amazon-sp-api-token-persistence-orchestrator-real-write-branch-runtime'),
  'package.json registers Step139-M smoke',
);

for (const marker of [
  'persistEncryptedTokensRealWrite(',
  'AmazonSpApiCredentialPrismaDelegate',
  'AmazonSpApiEncryptedCredentialRepositoryRealWriteResult',
  "source: 'amazon-sp-api-token-persistence-orchestrator-real-write'",
  "orchestratorMode: 'repository-real-write-wiring-mocked-prisma'",
  "repositoryMethodCalled: 'upsertEncryptedCredentialRealWrite'",
  "'missing_prisma_delegate'",
  "'repository_real_write_rejected'",
  "'prisma_upsert_exception'",
  'oauthCallbackPersistenceWiringNow: false',
  'upsertEncryptedCredentialRealWrite',
  'prismaClientWriteNow: true',
  'databaseWriteNow: true',
  'tokenPersistenceDatabaseWriteNow: true',
  'plaintextTokenDatabaseWriteNow: false',
  'rawAccessTokenReturnedNow: false',
  'rawRefreshTokenReturnedNow: false',
]) {
  assert(orchestratorSource.includes(marker), `orchestrator contains marker: ${marker}`);
}

for (const forbidden of [
  'plaintextTokenDatabaseWriteNow: true',
  'amazonNetworkCallNow: true',
  'rawTokenReturnedNow: true',
  'rawAccessTokenReturnedNow: true',
  'rawRefreshTokenReturnedNow: true',
]) {
  assert(!orchestratorSource.includes(forbidden), `orchestrator does not contain forbidden marker: ${forbidden}`);
}

assert(repositorySource.includes('upsertEncryptedCredentialRealWrite'), 'repository real-write method exists');

for (const forbidden of [
  'AmazonSpApiCredentialRepository',
  'persistEncryptedTokensRealWrite',
  'upsertEncryptedCredentialRealWrite',
  'tokenPersistenceDatabaseWriteNow: true',
  'databaseWriteNow: true',
  'prismaClientWriteNow: true',
]) {
  assert(!controllerSource.includes(forbidden), `controller still does not contain forbidden marker: ${forbidden}`);
}

const OrchestratorClass = loadOrchestratorClass();
const orchestrator = new OrchestratorClass();

(async () => {
  {
    const result = await orchestrator.persistEncryptedTokensRealWrite(baseInput(), null);
    assertSafe(result, 'missing delegate null');
    assertEqual(result.accepted, false, 'missing delegate null rejected');
    assertEqual(result.reason, 'missing_prisma_delegate', 'missing delegate null reason');
    assertEqual(result.repositoryAccepted, false, 'missing delegate null repository not accepted');
    assertEqual(result.repositoryMethodCalled, null, 'missing delegate null no repository method');
    assertEqual(result.mockedPrismaDelegateUsedNow, false, 'missing delegate null flag');
  }

  {
    const result = await orchestrator.persistEncryptedTokensRealWrite(baseInput(), {});
    assertSafe(result, 'missing delegate upsert');
    assertEqual(result.accepted, false, 'missing delegate upsert rejected');
    assertEqual(result.reason, 'missing_prisma_delegate', 'missing delegate upsert reason');
    assertEqual(result.repositoryMethodCalled, null, 'missing delegate upsert no method');
    assertEqual(result.mockedPrismaDelegateUsedNow, false, 'missing delegate upsert flag');
  }

  await runRejectedCase('transport not accepted', { transportAccepted: false }, 'transport_not_accepted');
  await runRejectedCase('parser not accepted', { parserAccepted: false }, 'parser_not_accepted');
  await runRejectedCase('persistence input not accepted', { persistenceInputAccepted: false }, 'persistence_input_not_accepted');

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
  await runRejectedCase('invalid status', { status: 'invalid' }, 'invalid_status');

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
    const { delegate, calls } = makeDelegate();
    const result = await orchestrator.persistEncryptedTokensRealWrite(
      baseInput({ status: 'revoked', revokedAt: null }),
      delegate,
    );

    assertSafe(result, 'repository rejected revoked status');
    assertEqual(result.accepted, false, 'repository rejected revoked status rejected');
    assertEqual(result.reason, 'repository_real_write_rejected', 'repository rejected revoked status reason');
    assertEqual(result.repositoryReason, 'revoked_status_requires_revoked_at', 'repository rejected revoked status repository reason');
    assertEqual(result.repositoryMethodCalled, 'upsertEncryptedCredentialRealWrite', 'repository rejected revoked status method');
    assertEqual(result.repositoryMode, 'mocked-prisma-delegate-real-write-contract', 'repository rejected revoked status mode');
    assertEqual(calls.length, 0, 'repository rejected revoked status no Prisma call');
  }

  {
    const { delegate, calls } = makeDelegate({ throwOnUpsert: true });
    const result = await orchestrator.persistEncryptedTokensRealWrite(baseInput(), delegate);

    assertSafe(result, 'repository prisma exception');
    assertEqual(result.accepted, false, 'repository prisma exception rejected');
    assertEqual(result.reason, 'prisma_upsert_exception', 'repository prisma exception reason');
    assertEqual(result.repositoryReason, 'prisma_upsert_exception', 'repository prisma exception repository reason');
    assertEqual(result.repositoryMethodCalled, 'upsertEncryptedCredentialRealWrite', 'repository prisma exception method');
    assertEqual(result.repositoryMode, 'mocked-prisma-delegate-real-write-contract', 'repository prisma exception mode');
    assertEqual(calls.length, 1, 'repository prisma exception call count');
  }

  {
    const { delegate, calls } = makeDelegate();
    const result = await orchestrator.persistEncryptedTokensRealWrite(baseInput(), delegate);

    assertSafe(result, 'success full access cache');
    assertEqual(result.accepted, true, 'success full access cache accepted');
    assertEqual(result.reason, 'ready', 'success full access cache reason');
    assertEqual(result.repositoryAccepted, true, 'success full access cache repository accepted');
    assertEqual(result.repositoryReason, 'ready', 'success full access cache repository reason');
    assertEqual(result.repositoryMethodCalled, 'upsertEncryptedCredentialRealWrite', 'success full access cache method');
    assertEqual(result.repositoryMode, 'mocked-prisma-delegate-real-write-contract', 'success full access cache repository mode');
    assertEqual(result.mockedPrismaDelegateUsedNow, true, 'success full access cache delegate flag');
    assertEqual(calls.length, 1, 'success full access cache call count');

    const args = calls[0];
    assertEqual(args.where.companyId_storeId_marketplaceId_region.companyId, 'company-123', 'success full access cache company trimmed');
    assertEqual(args.where.companyId_storeId_marketplaceId_region.storeId, 'store-456', 'success full access cache store trimmed');
    assertEqual(args.where.companyId_storeId_marketplaceId_region.marketplaceId, 'A1VC38T7YXB528', 'success full access cache marketplace trimmed');
    assertEqual(args.where.companyId_storeId_marketplaceId_region.region, 'JP', 'success full access cache region trimmed');

    assertEqual(args.create.encryptedRefreshToken, 'encrypted-refresh-token', 'success full access cache encrypted refresh');
    assertEqual(args.create.encryptedAccessTokenCache, 'encrypted-access-token', 'success full access cache encrypted access');
    assertEqual(args.create.refreshTokenFingerprint, 'refresh-fingerprint', 'success full access cache refresh fingerprint');
    assertEqual(args.create.accessTokenFingerprint, 'access-fingerprint', 'success full access cache access fingerprint');
    assert(!('plaintextAccessToken' in args.create), 'success full access cache create no plaintext access token');
    assert(!('plaintextRefreshToken' in args.create), 'success full access cache create no plaintext refresh token');
    assert(!('rawLwaResponse' in args.create), 'success full access cache create no raw LWA response');

    assertEqual(result.persistedCredentialShape.id, 'credential-123', 'success full access cache persisted id');
    assertEqual(result.persistedCredentialShape.companyId, 'company-123', 'success full access cache persisted company');
    assertEqual(result.persistedCredentialShape.storeId, 'store-456', 'success full access cache persisted store');
    assertEqual(result.persistedCredentialShape.marketplaceId, 'A1VC38T7YXB528', 'success full access cache persisted marketplace');
    assertEqual(result.persistedCredentialShape.region, 'JP', 'success full access cache persisted region');
    assertEqual(result.persistedCredentialShape.sellingPartnerIdRedacted, 'SELL****', 'success full access cache seller redacted');
  }

  {
    const { delegate, calls } = makeDelegate({ id: '' });
    const result = await orchestrator.persistEncryptedTokensRealWrite(
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
    assertEqual(result.repositoryAccepted, true, 'success without access cache repository accepted');
    assertEqual(result.repositoryReason, 'ready', 'success without access cache repository reason');
    assertEqual(calls.length, 1, 'success without access cache call count');

    const args = calls[0];
    assertEqual(args.create.encryptedAccessTokenCache, null, 'success without access cache create access null');
    assertEqual(args.create.accessTokenFingerprint, null, 'success without access cache create fingerprint null');
    assertEqual(args.update.encryptedAccessTokenCache, null, 'success without access cache update access null');
    assertEqual(args.update.accessTokenFingerprint, null, 'success without access cache update fingerprint null');
    assertEqual(result.persistedCredentialShape.id, null, 'success without access cache empty id normalized null');
  }

  console.log('========== Step139-M token persistence orchestrator real-write branch runtime smoke passed ==========');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
