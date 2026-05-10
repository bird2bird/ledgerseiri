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
  assertEqual(result.plaintextTokenDatabaseWriteNow, false, `${label} plaintext DB flag false`);
  assertEqual(result.rawTokenReturnedNow, false, `${label} no raw token`);
  assertEqual(result.rawLwaResponseReturnedNow, false, `${label} no raw LWA`);
  assertEqual(result.rawAccessTokenReturnedNow, false, `${label} no raw access token`);
  assertEqual(result.rawRefreshTokenReturnedNow, false, `${label} no raw refresh token`);

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

function loadOrchestratorClass() {
  const ts = require(path.join(apiRoot, 'node_modules/typescript'));
  const source = read(files.orchestrator);
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: files.orchestrator,
  }).outputText;

  const module = { exports: {} };

  vm.runInNewContext(
    output,
    {
      require: (request) => {
        if (request === './amazon-sp-api-credential.repository') {
          const repoTs = require(path.join(apiRoot, 'node_modules/typescript'));
          const repoSource = read(files.repository);
          const repoOutput = repoTs.transpileModule(repoSource, {
            compilerOptions: {
              module: repoTs.ModuleKind.CommonJS,
              target: repoTs.ScriptTarget.ES2020,
              esModuleInterop: true,
            },
            fileName: files.repository,
          }).outputText;
          const repoModule = { exports: {} };
          vm.runInNewContext(
            repoOutput,
            {
              require,
              module: repoModule,
              exports: repoModule.exports,
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
          return repoModule.exports;
        }
        return require(request);
      },
      module,
      exports: module.exports,
      __dirname: path.dirname(files.orchestrator),
      __filename: files.orchestrator,
      console,
      Date,
      Number,
      Object,
      String,
      JSON,
    },
    { filename: files.orchestrator.replace(/\.ts$/, '.js') },
  );

  return module.exports.AmazonSpApiTokenPersistenceOrchestrator;
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

async function runRejectedCase(orchestrator, label, patch, expectedReason, expectedRepositoryCalls = 0) {
  const { delegate, calls } = makeDelegate();
  const result = await orchestrator.persistEncryptedTokensRealWrite(baseInput(patch), delegate);

  assertSafe(result, label);
  assertEqual(result.accepted, false, `${label} rejected`);
  assertEqual(result.reason, expectedReason, `${label} reason`);
  assertEqual(result.persistedCredentialShape, null, `${label} no persisted shape`);
  assertEqual(calls.length, expectedRepositoryCalls, `${label} repository call count`);
  return result;
}

console.log('========== Step139-L token persistence orchestrator real-write mocked Prisma smoke ==========');

const pkg = JSON.parse(read(files.packageJson));
const orchestratorSource = read(files.orchestrator);
const repositorySource = read(files.repository);
const controllerSource = read(files.controller);

assert(
  JSON.stringify(pkg.scripts || {}).includes('smoke:amazon-sp-api-token-persistence-orchestrator-real-write-mocked-prisma'),
  'package.json registers Step139-L smoke',
);

for (const marker of [
  'persistEncryptedTokensRealWrite(',
  'AmazonSpApiCredentialPrismaDelegate',
  'AmazonSpApiEncryptedCredentialRepositoryRealWriteResult',
  "source: 'amazon-sp-api-token-persistence-orchestrator-real-write'",
  "orchestratorMode: 'repository-real-write-wiring-mocked-prisma'",
  "repositoryMethodCalled: 'upsertEncryptedCredentialRealWrite'",
  "oauthCallbackPersistenceWiringNow: false",
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
    assertSafe(result, 'missing delegate');
    assertEqual(result.accepted, false, 'missing delegate rejected');
    assertEqual(result.reason, 'missing_prisma_delegate', 'missing delegate reason');
    assertEqual(result.repositoryMethodCalled, null, 'missing delegate no repository method');
  }

  await runRejectedCase(orchestrator, 'transport not accepted', { transportAccepted: false }, 'transport_not_accepted');
  await runRejectedCase(orchestrator, 'parser not accepted', { parserAccepted: false }, 'parser_not_accepted');
  await runRejectedCase(orchestrator, 'persistence input not accepted', { persistenceInputAccepted: false }, 'persistence_input_not_accepted');
  await runRejectedCase(orchestrator, 'missing company', { companyId: ' ' }, 'missing_company_id');
  await runRejectedCase(orchestrator, 'missing store', { storeId: ' ' }, 'missing_store_id');
  await runRejectedCase(orchestrator, 'missing marketplace', { marketplaceId: ' ' }, 'missing_marketplace_id');
  await runRejectedCase(orchestrator, 'missing region', { region: ' ' }, 'missing_region');
  await runRejectedCase(orchestrator, 'missing selling partner', { sellingPartnerId: ' ' }, 'missing_selling_partner_id');
  await runRejectedCase(orchestrator, 'missing encrypted refresh', { encryptedRefreshToken: ' ' }, 'missing_encrypted_refresh_token');
  await runRejectedCase(orchestrator, 'missing refresh fingerprint', { refreshTokenFingerprint: ' ' }, 'missing_refresh_token_fingerprint');
  await runRejectedCase(orchestrator, 'missing encryption key', { encryptionKeyId: ' ' }, 'missing_encryption_key_id');
  await runRejectedCase(orchestrator, 'missing encryption algorithm', { encryptionAlgorithm: ' ' }, 'missing_encryption_algorithm');
  await runRejectedCase(orchestrator, 'invalid token version', { tokenVersion: 0 }, 'invalid_token_version');
  await runRejectedCase(orchestrator, 'invalid status', { status: 'invalid' }, 'invalid_status');
  await runRejectedCase(
    orchestrator,
    'plaintext access rejected',
    { plaintextAccessToken: 'ACCESS_TOKEN_SECRET_VALUE' },
    'plaintext_token_field_rejected',
  );
  await runRejectedCase(
    orchestrator,
    'plaintext refresh rejected',
    { plaintextRefreshToken: 'REFRESH_TOKEN_SECRET_VALUE' },
    'plaintext_token_field_rejected',
  );
  await runRejectedCase(
    orchestrator,
    'raw LWA rejected',
    { rawLwaResponse: 'RAW_LWA_RESPONSE_SECRET' },
    'raw_lwa_response_rejected',
  );
  await runRejectedCase(
    orchestrator,
    'raw authorization rejected',
    { rawAuthorizationCode: 'AUTHORIZATION_CODE_SECRET' },
    'raw_authorization_code_rejected',
  );
  await runRejectedCase(
    orchestrator,
    'raw client secret rejected',
    { rawClientSecret: 'CLIENT_SECRET_VALUE' },
    'raw_client_secret_rejected',
  );

  {
    const { delegate, calls } = makeDelegate({ throwOnUpsert: true });
    const result = await orchestrator.persistEncryptedTokensRealWrite(baseInput(), delegate);
    assertSafe(result, 'repository prisma exception');
    assertEqual(result.accepted, false, 'repository prisma exception rejected');
    assertEqual(result.reason, 'prisma_upsert_exception', 'repository prisma exception reason');
    assertEqual(result.repositoryReason, 'prisma_upsert_exception', 'repository prisma exception repository reason');
    assertEqual(result.repositoryMethodCalled, 'upsertEncryptedCredentialRealWrite', 'repository prisma exception method');
    assertEqual(calls.length, 1, 'repository prisma exception called once');
  }

  {
    const { delegate, calls } = makeDelegate();
    const result = await orchestrator.persistEncryptedTokensRealWrite(baseInput(), delegate);
    assertSafe(result, 'success');
    assertEqual(result.accepted, true, 'success accepted');
    assertEqual(result.reason, 'ready', 'success reason');
    assertEqual(result.repositoryAccepted, true, 'success repository accepted');
    assertEqual(result.repositoryReason, 'ready', 'success repository reason');
    assertEqual(result.repositoryMethodCalled, 'upsertEncryptedCredentialRealWrite', 'success repository method');
    assertEqual(result.repositoryMode, 'mocked-prisma-delegate-real-write-contract', 'success repository mode');
    assertEqual(calls.length, 1, 'success repository called once');

    const args = calls[0];
    assertEqual(args.where.companyId_storeId_marketplaceId_region.companyId, 'company-123', 'success company trimmed');
    assertEqual(args.where.companyId_storeId_marketplaceId_region.storeId, 'store-456', 'success store trimmed');
    assertEqual(args.create.encryptedRefreshToken, 'encrypted-refresh-token', 'success encrypted refresh mapped');
    assertEqual(args.create.refreshTokenFingerprint, 'refresh-fingerprint', 'success refresh fingerprint mapped');
    assert(!('plaintextAccessToken' in args.create), 'success create has no plaintext access token');
    assert(!('plaintextRefreshToken' in args.create), 'success create has no plaintext refresh token');

    assertEqual(result.persistedCredentialShape.id, 'credential-123', 'success persisted id');
    assertEqual(result.persistedCredentialShape.companyId, 'company-123', 'success persisted company');
    assertEqual(result.persistedCredentialShape.storeId, 'store-456', 'success persisted store');
    assertEqual(result.persistedCredentialShape.sellingPartnerIdRedacted, 'SELL****', 'success seller redacted');
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
    assertEqual(calls.length, 1, 'success without access cache called once');
    assertEqual(calls[0].create.encryptedAccessTokenCache, null, 'success without access cache create access null');
    assertEqual(calls[0].update.encryptedAccessTokenCache, null, 'success without access cache update access null');
    assertEqual(result.persistedCredentialShape.id, null, 'success without access cache empty id normalized null');
  }

  console.log('========== Step139-L token persistence orchestrator real-write mocked Prisma smoke passed ==========');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
