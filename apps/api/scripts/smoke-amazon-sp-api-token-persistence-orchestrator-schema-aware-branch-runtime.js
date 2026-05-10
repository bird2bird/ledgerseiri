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
        if (request === './amazon-sp-api-credential.repository') return repositoryMock;
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
    companyId: ' company-step139-v6 ',
    storeId: ' store-step139-v6 ',
    marketplaceId: ' A1VC38T7YXB528 ',
    region: ' JP ',
    sellingPartnerId: ' SELLINGPARTNERSTEP139V6 ',
    transportAccepted: true,
    parserAccepted: true,
    persistenceInputAccepted: true,
    encryptedRefreshToken: ' ENCRYPTED_REFRESH_TOKEN_ONLY ',
    encryptedAccessTokenCache: ' ENCRYPTED_ACCESS_TOKEN_ONLY ',
    accessTokenExpiresAt: new Date(Date.now() + 3600_000),
    refreshTokenFingerprint: ' refresh-fingerprint-v6 ',
    accessTokenFingerprint: ' access-fingerprint-v6 ',
    encryptionKeyId: ' kms-step139-v6 ',
    encryptionAlgorithm: ' envelope-v1 ',
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
          id: 'connection-step139-v6',
          companyId: input.companyId,
          storeId: input.storeId,
          marketplaceId: input.marketplaceId,
          region: input.region,
          status: 'CONNECTED',
          sellingPartnerIdRedacted: 'SELL****',
          connectedAt: new Date().toISOString(),
        },
        persistedCredentialShape: {
          id: 'credential-step139-v6',
          connectionId: 'connection-step139-v6',
          encryptionKeyId: input.encryptionKeyId,
          encryptionAlgorithm: input.encryptionAlgorithm,
          tokenVersion: input.tokenVersion,
          rotatedAt: new Date().toISOString(),
          revokedAt: null,
        },
        persistedAccessTokenCacheShape: input.encryptedAccessTokenCache
          ? {
              id: 'cache-step139-v6',
              connectionId: 'connection-step139-v6',
              expiresAt: new Date(Date.now() + 3600_000).toISOString(),
            }
          : null,
      };
    }

    async upsertEncryptedCredentialRealWrite(input, prismaDelegate) {
      calls.legacy.push({ input, prismaDelegate });
      return { accepted: false, reason: 'legacy_should_not_be_called' };
    }
  }

  return { repositoryModule: { AmazonSpApiCredentialRepository }, calls };
}

function makeOrchestrator(repositoryOptions) {
  const { repositoryModule, calls } = makeRepository(repositoryOptions);
  const OrchestratorClass = loadOrchestratorClass(repositoryModule);
  return { orchestrator: new OrchestratorClass(), calls };
}

async function expectReject(label, patch, expectedReason, options = {}) {
  const { orchestrator, calls } = makeOrchestrator(options.repositoryOptions);
  const result = await orchestrator.persistEncryptedTokensSchemaAwareRealWrite(
    buildInput(patch),
    options.prismaClient === undefined ? { schemaAware: true } : options.prismaClient,
  );

  assertNoSecret(result, label);
  assertEqual(result.accepted, false, `${label} rejected`);
  assertEqual(result.reason, expectedReason, `${label} reason`);
  assertEqual(result.source, 'amazon-sp-api-token-persistence-orchestrator-schema-aware-real-write', `${label} source`);
  assertEqual(result.orchestratorMode, 'repository-schema-aware-real-write-wiring', `${label} mode`);
  assertEqual(result.plaintextTokenDatabaseWriteNow, false, `${label} no plaintext token`);
  assertEqual(result.rawTokenReturnedNow, false, `${label} no raw token`);
  assertEqual(result.rawLwaResponseReturnedNow, false, `${label} no raw LWA response`);
  assertEqual(result.rawAccessTokenReturnedNow, false, `${label} no raw access token`);
  assertEqual(result.rawRefreshTokenReturnedNow, false, `${label} no raw refresh token`);
  assertEqual(result.rawAuthorizationCodeReturnedNow, false, `${label} no raw auth code`);

  if (options.expectRepositoryCall) {
    assertEqual(calls.schemaAware.length, 1, `${label} schema-aware repository called once`);
  } else {
    assertEqual(calls.schemaAware.length, 0, `${label} no schema-aware repository call`);
  }
  assertEqual(calls.legacy.length, 0, `${label} no legacy repository call`);

  return result;
}

async function expectSuccess(label, patch = {}) {
  const { orchestrator, calls } = makeOrchestrator();
  const result = await orchestrator.persistEncryptedTokensSchemaAwareRealWrite(
    buildInput(patch),
    { schemaAware: true },
  );

  assertNoSecret(result, label);
  assertEqual(result.accepted, true, `${label} accepted`);
  assertEqual(result.reason, 'ready', `${label} reason`);
  assertEqual(result.repositoryMethodCalled, 'upsertEncryptedCredentialSchemaAwareRealWrite', `${label} repository method`);
  assertEqual(result.repositoryAccepted, true, `${label} repository accepted`);
  assertEqual(result.connectionWriteNow, true, `${label} connection write`);
  assertEqual(result.credentialWriteNow, true, `${label} credential write`);
  assertEqual(result.accessTokenCacheWriteNow, Boolean(patch.encryptedAccessTokenCache !== null), `${label} access token cache write`);
  assertEqual(result.tokenPersistenceDatabaseWriteNow, true, `${label} token DB write`);
  assertEqual(result.databaseWriteNow, true, `${label} DB write`);
  assertEqual(result.prismaClientWriteNow, true, `${label} Prisma write`);
  assertEqual(result.plaintextTokenDatabaseWriteNow, false, `${label} no plaintext token`);
  assertEqual(result.amazonNetworkCallNow, false, `${label} no Amazon call`);
  assertEqual(result.rawAccessTokenReturnedNow, false, `${label} no raw access token`);
  assertEqual(result.rawRefreshTokenReturnedNow, false, `${label} no raw refresh token`);
  assertEqual(result.rawAuthorizationCodeReturnedNow, false, `${label} no raw auth code`);
  assertEqual(result.rawLwaResponseReturnedNow, false, `${label} no raw LWA response`);
  assertEqual(calls.schemaAware.length, 1, `${label} schema-aware repository called once`);
  assertEqual(calls.legacy.length, 0, `${label} legacy repository not called`);

  return result;
}

