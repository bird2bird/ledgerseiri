const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '../../..');
const apiRoot = path.join(root, 'apps/api');

const files = {
  packageJson: path.join(apiRoot, 'package.json'),
  controller: path.join(apiRoot, 'src/imports/imports.controller.ts'),
  module: path.join(apiRoot, 'src/imports/imports.module.ts'),
  prismaService: path.join(apiRoot, 'src/prisma.service.ts'),
  orchestrator: path.join(apiRoot, 'src/imports/amazon-sp-api-token-persistence.orchestrator.ts'),
  repository: path.join(apiRoot, 'src/imports/amazon-sp-api-credential.repository.ts'),
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
    'AUTHORIZATION_CODE_SECRET',
    'ACCESS_TOKEN_SECRET_VALUE',
    'REFRESH_TOKEN_SECRET_VALUE',
    'RAW_LWA_RESPONSE_SECRET',
    'CLIENT_SECRET_VALUE',
    'PLAINTEXT_ACCESS_TOKEN',
    'PLAINTEXT_REFRESH_TOKEN',
  ]) {
    assert(!serialized.includes(secret), `${label} does not expose ${secret}`);
  }
}

function clearCommitEnv() {
  for (const key of [
    'AMAZON_SP_API_OAUTH_CALLBACK_COMMIT_ENABLED',
    'AMAZON_SP_API_OAUTH_CALLBACK_OPERATOR_CONFIRMED',
    'AMAZON_SP_API_OAUTH_CALLBACK_COMPANY_STORE_ALLOWLISTED',
    'AMAZON_SP_API_OAUTH_CALLBACK_PERSISTENCE_ENABLED',
    'AMAZON_SP_API_OAUTH_CALLBACK_TRUSTED_STATE_SIGNATURE_VALID',
    'AMAZON_SP_API_OAUTH_CALLBACK_TRUSTED_STATE_EXPIRED',
    'AMAZON_SP_API_OAUTH_CALLBACK_REAL_LWA_GATE_ACCEPTED',
    'AMAZON_SP_API_OAUTH_CALLBACK_IDEMPOTENCY_KEY',
    'AMAZON_SP_API_OAUTH_CALLBACK_USE_MOCKED_PRISMA_DELEGATE',
  ]) {
    delete process.env[key];
  }
}

