const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '../../..');
const apiRoot = path.join(root, 'apps/api');

const files = {
  packageJson: path.join(apiRoot, 'package.json'),
  repository: path.join(apiRoot, 'src/imports/amazon-sp-api-credential.repository.ts'),
  schema: path.join(apiRoot, 'prisma/schema.prisma'),
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

function loadRepositoryClass() {
  const ts = require(path.join(apiRoot, 'node_modules/typescript'));
  const source = read(files.repository);
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      experimentalDecorators: true,
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
      Promise,
    },
    { filename: files.repository.replace(/\.ts$/, '.js') },
  );

  return module.exports.AmazonSpApiCredentialRepository;
}

function buildInput(patch = {}) {
  return {
    companyId: 'company-step139-v3',
    storeId: 'store-step139-v3',
    marketplaceId: 'A1VC38T7YXB528',
    region: 'JP',
    sellingPartnerId: 'SELLINGPARTNERSTEP139V3',
    encryptedRefreshToken: 'ENCRYPTED_REFRESH_TOKEN_ONLY',
    encryptedAccessTokenCache: 'ENCRYPTED_ACCESS_TOKEN_ONLY',
    accessTokenExpiresAt: new Date(Date.now() + 3600_000),
    refreshTokenFingerprint: 'refresh-fingerprint-v3',
    accessTokenFingerprint: 'access-fingerprint-v3',
    encryptionKeyId: 'kms-step139-v3',
    encryptionAlgorithm: 'envelope-v1',
    tokenVersion: 1,
    status: 'active',
    lastValidatedAt: new Date(),
    revokedAt: null,
    ...patch,
  };
}

function makePrismaMock({ failConnection = false } = {}) {
  const calls = {
    company: [],
    store: [],
    connection: [],
    credential: [],
    accessTokenCache: [],
  };

  const db = {
    company: new Map(),
    store: new Map(),
    connection: new Map(),
    credential: new Map(),
    accessTokenCache: new Map(),
  };

  const prisma = {
    company: {
      upsert: async (args) => {
        calls.company.push(args);
        const row = { ...(db.company.get(args.where.id) || {}), ...args.create, ...args.update };
        db.company.set(args.where.id, row);
        return row;
      },
    },
    store: {
      upsert: async (args) => {
        calls.store.push(args);
        const row = { ...(db.store.get(args.where.id) || {}), ...args.create, ...args.update };
        db.store.set(args.where.id, row);
        return row;
      },
    },
    amazonSpApiConnection: {
      upsert: async (args) => {
        calls.connection.push(args);
        if (failConnection) throw new Error('connection upsert failed');
        const scoped = args.where.companyId_storeId_marketplaceId_region;
        const key = [scoped.companyId, scoped.storeId, scoped.marketplaceId, scoped.region].join('|');
        const existing = db.connection.get(key);
        const row = {
          id: existing?.id || 'connection-step139-v3',
          ...(existing || {}),
          ...(existing ? args.update : args.create),
          connectedAt: args.update.connectedAt || args.create.connectedAt || new Date(),
        };
        db.connection.set(key, row);
        return row;
      },
    },
    amazonSpApiCredential: {
      upsert: async (args) => {
        calls.credential.push(args);
        const key = args.where.connectionId;
        const existing = db.credential.get(key);
        const row = {
          id: existing?.id || 'credential-step139-v3',
          ...(existing || {}),
          ...(existing ? args.update : args.create),
          rotatedAt: args.update.rotatedAt || args.create.rotatedAt || new Date(),
        };
        db.credential.set(key, row);
        return row;
      },
    },
    amazonSpApiAccessTokenCache: {
      upsert: async (args) => {
        calls.accessTokenCache.push(args);
        const key = args.where.connectionId;
        const existing = db.accessTokenCache.get(key);
        const row = {
          id: existing?.id || 'access-token-cache-step139-v3',
          ...(existing || {}),
          ...(existing ? args.update : args.create),
        };
        db.accessTokenCache.set(key, row);
        return row;
      },
    },
  };

  return { prisma, calls, db };
}

