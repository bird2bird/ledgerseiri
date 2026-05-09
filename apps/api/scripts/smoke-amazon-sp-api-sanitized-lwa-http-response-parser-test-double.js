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

function assertSafeParserEnvelope(result, label) {
  assertEqual(result.source, 'amazon-sp-api-sanitized-lwa-http-response-parser', `${label} source`);
  assertEqual(result.parserMode, 'sanitized-only', `${label} parser mode`);

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

  const serialized = JSON.stringify(result);
  assert(!serialized.includes('ACCESS_TOKEN_SECRET_VALUE'), `${label} does not expose raw access token`);
  assert(!serialized.includes('REFRESH_TOKEN_SECRET_VALUE'), `${label} does not expose raw refresh token`);
  assert(!serialized.includes('client_secret'), `${label} does not expose client secret marker`);
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

console.log('========== Step137-N sanitized LWA HTTP response parser test-double smoke ==========');

const serviceSource = read(servicePath);
const controllerSource = read(controllerPath);
const pkg = JSON.parse(read(packagePath));

assert(
  JSON.stringify(pkg.scripts || {}).includes('smoke:amazon-sp-api-sanitized-lwa-http-response-parser-test-double'),
  'package.json registers Step137-N smoke',
);

for (const marker of [
  'export type AmazonSpApiSanitizedLwaHttpResponseParserInput',
  'export type AmazonSpApiSanitizedLwaHttpResponseParserSuccessResult',
  'export type AmazonSpApiSanitizedLwaHttpResponseParserFailureResult',
  'parseRealLwaHttpResponseSanitizedLater',
  "source: 'amazon-sp-api-sanitized-lwa-http-response-parser'",
  "parserMode: 'sanitized-only'",
  "'http_status_not_success'",
  "'missing_response_body'",
  "'malformed_json'",
  "'missing_access_token'",
  "'missing_refresh_token'",
  "'missing_token_type'",
  "'invalid_token_type'",
  "'missing_expires_in'",
  "'invalid_expires_in'",
  "'response_body_too_large'",
  "'unexpected_parser_exception'",
  'rawLwaResponseReturnedNow: false',
  'rawResponseBodyReturnedNow: false',
  'rawResponseHeadersReturnedNow: false',
  'rawAccessTokenReturnedNow: false',
  'rawRefreshTokenReturnedNow: false',
  'tokenPersistenceDatabaseWriteNow: false',
]) {
  assert(serviceSource.includes(marker), `service contains marker: ${marker}`);
}

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
  'parser method is callable at runtime',
);

const successBody = JSON.stringify({
  access_token: 'ACCESS_TOKEN_SECRET_VALUE',
  refresh_token: 'REFRESH_TOKEN_SECRET_VALUE',
  token_type: 'bearer',
  expires_in: 3600,
  scope: 'sellingpartnerapi::migration',
});

const success = service.parseRealLwaHttpResponseSanitizedLater({
  httpStatus: 200,
  responseBody: successBody,
  responseHeaders: { 'content-type': 'application/json' },
  maxResponseBytes: 32768,
});

assertEqual(success.accepted, true, 'success accepted');
assertEqual(success.reason, 'parsed', 'success reason');
assertEqual(success.tokenType, 'bearer', 'success token type');
assertEqual(success.expiresInSeconds, 3600, 'success expires');
assertEqual(success.scope, 'sellingpartnerapi::migration', 'success scope');
assertEqual(success.accessTokenPresent, true, 'success access token present');
assertEqual(success.refreshTokenPresent, true, 'success refresh token present');
assertEqual(success.accessTokenLength, 'ACCESS_TOKEN_SECRET_VALUE'.length, 'success access token length');
assertEqual(success.refreshTokenLength, 'REFRESH_TOKEN_SECRET_VALUE'.length, 'success refresh token length');
assert(success.accessTokenFingerprint && success.accessTokenFingerprint.length > 0, 'success access token fingerprint exists');
assert(success.refreshTokenFingerprint && success.refreshTokenFingerprint.length > 0, 'success refresh token fingerprint exists');
assertSafeParserEnvelope(success, 'success');

const cases = [
  {
    name: 'http status not success',
    input: {
      httpStatus: 400,
      responseBody: JSON.stringify({
        error: 'invalid_grant',
        error_description: 'should be redacted',
      }),
      maxResponseBytes: 32768,
    },
    reason: 'http_status_not_success',
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
    name: 'invalid expires in',
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
    name: 'response body too large',
    input: {
      httpStatus: 200,
      responseBody: successBody,
      maxResponseBytes: 8,
    },
    reason: 'response_body_too_large',
  },
];

for (const testCase of cases) {
  const result = service.parseRealLwaHttpResponseSanitizedLater(testCase.input);
  assertEqual(result.accepted, false, `${testCase.name} accepted false`);
  assertEqual(result.reason, testCase.reason, `${testCase.name} reason`);
  assertSafeParserEnvelope(result, testCase.name);
}

const errorResult = service.parseRealLwaHttpResponseSanitizedLater({
  httpStatus: 401,
  responseBody: JSON.stringify({
    error: 'invalid_client',
    error_description: 'client secret leaked text must not appear',
  }),
  maxResponseBytes: 32768,
});

assertEqual(errorResult.amazonErrorCode, 'invalid_client', 'amazon error code is sanitized');
assertEqual(
  errorResult.amazonErrorDescriptionRedacted,
  '[redacted-amazon-error-description]',
  'amazon error description is redacted',
);
assert(!JSON.stringify(errorResult).includes('client secret leaked text'), 'amazon error description raw text is absent');

console.log('========== Step137-N sanitized LWA HTTP response parser test-double smoke passed ==========');
