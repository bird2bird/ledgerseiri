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

function setCommitEnv() {
  process.env.AMAZON_SP_API_OAUTH_CALLBACK_COMMIT_ENABLED = 'true';
  process.env.AMAZON_SP_API_OAUTH_CALLBACK_OPERATOR_CONFIRMED = 'true';
  process.env.AMAZON_SP_API_OAUTH_CALLBACK_COMPANY_STORE_ALLOWLISTED = 'true';
  process.env.AMAZON_SP_API_OAUTH_CALLBACK_PERSISTENCE_ENABLED = 'true';
  process.env.AMAZON_SP_API_OAUTH_CALLBACK_TRUSTED_STATE_SIGNATURE_VALID = 'true';
  process.env.AMAZON_SP_API_OAUTH_CALLBACK_TRUSTED_STATE_EXPIRED = 'false';
  process.env.AMAZON_SP_API_OAUTH_CALLBACK_REAL_LWA_GATE_ACCEPTED = 'true';
  process.env.AMAZON_SP_API_OAUTH_CALLBACK_IDEMPOTENCY_KEY = 'step139-v9-idempotency';
}

function loadControllerClass() {
  const ts = require(path.join(apiRoot, 'node_modules/typescript'));
  const source = read(files.controller);
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      experimentalDecorators: true,
      emitDecoratorMetadata: false,
    },
    fileName: files.controller,
  }).outputText;

  const module = { exports: {} };

  vm.runInNewContext(
    output,
    {
      require: (request) => {
        if (request === '@nestjs/common') {
          return {
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
          };
        }

        if (request === '../auth/jwt.guard') return { JwtAuthGuard: class JwtAuthGuard {} };
        if (request === '../prisma.service') return { PrismaService: class PrismaService {} };

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
      __dirname: path.dirname(files.controller),
      __filename: files.controller,
      console,
      Date,
      Number,
      Object,
      String,
      JSON,
      process,
      Promise,
    },
    { filename: files.controller.replace(/\.ts$/, '.js') },
  );

  return module.exports.ImportsController;
}