(async () => {
  console.log('========== Step139-V3 schema-aware repository real-write implementation smoke ==========');

  const pkg = JSON.parse(read(files.packageJson));
  const repositorySource = read(files.repository);
  const schema = read(files.schema);

  assert(
    pkg.scripts &&
      pkg.scripts['smoke:amazon-sp-api-credential-repository-schema-aware-real-write-implementation'] ===
        'node scripts/smoke-amazon-sp-api-credential-repository-schema-aware-real-write-implementation.js',
    'package.json registers Step139-V3 smoke',
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
    'upsertEncryptedCredentialSchemaAwareRealWrite',
    "source: 'amazon-sp-api-credential-repository-schema-aware-real-write'",
    "repositoryMode: 'schema-aware-prisma-real-write'",
    "operation: 'upsertEncryptedCredentialSchemaAwareRealWrite'",
    'amazonSpApiConnection.upsert',
    'amazonSpApiCredential.upsert',
    'amazonSpApiAccessTokenCache.upsert',
    'plaintextTokenDatabaseWriteNow: false',
    'rawTokenReturnedNow: false',
    'rawLwaResponseReturnedNow: false',
    'rawAuthorizationCodeReturnedNow: false',
  ]) {
    assert(repositorySource.includes(marker), `repository contains marker: ${marker}`);
  }

  for (const forbidden of [
    'fetch(',
    'axios',
    'rawTokenReturnedNow: true',
    'rawLwaResponseReturnedNow: true',
    'rawAuthorizationCodeReturnedNow: true',
    'plaintextTokenDatabaseWriteNow: true',
  ]) {
    assert(!repositorySource.includes(forbidden), `repository does not contain forbidden marker: ${forbidden}`);
  }

  const RepositoryClass = loadRepositoryClass();
  const repository = new RepositoryClass();

  {
    const result = await repository.upsertEncryptedCredentialSchemaAwareRealWrite(
      buildInput(),
      null,
    );

    assertNoSecret(result, 'missing prisma result');
    assertEqual(result.accepted, false, 'missing prisma rejected');
    assertEqual(result.reason, 'missing_prisma_client', 'missing prisma reason');
    assertEqual(result.connectionWriteNow, false, 'missing prisma no connection write');
    assertEqual(result.credentialWriteNow, false, 'missing prisma no credential write');
    assertEqual(result.accessTokenCacheWriteNow, false, 'missing prisma no access token write');
  }

  {
    const { prisma, calls } = makePrismaMock();
    const result = await repository.upsertEncryptedCredentialSchemaAwareRealWrite(
      buildInput(),
      prisma,
    );

    assertNoSecret(result, 'success result');
    assertEqual(result.accepted, true, 'success accepted');
    assertEqual(result.reason, 'ready', 'success reason');
    assertEqual(result.source, 'amazon-sp-api-credential-repository-schema-aware-real-write', 'success source');
    assertEqual(result.repositoryMode, 'schema-aware-prisma-real-write', 'success mode');
    assertEqual(result.operation, 'upsertEncryptedCredentialSchemaAwareRealWrite', 'success operation');
    assertEqual(result.connectionWriteNow, true, 'success connection write');
    assertEqual(result.credentialWriteNow, true, 'success credential write');
    assertEqual(result.accessTokenCacheWriteNow, true, 'success access token cache write');
    assertEqual(result.tokenPersistenceDatabaseWriteNow, true, 'success token DB write');
    assertEqual(result.databaseWriteNow, true, 'success DB write');
    assertEqual(result.prismaClientWriteNow, true, 'success Prisma write');
    assertEqual(result.plaintextTokenDatabaseWriteNow, false, 'success no plaintext token');
    assertEqual(result.rawTokenReturnedNow, false, 'success no raw token');
    assertEqual(result.rawLwaResponseReturnedNow, false, 'success no raw LWA response');
    assertEqual(result.rawAuthorizationCodeReturnedNow, false, 'success no raw auth code');

    assertEqual(calls.company.length, 1, 'company upsert once');
    assertEqual(calls.store.length, 1, 'store upsert once');
    assertEqual(calls.connection.length, 1, 'connection upsert once');
    assertEqual(calls.credential.length, 1, 'credential upsert once');
    assertEqual(calls.accessTokenCache.length, 1, 'access token cache upsert once');

    assertEqual(
      calls.connection[0].where.companyId_storeId_marketplaceId_region.companyId,
      'company-step139-v3',
      'connection scoped company',
    );
    assertEqual(calls.credential[0].where.connectionId, 'connection-step139-v3', 'credential by connectionId');
    assertEqual(calls.accessTokenCache[0].where.connectionId, 'connection-step139-v3', 'cache by connectionId');
  }

  {
    const { prisma, calls } = makePrismaMock();
    const result = await repository.upsertEncryptedCredentialSchemaAwareRealWrite(
      buildInput({ encryptedAccessTokenCache: null }),
      prisma,
    );

    assertEqual(result.accepted, true, 'success without access token cache accepted');
    assertEqual(result.accessTokenCacheWriteNow, false, 'no access token cache write flag');
    assertEqual(calls.accessTokenCache.length, 0, 'access token cache not upserted when absent');
  }

  {
    const { prisma } = makePrismaMock({ failConnection: true });
    const result = await repository.upsertEncryptedCredentialSchemaAwareRealWrite(
      buildInput(),
      prisma,
    );

    assertNoSecret(result, 'exception result');
    assertEqual(result.accepted, false, 'exception rejected');
    assertEqual(result.reason, 'prisma_schema_aware_write_exception', 'exception reason');
  }

  {
    const { prisma } = makePrismaMock();
    const result = await repository.upsertEncryptedCredentialSchemaAwareRealWrite(
      buildInput({ plaintextAccessToken: 'PLAINTEXT_ACCESS_TOKEN' }),
      prisma,
    );

    assertNoSecret(result, 'unsafe field result');
    assertEqual(result.accepted, false, 'unsafe field rejected');
    assertEqual(result.reason, 'plaintext_token_field_rejected', 'unsafe field reason');
    assertEqual(result.connectionWriteNow, false, 'unsafe field no connection write');
  }

  console.log('========== Step139-V3 schema-aware repository real-write implementation smoke passed ==========');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
