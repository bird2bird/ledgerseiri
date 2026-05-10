const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '../../..');
const apiRoot = path.join(root, 'apps/api');

const files = {
  packageJson: path.join(apiRoot, 'package.json'),
  orchestrator: path.join(apiRoot, 'src/imports/amazon-sp-api-token-persistence.orchestrator.ts'),
  repository: path.join(apiRoot, 'src/imports/amazon-sp-api-credential.repository.ts'),
  prismaService: path.join(apiRoot, 'src/prisma.service.ts'),
  schema: path.join(apiRoot, 'prisma/schema.prisma'),
};

function read(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing file: ${path.relative(root, file)}`);
  }
  return fs.readFileSync(file, 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`[OK] ${message}`);
}

function assertEqual(actual, expected, message) {
  assert(
    actual === expected,
    `${message}: expected=${JSON.stringify(expected)} actual=${JSON.stringify(actual)}`,
  );
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

function loadTsModule(file, mocks = {}) {
  const ts = require(path.join(apiRoot, 'node_modules/typescript'));
  const source = read(file);
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      experimentalDecorators: true,
      emitDecoratorMetadata: false,
    },
    fileName: file,
  }).outputText;

  const module = { exports: {} };

  vm.runInNewContext(
    output,
    {
      require: (request) => {
        if (mocks[request]) return mocks[request];
        if (request === '@nestjs/common') {
          return {
            Injectable: () => () => undefined,
            OnModuleInit: class {},
            OnModuleDestroy: class {},
          };
        }
        if (request === '@prisma/client') {
          return require(path.join(apiRoot, 'node_modules/@prisma/client'));
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
      process,
      Promise,
    },
    { filename: file.replace(/\.ts$/, '.js') },
  );

  return module.exports;
}

function buildInput(suffix, patch = {}) {
  return {
    companyId: `step139-v7-company-${suffix}`,
    storeId: `step139-v7-store-${suffix}`,
    marketplaceId: 'A1VC38T7YXB528',
    region: 'JP',
    sellingPartnerId: `STEP139V7SELLER${suffix}`,
    transportAccepted: true,
    parserAccepted: true,
    persistenceInputAccepted: true,
    encryptedRefreshToken: `encrypted-refresh-v7-${suffix}`,
    encryptedAccessTokenCache: `encrypted-access-v7-${suffix}`,
    accessTokenExpiresAt: new Date(Date.now() + 3600_000),
    refreshTokenFingerprint: `refresh-fingerprint-v7-${suffix}`,
    accessTokenFingerprint: `access-fingerprint-v7-${suffix}`,
    encryptionKeyId: 'kms-step139-v7',
    encryptionAlgorithm: 'envelope-v1',
    tokenVersion: 1,
    status: 'active',
    lastValidatedAt: new Date(),
    revokedAt: null,
    ...patch,
  };
}

async function cleanup(prisma, scoped) {
  const connection = await prisma.amazonSpApiConnection.findUnique({
    where: {
      companyId_storeId_marketplaceId_region: scoped,
    },
  });

  if (connection) {
    await prisma.amazonSpApiAccessTokenCache.deleteMany({
      where: { connectionId: connection.id },
    });
    await prisma.amazonSpApiCredential.deleteMany({
      where: { connectionId: connection.id },
    });

    if (prisma.amazonSpApiConnectionAudit) {
      await prisma.amazonSpApiConnectionAudit.deleteMany({
        where: { connectionId: connection.id },
      });
    }

    await prisma.amazonSpApiConnection.delete({
      where: { id: connection.id },
    });
  }

  await prisma.store.deleteMany({ where: { id: scoped.storeId } });
  await prisma.company.deleteMany({ where: { id: scoped.companyId } });
}

(async () => {
  console.log('========== Step139-V7 schema-aware orchestrator real DB smoke ==========');

  const pkg = JSON.parse(read(files.packageJson));
  const orchestratorSource = read(files.orchestrator);
  const repositorySource = read(files.repository);
  const schema = read(files.schema);

  assert(
    pkg.scripts &&
      pkg.scripts['smoke:amazon-sp-api-token-persistence-orchestrator-schema-aware-real-db'] ===
        'node scripts/smoke-amazon-sp-api-token-persistence-orchestrator-schema-aware-real-db.js',
    'package.json registers Step139-V7 smoke',
  );

  for (const marker of [
    'persistEncryptedTokensSchemaAwareRealWrite',
    "source: 'amazon-sp-api-token-persistence-orchestrator-schema-aware-real-write'",
    "orchestratorMode: 'repository-schema-aware-real-write-wiring'",
    "repositoryMethodCalled: 'upsertEncryptedCredentialSchemaAwareRealWrite'",
    'plaintextTokenDatabaseWriteNow: false',
    'rawAccessTokenReturnedNow: false',
    'rawRefreshTokenReturnedNow: false',
    'rawAuthorizationCodeReturnedNow: false',
    'rawLwaResponseReturnedNow: false',
  ]) {
    assert(orchestratorSource.includes(marker), `orchestrator contains marker: ${marker}`);
  }

  for (const marker of [
    'upsertEncryptedCredentialSchemaAwareRealWrite',
    'amazonSpApiConnection.upsert',
    'amazonSpApiCredential.upsert',
    'amazonSpApiAccessTokenCache.upsert',
    'plaintextTokenDatabaseWriteNow: false',
    'rawTokenReturnedNow: false',
    'rawLwaResponseReturnedNow: false',
  ]) {
    assert(repositorySource.includes(marker), `repository contains marker: ${marker}`);
  }

  for (const marker of [
    'model AmazonSpApiConnection',
    'model AmazonSpApiCredential',
    'model AmazonSpApiAccessTokenCache',
    '@@unique([companyId, storeId, marketplaceId, region])',
    'connectionId          String   @unique',
  ]) {
    assert(schema.includes(marker), `schema contains marker: ${marker}`);
  }

  const prismaExports = loadTsModule(files.prismaService);
  const PrismaService = prismaExports.PrismaService;
  assert(typeof PrismaService === 'function', 'PrismaService class loaded');

  const repositoryExports = loadTsModule(files.repository);
  const orchestratorExports = loadTsModule(files.orchestrator, {
    './amazon-sp-api-credential.repository': repositoryExports,
  });

  const OrchestratorClass = orchestratorExports.AmazonSpApiTokenPersistenceOrchestrator;
  assert(typeof OrchestratorClass === 'function', 'orchestrator class loaded');

  const prisma = new PrismaService();

  try {
    if (typeof prisma.$connect === 'function') {
      await prisma.$connect();
    }

    assert(prisma.company, 'prisma.company delegate exists');
    assert(prisma.store, 'prisma.store delegate exists');
    assert(prisma.amazonSpApiConnection, 'prisma.amazonSpApiConnection delegate exists');
    assert(prisma.amazonSpApiCredential, 'prisma.amazonSpApiCredential delegate exists');
    assert(prisma.amazonSpApiAccessTokenCache, 'prisma.amazonSpApiAccessTokenCache delegate exists');

    const orchestrator = new OrchestratorClass();
    const suffix = `${Date.now()}`;

    const input = buildInput(suffix);
    const scoped = {
      companyId: input.companyId,
      storeId: input.storeId,
      marketplaceId: input.marketplaceId,
      region: input.region,
    };

    await cleanup(prisma, scoped);

    const firstResult = await orchestrator.persistEncryptedTokensSchemaAwareRealWrite(
      input,
      prisma,
    );

    if (!firstResult.accepted) {
      console.error('[DEBUG] first real DB result rejected:', JSON.stringify(firstResult, null, 2));
    }

    assertNoSecret(firstResult, 'first real DB result');
    assertEqual(firstResult.accepted, true, 'first real DB upsert accepted');
    assertEqual(firstResult.reason, 'ready', 'first real DB reason');
    assertEqual(firstResult.source, 'amazon-sp-api-token-persistence-orchestrator-schema-aware-real-write', 'first source');
    assertEqual(firstResult.orchestratorMode, 'repository-schema-aware-real-write-wiring', 'first mode');
    assertEqual(firstResult.repositoryAccepted, true, 'first repository accepted');
    assertEqual(firstResult.repositoryReason, 'ready', 'first repository reason');
    assertEqual(firstResult.repositoryMethodCalled, 'upsertEncryptedCredentialSchemaAwareRealWrite', 'first repository method');
    assertEqual(firstResult.connectionWriteNow, true, 'first connection write flag');
    assertEqual(firstResult.credentialWriteNow, true, 'first credential write flag');
    assertEqual(firstResult.accessTokenCacheWriteNow, true, 'first access token cache write flag');
    assertEqual(firstResult.tokenPersistenceDatabaseWriteNow, true, 'first token DB write flag');
    assertEqual(firstResult.databaseWriteNow, true, 'first DB write flag');
    assertEqual(firstResult.prismaClientWriteNow, true, 'first Prisma write flag');
    assertEqual(firstResult.plaintextTokenDatabaseWriteNow, false, 'first no plaintext token DB write');
    assertEqual(firstResult.amazonNetworkCallNow, false, 'first no Amazon network call');
    assertEqual(firstResult.rawAccessTokenReturnedNow, false, 'first no raw access token');
    assertEqual(firstResult.rawRefreshTokenReturnedNow, false, 'first no raw refresh token');
    assertEqual(firstResult.rawAuthorizationCodeReturnedNow, false, 'first no raw auth code');
    assertEqual(firstResult.rawLwaResponseReturnedNow, false, 'first no raw LWA response');

    const connection = await prisma.amazonSpApiConnection.findUnique({
      where: { companyId_storeId_marketplaceId_region: scoped },
      include: {
        credential: true,
        accessTokenCache: true,
      },
    });

    assert(connection, 'connection row can be read back');
    assert(connection.credential, 'credential row can be read back');
    assert(connection.accessTokenCache, 'access token cache row can be read back');

    assertEqual(connection.companyId, input.companyId, 'connection company id');
    assertEqual(connection.storeId, input.storeId, 'connection store id');
    assertEqual(connection.marketplaceId, input.marketplaceId, 'connection marketplace id');
    assertEqual(connection.region, input.region, 'connection region');
    assertEqual(connection.sellingPartnerId, input.sellingPartnerId, 'connection seller');
    assertEqual(connection.status, 'CONNECTED', 'connection status');
    assertEqual(connection.credential.encryptedRefreshToken, input.encryptedRefreshToken, 'credential encrypted refresh token');
    assertEqual(connection.credential.encryptionKeyId, input.encryptionKeyId, 'credential encryption key id');
    assertEqual(connection.credential.encryptionAlgorithm, input.encryptionAlgorithm, 'credential encryption algorithm');
    assertEqual(connection.credential.tokenVersion, input.tokenVersion, 'credential token version');
    assertEqual(connection.accessTokenCache.encryptedAccessToken, input.encryptedAccessTokenCache, 'access token cache encrypted token');

    assert(!('plaintextAccessToken' in connection.credential), 'credential has no plaintextAccessToken field');
    assert(!('plaintextRefreshToken' in connection.credential), 'credential has no plaintextRefreshToken field');
    assert(!('rawLwaResponse' in connection.credential), 'credential has no rawLwaResponse field');
    assertNoSecret(connection, 'first DB rows');

    const secondInput = buildInput(suffix, {
      encryptedRefreshToken: `encrypted-refresh-v7-${suffix}-updated`,
      encryptedAccessTokenCache: `encrypted-access-v7-${suffix}-updated`,
      refreshTokenFingerprint: `refresh-fingerprint-v7-${suffix}-updated`,
      accessTokenFingerprint: `access-fingerprint-v7-${suffix}-updated`,
      encryptionKeyId: 'kms-step139-v7-updated',
      tokenVersion: 2,
      lastValidatedAt: new Date(Date.now() + 1000),
    });

    const secondResult = await orchestrator.persistEncryptedTokensSchemaAwareRealWrite(
      secondInput,
      prisma,
    );

    if (!secondResult.accepted) {
      console.error('[DEBUG] second real DB result rejected:', JSON.stringify(secondResult, null, 2));
    }

    assertNoSecret(secondResult, 'second real DB result');
    assertEqual(secondResult.accepted, true, 'second real DB upsert accepted');
    assertEqual(secondResult.reason, 'ready', 'second reason');
    assertEqual(secondResult.repositoryMethodCalled, 'upsertEncryptedCredentialSchemaAwareRealWrite', 'second repository method');
    assertEqual(secondResult.persistedConnectionShape.id, firstResult.persistedConnectionShape.id, 'second keeps same connection id');
    assertEqual(secondResult.persistedCredentialShape.id, firstResult.persistedCredentialShape.id, 'second keeps same credential id');
    assertEqual(secondResult.persistedAccessTokenCacheShape.id, firstResult.persistedAccessTokenCacheShape.id, 'second keeps same cache id');

    const updatedConnection = await prisma.amazonSpApiConnection.findUnique({
      where: { companyId_storeId_marketplaceId_region: scoped },
      include: {
        credential: true,
        accessTokenCache: true,
      },
    });

    assert(updatedConnection, 'updated connection row can be read back');
    assert(updatedConnection.credential, 'updated credential row can be read back');
    assert(updatedConnection.accessTokenCache, 'updated access token cache row can be read back');

    assertEqual(updatedConnection.id, connection.id, 'connection row id unchanged');
    assertEqual(updatedConnection.credential.id, connection.credential.id, 'credential row id unchanged');
    assertEqual(updatedConnection.accessTokenCache.id, connection.accessTokenCache.id, 'access token cache row id unchanged');
    assertEqual(updatedConnection.credential.encryptedRefreshToken, secondInput.encryptedRefreshToken, 'refresh token updated');
    assertEqual(updatedConnection.accessTokenCache.encryptedAccessToken, secondInput.encryptedAccessTokenCache, 'access token cache updated');
    assertEqual(updatedConnection.credential.encryptionKeyId, secondInput.encryptionKeyId, 'encryption key updated');
    assertEqual(updatedConnection.credential.tokenVersion, secondInput.tokenVersion, 'token version updated');

    const noCacheSuffix = `${suffix}-nocache`;
    const noCacheInput = buildInput(noCacheSuffix, {
      encryptedAccessTokenCache: null,
      accessTokenFingerprint: null,
      accessTokenExpiresAt: null,
    });
    const noCacheScoped = {
      companyId: noCacheInput.companyId,
      storeId: noCacheInput.storeId,
      marketplaceId: noCacheInput.marketplaceId,
      region: noCacheInput.region,
    };

    await cleanup(prisma, noCacheScoped);

    const noCacheResult = await orchestrator.persistEncryptedTokensSchemaAwareRealWrite(
      noCacheInput,
      prisma,
    );

    if (!noCacheResult.accepted) {
      console.error('[DEBUG] no-cache real DB result rejected:', JSON.stringify(noCacheResult, null, 2));
    }

    assertNoSecret(noCacheResult, 'no-cache real DB result');
    assertEqual(noCacheResult.accepted, true, 'no-cache upsert accepted');
    assertEqual(noCacheResult.accessTokenCacheWriteNow, false, 'no-cache access token cache write flag false');
    assertEqual(noCacheResult.persistedAccessTokenCacheShape, null, 'no-cache result has null cache shape');

    const noCacheConnection = await prisma.amazonSpApiConnection.findUnique({
      where: { companyId_storeId_marketplaceId_region: noCacheScoped },
      include: {
        credential: true,
        accessTokenCache: true,
      },
    });

    assert(noCacheConnection, 'no-cache connection row can be read back');
    assert(noCacheConnection.credential, 'no-cache credential row can be read back');
    assertEqual(noCacheConnection.accessTokenCache, null, 'no-cache access token cache row absent');

    if (process.env.STEP139_V7_KEEP_DB_ROWS !== 'true') {
      await cleanup(prisma, scoped);
      await cleanup(prisma, noCacheScoped);
      console.log('[OK] cleaned Step139-V7 temporary rows');
    } else {
      console.log('[WARN] STEP139_V7_KEEP_DB_ROWS=true, temporary rows kept for inspection');
      console.log('[WARN] kept scoped rows:', JSON.stringify({ scoped, noCacheScoped }, null, 2));
    }

    console.log('========== Step139-V7 schema-aware orchestrator real DB smoke passed ==========');
  } catch (error) {
    console.error('[ERROR] Step139-V7 real DB smoke failed.');
    console.error('[HINT] Ensure DATABASE_URL is configured, Prisma client is generated, migrations are applied, and local PostgreSQL is reachable.');
    throw error;
  } finally {
    if (typeof prisma.$disconnect === 'function') {
      await prisma.$disconnect();
    }
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
