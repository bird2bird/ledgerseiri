const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '../../..');
const apiRoot = path.join(root, 'apps/api');

const files = {
  packageJson: path.join(apiRoot, 'package.json'),
  orchestrator: path.join(apiRoot, 'src/imports/amazon-sp-api-token-persistence.orchestrator.ts'),
  repository: path.join(apiRoot, 'src/imports/amazon-sp-api-credential.repository.ts'),
};

function read(file) {
  if (!fs.existsSync(file)) throw new Error(`Missing file: ${path.relative(root, file)}`);
  return fs.readFileSync(file, 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`[OK] ${message}`);
}

function assertEqual(actual, expected, message) {
  assert(actual === expected, `${message}: expected=${JSON.stringify(expected)} actual=${JSON.stringify(actual)}`);
}

function assertNoSecret(value, label) {
  const serialized = JSON.stringify(value);
  for (const secret of [
    'PLAINTEXT_REFRESH_TOKEN',
    'PLAINTEXT_ACCESS_TOKEN',
    'AUTHORIZATION_CODE_SECRET',
    'RAW_LWA_RESPONSE_SECRET',
    'CLIENT_SECRET_VALUE',
  ]) {
    assert(!serialized.includes(secret), `${label} does not expose ${secret}`);
  }
}

function loadOrchestratorClass(repositoryMock) {
  const ts = require(path.join(apiRoot, 'node_modules/typescript'));
  const source = read(files.orchestrator);
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      experimentalDecorators: true,
    },
    fileName: files.orchestrator,
  }).outputText;

  const module = { exports: {} };

  vm.runInNewContext(
    output,
    {
      require: (request) => {
        if (request === './amazon-sp-api-credential.repository') {
          return repositoryMock;
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
      Promise,
    },
    { filename: files.orchestrator.replace(/\.ts$/, '.js') },
  );

  return module.exports.AmazonSpApiTokenPersistenceOrchestrator;
}

function buildInput(patch = {}) {
  return {
    companyId: 'company-step139-v5',
    storeId: 'store-step139-v5',
    marketplaceId: 'A1VC38T7YXB528',
    region: 'JP',
    sellingPartnerId: 'SELLINGPARTNERSTEP139V5',
    transportAccepted: true,
    parserAccepted: true,
    persistenceInputAccepted: true,
    encryptedRefreshToken: 'ENCRYPTED_REFRESH_TOKEN_ONLY',
    encryptedAccessTokenCache: 'ENCRYPTED_ACCESS_TOKEN_ONLY',
    accessTokenExpiresAt: new Date(Date.now() + 3600_000),
    refreshTokenFingerprint: 'refresh-fingerprint-v5',
    accessTokenFingerprint: 'access-fingerprint-v5',
    encryptionKeyId: 'kms-step139-v5',
    encryptionAlgorithm: 'envelope-v1',
    tokenVersion: 1,
    status: 'active',
    lastValidatedAt: new Date(),
    revokedAt: null,
    ...patch,
  };
}

function makeRepository({ accepted = true, reason = 'ready' } = {}) {
  const calls = {
    schemaAware: [],
    legacy: [],
  };

  class AmazonSpApiCredentialRepository {
    async upsertEncryptedCredentialSchemaAwareRealWrite(input, prismaClient) {
      calls.schemaAware.push({ input, prismaClient });

      if (!accepted) {
        return {
          accepted: false,
          source: 'amazon-sp-api-credential-repository-schema-aware-real-write',
          repositoryMode: 'schema-aware-prisma-real-write',
          operation: 'upsertEncryptedCredentialSchemaAwareRealWrite',
          reason,
          messageRedacted: 'Repository schema-aware rejected.',
          scopedIdentityReady: true,
          encryptedCredentialPayloadReady: true,
          connectionWriteNow: false,
          credentialWriteNow: false,
          accessTokenCacheWriteNow: false,
          prismaClientWriteNow: false,
          databaseWriteNow: false,
          tokenPersistenceDatabaseWriteNow: false,
          plaintextTokenDatabaseWriteNow: false,
          repositoryMayCallAmazonNow: false,
          repositoryMayParseLwaResponseNow: false,
          repositoryMayOwnEncryptionNow: false,
          rawTokenReturnedNow: false,
          rawLwaResponseReturnedNow: false,
          rawAuthorizationCodeReturnedNow: false,
          persistedConnectionShape: null,
          persistedCredentialShape: null,
          persistedAccessTokenCacheShape: null,
        };
      }

      return {
        accepted: true,
        source: 'amazon-sp-api-credential-repository-schema-aware-real-write',
        repositoryMode: 'schema-aware-prisma-real-write',
        operation: 'upsertEncryptedCredentialSchemaAwareRealWrite',
        reason: 'ready',
        messageRedacted: 'Repository schema-aware accepted.',
        scopedIdentityReady: true,
        encryptedCredentialPayloadReady: true,
        connectionWriteNow: true,
        credentialWriteNow: true,
        accessTokenCacheWriteNow: Boolean(input.encryptedAccessTokenCache),
        prismaClientWriteNow: true,
        databaseWriteNow: true,
        tokenPersistenceDatabaseWriteNow: true,
        plaintextTokenDatabaseWriteNow: false,
        repositoryMayCallAmazonNow: false,
        repositoryMayParseLwaResponseNow: false,
        repositoryMayOwnEncryptionNow: false,
        rawTokenReturnedNow: false,
        rawLwaResponseReturnedNow: false,
        rawAuthorizationCodeReturnedNow: false,
        persistedConnectionShape: {
          id: 'connection-step139-v5',
          companyId: input.companyId,
          storeId: input.storeId,
          marketplaceId: input.marketplaceId,
          region: input.region,
          status: 'CONNECTED',
          sellingPartnerIdRedacted: 'SELL****',
          connectedAt: new Date().toISOString(),
        },
        persistedCredentialShape: {
          id: 'credential-step139-v5',
          connectionId: 'connection-step139-v5',
          encryptionKeyId: input.encryptionKeyId,
          encryptionAlgorithm: input.encryptionAlgorithm,
          tokenVersion: input.tokenVersion,
          rotatedAt: new Date().toISOString(),
          revokedAt: null,
        },
        persistedAccessTokenCacheShape: input.encryptedAccessTokenCache
          ? {
              id: 'cache-step139-v5',
              connectionId: 'connection-step139-v5',
              expiresAt: new Date(Date.now() + 3600_000).toISOString(),
            }
          : null,
      };
    }

    async upsertEncryptedCredentialRealWrite(input, prismaDelegate) {
      calls.legacy.push({ input, prismaDelegate });
      return {
        accepted: false,
        reason: 'legacy_should_not_be_called',
      };
    }
  }

  return { repositoryModule: { AmazonSpApiCredentialRepository }, calls };
}

(async () => {
  console.log('========== Step139-V5 schema-aware orchestrator real-write implementation smoke ==========');

  const pkg = JSON.parse(read(files.packageJson));
  const orchestratorSource = read(files.orchestrator);
  const repositorySource = read(files.repository);

  assert(
    pkg.scripts &&
      pkg.scripts['smoke:amazon-sp-api-token-persistence-orchestrator-schema-aware-real-write-implementation'] ===
        'node scripts/smoke-amazon-sp-api-token-persistence-orchestrator-schema-aware-real-write-implementation.js',
    'package.json registers Step139-V5 smoke',
  );

  for (const marker of [
    'persistEncryptedTokensSchemaAwareRealWrite',
    "source: 'amazon-sp-api-token-persistence-orchestrator-schema-aware-real-write'",
    "orchestratorMode: 'repository-schema-aware-real-write-wiring'",
    "repositoryMethodCalled: 'upsertEncryptedCredentialSchemaAwareRealWrite'",
    'upsertEncryptedCredentialSchemaAwareRealWrite',
    'plaintextTokenDatabaseWriteNow: false',
    'rawAccessTokenReturnedNow: false',
    'rawRefreshTokenReturnedNow: false',
    'rawAuthorizationCodeReturnedNow: false',
    'rawLwaResponseReturnedNow: false',
  ]) {
    assert(orchestratorSource.includes(marker), `orchestrator contains marker: ${marker}`);
  }

  assert(repositorySource.includes('upsertEncryptedCredentialSchemaAwareRealWrite'), 'repository schema-aware method exists');

  for (const forbidden of [
    'fetch(',
    'axios',
    'rawAccessTokenReturnedNow: true',
    'rawRefreshTokenReturnedNow: true',
    'rawAuthorizationCodeReturnedNow: true',
    'rawLwaResponseReturnedNow: true',
    'plaintextTokenDatabaseWriteNow: true',
  ]) {
    assert(!orchestratorSource.includes(forbidden), `orchestrator does not contain forbidden marker: ${forbidden}`);
  }

  {
    const { repositoryModule, calls } = makeRepository();
    const OrchestratorClass = loadOrchestratorClass(repositoryModule);
    const orchestrator = new OrchestratorClass();

    const result = await orchestrator.persistEncryptedTokensSchemaAwareRealWrite(
      buildInput(),
      null,
    );

    assertNoSecret(result, 'missing prisma result');
    assertEqual(result.accepted, false, 'missing schema-aware prisma rejected');
    assertEqual(result.reason, 'missing_schema_aware_prisma_client', 'missing prisma reason');
    assertEqual(result.repositoryMethodCalled, null, 'missing prisma no repository method');
    assertEqual(calls.schemaAware.length, 0, 'missing prisma no schema-aware repository call');
    assertEqual(calls.legacy.length, 0, 'missing prisma no legacy repository call');
  }

  {
    const { repositoryModule, calls } = makeRepository();
    const OrchestratorClass = loadOrchestratorClass(repositoryModule);
    const orchestrator = new OrchestratorClass();

    const result = await orchestrator.persistEncryptedTokensSchemaAwareRealWrite(
      buildInput(),
      { schemaAware: true },
    );

    assertNoSecret(result, 'success result');
    assertEqual(result.accepted, true, 'success accepted');
    assertEqual(result.reason, 'ready', 'success reason');
    assertEqual(result.source, 'amazon-sp-api-token-persistence-orchestrator-schema-aware-real-write', 'success source');
    assertEqual(result.orchestratorMode, 'repository-schema-aware-real-write-wiring', 'success mode');
    assertEqual(result.repositoryAccepted, true, 'success repository accepted');
    assertEqual(result.repositoryReason, 'ready', 'success repository reason');
    assertEqual(result.repositoryMethodCalled, 'upsertEncryptedCredentialSchemaAwareRealWrite', 'success repository method');
    assertEqual(result.connectionWriteNow, true, 'success connection write');
    assertEqual(result.credentialWriteNow, true, 'success credential write');
    assertEqual(result.accessTokenCacheWriteNow, true, 'success access token cache write');
    assertEqual(result.tokenPersistenceDatabaseWriteNow, true, 'success token DB write');
    assertEqual(result.databaseWriteNow, true, 'success DB write');
    assertEqual(result.prismaClientWriteNow, true, 'success Prisma write');
    assertEqual(result.plaintextTokenDatabaseWriteNow, false, 'success no plaintext token');
    assertEqual(result.amazonNetworkCallNow, false, 'success no Amazon call');
    assertEqual(result.rawAccessTokenReturnedNow, false, 'success no raw access token');
    assertEqual(result.rawRefreshTokenReturnedNow, false, 'success no raw refresh token');
    assertEqual(result.rawAuthorizationCodeReturnedNow, false, 'success no raw auth code');
    assertEqual(result.rawLwaResponseReturnedNow, false, 'success no raw LWA response');
    assert(result.persistedConnectionShape, 'success connection shape');
    assert(result.persistedCredentialShape, 'success credential shape');
    assert(result.persistedAccessTokenCacheShape, 'success access token cache shape');
    assertEqual(calls.schemaAware.length, 1, 'success schema-aware repository called once');
    assertEqual(calls.legacy.length, 0, 'success legacy repository not called');
  }

  {
    const { repositoryModule, calls } = makeRepository();
    const OrchestratorClass = loadOrchestratorClass(repositoryModule);
    const orchestrator = new OrchestratorClass();

    const result = await orchestrator.persistEncryptedTokensSchemaAwareRealWrite(
      buildInput({ encryptedAccessTokenCache: null }),
      { schemaAware: true },
    );

    assertEqual(result.accepted, true, 'success without access token accepted');
    assertEqual(result.accessTokenCacheWriteNow, false, 'no access token cache write');
    assertEqual(result.persistedAccessTokenCacheShape, null, 'no access token cache shape');
    assertEqual(calls.schemaAware.length, 1, 'no access token schema-aware repository called');
    assertEqual(calls.legacy.length, 0, 'no access token legacy repository not called');
  }

  {
    const { repositoryModule, calls } = makeRepository({
      accepted: false,
      reason: 'prisma_schema_aware_write_exception',
    });
    const OrchestratorClass = loadOrchestratorClass(repositoryModule);
    const orchestrator = new OrchestratorClass();

    const result = await orchestrator.persistEncryptedTokensSchemaAwareRealWrite(
      buildInput(),
      { schemaAware: true },
    );

    assertNoSecret(result, 'repository exception result');
    assertEqual(result.accepted, false, 'repository exception rejected');
    assertEqual(result.reason, 'prisma_schema_aware_write_exception', 'repository exception reason mapped');
    assertEqual(result.repositoryReason, 'prisma_schema_aware_write_exception', 'repository exception reason preserved');
    assertEqual(result.repositoryMethodCalled, 'upsertEncryptedCredentialSchemaAwareRealWrite', 'repository exception method');
    assertEqual(calls.schemaAware.length, 1, 'repository exception schema-aware repository called');
    assertEqual(calls.legacy.length, 0, 'repository exception legacy repository not called');
  }

  {
    const { repositoryModule, calls } = makeRepository();
    const OrchestratorClass = loadOrchestratorClass(repositoryModule);
    const orchestrator = new OrchestratorClass();

    const result = await orchestrator.persistEncryptedTokensSchemaAwareRealWrite(
      buildInput({ plaintextAccessToken: 'PLAINTEXT_ACCESS_TOKEN' }),
      { schemaAware: true },
    );

    assertNoSecret(result, 'unsafe result');
    assertEqual(result.accepted, false, 'unsafe rejected');
    assertEqual(result.reason, 'plaintext_token_field_rejected', 'unsafe reason');
    assertEqual(result.repositoryMethodCalled, null, 'unsafe no repository method');
    assertEqual(calls.schemaAware.length, 0, 'unsafe no schema-aware repository call');
    assertEqual(calls.legacy.length, 0, 'unsafe no legacy repository call');
  }

  console.log('========== Step139-V5 schema-aware orchestrator real-write implementation smoke passed ==========');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
