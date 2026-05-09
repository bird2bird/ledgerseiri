const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '../../..');
const apiRoot = path.join(root, 'apps/api');

const servicePath = path.join(apiRoot, 'src/imports/amazon-sp-api-token-exchange.service.ts');
const controllerPath = path.join(apiRoot, 'src/imports/imports.controller.ts');
const packagePath = path.join(apiRoot, 'package.json');

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

function loadServiceClass() {
  const ts = require(path.join(apiRoot, 'node_modules/typescript'));
  const source = read(servicePath);

  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      experimentalDecorators: true,
      emitDecoratorMetadata: false,
      esModuleInterop: true,
    },
    fileName: servicePath,
  }).outputText;

  const module = { exports: {} };
  const sandbox = {
    require: (request) => {
      if (request === './amazon-sp-api-token-persistence-e2e.runner') {
        return {
          AmazonSpApiTokenPersistenceE2eRunner: class AmazonSpApiTokenPersistenceE2eRunner {
            runTokenPersistenceE2eTestDouble(input) {
              return {
                accepted: input?.activationGateAccepted === true,
                source: 'amazon-sp-api-token-persistence-e2e-runner',
                runnerMode: 'test-double-no-controller-no-prisma-write-no-amazon-call',
                reason: input?.activationGateAccepted === true ? 'ready' : 'activation_gate_not_accepted',
                messageRedacted: 'legacy Step137-V smoke mock only',
                activationGateAccepted: input?.activationGateAccepted === true,
                executableTransportAccepted: input?.executableTransportAccepted === true,
                sanitizedParserAccepted: input?.sanitizedParserAccepted === true,
                encryptedPersistenceInputAccepted: input?.encryptedPersistenceInputAccepted === true,
                orchestratorAccepted: input?.activationGateAccepted === true,
                repositoryAccepted: input?.activationGateAccepted === true,
                companyIdPresent: Boolean(input?.companyId),
                storeIdPresent: Boolean(input?.storeId),
                marketplaceIdPresent: Boolean(input?.marketplaceId),
                regionPresent: Boolean(input?.region),
                sellingPartnerIdPresent: Boolean(input?.sellingPartnerId),
                controllerWiringNow: false,
                oauthCallbackWiringNow: false,
                amazonNetworkCallNow: false,
                executableHttpClientUsedNow: false,
                realSpApiRequestNow: false,
                prismaClientWriteNow: false,
                databaseWriteNow: false,
                tokenPersistenceDatabaseWriteNow: false,
                plaintextTokenDatabaseWriteNow: false,
                rawTokenReturnedNow: false,
                rawLwaResponseReturnedNow: false,
              };
            }
          },
        };
      }

      try {
        return require(request);
      } catch (error) {
        return {};
      }
    },
    module,
    exports: module.exports,
    __dirname: path.dirname(servicePath),
    __filename: servicePath,
    console,
    URL,
    Buffer,
  };

  vm.runInNewContext(output, sandbox, {
    filename: servicePath.replace(/\.ts$/, '.js'),
  });

  return module.exports.AmazonSpApiTokenExchangeService;
}

function assertSafeEnvelope(result, label) {
  assertEqual(result.transportMode, 'server-gated-real-lwa-http', `${label} transport mode`);

  for (const [key, expected] of [
    ['realSpApiRequestNow', false],
    ['tokenPersistenceDatabaseWriteNow', false],
    ['plaintextTokenDatabaseWriteNow', false],
    ['rawRequestBodyReturnedNow', false],
    ['rawLwaResponseReturnedNow', false],
    ['rawAccessTokenReturnedNow', false],
    ['rawRefreshTokenReturnedNow', false],
  ]) {
    assertEqual(result[key], expected, `${label} ${key}`);
  }

  const serialized = JSON.stringify(result);
  assert(!serialized.includes('ACCESS_TOKEN_SECRET_VALUE'), `${label} does not expose raw access token`);
  assert(!serialized.includes('REFRESH_TOKEN_SECRET_VALUE'), `${label} does not expose raw refresh token`);
  assert(!serialized.includes('CLIENT_SECRET_VALUE'), `${label} does not expose raw client secret`);
  assert(!serialized.includes('AUTHORIZATION_CODE_VALUE'), `${label} does not expose authorization code`);
}

