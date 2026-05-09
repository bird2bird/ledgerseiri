const fs = require('fs');
const path = require('path');
const Module = require('module');
const ts = require('typescript');

const root = path.resolve(__dirname, '../../..');

const serviceFile = path.join(
  root,
  'apps/api/src/imports/amazon-sp-api-token-exchange.service.ts',
);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
  console.log(`[OK] ${message}`);
}

function loadServiceClass() {
  const source = fs.readFileSync(serviceFile, 'utf8');

  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      experimentalDecorators: true,
      emitDecoratorMetadata: false,
      esModuleInterop: true,
    },
    fileName: serviceFile,
  }).outputText;

  const m = new Module(serviceFile, module.parent);
  m.filename = serviceFile;
  m.paths = Module._nodeModulePaths(path.dirname(serviceFile));
  m._compile(compiled, serviceFile);

  const ServiceClass = m.exports.AmazonSpApiTokenExchangeService;

  assert(
    typeof ServiceClass === 'function',
    'AmazonSpApiTokenExchangeService can be loaded from TypeScript source',
  );

  return ServiceClass;
}

function baseInput(overrides = {}) {
  return {
    tokenEndpoint: 'https://api.amazon.com/auth/o2/token',
    requestBodyPrepared: true,
    requestBodyFingerprint: 'body-fingerprint-step136-i',
    requestBodyLength: 128,
    contentType: 'application/x-www-form-urlencoded',
    method: 'POST',
    configValidatorStatus: 'ready',
    requestBodyBuilderStatus: 'ready',
    serverSideFeatureGateEnabled: false,
    enableRealLwaHttpTransport: false,
    ...overrides,
  };
}

function assertSafeDisabledResult(result, scenario) {
  const serialized = JSON.stringify(result);

  assert(result.accepted === false, `${scenario}: accepted=false`);
  assert(
    result.source === 'amazon-sp-api-lwa-http-transport-disabled',
    `${scenario}: source marker`,
  );
  assert(result.httpTransportPreparedNow === true, `${scenario}: HTTP transport prepared`);
  assert(result.httpTransportImplementedNow === true, `${scenario}: disabled transport implementation exists`);
  assert(result.httpExecutedNow === false, `${scenario}: HTTP not executed`);
  assert(result.requestBodyConstructedNow === false, `${scenario}: request body not constructed`);
  assert(result.requestBodyLoggedNow === false, `${scenario}: request body not logged`);
  assert(result.rawRequestBodyReturnedNow === false, `${scenario}: raw request body not returned`);
  assert(result.rawLwaResponseParsedNow === false, `${scenario}: raw LWA response not parsed`);
  assert(result.rawLwaResponseLoggedNow === false, `${scenario}: raw LWA response not logged`);
  assert(result.rawLwaResponseReturnedNow === false, `${scenario}: raw LWA response not returned`);
  assert(result.tokenExchangeHttpCallNow === false, `${scenario}: token exchange HTTP not executed`);
  assert(result.lwaHttpCallNow === false, `${scenario}: LWA HTTP not executed`);
  assert(result.realSpApiRequestNow === false, `${scenario}: real SP-API request not executed`);
  assert(result.tokenPersistenceDatabaseWriteNow === false, `${scenario}: token persistence DB write not executed`);

  assert(result.rawAuthorizationCodeReturnedNow === false, `${scenario}: raw authorization code not returned`);
  assert(result.rawClientIdReturnedNow === false, `${scenario}: raw client id not returned`);
  assert(result.rawClientSecretReturnedNow === false, `${scenario}: raw client secret not returned`);
  assert(result.rawAccessTokenReturnedNow === false, `${scenario}: raw access token not returned`);
  assert(result.rawRefreshTokenReturnedNow === false, `${scenario}: raw refresh token not returned`);

  assert(result.sanitizedHttpTransportShape.method === 'POST', `${scenario}: method marker`);
  assert(
    result.sanitizedHttpTransportShape.contentType === 'application/x-www-form-urlencoded',
    `${scenario}: content type marker`,
  );
  assert(result.sanitizedHttpTransportShape.timeoutMs === 10000, `${scenario}: timeout marker`);
  assert(result.sanitizedHttpTransportShape.maxAttempts === 1, `${scenario}: max attempts marker`);
  assert(
    result.sanitizedHttpTransportShape.executableClientUsedNow === false,
    `${scenario}: executable client not used`,
  );
  assert(
    result.sanitizedHttpTransportShape.responseBodyParsedNow === false,
    `${scenario}: response body not parsed`,
  );
  assert(
    result.sanitizedHttpTransportShape.nextImplementationStep === 'Step136-I',
    `${scenario}: next implementation step`,
  );

  assert(
    result.sanitizedEnablementGate.serverSideFeatureGateEnabled === false,
    `${scenario}: feature gate false`,
  );
  assert(result.sanitizedEnablementGate.envFlagAloneAccepted === false, `${scenario}: env flag alone rejected`);
  assert(
    result.sanitizedEnablementGate.realLwaHttpTransportEnabled === false,
    `${scenario}: real transport disabled`,
  );

  for (const forbidden of [
    'raw-response-step136-i',
    'raw-request-body-step136-i',
    'access-token-step136-i',
    'refresh-token-step136-i',
    'client-secret-step136-i',
    'authorization-code-step136-i',
    'body-fingerprint-step136-i',
    'rawResponseBody":"',
    'rawRequestBody":"',
    'accessToken":"',
    'refreshToken":"',
    'clientSecret":"',
    'authorizationCode":"',
    'access_token":"',
    'refresh_token":"',
    'requestBody":"',
    'responseBody":"',
  ]) {
    assert(!serialized.includes(forbidden), `${scenario}: does not serialize forbidden value ${forbidden}`);
  }
}

