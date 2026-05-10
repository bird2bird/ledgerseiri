const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '../../..');
const apiRoot = path.join(root, 'apps/api');

const files = {
  packageJson: path.join(apiRoot, 'package.json'),
  controller: path.join(apiRoot, 'src/imports/imports.controller.ts'),
  module: path.join(apiRoot, 'src/imports/imports.module.ts'),
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

function assertSafeResponse(result, label) {
  const serialized = JSON.stringify(result);

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

  assertEqual(result.rawAuthorizationCodeReturnedNow, false, `${label} no raw authorization code`);
  assertEqual(result.rawLwaResponseReturnedNow, false, `${label} no raw LWA response`);
  assertEqual(result.rawAccessTokenReturnedNow, false, `${label} no raw access token`);
  assertEqual(result.rawRefreshTokenReturnedNow, false, `${label} no raw refresh token`);
  assertEqual(result.plaintextTokenDatabaseWriteNow, false, `${label} no plaintext token DB write`);
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

  const decorator = () => () => undefined;
  const passthroughDecorator = () => () => undefined;

  vm.runInNewContext(
    output,
    {
      require: (request) => {
        if (request === '@nestjs/common') {
          return {
            BadRequestException: class BadRequestException extends Error {},
            ForbiddenException: class ForbiddenException extends Error {},
            Body: decorator,
            Controller: decorator,
            Get: decorator,
            Param: decorator,
            Post: decorator,
            Query: decorator,
            Req: decorator,
            UseGuards: passthroughDecorator,
          };
        }

        if (request === '../auth/jwt.guard') {
          return { JwtAuthGuard: class JwtAuthGuard {} };
        }

        if (
          request.startsWith('./') ||
          request.startsWith('../')
        ) {
          return new Proxy(
            {},
            {
              get(_target, prop) {
                if (prop === '__esModule') return true;
                return {};
              },
            },
          );
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

function makeController({ gateOverride, orchestratorOverride } = {}) {
  const calls = {
    exchange: [],
    persistencePlan: [],
    serviceDryRun: [],
    gate: [],
    orchestrator: [],
  };

  const importsService = {};

  const bridgeService = {
    buildPersistencePlan: (...args) => {
      calls.persistencePlan.push(args);
      return {
        accepted: true,
        reason: 'ready',
        messageRedacted: 'Persistence input accepted.',
        refreshCredentialInput: {
          encryptedRefreshToken: 'ENCRYPTED_REFRESH_TOKEN_ONLY',
          encryptionKeyId: 'kms-key-step139-u',
          encryptionAlgorithm: 'envelope-v1',
          tokenVersion: 1,
        },
        accessTokenCacheInput: {
          encryptedAccessToken: 'ENCRYPTED_ACCESS_TOKEN_ONLY',
          expiresAt: '2026-05-10T03:00:00.000Z',
        },
      };
    },
    validateStatePayload: () => ({ accepted: true }),
  };

  const authorizationUrlService = {};

  const tokenExchangeService = {
    exchangeAuthorizationCodeDryRunnable: (input) => {
      calls.exchange.push(input);
      return {
        accepted: true,
        reason: 'ready',
        messageRedacted: 'Fake exchange accepted.',
        transportMode: 'fake',
        tokenExchangeHttpCallNow: false,
        realSpApiRequestNow: false,
        companyId: 'company-step139u',
        storeId: 'store-step139u',
        marketplaceId: 'A1VC38T7YXB528',
        region: 'JP',
        sanitizedTokenEnvelope: {
          accessTokenPresent: true,
          refreshTokenPresent: true,
          rawAccessTokenReturnedNow: false,
          rawRefreshTokenReturnedNow: false,
        },
      };
    },
    runTokenPersistenceE2eServiceOnlyTestDouble: (input) => {
      calls.serviceDryRun.push(input);
      return {
        accepted: true,
        reason: 'ready',
        messageRedacted: 'Service dry-run accepted.',
      };
    },
  };

  const tokenPersistenceService = {};
  const lwaEnvConfigService = {};
  const realLwaGateService = {};

  const commitGateService = {
    evaluateCommitGate: (input) => {
      calls.gate.push(input);

      if (gateOverride) {
        return gateOverride(input);
      }

      if (input.dryRun !== false) {
        return {
          accepted: false,
          source: 'amazon-sp-api-oauth-callback-commit-gate',
          gateMode: 'server-side-pure-commit-gate-no-side-effects',
          reason: 'dry_run_default',
          messageRedacted: 'Dry-run default.',
          commitAllowedNow: false,
          dryRunForcedNow: true,
          controllerMayCallOrchestratorRealWriteNow: false,
          tokenExchangeHttpCallAllowedNow: false,
          amazonNetworkCallAllowedNow: false,
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

      if (input.requestedCommit !== true) {
        return {
          accepted: false,
          source: 'amazon-sp-api-oauth-callback-commit-gate',
          gateMode: 'server-side-pure-commit-gate-no-side-effects',
          reason: 'commit_not_requested',
          messageRedacted: 'Commit not requested.',
          commitAllowedNow: false,
          dryRunForcedNow: true,
          controllerMayCallOrchestratorRealWriteNow: false,
          tokenExchangeHttpCallAllowedNow: false,
          amazonNetworkCallAllowedNow: false,
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

      return {
        accepted: true,
        source: 'amazon-sp-api-oauth-callback-commit-gate',
        gateMode: 'server-side-pure-commit-gate-no-side-effects',
        reason: 'ready_for_commit',
        messageRedacted: 'Commit allowed.',
        commitAllowedNow: true,
        dryRunForcedNow: false,
        controllerMayCallOrchestratorRealWriteNow: true,
        tokenExchangeHttpCallAllowedNow: true,
        amazonNetworkCallAllowedNow: true,
        tokenPersistenceDatabaseWriteAllowedNow: true,
        databaseWriteAllowedNow: true,
        prismaClientWriteAllowedNow: true,
        plaintextTokenDatabaseWriteAllowedNow: false,
        rawAuthorizationCodeReturnedNow: false,
        rawLwaResponseReturnedNow: false,
        rawAccessTokenReturnedNow: false,
        rawRefreshTokenReturnedNow: false,
      };
    },
  };

  const orchestrator = {
    persistEncryptedTokensRealWrite: async (input, delegate) => {
      calls.orchestrator.push({ input, delegatePresent: Boolean(delegate && delegate.upsert) });

      if (orchestratorOverride) {
        return orchestratorOverride(input, delegate);
      }

      return {
        accepted: true,
        source: 'amazon-sp-api-token-persistence-orchestrator-real-write',
        reason: 'ready',
        messageRedacted: 'Credential persisted through mocked delegate.',
        tokenPersistenceDatabaseWriteNow: true,
        plaintextTokenDatabaseWriteNow: false,
        databaseWriteNow: true,
        prismaClientWriteNow: true,
        persistedCredentialShape: {
          id: 'step139-u-controller-smoke-credential',
          companyId: input.companyId,
          storeId: input.storeId,
          marketplaceId: input.marketplaceId,
          region: input.region,
          sellingPartnerIdRedacted: 'SEL***789',
          status: 'active',
        },
      };
    },
  };

  const ControllerClass = loadControllerClass();
  const controller = new ControllerClass(
    importsService,
    bridgeService,
    authorizationUrlService,
    tokenExchangeService,
    tokenPersistenceService,
    lwaEnvConfigService,
    realLwaGateService,
    commitGateService,
    orchestrator,
  );

  return { controller, calls };
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
  process.env.AMAZON_SP_API_OAUTH_CALLBACK_IDEMPOTENCY_KEY = 'step139-u-env-idempotency';
  process.env.AMAZON_SP_API_OAUTH_CALLBACK_USE_MOCKED_PRISMA_DELEGATE = 'true';
}

function validArgs(extra = {}) {
  return {
    state: 'STATE_OK',
    code: 'AUTHORIZATION_CODE_SECRET',
    spapiOauthCode: '',
    sellingPartnerId: 'SELLER123456789',
    error: '',
    errorDescription: '',
    dryRun: undefined,
    commit: undefined,
    idempotencyKey: undefined,
    ...extra,
  };
}

async function callBoundary(controller, args) {
  return controller.amazonSpApiOAuthCallbackBoundary(
    args.state,
    args.code,
    args.spapiOauthCode,
    args.sellingPartnerId,
    args.error,
    args.errorDescription,
    args.dryRun,
    args.commit,
    args.idempotencyKey,
  );
}

(async () => {
  console.log('========== Step139-U OAuth callback controller real-write branch runtime smoke ==========');

  const pkg = JSON.parse(read(files.packageJson));
  const controllerSource = read(files.controller);
  const moduleSource = read(files.module);

  assert(
    pkg.scripts &&
      pkg.scripts['smoke:amazon-sp-api-oauth-callback-controller-real-write-branch-runtime'] ===
        'node scripts/smoke-amazon-sp-api-oauth-callback-controller-real-write-branch-runtime.js',
    'package.json registers Step139-U smoke',
  );

  for (const marker of [
    'Step139-T: guarded OAuth callback controller real-write branch implementation.',
    'amazonSpApiOAuthCallbackBoundary',
    'this.amazonSpApiOauthCallbackCommitGateService.evaluateCommitGate',
    'this.amazonSpApiTokenPersistenceOrchestrator.persistEncryptedTokensRealWrite',
    'controller-commit-gate-to-orchestrator-real-write',
    'controllerCallsRepositoryDirectlyNow: false',
    'rawAuthorizationCodeReturnedNow: false',
    'rawLwaResponseReturnedNow: false',
    'rawAccessTokenReturnedNow: false',
    'rawRefreshTokenReturnedNow: false',
  ]) {
    assert(controllerSource.includes(marker), `controller contains marker: ${marker}`);
  }

  for (const forbidden of [
    'AmazonSpApiCredentialRepository',
    'upsertEncryptedCredentialRealWrite',
    'rawAuthorizationCodeReturnedNow: true',
    'rawAccessTokenReturnedNow: true',
    'rawRefreshTokenReturnedNow: true',
    'plaintextTokenDatabaseWriteNow: true',
    'controllerCallsRepositoryDirectlyNow: true',
  ]) {
    assert(!controllerSource.includes(forbidden), `controller does not contain forbidden marker: ${forbidden}`);
  }

  for (const marker of [
    'AmazonSpApiOauthCallbackCommitGateService,',
    'AmazonSpApiTokenPersistenceOrchestrator,',
  ]) {
    const count = moduleSource.split(marker).length - 1;
    assert(count === 1, `imports.module provider ${marker} appears exactly once`);
  }

  {
    clearCommitEnv();
    const { controller, calls } = makeController();
    const result = await callBoundary(controller, validArgs({ error: 'access_denied', errorDescription: 'RAW_LWA_RESPONSE_SECRET' }));

    assertSafeResponse(result, 'callback error');
    assertEqual(result.accepted, false, 'callback error rejected');
    assertEqual(result.status, 'callback_error', 'callback error status');
    assertEqual(calls.exchange.length, 0, 'callback error no token exchange');
    assertEqual(calls.gate.length, 0, 'callback error no gate');
    assertEqual(calls.orchestrator.length, 0, 'callback error no orchestrator');
  }

  {
    clearCommitEnv();
    const { controller, calls } = makeController();
    const result = await callBoundary(controller, validArgs({ state: '' }));

    assertSafeResponse(result, 'missing state');
    assertEqual(result.accepted, false, 'missing state rejected');
    assertEqual(result.status, 'missing_state', 'missing state status');
    assertEqual(calls.exchange.length, 0, 'missing state no token exchange');
    assertEqual(calls.gate.length, 0, 'missing state no gate');
    assertEqual(calls.orchestrator.length, 0, 'missing state no orchestrator');
  }

  {
    clearCommitEnv();
    const { controller, calls } = makeController();
    const result = await callBoundary(controller, validArgs({ code: '', spapiOauthCode: '' }));

    assertSafeResponse(result, 'missing code');
    assertEqual(result.accepted, false, 'missing code rejected');
    assertEqual(result.status, 'missing_authorization_code', 'missing code status');
    assertEqual(calls.exchange.length, 0, 'missing code no token exchange');
    assertEqual(calls.gate.length, 0, 'missing code no gate');
    assertEqual(calls.orchestrator.length, 0, 'missing code no orchestrator');
  }

  {
    clearCommitEnv();
    const { controller, calls } = makeController();
    const result = await callBoundary(controller, validArgs({ sellingPartnerId: '' }));

    assertSafeResponse(result, 'missing seller');
    assertEqual(result.accepted, false, 'missing seller rejected');
    assertEqual(result.status, 'missing_selling_partner_id', 'missing seller status');
    assertEqual(calls.exchange.length, 0, 'missing seller no token exchange');
    assertEqual(calls.gate.length, 0, 'missing seller no gate');
    assertEqual(calls.orchestrator.length, 0, 'missing seller no orchestrator');
  }

  {
    clearCommitEnv();
    const { controller, calls } = makeController();
    const result = await callBoundary(controller, validArgs());

    assertSafeResponse(result, 'default dry-run');
    assertEqual(result.wiringMode, 'controller-dry-run-only-no-persistence', 'default dry-run wiring mode');
    assertEqual(result.oauthCallbackDryRunWiringNow, true, 'default dry-run still dry-run');
    assertEqual(result.oauthCallbackPersistenceWiringNow, false, 'default dry-run no persistence');
    assertEqual(result.tokenPersistenceDatabaseWriteNow, false, 'default dry-run no token DB write');
    assertEqual(result.databaseWriteNow, false, 'default dry-run no DB write');
    assertEqual(result.prismaClientWriteNow, false, 'default dry-run no Prisma write');
    assertEqual(calls.exchange.length, 1, 'default dry-run exchange called');
    assertEqual(calls.gate.length, 1, 'default dry-run gate evaluated');
    assertEqual(calls.gate[0].dryRun, true, 'default dry-run gate dryRun true');
    assertEqual(calls.orchestrator.length, 0, 'default dry-run no orchestrator');
  }

  {
    clearCommitEnv();
    const { controller, calls } = makeController();
    const result = await callBoundary(controller, validArgs({ dryRun: 'false', commit: 'true', idempotencyKey: 'step139-u-query-idem' }));

    assertSafeResponse(result, 'commit requested env disabled');
    assertEqual(result.wiringMode, 'controller-dry-run-only-no-persistence', 'commit env disabled still dry-run response');
    assertEqual(result.oauthCallbackPersistenceWiringNow, false, 'commit env disabled no persistence');
    assertEqual(result.tokenPersistenceDatabaseWriteNow, false, 'commit env disabled no token DB write');
    assertEqual(calls.gate.length, 1, 'commit env disabled gate evaluated');
    assertEqual(calls.gate[0].dryRun, false, 'commit env disabled gate dryRun false');
    assertEqual(calls.gate[0].requestedCommit, false, 'commit env disabled requestedCommit false because server env disabled');
    assertEqual(calls.orchestrator.length, 0, 'commit env disabled no orchestrator');
  }

  {
    clearCommitEnv();
    setCommitEnv();

    const { controller, calls } = makeController();
    const result = await callBoundary(controller, validArgs({ dryRun: 'false', commit: 'true' }));

    assertSafeResponse(result, 'commit accepted');
    assertEqual(result.source, 'amazon-sp-api-oauth-callback-controller-real-write', 'commit accepted source');
    assertEqual(result.wiringMode, 'controller-commit-gate-to-orchestrator-real-write', 'commit accepted wiring mode');
    assertEqual(result.accepted, true, 'commit accepted result');
    assertEqual(result.status, 'token_persistence_committed', 'commit accepted status');
    assertEqual(result.oauthCallbackDryRunWiringNow, false, 'commit accepted not dry-run');
    assertEqual(result.oauthCallbackPersistenceWiringNow, true, 'commit accepted persistence wiring');
    assertEqual(result.controllerCallsServicePersistenceCommitNow, true, 'commit accepted commit branch flag');
    assertEqual(result.controllerCallsRepositoryDirectlyNow, false, 'commit accepted no direct repository');
    assertEqual(result.amazonNetworkCallNow, false, 'commit accepted no Amazon call');
    assertEqual(result.realSpApiRequestNow, false, 'commit accepted no SP-API call');
    assertEqual(result.tokenPersistenceDatabaseWriteNow, true, 'commit accepted token DB write flag');
    assertEqual(result.databaseWriteNow, true, 'commit accepted DB write flag');
    assertEqual(result.prismaClientWriteNow, true, 'commit accepted Prisma write flag');
    assertEqual(calls.gate.length, 1, 'commit accepted gate evaluated');
    assertEqual(calls.gate[0].dryRun, false, 'commit accepted gate dryRun false');
    assertEqual(calls.gate[0].requestedCommit, true, 'commit accepted gate requestedCommit true');
    assertEqual(calls.gate[0].idempotencyKey, 'step139-u-env-idempotency', 'commit accepted env idempotency key');
    assertEqual(calls.orchestrator.length, 1, 'commit accepted orchestrator called once');
    assertEqual(calls.orchestrator[0].delegatePresent, true, 'commit accepted mocked delegate passed');
  }

  {
    clearCommitEnv();
    setCommitEnv();
    delete process.env.AMAZON_SP_API_OAUTH_CALLBACK_IDEMPOTENCY_KEY;

    const { controller, calls } = makeController();
    const result = await callBoundary(controller, validArgs({ dryRun: 'false', commit: 'true', idempotencyKey: 'step139-u-query-idem' }));

    assertSafeResponse(result, 'commit accepted query idempotency');
    assertEqual(calls.gate[0].idempotencyKey, 'step139-u-query-idem', 'query idempotency used when env key absent');
    assertEqual(calls.orchestrator.length, 1, 'query idempotency orchestrator called');
  }

  clearCommitEnv();

  console.log('========== Step139-U OAuth callback controller real-write branch runtime smoke passed ==========');
})().catch((error) => {
  clearCommitEnv();
  console.error(error);
  process.exit(1);
});
