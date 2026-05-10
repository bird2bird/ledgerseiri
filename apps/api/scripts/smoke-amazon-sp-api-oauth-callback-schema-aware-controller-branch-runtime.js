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
  assert(
    actual === expected,
    `${message}: expected=${JSON.stringify(expected)} actual=${JSON.stringify(actual)}`,
  );
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

function setCommitEnv(patch = {}) {
  clearCommitEnv();

  const env = {
    AMAZON_SP_API_OAUTH_CALLBACK_COMMIT_ENABLED: 'true',
    AMAZON_SP_API_OAUTH_CALLBACK_OPERATOR_CONFIRMED: 'true',
    AMAZON_SP_API_OAUTH_CALLBACK_COMPANY_STORE_ALLOWLISTED: 'true',
    AMAZON_SP_API_OAUTH_CALLBACK_PERSISTENCE_ENABLED: 'true',
    AMAZON_SP_API_OAUTH_CALLBACK_TRUSTED_STATE_SIGNATURE_VALID: 'true',
    AMAZON_SP_API_OAUTH_CALLBACK_TRUSTED_STATE_EXPIRED: 'false',
    AMAZON_SP_API_OAUTH_CALLBACK_REAL_LWA_GATE_ACCEPTED: 'true',
    AMAZON_SP_API_OAUTH_CALLBACK_IDEMPOTENCY_KEY: 'step139-w-idempotency',
    ...patch,
  };

  for (const [key, value] of Object.entries(env)) {
    process.env[key] = value;
  }
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

function makeController(options = {}) {
  const calls = {
    gate: [],
    schemaAware: [],
    legacy: [],
    exchange: [],
    persistencePlan: [],
    serviceDryRun: [],
  };

  const bridgeService = {
    buildPersistencePlan: (...args) => {
      calls.persistencePlan.push(args);

      if (options.persistencePlanAccepted === false) {
        return {
          accepted: false,
          reason: options.persistencePlanReason || 'state_signature_invalid',
          messageRedacted: 'Persistence plan rejected.',
        };
      }

      return {
        accepted: true,
        reason: 'ready',
        messageRedacted: 'Persistence input accepted.',
        refreshCredentialInput: {
          encryptedRefreshToken: 'ENCRYPTED_REFRESH_TOKEN_ONLY',
          encryptionKeyId: 'kms-step139-w',
          encryptionAlgorithm: 'envelope-v1',
          tokenVersion: 1,
        },
        accessTokenCacheInput:
          options.noAccessTokenCache === true
            ? null
            : {
                encryptedAccessToken: 'ENCRYPTED_ACCESS_TOKEN_ONLY',
                expiresAt: new Date(Date.now() + 3600_000).toISOString(),
              },
      };
    },
    validateStatePayload: () => ({ accepted: true }),
  };

  const tokenExchangeService = {
    exchangeAuthorizationCodeDryRunnable: (input) => {
      calls.exchange.push(input);

      if (options.exchangeAccepted === false) {
        return {
          accepted: false,
          reason: options.exchangeReason || 'transport_rejected',
          messageRedacted: 'Fake exchange rejected.',
          transportMode: 'fake',
          tokenExchangeHttpCallNow: false,
          realSpApiRequestNow: false,
        };
      }

      return {
        accepted: true,
        reason: 'ready',
        messageRedacted: 'Fake exchange accepted.',
        transportMode: 'fake',
        tokenExchangeHttpCallNow: false,
        realSpApiRequestNow: false,
        companyId: 'company-step139w',
        storeId: 'store-step139w',
        marketplaceId: 'A1VC38T7YXB528',
        region: 'JP',
        sanitizedTokenEnvelope: {
          accessTokenPresent: options.noAccessTokenCache !== true,
          refreshTokenPresent: true,
          rawAccessTokenReturnedNow: false,
          rawRefreshTokenReturnedNow: false,
        },
      };
    },
    runTokenPersistenceE2eServiceOnlyTestDouble: (input) => {
      calls.serviceDryRun.push(input);

      if (options.serviceDryRunAccepted === false) {
        return {
          accepted: false,
          reason: options.serviceDryRunReason || 'encrypted_persistence_input_rejected',
          messageRedacted: 'Service dry-run rejected.',
        };
      }

      return {
        accepted: true,
        reason: 'ready',
        messageRedacted: 'Service dry-run accepted.',
      };
    },
  };

  const commitGate = {
    evaluateCommitGate: (input) => {
      calls.gate.push(input);

      if (options.forceGateRejected === true) {
        return {
          accepted: false,
          reason: options.gateReason || 'operator_confirmation_required',
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
      }

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

  const orchestrator = {
    persistEncryptedTokensSchemaAwareRealWrite: async (input, prismaClient) => {
      calls.schemaAware.push({ input, prismaClient });

      if (options.orchestratorAccepted === false) {
        return {
          accepted: false,
          source: 'amazon-sp-api-token-persistence-orchestrator-schema-aware-real-write',
          orchestratorMode: 'repository-schema-aware-real-write-wiring',
          reason: options.orchestratorReason || 'repository_schema_aware_real_write_rejected',
          messageRedacted: 'Schema-aware persistence rejected.',
          transportAccepted: true,
          parserAccepted: true,
          persistenceInputAccepted: true,
          repositoryAccepted: false,
          repositoryReason: options.repositoryReason || 'missing_schema_aware_delegate',
          repositoryMethodCalled: 'upsertEncryptedCredentialSchemaAwareRealWrite',
          connectionWriteNow: false,
          credentialWriteNow: false,
          accessTokenCacheWriteNow: false,
          controllerWiringNow: false,
          oauthCallbackWiringNow: false,
          oauthCallbackPersistenceWiringNow: false,
          amazonNetworkCallNow: false,
          prismaClientWriteNow: false,
          databaseWriteNow: false,
          tokenPersistenceDatabaseWriteNow: false,
          plaintextTokenDatabaseWriteNow: false,
          rawTokenReturnedNow: false,
          rawLwaResponseReturnedNow: false,
          rawAccessTokenReturnedNow: false,
          rawRefreshTokenReturnedNow: false,
          rawAuthorizationCodeReturnedNow: false,
          persistedConnectionShape: null,
          persistedCredentialShape: null,
          persistedAccessTokenCacheShape: null,
        };
      }

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
        accessTokenCacheWriteNow: options.noAccessTokenCache !== true,
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
          id: 'connection-step139-w',
          companyId: input.companyId,
          storeId: input.storeId,
          marketplaceId: input.marketplaceId,
          region: input.region,
          sellingPartnerIdRedacted: 'SEL***789',
          status: 'CONNECTED',
          connectedAt: new Date().toISOString(),
        },
        persistedCredentialShape: {
          id: 'credential-step139-w',
          connectionId: 'connection-step139-w',
          encryptionKeyId: input.encryptionKeyId,
          encryptionAlgorithm: input.encryptionAlgorithm,
          tokenVersion: input.tokenVersion,
          rotatedAt: new Date().toISOString(),
          revokedAt: null,
        },
        persistedAccessTokenCacheShape:
          options.noAccessTokenCache === true
            ? null
            : {
                id: 'cache-step139-w',
                connectionId: 'connection-step139-w',
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
    patch.state,
    patch.code,
    patch.spapiOauthCode,
    patch.sellingPartnerId,
    patch.error,
    patch.errorDescription,
    patch.dryRun,
    patch.commit,
    patch.idempotencyKey,
  );
}

const validCallback = {
  state: 'STATE_OK',
  code: 'AUTHORIZATION_CODE_SECRET',
  spapiOauthCode: '',
  sellingPartnerId: 'SELLER123456789',
};

function assertNoWrites(result, calls, label) {
  assertNoSecret(result, label);
  assertEqual(calls.schemaAware.length, 0, `${label} no schema-aware orchestrator call`);
  assertEqual(calls.legacy.length, 0, `${label} no legacy orchestrator call`);

  if ('tokenPersistenceDatabaseWriteNow' in result) {
    assertEqual(result.tokenPersistenceDatabaseWriteNow, false, `${label} no token DB write`);
  }

  if ('databaseWriteNow' in result) {
    assertEqual(result.databaseWriteNow, false, `${label} no DB write`);
  }

  if ('prismaClientWriteNow' in result) {
    assertEqual(result.prismaClientWriteNow, false, `${label} no Prisma write`);
  }

  if ('rawAuthorizationCodeReturnedNow' in result) {
    assertEqual(result.rawAuthorizationCodeReturnedNow, false, `${label} no raw auth code`);
  }

  if ('rawAccessTokenReturnedNow' in result) {
    assertEqual(result.rawAccessTokenReturnedNow, false, `${label} no raw access token`);
  }

  if ('rawRefreshTokenReturnedNow' in result) {
    assertEqual(result.rawRefreshTokenReturnedNow, false, `${label} no raw refresh token`);
  }
}

(async () => {
  console.log('========== Step139-W OAuth callback schema-aware controller branch runtime smoke ==========');

  const pkg = JSON.parse(read(files.packageJson));
  const controllerSource = read(files.controller);
  const moduleSource = read(files.module);
  const prismaSource = read(files.prismaService);

  assert(
    pkg.scripts &&
      pkg.scripts['smoke:amazon-sp-api-oauth-callback-schema-aware-controller-branch-runtime'] ===
        'node scripts/smoke-amazon-sp-api-oauth-callback-schema-aware-controller-branch-runtime.js',
    'package.json registers Step139-W smoke',
  );

  for (const marker of [
    'this.amazonSpApiTokenPersistenceOrchestrator.persistEncryptedTokensSchemaAwareRealWrite',
    'controller-commit-gate-to-schema-aware-orchestrator-real-write',
    'controllerCallsSchemaAwareOrchestratorNow: true',
    'controllerCallsLegacyOrchestratorNow: false',
    'controllerCallsRepositoryDirectlyNow: false',
    'rawAuthorizationCodeReturnedNow: false',
    'rawLwaResponseReturnedNow: false',
    'rawAccessTokenReturnedNow: false',
    'rawRefreshTokenReturnedNow: false',
    'private readonly prismaService: PrismaService',
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
    const result = await callBoundary(controller, {
      ...validCallback,
      error: 'access_denied',
      errorDescription: 'User denied AUTHORIZATION_CODE_SECRET',
    });

    assertEqual(result.status, 'callback_error', 'callback error status');
    assertEqual(result.accepted, false, 'callback error rejected');
    assertNoWrites(result, calls, 'callback error');
  }

  {
    clearCommitEnv();
    const { controller, calls } = makeController();
    const result = await callBoundary(controller, {
      ...validCallback,
      state: '',
    });

    assertEqual(result.status, 'missing_state', 'missing state status');
    assertEqual(result.accepted, false, 'missing state rejected');
    assertNoWrites(result, calls, 'missing state');
  }

  {
    clearCommitEnv();
    const { controller, calls } = makeController();
    const result = await callBoundary(controller, {
      ...validCallback,
      code: '',
      spapiOauthCode: '',
    });

    assertEqual(result.status, 'missing_authorization_code', 'missing code status');
    assertEqual(result.accepted, false, 'missing code rejected');
    assertNoWrites(result, calls, 'missing code');
  }

  {
    clearCommitEnv();
    const { controller, calls } = makeController();
    const result = await callBoundary(controller, {
      ...validCallback,
      sellingPartnerId: '',
    });

    assertEqual(result.status, 'missing_selling_partner_id', 'missing seller status');
    assertEqual(result.accepted, false, 'missing seller rejected');
    assertNoWrites(result, calls, 'missing seller');
  }

  {
    clearCommitEnv();
    const { controller, calls } = makeController({ exchangeAccepted: false, exchangeReason: 'transport_rejected' });
    const result = await callBoundary(controller, validCallback);

    assertEqual(result.status, 'transport_rejected', 'token exchange rejected status');
    assertEqual(result.accepted, false, 'token exchange rejected');
    assertEqual(calls.exchange.length, 1, 'exchange attempted once');
    assertNoWrites(result, calls, 'token exchange rejected');
  }

  {
    clearCommitEnv();
    const { controller, calls } = makeController({ persistencePlanAccepted: false, persistencePlanReason: 'state_signature_invalid' });
    const result = await callBoundary(controller, validCallback);

    assertEqual(result.status, 'state_signature_invalid', 'persistence plan rejected status');
    assertEqual(result.accepted, false, 'persistence plan rejected');
    assertEqual(calls.persistencePlan.length, 1, 'persistence plan attempted once');
    assertNoWrites(result, calls, 'persistence plan rejected');
  }

  {
    clearCommitEnv();
    const { controller, calls } = makeController();
    const result = await callBoundary(controller, validCallback);

    assertNoSecret(result, 'default dry-run');
    assertEqual(result.wiringMode, 'controller-dry-run-only-no-persistence', 'default dry-run wiring');
    assertEqual(result.oauthCallbackPersistenceWiringNow, false, 'default dry-run no persistence');
    assertEqual(calls.gate.length, 1, 'default dry-run commit gate evaluated');
    assertEqual(calls.schemaAware.length, 0, 'default dry-run no schema-aware call');
    assertEqual(calls.legacy.length, 0, 'default dry-run no legacy call');
  }

  {
    clearCommitEnv();
    const { controller, calls } = makeController();
    const result = await callBoundary(controller, {
      ...validCallback,
      dryRun: 'false',
      commit: 'true',
    });

    assertNoSecret(result, 'commit env disabled');
    assertEqual(result.wiringMode, 'controller-dry-run-only-no-persistence', 'commit env disabled remains dry-run');
    assertEqual(calls.gate.length, 1, 'commit env disabled gate evaluated');
    assertEqual(calls.schemaAware.length, 0, 'commit env disabled no schema-aware call');
    assertEqual(calls.legacy.length, 0, 'commit env disabled no legacy call');
  }

  {
    setCommitEnv({ AMAZON_SP_API_OAUTH_CALLBACK_OPERATOR_CONFIRMED: 'false' });
    const { controller, calls } = makeController({ forceGateRejected: true, gateReason: 'operator_confirmation_required' });
    const result = await callBoundary(controller, {
      ...validCallback,
      dryRun: 'false',
      commit: 'true',
    });

    assertNoSecret(result, 'commit gate rejected');
    assertEqual(result.wiringMode, 'controller-dry-run-only-no-persistence', 'commit gate rejected dry-run response');
    assertEqual(calls.gate.length, 1, 'commit gate rejected gate evaluated');
    assertEqual(calls.schemaAware.length, 0, 'commit gate rejected no schema-aware call');
    assertEqual(calls.legacy.length, 0, 'commit gate rejected no legacy call');
  }

  {
    setCommitEnv();
    const { controller, calls, prismaService } = makeController();
    const result = await callBoundary(controller, {
      ...validCallback,
      dryRun: 'false',
      commit: 'true',
      idempotencyKey: 'step139-w-idem',
    });

    assertNoSecret(result, 'commit success');
    assertEqual(result.source, 'amazon-sp-api-oauth-callback-controller-schema-aware-real-write', 'commit success source');
    assertEqual(result.wiringMode, 'controller-commit-gate-to-schema-aware-orchestrator-real-write', 'commit success wiring');
    assertEqual(result.accepted, true, 'commit success accepted');
    assertEqual(result.status, 'token_persistence_committed', 'commit success status');
    assertEqual(result.controllerCallsSchemaAwareOrchestratorNow, true, 'commit success schema-aware flag');
    assertEqual(result.controllerCallsLegacyOrchestratorNow, false, 'commit success legacy flag false');
    assertEqual(result.controllerCallsRepositoryDirectlyNow, false, 'commit success no direct repository');
    assertEqual(result.tokenPersistenceDatabaseWriteNow, true, 'commit success token DB write');
    assertEqual(result.connectionWriteNow, true, 'commit success connection write');
    assertEqual(result.credentialWriteNow, true, 'commit success credential write');
    assertEqual(result.accessTokenCacheWriteNow, true, 'commit success cache write');
    assertEqual(result.rawAuthorizationCodeReturnedNow, false, 'commit success no raw auth code');
    assertEqual(result.rawAccessTokenReturnedNow, false, 'commit success no raw access token');
    assertEqual(result.rawRefreshTokenReturnedNow, false, 'commit success no raw refresh token');
    assertEqual(calls.schemaAware.length, 1, 'commit success schema-aware orchestrator called');
    assertEqual(calls.schemaAware[0].prismaClient, prismaService, 'commit success passes PrismaService');
    assertEqual(calls.legacy.length, 0, 'commit success legacy not called');
    assert(result.persistedConnectionShape, 'commit success returns connection shape');
    assert(result.persistedCredentialShape, 'commit success returns credential shape');
    assert(result.persistedAccessTokenCacheShape, 'commit success returns cache shape');
  }

  {
    setCommitEnv();
    const { controller, calls } = makeController({
      orchestratorAccepted: false,
      orchestratorReason: 'repository_schema_aware_real_write_rejected',
      repositoryReason: 'missing_schema_aware_delegate',
    });
    const result = await callBoundary(controller, {
      ...validCallback,
      dryRun: 'false',
      commit: 'true',
    });

    assertNoSecret(result, 'orchestrator rejected');
    assertEqual(result.source, 'amazon-sp-api-oauth-callback-controller-schema-aware-real-write', 'orchestrator rejected source');
    assertEqual(result.wiringMode, 'controller-commit-gate-to-schema-aware-orchestrator-real-write', 'orchestrator rejected wiring');
    assertEqual(result.accepted, false, 'orchestrator rejected accepted false');
    assertEqual(result.status, 'repository_schema_aware_real_write_rejected', 'orchestrator rejected status reflects orchestrator reason');
    assertEqual(result.tokenPersistenceDatabaseWriteNow, false, 'orchestrator rejected no token DB write');
    assertEqual(result.connectionWriteNow, false, 'orchestrator rejected no connection write');
    assertEqual(calls.schemaAware.length, 1, 'orchestrator rejected schema-aware called');
    assertEqual(calls.legacy.length, 0, 'orchestrator rejected legacy not called');
  }

  {
    setCommitEnv();
    const { controller, calls } = makeController({
      orchestratorAccepted: false,
      orchestratorReason: 'prisma_schema_aware_write_exception',
      repositoryReason: 'prisma_schema_aware_write_exception',
    });
    const result = await callBoundary(controller, {
      ...validCallback,
      dryRun: 'false',
      commit: 'true',
    });

    assertNoSecret(result, 'orchestrator prisma exception');
    assertEqual(result.accepted, false, 'orchestrator prisma exception rejected');
    assertEqual(result.status, 'prisma_schema_aware_write_exception', 'orchestrator prisma exception status reflects orchestrator reason');
    assertEqual(result.tokenPersistenceDatabaseWriteNow, false, 'orchestrator prisma exception no token DB write');
    assertEqual(calls.schemaAware.length, 1, 'orchestrator prisma exception schema-aware called');
    assertEqual(calls.legacy.length, 0, 'orchestrator prisma exception legacy not called');
  }

  clearCommitEnv();

  console.log('========== Step139-W OAuth callback schema-aware controller branch runtime smoke passed ==========');
})().catch((error) => {
  clearCommitEnv();
  console.error(error);
  process.exit(1);
});