async function expectBlocked(service, baseInput, label, patch, expectedReason) {
  let executorCalled = false;

  const result = await service.executeRealLwaTokenExchangeHttpExecutableGuardedLater({
    ...baseInput,
    ...patch,
    executor: async () => {
      executorCalled = true;
      return {
        httpStatus: 200,
        responseBody: '{}',
      };
    },
  });

  assertEqual(result.accepted, false, `${label} accepted false`);
  assertEqual(result.reason, expectedReason, `${label} reason`);
  assertEqual(executorCalled, false, `${label} executor not called`);
  assertEqual(result.executableHttpClientUsedNow, false, `${label} http client not used`);
  assertEqual(result.networkCallNow, false, `${label} network not called`);
  assertEqual(result.lwaHttpCallNow, false, `${label} lwa http not called`);
  assertSafeEnvelope(result, label);
}

console.log('========== Step137-V executable LWA HTTP transport branch runtime smoke ==========');

const serviceSource = read(servicePath);
const controllerSource = read(controllerPath);
const pkg = JSON.parse(read(packagePath));

assert(
  JSON.stringify(pkg.scripts || {}).includes('smoke:amazon-sp-api-executable-lwa-http-transport-branch-runtime'),
  'package.json registers Step137-V smoke',
);

for (const marker of [
  'executeRealLwaTokenExchangeHttpExecutableGuardedLater',
  'AmazonSpApiExecutableRealLwaHttpTransportInput',
  "transportMode: 'server-gated-real-lwa-http'",
  "'missing_executor'",
  "'activation_gate_not_allowed'",
  "'config_not_ready'",
  "'token_endpoint_not_https'",
  "'request_body_builder_not_ready'",
  "'missing_request_body_fingerprint'",
  "'invalid_request_body_length'",
  "'invalid_content_type'",
  "'invalid_method'",
  "'callback_state_not_trusted'",
  "'company_id_not_resolved'",
  "'store_id_not_resolved'",
  "'missing_marketplace_id'",
  "'missing_region'",
  "'environment_not_allowed'",
  "'company_store_not_allowlisted'",
  "'operator_confirmation_missing'",
  "'dry_run_must_be_false_for_executable_transport'",
  "'invalid_timeout'",
  "'invalid_max_response_bytes'",
  "'executor_exception'",
]) {
  assert(serviceSource.includes(marker), `service contains marker: ${marker}`);
}

for (const forbidden of [
  'fetch(',
  'axios.',
  'http.request',
  'https.request',
  'tokenPersistenceDatabaseWriteNow: true',
  'plaintextTokenDatabaseWriteNow: true',
  'rawRequestBodyReturnedNow: true',
  'rawLwaResponseReturnedNow: true',
  'rawAccessTokenReturnedNow: true',
  'rawRefreshTokenReturnedNow: true',
  'ACCESS_TOKEN_SECRET_VALUE',
  'REFRESH_TOKEN_SECRET_VALUE',
  'CLIENT_SECRET_VALUE',
  'AUTHORIZATION_CODE_VALUE',
]) {
  assert(!serviceSource.includes(forbidden), `service does not contain forbidden marker: ${forbidden}`);
}

assert(!controllerSource.includes('executeRealLwaTokenExchangeHttpExecutableGuardedLater'), 'controller does not call executable transport');
assert(!controllerSource.includes('executeRealLwaTokenExchangeHttpGuardedLater'), 'controller does not call guarded transport');
assert(!controllerSource.includes('parseRealLwaHttpResponseSanitizedLater'), 'controller does not reference parser');
assert(!controllerSource.includes('prepareEncryptedTokenPersistenceInputLater'), 'controller does not reference persistence builder');

const ServiceClass = loadServiceClass();
const service = new ServiceClass();

assert(
  typeof service.executeRealLwaTokenExchangeHttpExecutableGuardedLater === 'function',
  'executable guarded method is callable',
);

