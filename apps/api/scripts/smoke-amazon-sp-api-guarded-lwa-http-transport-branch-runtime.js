const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '../../..');
const apiRoot = path.join(root, 'apps/api');

const servicePath = path.join(apiRoot, 'src/imports/amazon-sp-api-token-exchange.service.ts');
const controllerPath = path.join(apiRoot, 'src/imports/imports.controller.ts');

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

function assertSafeTransportEnvelope(result, label) {
  assertEqual(result.accepted, false, `${label} accepted remains false`);
  assertEqual(
    result.source,
    'amazon-sp-api-real-lwa-guarded-http-transport-test-double',
    `${label} source is guarded test double`,
  );
  assertEqual(result.transportMode, 'test-double-no-network', `${label} transport mode`);
  assertEqual(result.gateDecision, 'blocked', `${label} gate decision remains blocked`);

  for (const [key, expected] of [
    ['guardedHttpTransportPreparedNow', true],
    ['guardedHttpTransportImplementedNow', true],
    ['realHttpAllowedNow', false],
    ['realHttpEnabledNow', false],
    ['executableHttpClientUsedNow', false],
    ['networkCallNow', false],
    ['tokenExchangeHttpCallNow', false],
    ['lwaHttpCallNow', false],
    ['realSpApiRequestNow', false],
    ['tokenPersistenceDatabaseWriteNow', false],
    ['rawRequestBodyReturnedNow', false],
    ['rawLwaResponseReturnedNow', false],
    ['rawAccessTokenReturnedNow', false],
    ['rawRefreshTokenReturnedNow', false],
  ]) {
    assertEqual(result[key], expected, `${label} ${key}`);
  }

  assert(result.messageRedacted && !/access_token|refresh_token|client_secret/i.test(result.messageRedacted), `${label} message is redacted`);
  assert(result.sanitizedGuardedHttpTransportShape, `${label} has sanitized guarded shape`);
  assertEqual(
    result.sanitizedGuardedHttpTransportShape.nextImplementationStep,
    'Step137-J',
    `${label} next implementation step`,
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
    require,
    module,
    exports: module.exports,
    __dirname: path.dirname(servicePath),
    __filename: servicePath,
    console,
    URL,
  };

  vm.runInNewContext(output, sandbox, {
    filename: servicePath.replace(/\.ts$/, '.js'),
  });

  return module.exports.AmazonSpApiTokenExchangeService;
}

console.log('========== Step137-J guarded LWA HTTP transport branch runtime smoke ==========');

const serviceSource = read(servicePath);
const controllerSource = read(controllerPath);

assert(serviceSource.includes('executeRealLwaTokenExchangeHttpGuardedLater'), 'service has guarded method');
assert(serviceSource.includes("transportMode: 'test-double-no-network'"), 'service remains test-double transport');
assert(!controllerSource.includes('executeRealLwaTokenExchangeHttpGuardedLater'), 'controller does not wire guarded transport');
assert(!controllerSource.includes('executeRealLwaTokenExchangeHttpLater'), 'controller does not wire legacy transport');

for (const forbidden of [
  'fetch(',
  'axios.',
  'http.request',
  'https.request',
  'access_token',
  'refresh_token',
  'rawAccessTokenReturnedNow: true',
  'rawRefreshTokenReturnedNow: true',
  'networkCallNow: true',
  'executableHttpClientUsedNow: true',
  'tokenPersistenceDatabaseWriteNow: true',
  'realSpApiRequestNow: true',
]) {
  assert(!serviceSource.includes(forbidden), `service does not contain forbidden marker: ${forbidden}`);
}

const ServiceClass = loadServiceClass();
assert(typeof ServiceClass === 'function', 'AmazonSpApiTokenExchangeService class is loadable');

const service = new ServiceClass();
assert(
  typeof service.executeRealLwaTokenExchangeHttpGuardedLater === 'function',
  'guarded method is callable at runtime',
);

const baseInput = {
  activationGateDecision: 'eligible-later',
  realHttpAllowedNow: true,
  configValidatorStatus: 'ready',
  tokenEndpoint: 'https://api.amazon.com/auth/o2/token',
  tokenEndpointHttps: true,
  method: 'POST',
  contentType: 'application/x-www-form-urlencoded',
  requestBodyFingerprint: 'step137j-safe-fingerprint',
  requestBodyLength: 128,
  requestBodyBuilderReady: true,
  callbackStateTrusted: true,
  companyIdResolvedFromTrustedState: true,
  storeIdResolvedFromTrustedState: true,
  marketplaceId: 'A1VC38T7YXB528',
  region: 'fe',
  environmentAllowsRealLwaHttp: true,
  companyStoreAllowlisted: true,
  explicitOperatorConfirmed: true,
  dryRun: true,
};