function makeController() {
  const calls = {
    gate: [],
    schemaAware: [],
    legacy: [],
  };

  const bridgeService = {
    buildPersistencePlan: () => ({
      accepted: true,
      reason: 'ready',
      messageRedacted: 'Persistence input accepted.',
      refreshCredentialInput: {
        encryptedRefreshToken: 'ENCRYPTED_REFRESH_TOKEN_ONLY',
        encryptionKeyId: 'kms-step139-v9',
        encryptionAlgorithm: 'envelope-v1',
        tokenVersion: 1,
      },
      accessTokenCacheInput: {
        encryptedAccessToken: 'ENCRYPTED_ACCESS_TOKEN_ONLY',
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      },
    }),
    validateStatePayload: () => ({ accepted: true }),
  };

  const tokenExchangeService = {
    exchangeAuthorizationCodeDryRunnable: () => ({
      accepted: true,
      reason: 'ready',
      messageRedacted: 'Fake exchange accepted.',
      transportMode: 'fake',
      tokenExchangeHttpCallNow: false,
      realSpApiRequestNow: false,
      companyId: 'company-step139v9',
      storeId: 'store-step139v9',
      marketplaceId: 'A1VC38T7YXB528',
      region: 'JP',
      sanitizedTokenEnvelope: {
        accessTokenPresent: true,
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

  const commitGate = {
    evaluateCommitGate: (input) => {
      calls.gate.push(input);

      if (
        input.dryRun === false &&
        input.requestedCommit === true &&
        input.operatorConfirmed === true &&
        input.companyStoreAllowlisted === true &&
        input.environmentAllowsPersistence === true
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

  const orchestrator = {
    persistEncryptedTokensSchemaAwareRealWrite: async (input, prismaClient) => {
      calls.schemaAware.push({ input, prismaClient });

      return {
        accepted: true,
        source: 'amazon-sp-api-token-persistence-orchestrator-schema-aware-real-write',
        orchestratorMode: 'repository-schema-aware-real-write-wiring',
        reason: 'ready',
        messageRedacted: 'Schema-aware persistence accepted.',
        transportAccepted: true,
        parserAccepted: true,
        persistenceInputAccepted: true,
        repositoryAccepted: true,
        repositoryReason: 'ready',
        repositoryMethodCalled: 'upsertEncryptedCredentialSchemaAwareRealWrite',
        connectionWriteNow: true,
        credentialWriteNow: true,
        accessTokenCacheWriteNow: true,
        controllerWiringNow: false,
        oauthCallbackWiringNow: false,
        oauthCallbackPersistenceWiringNow: false,
        amazonNetworkCallNow: false,
        prismaClientWriteNow: true,
        databaseWriteNow: true,
        tokenPersistenceDatabaseWriteNow: true,
        plaintextTokenDatabaseWriteNow: false,
        rawTokenReturnedNow: false,
        rawLwaResponseReturnedNow: false,
        rawAccessTokenReturnedNow: false,
        rawRefreshTokenReturnedNow: false,
        rawAuthorizationCodeReturnedNow: false,
        persistedConnectionShape: {
          id: 'connection-step139-v9',
          companyId: input.companyId,
          storeId: input.storeId,
          marketplaceId: input.marketplaceId,
          region: input.region,
          sellingPartnerIdRedacted: 'SEL***789',
          status: 'CONNECTED',
          connectedAt: new Date().toISOString(),
        },
        persistedCredentialShape: {
          id: 'credential-step139-v9',
          connectionId: 'connection-step139-v9',
          encryptionKeyId: input.encryptionKeyId,
          encryptionAlgorithm: input.encryptionAlgorithm,
          tokenVersion: input.tokenVersion,
          rotatedAt: new Date().toISOString(),
          revokedAt: null,
        },
        persistedAccessTokenCacheShape: {
          id: 'cache-step139-v9',
          connectionId: 'connection-step139-v9',
          expiresAt: new Date(Date.now() + 3600_000).toISOString(),
        },
      };
    },
    persistEncryptedTokensRealWrite: async () => {
      calls.legacy.push(true);
      return { accepted: false, reason: 'legacy_should_not_be_called' };
    },
  };

  const prismaService = { schemaAwarePrismaClient: true };

  const ControllerClass = loadControllerClass();
  const controller = new ControllerClass(
    {},
    bridgeService,
    {},
    tokenExchangeService,
    {},
    {},
    {},
    commitGate,
    orchestrator,
    prismaService,
  );

  return { controller, calls, prismaService };
}

async function callBoundary(controller, patch = {}) {
  return controller.amazonSpApiOAuthCallbackBoundary(
    patch.state ?? 'STATE_OK',
    patch.code ?? 'AUTHORIZATION_CODE_SECRET',
    patch.spapiOauthCode ?? '',
    patch.sellingPartnerId ?? 'SELLER123456789',
    patch.error ?? '',
    patch.errorDescription ?? '',
    patch.dryRun,
    patch.commit,
    patch.idempotencyKey,
  );
}

(async () => {
  console.log('========== Step139-V9 OAuth callback controller schema-aware switch runtime smoke ==========');

  const pkg = JSON.parse(read(files.packageJson));
  const controllerSource = read(files.controller);
  const moduleSource = read(files.module);
  const prismaSource = read(files.prismaService);

  assert(
    pkg.scripts &&
      pkg.scripts['smoke:amazon-sp-api-oauth-callback-controller-schema-aware-switch-runtime'] ===
        'node scripts/smoke-amazon-sp-api-oauth-callback-controller-schema-aware-switch-runtime.js',
    'package.json registers Step139-V9 smoke',
  );

  for (const marker of [
    "import { PrismaService } from '../prisma.service';",
    'private readonly prismaService: PrismaService',
    'this.amazonSpApiTokenPersistenceOrchestrator.persistEncryptedTokensSchemaAwareRealWrite',
    'controller-commit-gate-to-schema-aware-orchestrator-real-write',
    'controllerCallsSchemaAwareOrchestratorNow: true',
    'controllerCallsLegacyOrchestratorNow: false',
    'controllerCallsRepositoryDirectlyNow: false',
    'rawAuthorizationCodeReturnedNow: false',
    'rawLwaResponseReturnedNow: false',
    'rawAccessTokenReturnedNow: false',
    'rawRefreshTokenReturnedNow: false',
  ]) {
    assert(controllerSource.includes(marker), `controller contains marker: ${marker}`);
  }

  assert(!controllerSource.includes('this.amazonSpApiTokenPersistenceOrchestrator.persistEncryptedTokensRealWrite'), 'controller legacy orchestrator call removed');
  assert(!controllerSource.includes('AmazonSpApiCredentialRepository'), 'controller does not directly reference repository');
  assert(!controllerSource.includes('mockedControllerPrismaDelegate'), 'controller mocked legacy delegate removed');
  assert(moduleSource.includes('PrismaService'), 'imports.module has PrismaService provider');
  assert(prismaSource.includes('export class PrismaService extends PrismaClient'), 'PrismaService extends PrismaClient');

  {
    clearCommitEnv();
    const { controller, calls } = makeController();
    const result = await callBoundary(controller);

    assertNoSecret(result, 'default dry-run result');
    assertEqual(result.wiringMode, 'controller-dry-run-only-no-persistence', 'default dry-run wiring');
    assertEqual(result.oauthCallbackPersistenceWiringNow, false, 'default dry-run no persistence');
    assertEqual(calls.schemaAware.length, 0, 'default dry-run no schema-aware call');
    assertEqual(calls.legacy.length, 0, 'default dry-run no legacy call');
  }

  {
    clearCommitEnv();
    setCommitEnv();

    const { controller, calls, prismaService } = makeController();
    const result = await callBoundary(controller, {
      dryRun: 'false',
      commit: 'true',
      idempotencyKey: 'step139-v9-query-idem',
    });

    assertNoSecret(result, 'commit result');
    assertEqual(result.source, 'amazon-sp-api-oauth-callback-controller-schema-aware-real-write', 'commit source');
    assertEqual(result.wiringMode, 'controller-commit-gate-to-schema-aware-orchestrator-real-write', 'commit wiring mode');
    assertEqual(result.accepted, true, 'commit accepted');
    assertEqual(result.status, 'token_persistence_committed', 'commit status');
    assertEqual(result.oauthCallbackPersistenceWiringNow, true, 'commit persistence wiring');
    assertEqual(result.controllerCallsSchemaAwareOrchestratorNow, true, 'schema-aware orchestrator flag');
    assertEqual(result.controllerCallsLegacyOrchestratorNow, false, 'legacy orchestrator flag false');
    assertEqual(result.controllerCallsRepositoryDirectlyNow, false, 'no direct repository');
    assertEqual(result.tokenPersistenceDatabaseWriteNow, true, 'token DB write');
    assertEqual(result.databaseWriteNow, true, 'DB write');
    assertEqual(result.prismaClientWriteNow, true, 'Prisma write');
    assertEqual(result.connectionWriteNow, true, 'connection write');
    assertEqual(result.credentialWriteNow, true, 'credential write');
    assertEqual(result.accessTokenCacheWriteNow, true, 'cache write');
    assertEqual(result.amazonNetworkCallNow, false, 'no Amazon call');
    assertEqual(result.realSpApiRequestNow, false, 'no SP-API call');
    assertEqual(result.plaintextTokenDatabaseWriteNow, false, 'no plaintext token write');
    assertEqual(result.rawAuthorizationCodeReturnedNow, false, 'no raw auth code');
    assertEqual(result.rawLwaResponseReturnedNow, false, 'no raw LWA response');
    assertEqual(result.rawAccessTokenReturnedNow, false, 'no raw access token');
    assertEqual(result.rawRefreshTokenReturnedNow, false, 'no raw refresh token');

    assertEqual(calls.schemaAware.length, 1, 'schema-aware orchestrator called once');
    assertEqual(calls.schemaAware[0].prismaClient, prismaService, 'controller passes PrismaService to schema-aware orchestrator');
    assertEqual(calls.legacy.length, 0, 'legacy orchestrator not called');
    assert(result.persistedConnectionShape, 'commit returns persisted connection shape');
    assert(result.persistedCredentialShape, 'commit returns persisted credential shape');
    assert(result.persistedAccessTokenCacheShape, 'commit returns persisted cache shape');
  }

  clearCommitEnv();

  console.log('========== Step139-V9 OAuth callback controller schema-aware switch runtime smoke passed ==========');
})().catch((error) => {
  clearCommitEnv();
  console.error(error);
  process.exit(1);
});