const baseInput = {
  activationGateDecision: 'eligible-later',
  realHttpAllowedNow: true,
  configValidatorStatus: 'ready',
  tokenEndpoint: 'https://api.amazon.com/auth/o2/token',
  tokenEndpointHttps: true,
  method: 'POST',
  contentType: 'application/x-www-form-urlencoded',
  requestBodyFingerprint: 'request-body-fingerprint',
  requestBodyLength: 256,
  requestBodyBuilderReady: true,
  callbackStateTrusted: true,
  companyIdResolvedFromTrustedState: true,
  storeIdResolvedFromTrustedState: true,
  marketplaceId: 'A1VC38T7YXB528',
  region: 'fe',
  environmentAllowsRealLwaHttp: true,
  companyStoreAllowlisted: true,
  explicitOperatorConfirmed: true,
  dryRun: false,
  timeoutMs: 10000,
  maxResponseBytes: 32768,
};

(async () => {
  const blockedCases = [
    ['activation gate blocked', { activationGateDecision: 'blocked' }, 'activation_gate_not_allowed'],
    ['real http not allowed', { realHttpAllowedNow: false }, 'activation_gate_not_allowed'],
    ['config not ready', { configValidatorStatus: 'missing_required_env' }, 'config_not_ready'],
    ['token endpoint http', { tokenEndpoint: 'http://api.amazon.com/auth/o2/token', tokenEndpointHttps: false }, 'token_endpoint_not_https'],
    ['token endpoint malformed', { tokenEndpoint: 'not-a-url', tokenEndpointHttps: true }, 'token_endpoint_not_https'],
    ['request body builder not ready', { requestBodyBuilderReady: false }, 'request_body_builder_not_ready'],
    ['missing request body fingerprint', { requestBodyFingerprint: '' }, 'missing_request_body_fingerprint'],
    ['invalid request body length zero', { requestBodyLength: 0 }, 'invalid_request_body_length'],
    ['invalid request body length negative', { requestBodyLength: -1 }, 'invalid_request_body_length'],
    ['invalid content type', { contentType: 'application/json' }, 'invalid_content_type'],
    ['invalid method', { method: 'GET' }, 'invalid_method'],
    ['callback state not trusted', { callbackStateTrusted: false }, 'callback_state_not_trusted'],
    ['company id not resolved', { companyIdResolvedFromTrustedState: false }, 'company_id_not_resolved'],
    ['store id not resolved', { storeIdResolvedFromTrustedState: false }, 'store_id_not_resolved'],
    ['missing marketplace id', { marketplaceId: '' }, 'missing_marketplace_id'],
    ['missing region', { region: '' }, 'missing_region'],
    ['environment not allowed', { environmentAllowsRealLwaHttp: false }, 'environment_not_allowed'],
    ['company store not allowlisted', { companyStoreAllowlisted: false }, 'company_store_not_allowlisted'],
    ['operator confirmation missing', { explicitOperatorConfirmed: false }, 'operator_confirmation_missing'],
    ['dry run true blocked', { dryRun: true }, 'dry_run_must_be_false_for_executable_transport'],
    ['invalid timeout zero', { timeoutMs: 0 }, 'invalid_timeout'],
    ['invalid timeout too high', { timeoutMs: 10001 }, 'invalid_timeout'],
    ['invalid max response bytes zero', { maxResponseBytes: 0 }, 'invalid_max_response_bytes'],
    ['invalid max response bytes too high', { maxResponseBytes: 32769 }, 'invalid_max_response_bytes'],
  ];

  for (const [label, patch, expectedReason] of blockedCases) {
    await expectBlocked(service, baseInput, label, patch, expectedReason);
  }

  const missingExecutor = await service.executeRealLwaTokenExchangeHttpExecutableGuardedLater(baseInput);
  assertEqual(missingExecutor.accepted, false, 'missing executor accepted false');
  assertEqual(missingExecutor.reason, 'missing_executor', 'missing executor reason');
  assertEqual(missingExecutor.executableHttpClientUsedNow, false, 'missing executor http client false');
  assertEqual(missingExecutor.networkCallNow, false, 'missing executor network false');
  assertEqual(missingExecutor.lwaHttpCallNow, false, 'missing executor lwa http false');
  assertSafeEnvelope(missingExecutor, 'missing executor');

  let successExecutorCalled = false;
  const success = await service.executeRealLwaTokenExchangeHttpExecutableGuardedLater({
    ...baseInput,
    timeoutMs: 9999,
    maxResponseBytes: 32767,
    executor: async (request) => {
      successExecutorCalled = true;
      assertEqual(request.method, 'POST', 'success executor receives POST');
      assertEqual(request.tokenEndpoint, 'https://api.amazon.com/auth/o2/token', 'success executor endpoint');
      assertEqual(request.contentType, 'application/x-www-form-urlencoded', 'success executor content type');
      assertEqual(request.requestBodyFingerprint, 'request-body-fingerprint', 'success executor fingerprint');
      assertEqual(request.requestBodyLength, 256, 'success executor request body length');
      assertEqual(request.timeoutMs, 9999, 'success executor timeout');
      assertEqual(request.maxResponseBytes, 32767, 'success executor max response bytes');

      return {
        httpStatus: 200,
        responseBody: JSON.stringify({
          access_token: 'ACCESS_TOKEN_SECRET_VALUE',
          refresh_token: 'REFRESH_TOKEN_SECRET_VALUE',
          token_type: 'bearer',
          expires_in: 3600,
          scope: 'sellingpartnerapi::migration',
        }),
        responseHeaders: { 'content-type': 'application/json' },
      };
    },
  });

  assertEqual(successExecutorCalled, true, 'success executor called');
  assertEqual(success.accepted, true, 'success accepted');
  assertEqual(success.reason, 'parsed', 'success reason');
  assertEqual(success.sanitizedParserAccepted, true, 'success parser accepted');
  assertEqual(success.executableHttpClientUsedNow, true, 'success executable client used');
  assertEqual(success.networkCallNow, true, 'success network call flag true');
  assertEqual(success.lwaHttpCallNow, true, 'success lwa http call flag true');
  assertSafeEnvelope(success, 'success');

  const non2xx = await service.executeRealLwaTokenExchangeHttpExecutableGuardedLater({
    ...baseInput,
    executor: async () => ({
      httpStatus: 400,
      responseBody: JSON.stringify({
        error: 'invalid_grant',
        error_description: 'CLIENT_SECRET_VALUE should be redacted',
      }),
    }),
  });

  assertEqual(non2xx.accepted, false, 'non2xx accepted false');
  assertEqual(non2xx.reason, 'http_status_not_success', 'non2xx reason');
  assertEqual(non2xx.sanitizedParserAccepted, false, 'non2xx parser accepted false');
  assertEqual(non2xx.executableHttpClientUsedNow, true, 'non2xx executor used');
  assertEqual(non2xx.networkCallNow, true, 'non2xx network true');
  assertEqual(non2xx.lwaHttpCallNow, true, 'non2xx lwa http true');
  assertSafeEnvelope(non2xx, 'non2xx');

  const malformedParserResponse = await service.executeRealLwaTokenExchangeHttpExecutableGuardedLater({
    ...baseInput,
    executor: async () => ({
      httpStatus: 200,
      responseBody: '{bad-json',
    }),
  });

  assertEqual(malformedParserResponse.accepted, false, 'malformed parser response accepted false');
  assertEqual(malformedParserResponse.reason, 'malformed_json', 'malformed parser response reason');
  assertEqual(malformedParserResponse.sanitizedParserAccepted, false, 'malformed parser accepted false');
  assertSafeEnvelope(malformedParserResponse, 'malformed parser response');

  const executorException = await service.executeRealLwaTokenExchangeHttpExecutableGuardedLater({
    ...baseInput,
    executor: async () => {
      throw new Error('CLIENT_SECRET_VALUE must not leak');
    },
  });

  assertEqual(executorException.accepted, false, 'executor exception accepted false');
  assertEqual(executorException.reason, 'executor_exception', 'executor exception reason');
  assertEqual(executorException.executableHttpClientUsedNow, true, 'executor exception client used');
  assertEqual(executorException.networkCallNow, true, 'executor exception network attempted');
  assertEqual(executorException.lwaHttpCallNow, true, 'executor exception lwa http attempted');
  assertSafeEnvelope(executorException, 'executor exception');

  console.log('========== Step137-V executable LWA HTTP transport branch runtime smoke passed ==========');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
