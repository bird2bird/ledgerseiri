const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '../../..');
const apiRoot = path.join(root, 'apps/api');

const files = {
  packageJson: path.join(apiRoot, 'package.json'),
  controller: path.join(apiRoot, 'src/imports/imports.controller.ts'),
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

function assertSafe(result, label) {
  assertEqual(result.source, 'amazon-sp-api-oauth-callback-dry-run-controller-wiring', `${label} source`);
  assertEqual(result.wiringMode, 'controller-dry-run-only-no-persistence', `${label} wiringMode`);
  assertEqual(result.controllerWiringNow, true, `${label} controllerWiringNow`);
  assertEqual(result.oauthCallbackDryRunWiringNow, true, `${label} oauthCallbackDryRunWiringNow`);
  assertEqual(result.oauthCallbackPersistenceWiringNow, false, `${label} oauthCallbackPersistenceWiringNow`);
  assertEqual(result.controllerCallsServicePersistenceCommitNow, false, `${label} no commit persistence`);
  assertEqual(result.tokenPersistenceDatabaseWriteNow, false, `${label} token DB write false`);
  assertEqual(result.plaintextTokenDatabaseWriteNow, false, `${label} plaintext DB write false`);
  assertEqual(result.databaseWriteNow, false, `${label} databaseWriteNow false`);
  assertEqual(result.prismaClientWriteNow, false, `${label} prismaClientWriteNow false`);
  assertEqual(result.amazonNetworkCallNow, false, `${label} amazonNetworkCallNow false`);
  assertEqual(result.realSpApiRequestNow, false, `${label} realSpApiRequestNow false`);
  assertEqual(result.rawAuthorizationCodeReturnedNow, false, `${label} rawAuthorizationCodeReturnedNow false`);
  assertEqual(result.rawLwaResponseReturnedNow, false, `${label} rawLwaResponseReturnedNow false`);
  assertEqual(result.rawAccessTokenReturnedNow, false, `${label} rawAccessTokenReturnedNow false`);
  assertEqual(result.rawRefreshTokenReturnedNow, false, `${label} rawRefreshTokenReturnedNow false`);

  const serialized = JSON.stringify(result);
  for (const secret of [
    'AUTHORIZATION_CODE_SECRET',
    'SPAPI_OAUTH_CODE_SECRET',
    'RAW_LWA_RESPONSE_SECRET',
    'ACCESS_TOKEN_SECRET_VALUE',
    'REFRESH_TOKEN_SECRET_VALUE',
    'CLIENT_SECRET_VALUE',
  ]) {
    assert(!serialized.includes(secret), `${label} does not expose ${secret}`);
  }
}

function createLocalModuleStub(request) {
  if (request === '../auth/jwt.guard') {
    return { JwtAuthGuard: class JwtAuthGuard {} };
  }

  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === '__esModule') return true;
        if (typeof prop !== 'string') return undefined;

        if (prop.startsWith('assert')) {
          return (value) => value;
        }

        if (prop.startsWith('build')) {
          return () => ({});
        }

        if (prop.startsWith('normalize')) {
          return (value) => value || {};
        }

        return class LocalStub {};
      },
    },
  );
}

function loadControllerClass() {
  const ts = require(path.join(apiRoot, 'node_modules/typescript'));
  const source = read(files.controller);

  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      experimentalDecorators: true,
      emitDecoratorMetadata: false,
      esModuleInterop: true,
    },
    fileName: files.controller,
  }).outputText;

  const module = { exports: {} };
  const sandbox = {
    require: (request) => {
      if (request === '@nestjs/common') return require(request);
      if (request.startsWith('.')) return createLocalModuleStub(request);
      if (request.startsWith('..')) return createLocalModuleStub(request);

      try {
        return require(request);
      } catch (error) {
        return createLocalModuleStub(request);
      }
    },
    module,
    exports: module.exports,
    __dirname: path.dirname(files.controller),
    __filename: files.controller,
    console,
    Date,
    Promise,
    String,
    Boolean,
    Number,
    Array,
    Object,
    JSON,
  };

  vm.runInNewContext(output, sandbox, {
    filename: files.controller.replace(/\.ts$/, '.js'),
  });

  return module.exports.ImportsController;
}

