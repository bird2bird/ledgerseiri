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
                messageRedacted: 'legacy Step137-U smoke mock only',
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

function assertSafeTransportEnvelope(result, label) {
  assertEqual(result.transportMode, 'server-gated-real-lwa-http', `${label} transportMode`);

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
}

console.log('========== Step137-U executable real LWA HTTP transport guarded implementation smoke ==========');

const serviceSource = read(servicePath);
const controllerSource = read(controllerPath);
const pkg = JSON.parse(read(packagePath));

assert(
  JSON.stringify(pkg.scripts || {}).includes('smoke:amazon-sp-api-executable-real-lwa-http-transport-guarded-impl'),
  'package.json registers Step137-U smoke',
);

for (const marker of [
  'AmazonSpApiExecutableLwaHttpExecutorInput',
  'AmazonSpApiExecutableRealLwaHttpTransportInput',
  'executeRealLwaTokenExchangeHttpExecutableGuardedLater',
  "transportMode: 'server-gated-real-lwa-http'",
  "'missing_executor'",
  "'dry_run_must_be_false_for_executable_transport'",
  "'invalid_timeout'",
  "'invalid_max_response_bytes'",
  "'executor_exception'",
  'tokenPersistenceDatabaseWriteNow: false',
  'plaintextTokenDatabaseWriteNow: false',
  'rawRequestBodyReturnedNow: false',
  'rawLwaResponseReturnedNow: false',
  'rawAccessTokenReturnedNow: false',
  'rawRefreshTokenReturnedNow: false',
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
  const missingExecutor = await service.executeRealLwaTokenExchangeHttpExecutableGuardedLater(baseInput);
  assertEqual(missingExecutor.accepted, false, 'missing executor accepted false');
  assertEqual(missingExecutor.reason, 'missing_executor', 'missing executor reason');
  assertEqual(missingExecutor.executableHttpClientUsedNow, false, 'missing executor no http client');
  assertEqual(missingExecutor.networkCallNow, false, 'missing executor no network');
  assertEqual(missingExecutor.lwaHttpCallNow, false, 'missing executor no lwa http');
  assertSafeTransportEnvelope(missingExecutor, 'missing executor');

  const success = await service.executeRealLwaTokenExchangeHttpExecutableGuardedLater({
    ...baseInput,
    executor: async (request) => {
      assertEqual(request.method, 'POST', 'executor receives POST');
      assertEqual(request.tokenEndpoint, 'https://api.amazon.com/auth/o2/token', 'executor receives endpoint');
      assertEqual(request.contentType, 'application/x-www-form-urlencoded', 'executor receives content type');
      assertEqual(request.requestBodyFingerprint, 'request-body-fingerprint', 'executor receives fingerprint');
      assertEqual(request.requestBodyLength, 256, 'executor receives body length');
      assertEqual(request.timeoutMs, 10000, 'executor receives timeout');
      assertEqual(request.maxResponseBytes, 32768, 'executor receives max response bytes');
      return {
        httpStatus: 200,
        responseBody: JSON.stringify({
          access_token: 'ACCESS_TOKEN_SECRET_VALUE',
          refresh_token: 'REFRESH_TOKEN_SECRET_VALUE',
          token_type: 'bearer',
          expires_in: 3600,
        }),
        responseHeaders: { 'content-type': 'application/json' },
      };
    },
  });

  assertEqual(success.accepted, true, 'success accepted');
  assertEqual(success.reason, 'parsed', 'success parser reason');
  assertEqual(success.sanitizedParserAccepted, true, 'success parser accepted');
  assertEqual(success.executableHttpClientUsedNow, true, 'success used executor');
  assertEqual(success.networkCallNow, true, 'success network call flag');
  assertEqual(success.lwaHttpCallNow, true, 'success lwa http flag');
  assertSafeTransportEnvelope(success, 'success');

  const non2xx = await service.executeRealLwaTokenExchangeHttpExecutableGuardedLater({
    ...baseInput,
    executor: async () => ({
      httpStatus: 400,
      responseBody: JSON.stringify({ error: 'invalid_grant', error_description: 'should be redacted' }),
    }),
  });

  assertEqual(non2xx.accepted, false, 'non2xx accepted false');
  assertEqual(non2xx.reason, 'http_status_not_success', 'non2xx parser reason');
  assertEqual(non2xx.sanitizedParserAccepted, false, 'non2xx parser not accepted');
  assertEqual(non2xx.executableHttpClientUsedNow, true, 'non2xx used executor');
  assertSafeTransportEnvelope(non2xx, 'non2xx');

  const executorException = await service.executeRealLwaTokenExchangeHttpExecutableGuardedLater({
    ...baseInput,
    executor: async () => {
      throw new Error('CLIENT_SECRET_VALUE must not leak');
    },
  });

  assertEqual(executorException.accepted, false, 'executor exception accepted false');
  assertEqual(executorException.reason, 'executor_exception', 'executor exception reason');
  assertEqual(executorException.executableHttpClientUsedNow, true, 'executor exception used executor');
  assertEqual(executorException.networkCallNow, true, 'executor exception network attempted');
  assertSafeTransportEnvelope(executorException, 'executor exception');

  const dryRunStillTrue = await service.executeRealLwaTokenExchangeHttpExecutableGuardedLater({
    ...baseInput,
    dryRun: true,
  });

  assertEqual(dryRunStillTrue.reason, 'dry_run_must_be_false_for_executable_transport', 'dryRun true is blocked');
  assertEqual(dryRunStillTrue.networkCallNow, false, 'dryRun true no network');
  assertSafeTransportEnvelope(dryRunStillTrue, 'dryRun true');

  const invalidTimeout = await service.executeRealLwaTokenExchangeHttpExecutableGuardedLater({
    ...baseInput,
    timeoutMs: 10001,
  });

  assertEqual(invalidTimeout.reason, 'invalid_timeout', 'invalid timeout reason');
  assertEqual(invalidTimeout.networkCallNow, false, 'invalid timeout no network');
  assertSafeTransportEnvelope(invalidTimeout, 'invalid timeout');

  const invalidMaxBytes = await service.executeRealLwaTokenExchangeHttpExecutableGuardedLater({
    ...baseInput,
    maxResponseBytes: 32769,
  });

  assertEqual(invalidMaxBytes.reason, 'invalid_max_response_bytes', 'invalid max bytes reason');
  assertEqual(invalidMaxBytes.networkCallNow, false, 'invalid max bytes no network');
  assertSafeTransportEnvelope(invalidMaxBytes, 'invalid max bytes');

  console.log('========== Step137-U executable real LWA HTTP transport guarded implementation smoke passed ==========');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