(async () => {
  console.log('========== Step139-V6 schema-aware orchestrator branch runtime smoke ==========');

  const pkg = JSON.parse(read(files.packageJson));
  const orchestratorSource = read(files.orchestrator);
  const repositorySource = read(files.repository);

  assert(
    pkg.scripts &&
      pkg.scripts['smoke:amazon-sp-api-token-persistence-orchestrator-schema-aware-branch-runtime'] ===
        'node scripts/smoke-amazon-sp-api-token-persistence-orchestrator-schema-aware-branch-runtime.js',
    'package.json registers Step139-V6 smoke',
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

  await expectReject('transport rejected', { transportAccepted: false }, 'transport_not_accepted');
  await expectReject('parser rejected', { parserAccepted: false }, 'parser_not_accepted');
  await expectReject('persistence input rejected', { persistenceInputAccepted: false }, 'persistence_input_not_accepted');

  await expectReject('missing company', { companyId: '   ' }, 'missing_company_id');
  await expectReject('missing store', { storeId: '   ' }, 'missing_store_id');
  await expectReject('missing marketplace', { marketplaceId: '   ' }, 'missing_marketplace_id');
  await expectReject('missing region', { region: '   ' }, 'missing_region');
  await expectReject('missing seller', { sellingPartnerId: '   ' }, 'missing_selling_partner_id');
  await expectReject('missing encrypted refresh token', { encryptedRefreshToken: '   ' }, 'missing_encrypted_refresh_token');
  await expectReject('missing refresh fingerprint', { refreshTokenFingerprint: '   ' }, 'missing_refresh_token_fingerprint');
  await expectReject('missing encryption key', { encryptionKeyId: '   ' }, 'missing_encryption_key_id');
  await expectReject('missing encryption algorithm', { encryptionAlgorithm: '   ' }, 'missing_encryption_algorithm');
  await expectReject('invalid token version zero', { tokenVersion: 0 }, 'invalid_token_version');
  await expectReject('invalid token version non-number', { tokenVersion: Number.NaN }, 'invalid_token_version');
  await expectReject('invalid status', { status: 'connected' }, 'invalid_status');

  await expectReject('plaintext access token rejected', { plaintextAccessToken: 'PLAINTEXT_ACCESS_TOKEN' }, 'plaintext_token_field_rejected');
  await expectReject('plaintext refresh token rejected', { plaintextRefreshToken: 'PLAINTEXT_REFRESH_TOKEN' }, 'plaintext_token_field_rejected');
  await expectReject('raw LWA response rejected', { rawLwaResponse: 'RAW_LWA_RESPONSE_SECRET' }, 'raw_lwa_response_rejected');
  await expectReject('raw authorization code rejected', { rawAuthorizationCode: 'AUTHORIZATION_CODE_SECRET' }, 'raw_authorization_code_rejected');
  await expectReject('raw client secret rejected', { rawClientSecret: 'CLIENT_SECRET_VALUE' }, 'raw_client_secret_rejected');

  await expectReject('missing schema-aware prisma client', {}, 'missing_schema_aware_prisma_client', {
    prismaClient: null,
  });

  await expectReject('repository rejected maps to generic repository rejection', {}, 'repository_schema_aware_real_write_rejected', {
    expectRepositoryCall: true,
    repositoryOptions: { accepted: false, reason: 'missing_schema_aware_delegate' },
  });

  await expectReject('repository prisma exception maps through', {}, 'prisma_schema_aware_write_exception', {
    expectRepositoryCall: true,
    repositoryOptions: { accepted: false, reason: 'prisma_schema_aware_write_exception' },
  });

  await expectSuccess('success with access token cache');
  const withoutCache = await expectSuccess('success without access token cache', { encryptedAccessTokenCache: null });
  assertEqual(withoutCache.persistedAccessTokenCacheShape, null, 'success without cache has null cache shape');

  await expectSuccess('success trims required inputs', {
    companyId: '  company-trimmed-v6  ',
    storeId: '  store-trimmed-v6  ',
    marketplaceId: '  A1VC38T7YXB528  ',
    region: '  JP  ',
    sellingPartnerId: '  SELLERTRIMMEDV6  ',
    encryptedRefreshToken: '  ENCRYPTED_REFRESH_TRIMMED  ',
    refreshTokenFingerprint: '  refresh-fingerprint-trimmed  ',
    encryptionKeyId: '  kms-trimmed  ',
    encryptionAlgorithm: '  envelope-trimmed  ',
  });

  console.log('========== Step139-V6 schema-aware orchestrator branch runtime smoke passed ==========');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