function buildAcceptedFakeExchangeResult(patch = {}) {
  return {
    accepted: true,
    reason: 'fake_exchange_accepted',
    messageRedacted: 'fake exchange accepted',
    transportMode: 'fake',
    tokenExchangeHttpCallNow: false,
    realSpApiRequestNow: false,
    companyId: patch.companyId || 'company-step139e-dry-run',
    storeId: patch.storeId || 'store-step139e-dry-run',
    marketplaceId: patch.marketplaceId || 'A1VC38T7YXB528',
    region: patch.region || 'JP',
    sanitizedTokenEnvelope: {
      encryptedRefreshToken: patch.encryptedRefreshToken || 'encrypted-refresh-token',
      encryptedAccessToken: patch.encryptedAccessToken || 'encrypted-access-token',
      tokenType: 'bearer',
      expiresInSeconds: 3600,
      scope: 'sellingpartnerapi::orders',
      encryptionKeyId: 'step139e-kms-key',
      encryptionAlgorithm: 'test-double-envelope-v1',
      tokenVersion: 1,
    },
    sanitizedResult: {
      tokenType: 'bearer',
      accessTokenExpiresAt: '2026-05-10T00:00:00.000Z',
    },
  };
}

function buildAcceptedPersistencePlan(patch = {}) {
  return {
    accepted: true,
    authorizationCodePresent: true,
    sellingPartnerId: patch.sellingPartnerId || 'A_SELLING_PARTNER_ID',
    refreshCredentialInput: {
      companyId: patch.companyId || 'company-step139e-dry-run',
      storeId: patch.storeId || 'store-step139e-dry-run',
      marketplaceId: patch.marketplaceId || 'A1VC38T7YXB528',
      region: patch.region || 'JP',
      appId: 'amzn1.application-oa2-client.step139e',
      sellingPartnerId: patch.sellingPartnerId || 'A_SELLING_PARTNER_ID',
      encryptedRefreshToken: patch.encryptedRefreshToken || 'encrypted-refresh-token',
      encryptionKeyId: 'step139e-kms-key',
      encryptionAlgorithm: 'test-double-envelope-v1',
      tokenVersion: 1,
      connectedAt: new Date('2026-05-10T00:00:00.000Z'),
      auditMessage: 'dry-run',
      auditMetadataJson: {},
    },
    accessTokenCacheInput: patch.withoutAccessToken
      ? null
      : {
          companyId: patch.companyId || 'company-step139e-dry-run',
          storeId: patch.storeId || 'store-step139e-dry-run',
          marketplaceId: patch.marketplaceId || 'A1VC38T7YXB528',
          region: patch.region || 'JP',
          encryptedAccessToken: 'encrypted-access-token',
          tokenType: 'bearer',
          expiresAt: new Date('2026-05-10T01:00:00.000Z'),
          scope: 'sellingpartnerapi::orders',
          auditMessage: 'dry-run',
          auditMetadataJson: {},
        },
    sanitizedResult: {
      companyId: patch.companyId || 'company-step139e-dry-run',
      storeId: patch.storeId || 'store-step139e-dry-run',
      marketplaceId: patch.marketplaceId || 'A1VC38T7YXB528',
      region: patch.region || 'JP',
      appId: 'amzn1.application-oa2-client.step139e',
      sellingPartnerId: patch.sellingPartnerId || 'A_SELLING_PARTNER_ID',
      tokenType: patch.withoutAccessToken ? null : 'bearer',
      accessTokenExpiresAt: patch.withoutAccessToken ? null : '2026-05-10T01:00:00.000Z',
      returnTo: '/ja/app/data/import',
    },
  };
}

function makeController({
  exchangeResult = buildAcceptedFakeExchangeResult(),
  persistencePlan = buildAcceptedPersistencePlan(),
  serviceDryRunResult = {
    accepted: true,
    reason: 'ready',
    messageRedacted: 'service dry-run accepted',
    serviceWiringMode: 'internal-service-only-no-controller-no-oauth-callback',
  },
} = {}) {
  const ControllerClass = loadControllerClass();

  const importsService = {};
  const bridgeService = {
    buildPersistencePlan: (...args) => {
      bridgeService.calls.push(args);
      return typeof persistencePlan === 'function' ? persistencePlan(...args) : persistencePlan;
    },
    validateStatePayload: () => ({ accepted: true }),
    calls: [],
  };
  const authorizationUrlService = {};
  const tokenExchangeService = {
    exchangeAuthorizationCodeDryRunnable: (...args) => {
      tokenExchangeService.exchangeCalls.push(args);
      return typeof exchangeResult === 'function' ? exchangeResult(...args) : exchangeResult;
    },
    runTokenPersistenceE2eServiceOnlyTestDouble: (...args) => {
      tokenExchangeService.persistenceDryRunCalls.push(args);
      return typeof serviceDryRunResult === 'function' ? serviceDryRunResult(...args) : serviceDryRunResult;
    },
    exchangeCalls: [],
    persistenceDryRunCalls: [],
  };

  const controller = new ControllerClass(
    importsService,
    bridgeService,
    authorizationUrlService,
    tokenExchangeService,
    {},
    {},
    {},
  );

  return { controller, bridgeService, tokenExchangeService };
}

