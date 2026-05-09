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

function assertNotContainsSerialized(result, forbidden, label) {
  assert(!JSON.stringify(result).includes(forbidden), `${label} does not expose ${forbidden}`);
}

function assertSafeEnvelope(result, label) {
  assertEqual(result.source, 'amazon-sp-api-sanitized-lwa-http-response-parser', `${label} source`);
  assertEqual(result.parserMode, 'sanitized-only', `${label} parserMode`);

  for (const [key, expected] of [
    ['rawLwaResponseReturnedNow', false],
    ['rawResponseBodyReturnedNow', false],
    ['rawResponseHeadersReturnedNow', false],
    ['rawAccessTokenReturnedNow', false],
    ['rawRefreshTokenReturnedNow', false],
    ['tokenPersistenceDatabaseWriteNow', false],
  ]) {
    assertEqual(result[key], expected, `${label} ${key}`);
  }

  assertNotContainsSerialized(result, 'ACCESS_TOKEN_SECRET_VALUE', label);
  assertNotContainsSerialized(result, 'REFRESH_TOKEN_SECRET_VALUE', label);
  assertNotContainsSerialized(result, 'client secret leaked text must not appear', label);
  assertNotContainsSerialized(result, 'should be redacted', label);
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
    Buffer,
  };

  vm.runInNewContext(output, sandbox, {
    filename: servicePath.replace(/\.ts$/, '.js'),
  });

  return module.exports.AmazonSpApiTokenExchangeService;
}

console.log('========== Step137-O sanitized LWA parser branch runtime smoke ==========');

const serviceSource = read(servicePath);
const controllerSource = read(controllerPath);
const pkg = JSON.parse(read(packagePath));

assert(
  JSON.stringify(pkg.scripts || {}).includes('smoke:amazon-sp-api-sanitized-lwa-parser-branch-runtime'),
  'package.json registers Step137-O smoke',
);

assert(serviceSource.includes('parseRealLwaHttpResponseSanitizedLater'), 'service has parser method');
assert(serviceSource.includes("source: 'amazon-sp-api-sanitized-lwa-http-response-parser'"), 'service has parser source');
assert(serviceSource.includes("parserMode: 'sanitized-only'"), 'service has sanitized parser mode');

for (const forbidden of [
  'fetch(',
  'axios.',
  'http.request',
  'https.request',
  'rawAccessTokenReturnedNow: true',
  'rawRefreshTokenReturnedNow: true',
  'rawLwaResponseReturnedNow: true',
  'rawResponseBodyReturnedNow: true',
  'tokenPersistenceDatabaseWriteNow: true',
  'ACCESS_TOKEN_SECRET_VALUE',
  'REFRESH_TOKEN_SECRET_VALUE',
]) {
  assert(!serviceSource.includes(forbidden), `service does not contain forbidden marker: ${forbidden}`);
}

assert(!controllerSource.includes('parseRealLwaHttpResponseSanitizedLater'), 'controller does not reference parser');
assert(!controllerSource.includes('executeRealLwaTokenExchangeHttpGuardedLater'), 'controller does not wire guarded transport');
assert(!controllerSource.includes('executeRealLwaTokenExchangeHttpLater'), 'controller does not wire legacy transport');

const ServiceClass = loadServiceClass();
const service = new ServiceClass();

assert(
  typeof service.parseRealLwaHttpResponseSanitizedLater === 'function',
  'parser method is callable',
);

const successBody = JSON.stringify({
  access_token: 'ACCESS_TOKEN_SECRET_VALUE',
  refresh_token: 'REFRESH_TOKEN_SECRET_VALUE',
  token_type: 'bearer',
  expires_in: 3600,
  scope: 'sellingpartnerapi::migration',
});

const successWithNumericExpires = service.parseRealLwaHttpResponseSanitizedLater({
  httpStatus: 200,
  responseBody: successBody,
  maxResponseBytes: 32768,
});

assertEqual(successWithNumericExpires.accepted, true, 'numeric expires success accepted');
assertEqual(successWithNumericExpires.reason, 'parsed', 'numeric expires success reason');
assertEqual(successWithNumericExpires.expiresInSeconds, 3600, 'numeric expires parsed');
assertEqual(successWithNumericExpires.scope, 'sellingpartnerapi::migration', 'scope preserved as metadata');
assert(successWithNumericExpires.responseBodyFingerprint, 'success has response body fingerprint');
assert(successWithNumericExpires.accessTokenFingerprint, 'success has access token fingerprint');
assert(successWithNumericExpires.refreshTokenFingerprint, 'success has refresh token fingerprint');
assertSafeEnvelope(successWithNumericExpires, 'numeric expires success');

const successWithStringExpires = service.parseRealLwaHttpResponseSanitizedLater({
  httpStatus: 201,
  responseBody: JSON.stringify({
    access_token: 'ACCESS_TOKEN_SECRET_VALUE',
    refresh_token: 'REFRESH_TOKEN_SECRET_VALUE',
    token_type: 'Bearer',
    expires_in: '7200',
  }),
  maxResponseBytes: 32768,
});

assertEqual(successWithStringExpires.accepted, true, 'string expires success accepted');
assertEqual(successWithStringExpires.expiresInSeconds, 7200, 'string expires parsed');
assertEqual(successWithStringExpires.scope, null, 'missing optional scope becomes null');
assertSafeEnvelope(successWithStringExpires, 'string expires success');

