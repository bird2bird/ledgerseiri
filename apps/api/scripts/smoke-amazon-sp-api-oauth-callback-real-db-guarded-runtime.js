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
        if (request === '@nestjs/common') return { Injectable: () => () => undefined };
        if (request === '@prisma/client') return require(path.join(apiRoot, 'node_modules/@prisma/client'));
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

function buildInput(suffix) {
  return {
    companyId: `step139-v-company-${suffix}`,
    storeId: `step139-v-store-${suffix}`,
    marketplaceId: 'A1VC38T7YXB528',
    region: 'JP',
    sellingPartnerId: `STEP139VSELLER${suffix}`,
    transportAccepted: true,
    parserAccepted: true,
    persistenceInputAccepted: true,
    encryptedRefreshToken: `encrypted-refresh-${suffix}`,
    encryptedAccessTokenCache: `encrypted-access-${suffix}`,
    accessTokenExpiresAt: new Date(Date.now() + 3600_000),
    refreshTokenFingerprint: `refresh-fingerprint-${suffix}`,
    accessTokenFingerprint: `access-fingerprint-${suffix}`,
    encryptionKeyId: 'step139-v-kms-key',
    encryptionAlgorithm: 'envelope-v1',
    tokenVersion: 1,
    status: 'active',
    lastValidatedAt: new Date(),
    revokedAt: null,
  };
}

function createSchemaAwareDelegate(prisma) {
  return {
    upsert: async (args) => {
      const scoped = args.where.companyId_storeId_marketplaceId_region;
      const create = args.create || {};
      const update = args.update || {};

      const company = await prisma.company.upsert({
        where: { id: scoped.companyId },
        create: {
          id: scoped.companyId,
          name: `Step139-V Company ${scoped.companyId}`,
        },
        update: {},
      });

      const store = await prisma.store.upsert({
        where: { id: scoped.storeId },
        create: {
          id: scoped.storeId,
          companyId: company.id,
          name: `Step139-V Store ${scoped.storeId}`,
          platform: 'AMAZON',
          region: scoped.region,
        },
        update: {
          name: `Step139-V Store ${scoped.storeId}`,
          platform: 'AMAZON',
          region: scoped.region,
        },
      });

      const connection = await prisma.amazonSpApiConnection.upsert({
        where: {
          companyId_storeId_marketplaceId_region: {
            companyId: scoped.companyId,
            storeId: scoped.storeId,
            marketplaceId: scoped.marketplaceId,
            region: scoped.region,
          },
        },
        create: {
          companyId: scoped.companyId,
          storeId: scoped.storeId,
          marketplaceId: scoped.marketplaceId,
          region: scoped.region,
          sellingPartnerId: String(create.sellingPartnerId || update.sellingPartnerId || ''),
          appId: 'step139-v-app',
          status: 'CONNECTED',
          connectedAt: new Date(),
          lastTokenRefreshAt: create.lastValidatedAt ? new Date(create.lastValidatedAt) : null,
        },
        update: {
          sellingPartnerId: String(update.sellingPartnerId || create.sellingPartnerId || ''),
          status: 'CONNECTED',
          connectedAt: new Date(),
          lastTokenRefreshAt: update.lastValidatedAt ? new Date(update.lastValidatedAt) : null,
          revokedAt: update.revokedAt ? new Date(update.revokedAt) : null,
        },
      });

      const credential = await prisma.amazonSpApiCredential.upsert({
        where: { connectionId: connection.id },
        create: {
          connectionId: connection.id,
          encryptedRefreshToken: String(create.encryptedRefreshToken || ''),
          encryptionKeyId: String(create.encryptionKeyId || ''),
          encryptionAlgorithm: String(create.encryptionAlgorithm || ''),
          tokenVersion: Number(create.tokenVersion || 1),
          rotatedAt: new Date(),
          revokedAt: create.revokedAt ? new Date(create.revokedAt) : null,
        },
        update: {
          encryptedRefreshToken: String(update.encryptedRefreshToken || ''),
          encryptionKeyId: String(update.encryptionKeyId || ''),
          encryptionAlgorithm: String(update.encryptionAlgorithm || ''),
          tokenVersion: Number(update.tokenVersion || 1),
          rotatedAt: new Date(),
          revokedAt: update.revokedAt ? new Date(update.revokedAt) : null,
        },
      });

      if (create.encryptedAccessTokenCache || update.encryptedAccessTokenCache) {
        const tokenValue = String(update.encryptedAccessTokenCache || create.encryptedAccessTokenCache || '');
        const expiresAt = update.accessTokenExpiresAt || create.accessTokenExpiresAt || new Date(Date.now() + 3600_000);

        await prisma.amazonSpApiAccessTokenCache.upsert({
          where: { connectionId: connection.id },
          create: {
            connectionId: connection.id,
            encryptedAccessToken: tokenValue,
            tokenType: 'bearer',
            scope: null,
            expiresAt: new Date(expiresAt),
          },
          update: {
            encryptedAccessToken: tokenValue,
            tokenType: 'bearer',
            scope: null,
            expiresAt: new Date(expiresAt),
          },
        });
      }

      return {
        id: credential.id,
        companyId: scoped.companyId,
        storeId: scoped.storeId,
        marketplaceId: scoped.marketplaceId,
        region: scoped.region,
        status: create.status || update.status || 'active',
        sellingPartnerId: connection.sellingPartnerId,
        encryptedRefreshToken: credential.encryptedRefreshToken,
        encryptedAccessTokenCache: create.encryptedAccessTokenCache || update.encryptedAccessTokenCache || null,
        refreshTokenFingerprint: create.refreshTokenFingerprint || update.refreshTokenFingerprint || null,
        accessTokenFingerprint: create.accessTokenFingerprint || update.accessTokenFingerprint || null,
        encryptionKeyId: credential.encryptionKeyId,
        encryptionAlgorithm: credential.encryptionAlgorithm,
        tokenVersion: credential.tokenVersion,
        connectionId: connection.id,
      };
    },
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
    await prisma.amazonSpApiConnectionAudit.deleteMany({
      where: { connectionId: connection.id },
    });
    await prisma.amazonSpApiConnection.delete({
      where: { id: connection.id },
    });
  }

  await prisma.store.deleteMany({ where: { id: scoped.storeId } });
  await prisma.company.deleteMany({ where: { id: scoped.companyId } });
}