const cases = [
  {
    name: 'activation gate blocked',
    patch: { activationGateDecision: 'blocked', realHttpAllowedNow: false },
    reason: 'activation_gate_not_allowed',
  },
  {
    name: 'config not ready',
    patch: { configValidatorStatus: 'missing_required_env' },
    reason: 'config_not_ready',
  },
  {
    name: 'token endpoint not https',
    patch: { tokenEndpoint: 'http://api.amazon.com/auth/o2/token', tokenEndpointHttps: false },
    reason: 'token_endpoint_not_https',
  },
  {
    name: 'request body builder not ready',
    patch: { requestBodyBuilderReady: false },
    reason: 'request_body_builder_not_ready',
  },
  {
    name: 'missing request body fingerprint',
    patch: { requestBodyFingerprint: '' },
    reason: 'missing_request_body_fingerprint',
  },
  {
    name: 'invalid request body length',
    patch: { requestBodyLength: 0 },
    reason: 'invalid_request_body_length',
  },
  {
    name: 'invalid content type',
    patch: { contentType: 'application/json' },
    reason: 'invalid_content_type',
  },
  {
    name: 'invalid method',
    patch: { method: 'GET' },
    reason: 'invalid_method',
  },
  {
    name: 'callback state not trusted',
    patch: { callbackStateTrusted: false },
    reason: 'callback_state_not_trusted',
  },
  {
    name: 'company id not resolved',
    patch: { companyIdResolvedFromTrustedState: false },
    reason: 'company_id_not_resolved',
  },
  {
    name: 'store id not resolved',
    patch: { storeIdResolvedFromTrustedState: false },
    reason: 'store_id_not_resolved',
  },
  {
    name: 'missing marketplace id',
    patch: { marketplaceId: '' },
    reason: 'missing_marketplace_id',
  },
  {
    name: 'missing region',
    patch: { region: '' },
    reason: 'missing_region',
  },
  {
    name: 'environment not allowed',
    patch: { environmentAllowsRealLwaHttp: false },
    reason: 'environment_not_allowed',
  },
  {
    name: 'company store not allowlisted',
    patch: { companyStoreAllowlisted: false },
    reason: 'company_store_not_allowlisted',
  },
  {
    name: 'operator confirmation missing',
    patch: { explicitOperatorConfirmed: false },
    reason: 'operator_confirmation_missing',
  },
  {
    name: 'dry run required',
    patch: { dryRun: false },
    reason: 'dry_run_required',
  },
  {
    name: 'all preconditions true still test double',
    patch: {},
    reason: 'guarded_http_test_double',
  },
];

for (const testCase of cases) {
  const input = { ...baseInput, ...testCase.patch };
  const result = service.executeRealLwaTokenExchangeHttpGuardedLater(input);
  assertEqual(result.reason, testCase.reason, `${testCase.name} returns expected reason`);
  assertSafeTransportEnvelope(result, testCase.name);
}

const successShape = service.executeRealLwaTokenExchangeHttpGuardedLater(baseInput)
  .sanitizedGuardedHttpTransportShape;

assertEqual(successShape.method, 'POST', 'sanitized shape method');
assertEqual(successShape.tokenEndpointHost, 'api.amazon.com', 'sanitized shape endpoint host');
assertEqual(successShape.tokenEndpointPath, '/auth/o2/token', 'sanitized shape endpoint path');
assertEqual(successShape.tokenEndpointHttps, true, 'sanitized shape endpoint https');
assertEqual(successShape.contentType, 'application/x-www-form-urlencoded', 'sanitized shape content type');
assertEqual(successShape.requestBodyBuilderReady, true, 'sanitized shape request body builder ready');
assertEqual(successShape.requestBodyFingerprintPresent, true, 'sanitized shape request fingerprint present');
assertEqual(successShape.requestBodyLength, 128, 'sanitized shape request body length');
assertEqual(successShape.callbackStateTrusted, true, 'sanitized shape callback trusted');
assertEqual(successShape.companyIdResolvedFromTrustedState, true, 'sanitized shape company resolved');
assertEqual(successShape.storeIdResolvedFromTrustedState, true, 'sanitized shape store resolved');
assertEqual(successShape.marketplaceIdPresent, true, 'sanitized shape marketplace present');
assertEqual(successShape.regionPresent, true, 'sanitized shape region present');
assertEqual(successShape.environmentAllowsRealLwaHttp, true, 'sanitized shape environment allows real LWA HTTP');
assertEqual(successShape.companyStoreAllowlisted, true, 'sanitized shape company/store allowlisted');
assertEqual(successShape.explicitOperatorConfirmed, true, 'sanitized shape operator confirmed');
assertEqual(successShape.dryRun, true, 'sanitized shape dry run');

console.log('========== Step137-J guarded LWA HTTP transport branch runtime smoke passed ==========');