function setCommitEnv(idempotencyKey) {
  clearCommitEnv();
  process.env.AMAZON_SP_API_OAUTH_CALLBACK_COMMIT_ENABLED = 'true';
  process.env.AMAZON_SP_API_OAUTH_CALLBACK_OPERATOR_CONFIRMED = 'true';
  process.env.AMAZON_SP_API_OAUTH_CALLBACK_COMPANY_STORE_ALLOWLISTED = 'true';
  process.env.AMAZON_SP_API_OAUTH_CALLBACK_PERSISTENCE_ENABLED = 'true';
  process.env.AMAZON_SP_API_OAUTH_CALLBACK_TRUSTED_STATE_SIGNATURE_VALID = 'true';
  process.env.AMAZON_SP_API_OAUTH_CALLBACK_TRUSTED_STATE_EXPIRED = 'false';
  process.env.AMAZON_SP_API_OAUTH_CALLBACK_REAL_LWA_GATE_ACCEPTED = 'true';
  process.env.AMAZON_SP_API_OAUTH_CALLBACK_IDEMPOTENCY_KEY = idempotencyKey;
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
            BadRequestException: class BadRequestException extends Error {},
            ForbiddenException: class ForbiddenException extends Error {},
            Body: () => () => undefined,
            Controller: () => () => undefined,
            Get: () => () => undefined,
            Param: () => () => undefined,
            Post: () => () => undefined,
            Query: () => () => undefined,
            Req: () => () => undefined,
            UseGuards: () => () => undefined,
            OnModuleInit: class {},
            OnModuleDestroy: class {},
          };
        }

        if (request === '../auth/jwt.guard') return { JwtAuthGuard: class JwtAuthGuard {} };
        if (request === '@prisma/client') return require(path.join(apiRoot, 'node_modules/@prisma/client'));

        if (request.startsWith('./') || request.startsWith('../')) {
          const resolvedCandidates = [
            path.join(path.dirname(file), request + '.ts'),
            path.join(path.dirname(file), request, 'index.ts'),
            path.join(apiRoot, 'src', request.replace(/^\.\.\//, '') + '.ts'),
          ];

          for (const candidate of resolvedCandidates) {
            if (fs.existsSync(candidate)) return loadTsModule(candidate, mocks);
          }

          return new Proxy({}, {
            get(_target, prop) {
              if (prop === '__esModule') return true;
              return {};
            },
          });
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
    { filename: file.replace(/\\.ts$/, '.js') },
  );

  return module.exports;
}

function buildFakeTokenExchangeService(suffix, patch = {}) {
  return {
    exchangeAuthorizationCodeDryRunnable: () => ({
      accepted: true,
      reason: 'ready',
      messageRedacted: 'Fake exchange accepted.',
      transportMode: 'fake',
      tokenExchangeHttpCallNow: false,
      realSpApiRequestNow: false,
      companyId: `step139-x-company-${suffix}`,
      storeId: `step139-x-store-${suffix}`,
      marketplaceId: 'A1VC38T7YXB528',
      region: 'JP',
      sanitizedTokenEnvelope: {
        accessTokenPresent: patch.noAccessTokenCache !== true,
        refreshTokenPresent: true,
        rawAccessTokenReturnedNow: false,
        rawRefreshTokenReturnedNow: false,
      },
    }),
    runTokenPersistenceE2eServiceOnlyTestDouble: () => ({
      accepted: true,
      reason: 'ready',
      messageRedacted: 'Service dry-run accepted.',
    }),
  };
}

function buildBridgeService(suffix, patch = {}) {
  return {
    buildPersistencePlan: () => ({
      accepted: true,
      reason: 'ready',
      messageRedacted: 'Persistence input accepted.',
      refreshCredentialInput: {
        encryptedRefreshToken: `encrypted-refresh-step139-x-${suffix}${patch.refreshSuffix || ''}`,
        encryptionKeyId: `kms-step139-x${patch.keySuffix || ''}`,
        encryptionAlgorithm: 'envelope-v1',
        tokenVersion: patch.tokenVersion || 1,
      },
      accessTokenCacheInput:
        patch.noAccessTokenCache === true
          ? null
          : {
              encryptedAccessToken: `encrypted-access-step139-x-${suffix}${patch.accessSuffix || ''}`,
              expiresAt: new Date(Date.now() + 3600_000).toISOString(),
            },
    }),
    validateStatePayload: () => ({ accepted: true }),
  };
}

function buildCommitGateService() {
  return {
    evaluateCommitGate: (input) => {
      if (
        input.dryRun === false &&
        input.requestedCommit === true &&
        input.operatorConfirmed === true &&
        input.companyStoreAllowlisted === true &&
        input.environmentAllowsPersistence === true &&
        input.realLwaActivationGateAccepted === true
      ) {
        return {
          accepted: true,
          reason: 'ready_for_commit',
          commitAllowedNow: true,
          dryRunForcedNow: false,
          controllerMayCallOrchestratorRealWriteNow: true,
          tokenPersistenceDatabaseWriteAllowedNow: true,
          databaseWriteAllowedNow: true,
          prismaClientWriteAllowedNow: true,
          plaintextTokenDatabaseWriteAllowedNow: false,
          rawAuthorizationCodeReturnedNow: false,
          rawLwaResponseReturnedNow: false,
          rawAccessTokenReturnedNow: false,
          rawRefreshTokenReturnedNow: false,
        };
      }

      return {
        accepted: false,
        reason: 'dry_run_default',
        commitAllowedNow: false,
        dryRunForcedNow: true,
        controllerMayCallOrchestratorRealWriteNow: false,
        tokenPersistenceDatabaseWriteAllowedNow: false,
        databaseWriteAllowedNow: false,
        prismaClientWriteAllowedNow: false,
        plaintextTokenDatabaseWriteAllowedNow: false,
        rawAuthorizationCodeReturnedNow: false,
        rawLwaResponseReturnedNow: false,
        rawAccessTokenReturnedNow: false,
        rawRefreshTokenReturnedNow: false,
      };
    },
  };
}

async function cleanup(prisma, scoped) {
  const connection = await prisma.amazonSpApiConnection.findUnique({
    where: { companyId_storeId_marketplaceId_region: scoped },
  });

  if (connection) {
    await prisma.amazonSpApiAccessTokenCache.deleteMany({ where: { connectionId: connection.id } });
    await prisma.amazonSpApiCredential.deleteMany({ where: { connectionId: connection.id } });

    if (prisma.amazonSpApiConnectionAudit) {
      await prisma.amazonSpApiConnectionAudit.deleteMany({ where: { connectionId: connection.id } });
    }

    await prisma.amazonSpApiConnection.delete({ where: { id: connection.id } });
  }

  await prisma.store.deleteMany({ where: { id: scoped.storeId } });
  await prisma.company.deleteMany({ where: { id: scoped.companyId } });
}

async function invokeController(controller, suffix, patch = {}) {
  return controller.amazonSpApiOAuthCallbackBoundary(
    'STATE_OK',
    'AUTHORIZATION_CODE_SECRET',
    '',
    `SELLERSTEP139X${suffix}`,
    '',
    '',
    'false',
    'true',
    `step139-x-idempotency-${suffix}`,
  );
}

(async () => {
  console.log('========== Step139-X OAuth callback controller-level real DB E2E smoke ==========');

  const pkg = JSON.parse(read(files.packageJson));
  const controllerSource = read(files.controller);
  const orchestratorSource = read(files.orchestrator);
  const repositorySource = read(files.repository);
  const schema = read(files.schema);

  assert(
    pkg.scripts &&
      pkg.scripts['smoke:amazon-sp-api-oauth-callback-controller-real-db-e2e'] ===
        'node scripts/smoke-amazon-sp-api-oauth-callback-controller-real-db-e2e.js',
    'package.json registers Step139-X smoke',
  );

  for (const marker of [
    'this.amazonSpApiTokenPersistenceOrchestrator.persistEncryptedTokensSchemaAwareRealWrite',
    'controller-commit-gate-to-schema-aware-orchestrator-real-write',
    'controllerCallsSchemaAwareOrchestratorNow: true',
    'controllerCallsLegacyOrchestratorNow: false',
    'controllerCallsRepositoryDirectlyNow: false',
    'this.prismaService as any',
  ]) {
    assert(controllerSource.includes(marker), `controller contains marker: ${marker}`);
  }

  assert(!controllerSource.includes('this.amazonSpApiTokenPersistenceOrchestrator.persistEncryptedTokensRealWrite'), 'controller legacy orchestrator call removed');
  assert(!controllerSource.includes('AmazonSpApiCredentialRepository'), 'controller does not directly reference repository');
  assert(!controllerSource.includes('mockedControllerPrismaDelegate'), 'controller mocked legacy delegate removed');

  assert(orchestratorSource.includes('persistEncryptedTokensSchemaAwareRealWrite'), 'orchestrator schema-aware method exists');
  assert(repositorySource.includes('upsertEncryptedCredentialSchemaAwareRealWrite'), 'repository schema-aware method exists');

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

  const controllerExports = loadTsModule(files.controller, {
    './amazon-sp-api-token-persistence.orchestrator': orchestratorExports,
    '../prisma.service': prismaExports,
  });

  const OrchestratorClass = orchestratorExports.AmazonSpApiTokenPersistenceOrchestrator;
  const ControllerClass = controllerExports.ImportsController;

  assert(typeof OrchestratorClass === 'function', 'orchestrator class loaded');
  assert(typeof ControllerClass === 'function', 'controller class loaded');

  const prisma = new PrismaService();

  try {
    if (typeof prisma.$connect === 'function') await prisma.$connect();

    assert(prisma.company, 'prisma.company delegate exists');
    assert(prisma.store, 'prisma.store delegate exists');
    assert(prisma.amazonSpApiConnection, 'prisma.amazonSpApiConnection delegate exists');
    assert(prisma.amazonSpApiCredential, 'prisma.amazonSpApiCredential delegate exists');
    assert(prisma.amazonSpApiAccessTokenCache, 'prisma.amazonSpApiAccessTokenCache delegate exists');

    const suffix = `${Date.now()}`;
    const scoped = {
      companyId: `step139-x-company-${suffix}`,
      storeId: `step139-x-store-${suffix}`,
      marketplaceId: 'A1VC38T7YXB528',
      region: 'JP',
    };

    const noCacheSuffix = `${suffix}-nocache`;
    const noCacheScoped = {
      companyId: `step139-x-company-${noCacheSuffix}`,
      storeId: `step139-x-store-${noCacheSuffix}`,
      marketplaceId: 'A1VC38T7YXB528',
      region: 'JP',
    };

    await cleanup(prisma, scoped);
    await cleanup(prisma, noCacheScoped);

    setCommitEnv(`step139-x-idempotency-${suffix}`);

    const controller = new ControllerClass(
      {},
      buildBridgeService(suffix),
      {},
      buildFakeTokenExchangeService(suffix),
      {},
      {},
      {},
      buildCommitGateService(),
      new OrchestratorClass(),
      prisma,
    );

    const firstResult = await invokeController(controller, suffix);

    if (!firstResult.accepted) {
      console.error('[DEBUG] first controller E2E rejected:', JSON.stringify(firstResult, null, 2));
    }

    assertNoSecret(firstResult, 'first controller E2E result');
    assertEqual(firstResult.accepted, true, 'first controller E2E accepted');
    assertEqual(firstResult.status, 'token_persistence_committed', 'first status');
    assertEqual(firstResult.source, 'amazon-sp-api-oauth-callback-controller-schema-aware-real-write', 'first source');
    assertEqual(firstResult.wiringMode, 'controller-commit-gate-to-schema-aware-orchestrator-real-write', 'first wiring mode');
    assertEqual(firstResult.controllerCallsSchemaAwareOrchestratorNow, true, 'first schema-aware orchestrator flag');
    assertEqual(firstResult.controllerCallsLegacyOrchestratorNow, false, 'first legacy flag false');
    assertEqual(firstResult.controllerCallsRepositoryDirectlyNow, false, 'first no direct repository');
    assertEqual(firstResult.tokenPersistenceDatabaseWriteNow, true, 'first token DB write flag');
    assertEqual(firstResult.databaseWriteNow, true, 'first DB write flag');
    assertEqual(firstResult.prismaClientWriteNow, true, 'first Prisma write flag');
    assertEqual(firstResult.connectionWriteNow, true, 'first connection write');
    assertEqual(firstResult.credentialWriteNow, true, 'first credential write');
    assertEqual(firstResult.accessTokenCacheWriteNow, true, 'first cache write');
    assertEqual(firstResult.amazonNetworkCallNow, false, 'first no Amazon network call');
    assertEqual(firstResult.realSpApiRequestNow, false, 'first no real SP-API call');
    assertEqual(firstResult.rawAuthorizationCodeReturnedNow, false, 'first no raw auth code');
    assertEqual(firstResult.rawAccessTokenReturnedNow, false, 'first no raw access token');
    assertEqual(firstResult.rawRefreshTokenReturnedNow, false, 'first no raw refresh token');
    assert(firstResult.persistedConnectionShape, 'first result has connection shape');
    assert(firstResult.persistedCredentialShape, 'first result has credential shape');
    assert(firstResult.persistedAccessTokenCacheShape, 'first result has cache shape');

    const connection = await prisma.amazonSpApiConnection.findUnique({
      where: { companyId_storeId_marketplaceId_region: scoped },
      include: {
        credential: true,
        accessTokenCache: true,
      },
    });

    assert(connection, 'connection row can be read after controller E2E');
    assert(connection.credential, 'credential row can be read after controller E2E');
    assert(connection.accessTokenCache, 'access token cache row can be read after controller E2E');
    assertEqual(connection.companyId, scoped.companyId, 'connection company id');
    assertEqual(connection.storeId, scoped.storeId, 'connection store id');
    assertEqual(connection.marketplaceId, scoped.marketplaceId, 'connection marketplace id');
    assertEqual(connection.region, scoped.region, 'connection region');
    assertEqual(connection.sellingPartnerId, `SELLERSTEP139X${suffix}`, 'connection seller id');
    assertEqual(connection.status, 'CONNECTED', 'connection status connected');
    assertEqual(connection.credential.encryptedRefreshToken, `encrypted-refresh-step139-x-${suffix}`, 'encrypted refresh token stored');
    assertEqual(connection.accessTokenCache.encryptedAccessToken, `encrypted-access-step139-x-${suffix}`, 'encrypted access token cache stored');
    assertEqual(connection.credential.tokenVersion, 1, 'credential token version first');
    assertNoSecret(connection, 'first DB rows');

    const secondController = new ControllerClass(
      {},
      buildBridgeService(suffix, {
        refreshSuffix: '-updated',
        accessSuffix: '-updated',
        keySuffix: '-updated',
        tokenVersion: 2,
      }),
      {},
      buildFakeTokenExchangeService(suffix),
      {},
      {},
      {},
      buildCommitGateService(),
      new OrchestratorClass(),
      prisma,
    );

    const secondResult = await invokeController(secondController, suffix);

    if (!secondResult.accepted) {
      console.error('[DEBUG] second controller E2E rejected:', JSON.stringify(secondResult, null, 2));
    }

    assertNoSecret(secondResult, 'second controller E2E result');
    assertEqual(secondResult.accepted, true, 'second controller E2E accepted');
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

    assert(updatedConnection, 'updated connection row can be read');
    assert(updatedConnection.credential, 'updated credential row can be read');
    assert(updatedConnection.accessTokenCache, 'updated cache row can be read');
    assertEqual(updatedConnection.id, connection.id, 'connection id unchanged on second upsert');
    assertEqual(updatedConnection.credential.id, connection.credential.id, 'credential id unchanged on second upsert');
    assertEqual(updatedConnection.accessTokenCache.id, connection.accessTokenCache.id, 'cache id unchanged on second upsert');
    assertEqual(updatedConnection.credential.encryptedRefreshToken, `encrypted-refresh-step139-x-${suffix}-updated`, 'refresh token updated');
    assertEqual(updatedConnection.accessTokenCache.encryptedAccessToken, `encrypted-access-step139-x-${suffix}-updated`, 'access token cache updated');
    assertEqual(updatedConnection.credential.encryptionKeyId, 'kms-step139-x-updated', 'encryption key updated');
    assertEqual(updatedConnection.credential.tokenVersion, 2, 'credential token version updated');

    const noCacheController = new ControllerClass(
      {},
      buildBridgeService(noCacheSuffix, { noAccessTokenCache: true }),
      {},
      buildFakeTokenExchangeService(noCacheSuffix, { noAccessTokenCache: true }),
      {},
      {},
      {},
      buildCommitGateService(),
      new OrchestratorClass(),
      prisma,
    );

    setCommitEnv(`step139-x-idempotency-${noCacheSuffix}`);
    const noCacheResult = await invokeController(noCacheController, noCacheSuffix);

    if (!noCacheResult.accepted) {
      console.error('[DEBUG] no-cache controller E2E rejected:', JSON.stringify(noCacheResult, null, 2));
    }

    assertNoSecret(noCacheResult, 'no-cache controller E2E result');
    assertEqual(noCacheResult.accepted, true, 'no-cache controller E2E accepted');
    assertEqual(noCacheResult.accessTokenCacheWriteNow, false, 'no-cache access token cache flag false');
    assertEqual(noCacheResult.persistedAccessTokenCacheShape, null, 'no-cache result cache shape null');

    const noCacheConnection = await prisma.amazonSpApiConnection.findUnique({
      where: { companyId_storeId_marketplaceId_region: noCacheScoped },
      include: {
        credential: true,
        accessTokenCache: true,
      },
    });

    assert(noCacheConnection, 'no-cache connection row can be read');
    assert(noCacheConnection.credential, 'no-cache credential row can be read');
    assertEqual(noCacheConnection.accessTokenCache, null, 'no-cache access token cache row absent');

    if (process.env.STEP139_X_KEEP_DB_ROWS !== 'true') {
      await cleanup(prisma, scoped);
      await cleanup(prisma, noCacheScoped);
      console.log('[OK] cleaned Step139-X temporary rows');
    } else {
      console.log('[WARN] STEP139_X_KEEP_DB_ROWS=true, temporary rows kept for inspection');
      console.log('[WARN] kept scoped rows:', JSON.stringify({ scoped, noCacheScoped }, null, 2));
    }

    clearCommitEnv();

    console.log('========== Step139-X OAuth callback controller-level real DB E2E smoke passed ==========');
  } catch (error) {
    clearCommitEnv();
    console.error('[ERROR] Step139-X controller-level real DB E2E smoke failed.');
    console.error('[HINT] Ensure DATABASE_URL is configured, Prisma client is generated, migrations are applied, and local PostgreSQL is reachable.');
    throw error;
  } finally {
    if (typeof prisma.$disconnect === 'function') await prisma.$disconnect();
  }
})().catch((error) => {
  clearCommitEnv();
  console.error(error);
  process.exit(1);
});