async function runCase(label, deps, args, expectations) {
  const { controller, bridgeService, tokenExchangeService } = makeController(deps);
  const result = await controller.amazonSpApiOAuthCallbackBoundary(...args);

  assertSafe(result, label);

  for (const [key, expected] of Object.entries(expectations.result || {})) {
    assertEqual(result[key], expected, `${label} result.${key}`);
  }

  if (expectations.sanitizedResult) {
    for (const [key, expected] of Object.entries(expectations.sanitizedResult)) {
      assertEqual(result.sanitizedResult?.[key], expected, `${label} sanitizedResult.${key}`);
    }
  }

  if (expectations.exchangeCalls !== undefined) {
    assertEqual(tokenExchangeService.exchangeCalls.length, expectations.exchangeCalls, `${label} exchange call count`);
  }

  if (expectations.bridgeCalls !== undefined) {
    assertEqual(bridgeService.calls.length, expectations.bridgeCalls, `${label} bridge call count`);
  }

  if (expectations.persistenceDryRunCalls !== undefined) {
    assertEqual(tokenExchangeService.persistenceDryRunCalls.length, expectations.persistenceDryRunCalls, `${label} service dry-run call count`);
  }

  return result;
}

console.log('========== Step139-F OAuth callback dry-run-only controller branch runtime smoke ==========');

const pkg = JSON.parse(read(files.packageJson));
const controllerSource = read(files.controller);

assert(
  JSON.stringify(pkg.scripts || {}).includes('smoke:amazon-sp-api-oauth-callback-dry-run-controller-branch-runtime'),
  'package.json registers Step139-F smoke',
);

for (const marker of [
  'Step139-E: Amazon SP-API OAuth callback dry-run-only controller wiring implementation',
  "@Get('amazon-sp-api/oauth/callback')",
  'amazonSpApiOAuthCallbackBoundary',
  "wiringMode: 'controller-dry-run-only-no-persistence'",
  'runTokenPersistenceE2eServiceOnlyTestDouble',
  'tokenPersistenceDatabaseWriteNow: false',
  'plaintextTokenDatabaseWriteNow: false',
  'persistedConnection: null',
]) {
  assert(controllerSource.includes(marker), `controller contains marker: ${marker}`);
}

for (const forbidden of [
  'persistEncryptedRefreshCredential',
  'persistEncryptedAccessTokenCache',
  'tokenPersistenceDatabaseWriteNow: true',
  'plaintextTokenDatabaseWriteNow: true',
  'databaseWriteNow: true',
  'prismaClientWriteNow: true',
  'amazonNetworkCallNow: true',
  'realSpApiRequestNow: true',
  'rawAuthorizationCodeReturnedNow: true',
  'rawLwaResponseReturnedNow: true',
  'rawAccessTokenReturnedNow: true',
  'rawRefreshTokenReturnedNow: true',
  'controllerCallsServicePersistenceCommitNow: true',
  'oauthCallbackPersistenceWiringNow: true',
]) {
  assert(!controllerSource.includes(forbidden), `controller does not contain forbidden marker: ${forbidden}`);
}

