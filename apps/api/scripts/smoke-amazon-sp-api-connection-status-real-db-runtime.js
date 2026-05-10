const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '../../..');
const apiRoot = path.join(root, 'apps/api');

const files = {
  packageJson: path.join(apiRoot, 'package.json'),
  controller: path.join(apiRoot, 'src/imports/imports.controller.ts'),
  repository: path.join(apiRoot, 'src/imports/amazon-sp-api-token-persistence.repository.ts'),
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
  assert(
    actual === expected,
    `${message}: expected=${JSON.stringify(expected)} actual=${JSON.stringify(actual)}`,
  );
}

function assertNoSecret(value, label) {
  const serialized = JSON.stringify(value);
  // Do not ban safe boolean audit flag field names such as:
  // rawAuthorizationCodeReturnedNow / rawAccessTokenReturnedNow /
  // encryptedRefreshTokenReturnedNow / encryptedAccessTokenReturnedNow.
  // These are expected to exist and are asserted separately to be false.
  // Only ban actual secret sentinel values here.
  for (const secret of [
    'encrypted-refresh-secret',
    'encrypted-access-secret',
    'AUTHORIZATION_CODE_SECRET',
    'RAW_LWA_RESPONSE_SECRET',
    'PLAINTEXT_ACCESS_TOKEN',
    'PLAINTEXT_REFRESH_TOKEN',
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

        if (request === '@prisma/client') {
          return require(path.join(apiRoot, 'node_modules/@prisma/client'));
        }

        if (request === '../auth/jwt.guard') return { JwtAuthGuard: class JwtAuthGuard {} };

        if (request.startsWith('./') || request.startsWith('../')) {
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
    { filename: file.replace(/\.ts$/, '.js') },
  );

  return module.exports;
}

async function cleanup(prisma, scoped) {
  const connection = await prisma.amazonSpApiConnection.findUnique({
    where: {
      companyId_storeId_marketplaceId_region: {
        companyId: scoped.companyId,
        storeId: scoped.storeId,
        marketplaceId: scoped.marketplaceId,
        region: scoped.region,
      },
    },
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

async function ensureCompanyStore(prisma, scoped) {
  await prisma.company.upsert({
    where: { id: scoped.companyId },
    create: {
      id: scoped.companyId,
      name: `Step139-Y3 Company ${scoped.companyId}`,
    },
    update: {
      name: `Step139-Y3 Company ${scoped.companyId}`,
    },
  });

  await prisma.store.upsert({
    where: { id: scoped.storeId },
    create: {
      id: scoped.storeId,
      companyId: scoped.companyId,
      name: `Step139-Y3 Store ${scoped.storeId}`,
      platform: 'AMAZON',
      region: scoped.region,
    },
    update: {
      name: `Step139-Y3 Store ${scoped.storeId}`,
      platform: 'AMAZON',
      region: scoped.region,
    },
  });
}

async function seedConnection(prisma, scoped, options = {}) {
  await ensureCompanyStore(prisma, scoped);

  const now = new Date();
  const connection = await prisma.amazonSpApiConnection.create({
    data: {
      companyId: scoped.companyId,
      storeId: scoped.storeId,
      marketplaceId: scoped.marketplaceId,
      region: scoped.region,
      sellingPartnerId: options.sellingPartnerId || `SELLERSTEP139Y3${scoped.suffix || ''}`,
      appId: 'amzn1.application-oa2-client.step139-y3',
      status: options.status || 'CONNECTED',
      connectedAt: options.connectedAt === undefined ? now : options.connectedAt,
      revokedAt: options.revokedAt || null,
      lastTokenRefreshAt: options.lastTokenRefreshAt || null,
      lastHealthCheckAt: options.lastHealthCheckAt || null,
      lastSyncAt: options.lastSyncAt || null,
      lastErrorCode: options.lastErrorCode || null,
      lastErrorMessageRedacted: options.lastErrorMessageRedacted || null,
    },
  });

  if (options.withCredential !== false) {
    await prisma.amazonSpApiCredential.create({
      data: {
        connectionId: connection.id,
        encryptedRefreshToken: `encrypted-refresh-secret-${scoped.suffix}`,
        encryptionKeyId: 'kms-step139-y3',
        encryptionAlgorithm: 'envelope-v1',
        tokenVersion: 1,
        rotatedAt: options.credentialRotatedAt || now,
        revokedAt: options.credentialRevokedAt || null,
      },
    });
  }

  if (options.withCache === true) {
    await prisma.amazonSpApiAccessTokenCache.create({
      data: {
        connectionId: connection.id,
        encryptedAccessToken: `encrypted-access-secret-${scoped.suffix}`,
        tokenType: 'bearer',
        scope: options.scope || 'sellingpartnerapi::notifications',
        expiresAt: options.accessTokenExpiresAt || new Date(Date.now() + 3600_000),
      },
    });
  }

  return connection;
}

async function callStatus(controller, scoped) {
  return controller.amazonSpApiConnectionStatusBackendEndpoint(
    {
      user: {
        companyId: scoped.companyId,
      },
    },
    scoped.storeId,
    scoped.marketplaceId,
    scoped.region,
  );
}

function assertBaseReadOnlyFlags(result, label) {
  assertEqual(result.source, 'amazon-sp-api-connection-status', `${label} source`);
  assertEqual(result.routeImplementedNow, true, `${label} route flag`);
  assertEqual(result.readModelMode, 'real-db-connection-credential-cache', `${label} read model mode`);
  assertEqual(result.tokenExchangeHttpCallNow, false, `${label} no token exchange HTTP`);
  assertEqual(result.tokenPersistenceDatabaseWriteNow, false, `${label} no token persistence write`);
  assertEqual(result.realSpApiRequestNow, false, `${label} no real SP-API request`);
  assertEqual(result.importJobWriteNow, false, `${label} no ImportJob write`);
  assertEqual(result.transactionWriteNow, false, `${label} no transaction write`);
  assertEqual(result.inventoryWriteNow, false, `${label} no inventory write`);
  assertEqual(result.rawAuthorizationCodeReturnedNow, false, `${label} no raw authorization code`);
  assertEqual(result.rawLwaResponseReturnedNow, false, `${label} no raw LWA response`);
  assertEqual(result.rawAccessTokenReturnedNow, false, `${label} no raw access token`);
  assertEqual(result.rawRefreshTokenReturnedNow, false, `${label} no raw refresh token`);
  assertEqual(result.encryptedRefreshTokenReturnedNow, false, `${label} no encrypted refresh token`);
  assertEqual(result.encryptedAccessTokenReturnedNow, false, `${label} no encrypted access token`);
  assertNoSecret(result, label);
}

(async () => {
  console.log('========== Step139-Y3 Amazon SP-API connection status real DB runtime smoke ==========');

  const pkg = JSON.parse(read(files.packageJson));
  const controllerSource = read(files.controller);
  const repositorySource = read(files.repository);
  const schema = read(files.schema);

  assert(
    pkg.scripts &&
      pkg.scripts['smoke:amazon-sp-api-connection-status-real-db-runtime'] ===
        'node scripts/smoke-amazon-sp-api-connection-status-real-db-runtime.js',
    'package.json registers Step139-Y3 smoke',
  );

  for (const marker of [
    "readModelMode: 'real-db-connection-credential-cache'",
    'credentialPresent',
    'accessTokenCachePresent',
    'accessTokenExpired',
    'accessTokenExpiresAt',
    'credentialRotatedAt',
    'credentialRevokedAt',
  ]) {
    assert(controllerSource.includes(marker), `controller contains marker: ${marker}`);
  }

  for (const marker of [
    'credential: {',
    'accessTokenCache: {',
    'encryptionKeyId: true',
    'tokenVersion: true',
    'expiresAt: true',
  ]) {
    assert(repositorySource.includes(marker), `repository contains marker: ${marker}`);
  }

  for (const marker of [
    'model AmazonSpApiConnection',
    'model AmazonSpApiCredential',
    'model AmazonSpApiAccessTokenCache',
  ]) {
    assert(schema.includes(marker), `schema contains marker: ${marker}`);
  }

  const prismaExports = loadTsModule(files.prismaService);
  const PrismaService = prismaExports.PrismaService;
  assert(typeof PrismaService === 'function', 'PrismaService class loaded');

  const repositoryExports = loadTsModule(files.repository, {
    '../prisma.service': prismaExports,
  });
  const RepositoryClass = repositoryExports.AmazonSpApiTokenPersistenceRepository;
  assert(typeof RepositoryClass === 'function', 'repository class loaded');

  const controllerExports = loadTsModule(files.controller);
  const ControllerClass = controllerExports.ImportsController;
  assert(typeof ControllerClass === 'function', 'controller class loaded');

  const prisma = new PrismaService();

  try {
    if (typeof prisma.$connect === 'function') await prisma.$connect();

    assert(prisma.amazonSpApiConnection, 'prisma.amazonSpApiConnection delegate exists');
    assert(prisma.amazonSpApiCredential, 'prisma.amazonSpApiCredential delegate exists');
    assert(prisma.amazonSpApiAccessTokenCache, 'prisma.amazonSpApiAccessTokenCache delegate exists');

    const suffixBase = `${Date.now()}`;
    const marketplaceId = 'A1VC38T7YXB528';
    const region = 'JP';

    const scopes = {
      none: { suffix: `${suffixBase}-none`, companyId: `step139-y3-company-${suffixBase}-none`, storeId: `step139-y3-store-${suffixBase}-none`, marketplaceId, region },
      connected: { suffix: `${suffixBase}-connected`, companyId: `step139-y3-company-${suffixBase}-connected`, storeId: `step139-y3-store-${suffixBase}-connected`, marketplaceId, region },
      noCache: { suffix: `${suffixBase}-nocache`, companyId: `step139-y3-company-${suffixBase}-nocache`, storeId: `step139-y3-store-${suffixBase}-nocache`, marketplaceId, region },
      noCredential: { suffix: `${suffixBase}-nocredential`, companyId: `step139-y3-company-${suffixBase}-nocredential`, storeId: `step139-y3-store-${suffixBase}-nocredential`, marketplaceId, region },
      credentialRevoked: { suffix: `${suffixBase}-credrevoked`, companyId: `step139-y3-company-${suffixBase}-credrevoked`, storeId: `step139-y3-store-${suffixBase}-credrevoked`, marketplaceId, region },
      connectionRevoked: { suffix: `${suffixBase}-connrevoked`, companyId: `step139-y3-company-${suffixBase}-connrevoked`, storeId: `step139-y3-store-${suffixBase}-connrevoked`, marketplaceId, region },
      error: { suffix: `${suffixBase}-error`, companyId: `step139-y3-company-${suffixBase}-error`, storeId: `step139-y3-store-${suffixBase}-error`, marketplaceId, region },
      expiredCache: { suffix: `${suffixBase}-expiredcache`, companyId: `step139-y3-company-${suffixBase}-expiredcache`, storeId: `step139-y3-store-${suffixBase}-expiredcache`, marketplaceId, region },
    };

    for (const scoped of Object.values(scopes)) {
      await cleanup(prisma, scoped);
    }

    const repository = new RepositoryClass(prisma);
    const tokenPersistenceService = {
      readConnectionStatus: (scope) => repository.readConnectionStatus(scope),
    };

    const controller = new ControllerClass(
      {},
      {},
      {},
      {},
      tokenPersistenceService,
      {},
      {},
      {},
      {},
      prisma,
    );

    const noConnection = await callStatus(controller, scopes.none);
    assertBaseReadOnlyFlags(noConnection, 'no connection');
    assertEqual(noConnection.status, 'NOT_CONNECTED', 'no connection status');
    assertEqual(noConnection.readModelStatus, 'disconnected', 'no connection read model status');
    assertEqual(noConnection.connected, false, 'no connection connected false');
    assertEqual(noConnection.needsReconnect, false, 'no connection needsReconnect false');
    assertEqual(noConnection.credentialPresent, false, 'no connection credential absent');
    assertEqual(noConnection.accessTokenCachePresent, false, 'no connection cache absent');
    assertEqual(noConnection.accessTokenExpired, false, 'no connection cache expired false');

    await seedConnection(prisma, scopes.connected, { withCredential: true, withCache: true });
    const connected = await callStatus(controller, scopes.connected);
    assertBaseReadOnlyFlags(connected, 'connected');
    assertEqual(connected.status, 'CONNECTED', 'connected status');
    assertEqual(connected.readModelStatus, 'connected', 'connected read model status');
    assertEqual(connected.connected, true, 'connected connected true');
    assertEqual(connected.needsReconnect, false, 'connected needsReconnect false');
    assertEqual(connected.credentialPresent, true, 'connected credential present');
    assertEqual(connected.accessTokenCachePresent, true, 'connected cache present');
    assertEqual(connected.accessTokenExpired, false, 'connected cache not expired');
    assert(connected.accessTokenExpiresAt !== null, 'connected access token expires at present');
    assert(connected.credentialRotatedAt !== null, 'connected credential rotated at present');
    assertEqual(connected.credentialRevokedAt, null, 'connected credential revoked at null');

    await seedConnection(prisma, scopes.noCache, { withCredential: true, withCache: false });
    const noCache = await callStatus(controller, scopes.noCache);
    assertBaseReadOnlyFlags(noCache, 'no cache');
    assertEqual(noCache.status, 'CONNECTED', 'no cache still connected');
    assertEqual(noCache.readModelStatus, 'connected', 'no cache read model connected');
    assertEqual(noCache.credentialPresent, true, 'no cache credential present');
    assertEqual(noCache.accessTokenCachePresent, false, 'no cache cache absent');
    assertEqual(noCache.accessTokenExpired, false, 'no cache expired false');
    assertEqual(noCache.accessTokenExpiresAt, null, 'no cache expires at null');

    await seedConnection(prisma, scopes.noCredential, { withCredential: false, withCache: false });
    const noCredential = await callStatus(controller, scopes.noCredential);
    assertBaseReadOnlyFlags(noCredential, 'no credential');
    assertEqual(noCredential.status, 'RECONNECT_REQUIRED', 'no credential reconnect required');
    assertEqual(noCredential.readModelStatus, 'needs_reauth', 'no credential needs reauth');
    assertEqual(noCredential.connected, false, 'no credential connected false');
    assertEqual(noCredential.needsReconnect, true, 'no credential needs reconnect');
    assertEqual(noCredential.credentialPresent, false, 'no credential credential absent');

    await seedConnection(prisma, scopes.credentialRevoked, {
      withCredential: true,
      withCache: true,
      credentialRevokedAt: new Date(),
    });
    const credentialRevoked = await callStatus(controller, scopes.credentialRevoked);
    assertBaseReadOnlyFlags(credentialRevoked, 'credential revoked');
    assertEqual(credentialRevoked.status, 'RECONNECT_REQUIRED', 'credential revoked reconnect required');
    assertEqual(credentialRevoked.readModelStatus, 'needs_reauth', 'credential revoked needs reauth');
    assertEqual(credentialRevoked.credentialPresent, true, 'credential revoked credential present');
    assert(credentialRevoked.credentialRevokedAt !== null, 'credential revoked at present');

    await seedConnection(prisma, scopes.connectionRevoked, {
      withCredential: true,
      withCache: true,
      status: 'REVOKED',
      revokedAt: new Date(),
    });
    const connectionRevoked = await callStatus(controller, scopes.connectionRevoked);
    assertBaseReadOnlyFlags(connectionRevoked, 'connection revoked');
    assertEqual(connectionRevoked.status, 'RECONNECT_REQUIRED', 'connection revoked reconnect required');
    assertEqual(connectionRevoked.readModelStatus, 'needs_reauth', 'connection revoked needs reauth');
    assert(connectionRevoked.revokedAt !== null, 'connection revoked at present');

    await seedConnection(prisma, scopes.error, {
      withCredential: true,
      withCache: true,
      status: 'ERROR',
      lastErrorCode: 'STEP139_Y3_ERROR',
      lastErrorMessageRedacted: 'Redacted error for Step139-Y3',
    });
    const error = await callStatus(controller, scopes.error);
    assertBaseReadOnlyFlags(error, 'error');
    assertEqual(error.status, 'ERROR', 'error status');
    assertEqual(error.readModelStatus, 'error', 'error read model status');
    assertEqual(error.connected, false, 'error connected false');
    assertEqual(error.needsReconnect, true, 'error needs reconnect');
    assertEqual(error.lastErrorCode, 'STEP139_Y3_ERROR', 'error code returned');
    assertEqual(error.lastErrorMessageRedacted, 'Redacted error for Step139-Y3', 'error message redacted returned');

    await seedConnection(prisma, scopes.expiredCache, {
      withCredential: true,
      withCache: true,
      accessTokenExpiresAt: new Date(Date.now() - 3600_000),
    });
    const expiredCache = await callStatus(controller, scopes.expiredCache);
    assertBaseReadOnlyFlags(expiredCache, 'expired cache');
    assertEqual(expiredCache.status, 'CONNECTED', 'expired cache still connected');
    assertEqual(expiredCache.readModelStatus, 'connected', 'expired cache read model connected');
    assertEqual(expiredCache.accessTokenCachePresent, true, 'expired cache cache present');
    assertEqual(expiredCache.accessTokenExpired, true, 'expired cache expired true');

    if (process.env.STEP139_Y3_KEEP_DB_ROWS !== 'true') {
      for (const scoped of Object.values(scopes)) {
        await cleanup(prisma, scoped);
      }
      console.log('[OK] cleaned Step139-Y3 temporary rows');
    } else {
      console.log('[WARN] STEP139_Y3_KEEP_DB_ROWS=true, temporary rows kept for inspection');
      console.log('[WARN] kept scoped rows:', JSON.stringify(scopes, null, 2));
    }

    console.log('========== Step139-Y3 Amazon SP-API connection status real DB runtime smoke passed ==========');
  } catch (error) {
    console.error('[ERROR] Step139-Y3 real DB runtime smoke failed.');
    console.error('[HINT] Ensure DATABASE_URL is configured, Prisma client is generated, migrations are applied, and local PostgreSQL is reachable.');
    throw error;
  } finally {
    if (typeof prisma.$disconnect === 'function') await prisma.$disconnect();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