const failureCases = [
  {
    name: 'http 400 sanitized amazon error',
    input: {
      httpStatus: 400,
      responseBody: JSON.stringify({
        error: 'invalid_grant',
        error_description: 'should be redacted',
      }),
      maxResponseBytes: 32768,
    },
    reason: 'http_status_not_success',
    extra(result) {
      assertEqual(result.amazonErrorCode, 'invalid_grant', 'amazon error code preserved');
      assertEqual(
        result.amazonErrorDescriptionRedacted,
        '[redacted-amazon-error-description]',
        'amazon error description redacted',
      );
    },
  },
  {
    name: 'http 500 malformed error body',
    input: {
      httpStatus: 500,
      responseBody: '{not-json',
      maxResponseBytes: 32768,
    },
    reason: 'http_status_not_success',
    extra(result) {
      assertEqual(result.amazonErrorCode, null, 'malformed error code null');
      assertEqual(result.amazonErrorDescriptionRedacted, null, 'malformed error description null');
    },
  },
  {
    name: 'missing response body',
    input: { httpStatus: 200, responseBody: '', maxResponseBytes: 32768 },
    reason: 'missing_response_body',
  },
  {
    name: 'malformed json',
    input: { httpStatus: 200, responseBody: '{bad-json', maxResponseBytes: 32768 },
    reason: 'malformed_json',
  },
  {
    name: 'json null',
    input: { httpStatus: 200, responseBody: 'null', maxResponseBytes: 32768 },
    reason: 'malformed_json',
  },
  {
    name: 'json array',
    input: { httpStatus: 200, responseBody: '[]', maxResponseBytes: 32768 },
    reason: 'missing_access_token',
  },
  {
    name: 'missing access token',
    input: {
      httpStatus: 200,
      responseBody: JSON.stringify({
        refresh_token: 'REFRESH_TOKEN_SECRET_VALUE',
        token_type: 'bearer',
        expires_in: 3600,
      }),
      maxResponseBytes: 32768,
    },
    reason: 'missing_access_token',
  },
  {
    name: 'blank access token',
    input: {
      httpStatus: 200,
      responseBody: JSON.stringify({
        access_token: '',
        refresh_token: 'REFRESH_TOKEN_SECRET_VALUE',
        token_type: 'bearer',
        expires_in: 3600,
      }),
      maxResponseBytes: 32768,
    },
    reason: 'missing_access_token',
  },
  {
    name: 'missing refresh token',
    input: {
      httpStatus: 200,
      responseBody: JSON.stringify({
        access_token: 'ACCESS_TOKEN_SECRET_VALUE',
        token_type: 'bearer',
        expires_in: 3600,
      }),
      maxResponseBytes: 32768,
    },
    reason: 'missing_refresh_token',
  },
  {
    name: 'missing token type',
    input: {
      httpStatus: 200,
      responseBody: JSON.stringify({
        access_token: 'ACCESS_TOKEN_SECRET_VALUE',
        refresh_token: 'REFRESH_TOKEN_SECRET_VALUE',
        expires_in: 3600,
      }),
      maxResponseBytes: 32768,
    },
    reason: 'missing_token_type',
  },
  {
    name: 'invalid token type',
    input: {
      httpStatus: 200,
      responseBody: JSON.stringify({
        access_token: 'ACCESS_TOKEN_SECRET_VALUE',
        refresh_token: 'REFRESH_TOKEN_SECRET_VALUE',
        token_type: 'mac',
        expires_in: 3600,
      }),
      maxResponseBytes: 32768,
    },
    reason: 'invalid_token_type',
  },
  {
    name: 'missing expires in',
    input: {
      httpStatus: 200,
      responseBody: JSON.stringify({
        access_token: 'ACCESS_TOKEN_SECRET_VALUE',
        refresh_token: 'REFRESH_TOKEN_SECRET_VALUE',
        token_type: 'bearer',
      }),
      maxResponseBytes: 32768,
    },
    reason: 'missing_expires_in',
  },
  {
    name: 'invalid expires zero',
    input: {
      httpStatus: 200,
      responseBody: JSON.stringify({
        access_token: 'ACCESS_TOKEN_SECRET_VALUE',
        refresh_token: 'REFRESH_TOKEN_SECRET_VALUE',
        token_type: 'bearer',
        expires_in: 0,
      }),
      maxResponseBytes: 32768,
    },
    reason: 'invalid_expires_in',
  },
  {
    name: 'invalid expires string',
    input: {
      httpStatus: 200,
      responseBody: JSON.stringify({
        access_token: 'ACCESS_TOKEN_SECRET_VALUE',
        refresh_token: 'REFRESH_TOKEN_SECRET_VALUE',
        token_type: 'bearer',
        expires_in: 'not-a-number',
      }),
      maxResponseBytes: 32768,
    },
    reason: 'invalid_expires_in',
  },
  {
    name: 'response body too large',
    input: {
      httpStatus: 200,
      responseBody: successBody,
      maxResponseBytes: 8,
    },
    reason: 'response_body_too_large',
  },
];

for (const testCase of failureCases) {
  const result = service.parseRealLwaHttpResponseSanitizedLater(testCase.input);
  assertEqual(result.accepted, false, `${testCase.name} accepted false`);
  assertEqual(result.reason, testCase.reason, `${testCase.name} reason`);
  assertSafeEnvelope(result, testCase.name);

  if (typeof testCase.extra === 'function') {
    testCase.extra(result);
  }
}

console.log('========== Step137-O sanitized LWA parser branch runtime smoke passed ==========');