(async () => {
  console.log('========== Step139-V OAuth callback schema-aware real DB guarded local runtime smoke ==========');

  const pkg = JSON.parse(read(files.packageJson));
  const orchestratorSource = read(files.orchestrator);
  const repositorySource = read(files.repository);
  const schema = read(files.schema);

  assert(
    pkg.scripts &&
      pkg.scripts['smoke:amazon-sp-api-oauth-callback-real-db-guarded-runtime'] ===
        'node scripts/smoke-amazon-sp-api-oauth-callback-real-db-guarded-runtime.js',
    'package.json registers Step139-V smoke',
  );

  for (const marker of [
    'model AmazonSpApiConnection',
    'model AmazonSpApiCredential',
    'model AmazonSpApiAccessTokenCache',
    '@@unique([companyId, storeId, marketplaceId, region])',
    'connectionId          String   @unique',
  ]) {
    assert(schema.includes(marker), `schema contains marker: ${marker}`);
  }

  for (const marker of [
    'persistEncryptedTokensRealWrite',
    "source: 'amazon-sp-api-token-persistence-orchestrator-real-write'",
    'plaintextTokenDatabaseWriteNow: false',
    'rawAccessTokenReturnedNow: false',
    'rawRefreshTokenReturnedNow: false',
  ]) {
    assert(orchestratorSource.includes(marker), `orchestrator contains marker: ${marker}`);
  }

  for (const marker of [
    'upsertEncryptedCredentialRealWrite',
    'prismaDelegate.upsert',
    'plaintextTokenDatabaseWriteNow: false',
    'rawTokenReturnedNow: false',
  ]) {
    assert(repositorySource.includes(marker), `repository contains marker: ${marker}`);
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
    if (typeof prisma.$connect === 'function') await prisma.$connect();

    assert(prisma.amazonSpApiConnection, 'prisma.amazonSpApiConnection delegate exists');
    assert(prisma.amazonSpApiCredential, 'prisma.amazonSpApiCredential delegate exists');
    assert(prisma.amazonSpApiAccessTokenCache, 'prisma.amazonSpApiAccessTokenCache delegate exists');

    const orchestrator = new OrchestratorClass();
    const delegate = createSchemaAwareDelegate(prisma);
    const suffix = `${Date.now()}`;
    const input = buildInput(suffix);
    const scoped = {
      companyId: input.companyId,
      storeId: input.storeId,
      marketplaceId: input.marketplaceId,
      region: input.region,
    };

    await cleanup(prisma, scoped);

    const result = await orchestrator.persistEncryptedTokensRealWrite(input, delegate);

    if (!result.accepted) {
      console.error('[DEBUG] real DB result rejected:', JSON.stringify(result, null, 2));
    }

    assertNoSecret(result, 'orchestrator real DB result');
    assertEqual(result.accepted, true, 'schema-aware real DB upsert accepted');
    assertEqual(result.reason, 'ready', 'schema-aware real DB upsert reason');
    assertEqual(result.repositoryAccepted, true, 'repository accepted');
    assertEqual(result.repositoryMethodCalled, 'upsertEncryptedCredentialRealWrite', 'repository method');
    assertEqual(result.tokenPersistenceDatabaseWriteNow, true, 'token DB write flag');
    assertEqual(result.databaseWriteNow, true, 'DB write flag');
    assertEqual(result.prismaClientWriteNow, true, 'Prisma write flag');
    assertEqual(result.plaintextTokenDatabaseWriteNow, false, 'no plaintext token DB write');
    assertEqual(result.rawAccessTokenReturnedNow, false, 'no raw access token returned');
    assertEqual(result.rawRefreshTokenReturnedNow, false, 'no raw refresh token returned');

    const connection = await prisma.amazonSpApiConnection.findUnique({
      where: { companyId_storeId_marketplaceId_region: scoped },
      include: {
        credential: true,
        accessTokenCache: true,
      },
    });

    assert(connection, 'connection row can be read back');
    assert(connection.credential, 'credential row can be read back through connection');
    assert(connection.accessTokenCache, 'access token cache row can be read back through connection');

    assertEqual(connection.status, 'CONNECTED', 'connection status CONNECTED');
    assertEqual(connection.sellingPartnerId, input.sellingPartnerId, 'connection seller stored');
    assertEqual(connection.credential.encryptedRefreshToken, input.encryptedRefreshToken, 'encrypted refresh token stored');
    assertEqual(connection.credential.encryptionKeyId, input.encryptionKeyId, 'encryption key stored');
    assertEqual(connection.credential.encryptionAlgorithm, input.encryptionAlgorithm, 'encryption algorithm stored');
    assertEqual(connection.credential.tokenVersion, input.tokenVersion, 'token version stored');
    assertEqual(connection.accessTokenCache.encryptedAccessToken, input.encryptedAccessTokenCache, 'encrypted access token cache stored');

    assert(!('plaintextAccessToken' in connection.credential), 'credential has no plaintextAccessToken field');
    assert(!('plaintextRefreshToken' in connection.credential), 'credential has no plaintextRefreshToken field');
    assert(!('rawLwaResponse' in connection.credential), 'credential has no rawLwaResponse field');
    assertNoSecret(connection, 'schema-aware DB rows');

    const secondInput = {
      ...input,
      encryptedRefreshToken: `encrypted-refresh-${suffix}-updated`,
      encryptedAccessTokenCache: `encrypted-access-${suffix}-updated`,
      encryptionKeyId: 'step139-v-kms-key-updated',
      tokenVersion: 2,
      lastValidatedAt: new Date(Date.now() + 1000),
    };

    const secondResult = await orchestrator.persistEncryptedTokensRealWrite(secondInput, delegate);
    assertEqual(secondResult.accepted, true, 'second schema-aware upsert accepted');
    assertEqual(secondResult.persistedCredentialShape.id, result.persistedCredentialShape.id, 'second upsert keeps same credential row id');

    const updatedConnection = await prisma.amazonSpApiConnection.findUnique({
      where: { companyId_storeId_marketplaceId_region: scoped },
      include: {
        credential: true,
        accessTokenCache: true,
      },
    });

    assert(updatedConnection, 'updated connection can be read back');
    assertEqual(updatedConnection.credential.encryptedRefreshToken, secondInput.encryptedRefreshToken, 'refresh token updated');
    assertEqual(updatedConnection.credential.encryptionKeyId, secondInput.encryptionKeyId, 'encryption key updated');
    assertEqual(updatedConnection.credential.tokenVersion, secondInput.tokenVersion, 'token version updated');
    assertEqual(updatedConnection.accessTokenCache.encryptedAccessToken, secondInput.encryptedAccessTokenCache, 'access token cache updated');

    if (process.env.STEP139_V_KEEP_DB_ROW !== 'true') {
      await cleanup(prisma, scoped);
      console.log('[OK] cleaned Step139-V temporary connection/credential/access-token rows');
    } else {
      console.log('[WARN] STEP139_V_KEEP_DB_ROW=true, temporary rows kept for inspection');
    }

    console.log('========== Step139-V OAuth callback schema-aware real DB guarded local runtime smoke passed ==========');
  } catch (error) {
    console.error('[ERROR] Step139-V schema-aware real DB smoke failed.');
    console.error('[HINT] Ensure DATABASE_URL is configured, Prisma client is generated, migrations are applied, and local PostgreSQL is reachable.');
    throw error;
  } finally {
    if (typeof prisma.$disconnect === 'function') await prisma.$disconnect();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