console.log('========== Step136-I LWA HTTP transport mock runtime smoke ==========');

const ServiceClass = loadServiceClass();
const service = new ServiceClass();

const configNotReady = service.executeRealLwaTokenExchangeHttpLater(
  baseInput({
    configValidatorStatus: 'missing_required_env',
  }),
);

assert(configNotReady.reason === 'config_validator_not_ready', 'config not ready -> config_validator_not_ready');
assert(configNotReady.sanitizedEnablementGate.configValidatorReady === false, 'config not ready gate=false');
assertSafeDisabledResult(configNotReady, 'config not ready');

const bodyBuilderNotReady = service.executeRealLwaTokenExchangeHttpLater(
  baseInput({
    requestBodyPrepared: false,
    requestBodyBuilderStatus: 'disabled',
  }),
);

assert(
  bodyBuilderNotReady.reason === 'request_body_builder_not_ready',
  'request body builder not ready -> request_body_builder_not_ready',
);
assert(bodyBuilderNotReady.sanitizedEnablementGate.requestBodyBuilderReady === false, 'body builder ready=false');
assert(bodyBuilderNotReady.sanitizedHttpTransportShape.requestBodyPrepared === false, 'request body prepared=false');
assertSafeDisabledResult(bodyBuilderNotReady, 'request body builder not ready');

const invalidEndpoint = service.executeRealLwaTokenExchangeHttpLater(
  baseInput({
    tokenEndpoint: 'http://api.amazon.com/auth/o2/token',
  }),
);

assert(invalidEndpoint.reason === 'invalid_token_endpoint', 'invalid endpoint -> invalid_token_endpoint');
assert(invalidEndpoint.sanitizedHttpTransportShape.tokenEndpointHost === 'api.amazon.com', 'invalid endpoint host sanitized');
assert(invalidEndpoint.sanitizedHttpTransportShape.tokenEndpointPath === '/auth/o2/token', 'invalid endpoint path sanitized');
assertSafeDisabledResult(invalidEndpoint, 'invalid endpoint');

const missingFingerprint = service.executeRealLwaTokenExchangeHttpLater(
  baseInput({
    requestBodyFingerprint: '',
  }),
);

assert(
  missingFingerprint.reason === 'missing_request_body_fingerprint',
  'missing request body fingerprint -> missing_request_body_fingerprint',
);
assert(
  missingFingerprint.sanitizedHttpTransportShape.requestBodyFingerprintPresent === false,
  'fingerprint presence=false',
);
assertSafeDisabledResult(missingFingerprint, 'missing request body fingerprint');

const invalidBodyLength = service.executeRealLwaTokenExchangeHttpLater(
  baseInput({
    requestBodyLength: 0,
  }),
);

assert(invalidBodyLength.reason === 'invalid_request_body_length', 'invalid body length -> invalid_request_body_length');
assert(invalidBodyLength.sanitizedHttpTransportShape.requestBodyLength === 0, 'invalid body length sanitized metric=0');
assertSafeDisabledResult(invalidBodyLength, 'invalid body length');

const invalidContentType = service.executeRealLwaTokenExchangeHttpLater(
  baseInput({
    contentType: 'application/json',
  }),
);

assert(invalidContentType.reason === 'invalid_content_type', 'invalid content type -> invalid_content_type');
assertSafeDisabledResult(invalidContentType, 'invalid content type');

const invalidMethod = service.executeRealLwaTokenExchangeHttpLater(
  baseInput({
    method: 'GET',
  }),
);

assert(invalidMethod.reason === 'invalid_method', 'invalid method -> invalid_method');
assertSafeDisabledResult(invalidMethod, 'invalid method');

const validMockButDisabled = service.executeRealLwaTokenExchangeHttpLater(baseInput());

assert(
  validMockButDisabled.reason === 'server_side_feature_gate_disabled',
  'valid mock input -> server_side_feature_gate_disabled',
);
assert(validMockButDisabled.sanitizedEnablementGate.configValidatorReady === true, 'valid mock config ready=true');
assert(validMockButDisabled.sanitizedEnablementGate.requestBodyBuilderReady === true, 'valid mock body builder ready=true');
assert(validMockButDisabled.sanitizedHttpTransportShape.requestBodyPrepared === true, 'valid mock request body prepared=true');
assert(
  validMockButDisabled.sanitizedHttpTransportShape.requestBodyFingerprintPresent === true,
  'valid mock fingerprint present=true',
);
assert(validMockButDisabled.sanitizedHttpTransportShape.requestBodyLength === 128, 'valid mock body length sanitized');
assert(validMockButDisabled.sanitizedHttpTransportShape.tokenEndpointHost === 'api.amazon.com', 'valid mock endpoint host');
assert(validMockButDisabled.sanitizedHttpTransportShape.tokenEndpointPath === '/auth/o2/token', 'valid mock endpoint path');
assertSafeDisabledResult(validMockButDisabled, 'valid mock input');

console.log('========== Step136-I LWA HTTP transport mock runtime smoke passed ==========');