(async () => {
  await runCase(
    'callback error',
    {},
    ['state-value', 'AUTHORIZATION_CODE_SECRET', undefined, 'SELLER123', 'access_denied', 'RAW_LWA_RESPONSE_SECRET'],
    {
      result: {
        accepted: false,
        status: 'callback_error',
        error: 'access_denied',
        errorDescriptionPresent: true,
      },
      exchangeCalls: 0,
      bridgeCalls: 0,
      persistenceDryRunCalls: 0,
    },
  );

  await runCase(
    'missing state',
    {},
    ['', 'AUTHORIZATION_CODE_SECRET', undefined, 'SELLER123', undefined, undefined],
    {
      result: {
        accepted: false,
        status: 'missing_state',
      },
      exchangeCalls: 0,
      bridgeCalls: 0,
      persistenceDryRunCalls: 0,
    },
  );

  await runCase(
    'missing authorization code',
    {},
    ['state-value', '', '', 'SELLER123', undefined, undefined],
    {
      result: {
        accepted: false,
        status: 'missing_authorization_code',
        statePresent: true,
      },
      exchangeCalls: 0,
      bridgeCalls: 0,
      persistenceDryRunCalls: 0,
    },
  );

  await runCase(
    'missing selling partner id',
    {},
    ['state-value', 'AUTHORIZATION_CODE_SECRET', undefined, '', undefined, undefined],
    {
      result: {
        accepted: false,
        status: 'missing_selling_partner_id',
        statePresent: true,
        authorizationCodePresent: true,
      },
      exchangeCalls: 0,
      bridgeCalls: 0,
      persistenceDryRunCalls: 0,
    },
  );

  await runCase(
    'exchange rejected',
    {
      exchangeResult: {
        accepted: false,
        reason: 'callback_state_not_trusted',
        messageRedacted: 'state rejected',
      },
    },
    ['state-value', 'AUTHORIZATION_CODE_SECRET', undefined, 'SELLER123', undefined, undefined],
    {
      result: {
        accepted: false,
        status: 'callback_state_not_trusted',
        tokenExchangeAttempted: true,
        tokenExchangeTransportMode: 'fake',
      },
      exchangeCalls: 1,
      bridgeCalls: 0,
      persistenceDryRunCalls: 0,
    },
  );

  await runCase(
    'persistence plan rejected',
    {
      persistencePlan: {
        accepted: false,
        reason: 'invalid_state',
        messageRedacted: 'state invalid',
      },
    },
    ['state-value', 'AUTHORIZATION_CODE_SECRET', undefined, 'SELLER123', undefined, undefined],
    {
      result: {
        accepted: false,
        status: 'invalid_state',
        tokenExchangeAttempted: true,
        tokenExchangeTransportMode: 'fake',
      },
      exchangeCalls: 1,
      bridgeCalls: 1,
      persistenceDryRunCalls: 0,
    },
  );

  await runCase(
    'service dry-run rejected',
    {
      serviceDryRunResult: {
        accepted: false,
        reason: 'orchestrator_rejected',
        messageRedacted: 'orchestrator rejected',
        serviceWiringMode: 'internal-service-only-no-controller-no-oauth-callback',
      },
    },
    ['state-value', 'AUTHORIZATION_CODE_SECRET', undefined, 'SELLER123', undefined, undefined],
    {
      result: {
        accepted: false,
        status: 'orchestrator_rejected',
        tokenExchangeAttempted: true,
        controllerCallsServicePersistenceDryRunNow: true,
        servicePersistenceDryRunAccepted: false,
        servicePersistenceReason: 'orchestrator_rejected',
        persistedConnection: null,
      },
      exchangeCalls: 1,
      bridgeCalls: 1,
      persistenceDryRunCalls: 1,
    },
  );

  await runCase(
    'dry-run success with code',
    {},
    ['state-value', 'AUTHORIZATION_CODE_SECRET', undefined, 'SELLER123', undefined, undefined],
    {
      result: {
        accepted: true,
        status: 'dry_run_token_persistence_ready',
        tokenExchangeAttempted: true,
        controllerCallsServicePersistenceDryRunNow: true,
        servicePersistenceDryRunAccepted: true,
        servicePersistenceReason: 'ready',
        persistedConnection: null,
      },
      sanitizedResult: {
        sellingPartnerId: 'SELLER123',
        tokenExchangePending: false,
        tokenPersistencePending: true,
        tokenPersistenceDryRunOnly: true,
      },
      exchangeCalls: 1,
      bridgeCalls: 1,
      persistenceDryRunCalls: 1,
    },
  );

  await runCase(
    'dry-run success with spapi_oauth_code',
    {},
    ['state-value', '', 'SPAPI_OAUTH_CODE_SECRET', 'SELLER456', undefined, undefined],
    {
      result: {
        accepted: true,
        status: 'dry_run_token_persistence_ready',
        spapiOauthCodeUsed: true,
        sellingPartnerId: 'SELLER456',
        tokenExchangeAttempted: true,
        controllerCallsServicePersistenceDryRunNow: true,
      },
      sanitizedResult: {
        sellingPartnerId: 'SELLER456',
        tokenPersistenceDryRunOnly: true,
      },
      exchangeCalls: 1,
      bridgeCalls: 1,
      persistenceDryRunCalls: 1,
    },
  );

  await runCase(
    'dry-run success without access token cache',
    {
      persistencePlan: buildAcceptedPersistencePlan({ withoutAccessToken: true }),
    },
    ['state-value', 'AUTHORIZATION_CODE_SECRET', undefined, 'SELLER789', undefined, undefined],
    {
      result: {
        accepted: true,
        status: 'dry_run_token_persistence_ready',
        tokenExchangeAttempted: true,
        controllerCallsServicePersistenceDryRunNow: true,
      },
      sanitizedResult: {
        tokenType: null,
        tokenPersistenceDryRunOnly: true,
      },
      exchangeCalls: 1,
      bridgeCalls: 1,
      persistenceDryRunCalls: 1,
    },
  );

  console.log('========== Step139-F OAuth callback dry-run-only controller branch runtime smoke passed ==========');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
