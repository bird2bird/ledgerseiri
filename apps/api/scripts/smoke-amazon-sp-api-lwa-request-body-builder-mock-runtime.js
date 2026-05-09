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
    authorizationCode: 'auth-code-step136-f',
    redirectUri: 'https://ledgerseiri.com/api/imports/amazon-sp-api/oauth/callback',
    expectedRedirectUri: 'https://ledgerseiri.com/api/imports/amazon-sp-api/oauth/callback',
    clientId: 'client-id-step136-f',
    clientSecretConfigured: true,
    clientSecretFingerprint: 'secret-fingerprint-step136-f',
    tokenEndpoint: 'https://api.amazon.com/auth/o2/token',
    configValidatorStatus: 'ready',
    serverSideFeatureGateEnabled: false,
    enableRealLwaHttpTransport: false,
    ...overrides,
  };
}

function assertSafeDisabledResult(result, scenario) {
  const serialized = JSON.stringify(result);

  assert(result.accepted === false, `${scenario}: accepted=false`);
  assert(
    result.source === 'amazon-sp-api-lwa-request-body-builder-disabled',
    `${scenario}: source marker`,
  );
  assert(result.requestBodyBuilderPreparedNow === true, `${scenario}: request body builder prepared`);
  assert(result.requestBodyConstructedNow === false, `${scenario}: request body not constructed`);
  assert(result.requestBodyLoggedNow === false, `${scenario}: request body not logged`);
  assert(
    result.requestBodyReturnedToControllerNow === false,
    `${scenario}: request body not returned to controller`,
  );
  assert(
    result.requestBodyReturnedToFrontendNow === false,
    `${scenario}: request body not returned to frontend`,
  );
  assert(result.tokenExchangeHttpCallNow === false, `${scenario}: token exchange HTTP not executed`);
  assert(result.lwaHttpCallNow === false, `${scenario}: LWA HTTP not executed`);
  assert(result.realSpApiRequestNow === false, `${scenario}: real SP-API request not executed`);
  assert(
    result.tokenPersistenceDatabaseWriteNow === false,
    `${scenario}: token persistence DB write not executed`,
  );
  assert(result.rawAuthorizationCodeReturnedNow === false, `${scenario}: raw auth code not returned`);
  assert(result.rawClientIdReturnedNow === false, `${scenario}: raw client id not returned`);
  assert(result.rawClientSecretReturnedNow === false, `${scenario}: raw client secret not returned`);
  assert(result.rawRequestBodyReturnedNow === false, `${scenario}: raw request body not returned`);

  assert(
    result.sanitizedRequestBodyShape.contentType === 'application/x-www-form-urlencoded',
    `${scenario}: content type`,
  );
  assert(result.sanitizedRequestBodyShape.encodingApi === 'URLSearchParams', `${scenario}: encoding API marker`);
  assert(result.sanitizedRequestBodyShape.method === 'POST', `${scenario}: method marker`);
  assert(result.sanitizedRequestBodyShape.grantType === 'authorization_code', `${scenario}: grant type`);
  assert(
    Array.isArray(result.sanitizedRequestBodyShape.sortedFieldOrder),
    `${scenario}: sorted field order is array`,
  );
  assert(
    result.sanitizedRequestBodyShape.sortedFieldOrder.join('|') ===
      'grant_type|code|redirect_uri|client_id|client_secret',
    `${scenario}: sorted field order`,
  );
  assert(
    typeof result.sanitizedRequestBodyShape.encodedBodyLength === 'number',
    `${scenario}: encodedBodyLength is numeric sanitized metric`,
  );
  assert(
    typeof result.sanitizedRequestBodyShape.encodedBodySha256 === 'string' &&
      result.sanitizedRequestBodyShape.encodedBodySha256.length > 0,
    `${scenario}: encodedBodySha256 sanitized fingerprint present`,
  );
  assert(
    result.sanitizedRequestBodyShape.rawBodyAvailableOnlyInsideBuilder === false,
    `${scenario}: raw body unavailable outside builder`,
  );
  assert(
    result.sanitizedRequestBodyShape.nextImplementationStep === 'Step136-I',
    `${scenario}: next implementation step`,
  );

  assert(result.sanitizedEnablementGate.serverSideFeatureGateEnabled === false, `${scenario}: feature gate false`);
  assert(result.sanitizedEnablementGate.envFlagAloneAccepted === false, `${scenario}: env flag alone rejected`);
  assert(result.sanitizedEnablementGate.realLwaHttpTransportEnabled === false, `${scenario}: real transport disabled`);

  for (const forbidden of [
    'auth-code-step136-f',
    'client-id-step136-f',
    'secret-fingerprint-step136-f',
    'clientSecret":"',
    'clientId":"',
    'authorizationCode":"',
    'requestBody":"',
    'rawBody":"',
    'grant_type=authorization_code',
    'code=',
    'client_secret=',
    'client_id=',
    'refresh_token',
    'access_token',
  ]) {
    assert(!serialized.includes(forbidden), `${scenario}: does not serialize forbidden value ${forbidden}`);
  }

  // Enum reason strings such as client_secret_not_configured are allowed.
  // Raw fields or raw body fields are not allowed.
  assert(!serialized.includes('client_secret":"'), `${scenario}: does not serialize raw client_secret field`);
  assert(!serialized.includes('clientSecret":"'), `${scenario}: does not serialize raw clientSecret field`);
}

console.log('========== Step136-F LWA request body builder mock runtime smoke ==========');

const ServiceClass = loadServiceClass();
const service = new ServiceClass();

const configNotReady = service.buildRealLwaTokenExchangeRequestBodyLater(
  baseInput({
    configValidatorStatus: 'missing_required_env',
  }),
);

assert(configNotReady.reason === 'config_validator_not_ready', 'config not ready -> config_validator_not_ready');
assert(configNotReady.sanitizedEnablementGate.configValidatorReady === false, 'config not ready gate=false');
assertSafeDisabledResult(configNotReady, 'config not ready');

const missingAuthorizationCode = service.buildRealLwaTokenExchangeRequestBodyLater(
  baseInput({
    authorizationCode: '',
  }),
);

assert(
  missingAuthorizationCode.reason === 'missing_authorization_code',
  'missing authorization code -> missing_authorization_code',
);
assert(
  missingAuthorizationCode.sanitizedRequestBodyShape.fieldPresence.code === false,
  'missing authorization code presence=false',
);
assertSafeDisabledResult(missingAuthorizationCode, 'missing authorization code');

const mismatchedRedirectUri = service.buildRealLwaTokenExchangeRequestBodyLater(
  baseInput({
    redirectUri: 'https://ledgerseiri.com/api/imports/amazon-sp-api/oauth/callback',
    expectedRedirectUri: 'https://ledgerseiri.com/api/imports/amazon-sp-api/oauth/callback-v2',
  }),
);

assert(mismatchedRedirectUri.reason === 'mismatched_redirect_uri', 'mismatched redirect URI -> mismatched_redirect_uri');
assertSafeDisabledResult(mismatchedRedirectUri, 'mismatched redirect URI');

const missingClientSecretFingerprint = service.buildRealLwaTokenExchangeRequestBodyLater(
  baseInput({
    clientSecretFingerprint: '',
  }),
);

assert(
  missingClientSecretFingerprint.reason === 'missing_client_secret_fingerprint',
  'missing client secret fingerprint -> missing_client_secret_fingerprint',
);
assertSafeDisabledResult(missingClientSecretFingerprint, 'missing client secret fingerprint');

const invalidEndpoint = service.buildRealLwaTokenExchangeRequestBodyLater(
  baseInput({
    tokenEndpoint: 'http://api.amazon.com/auth/o2/token',
  }),
);

assert(invalidEndpoint.reason === 'invalid_token_endpoint', 'invalid endpoint -> invalid_token_endpoint');
assert(invalidEndpoint.sanitizedRequestBodyShape.tokenEndpointHost === 'api.amazon.com', 'invalid endpoint host sanitized');
assert(invalidEndpoint.sanitizedRequestBodyShape.tokenEndpointPath === '/auth/o2/token', 'invalid endpoint path sanitized');
assertSafeDisabledResult(invalidEndpoint, 'invalid endpoint');

const validMockButDisabled = service.buildRealLwaTokenExchangeRequestBodyLater(baseInput());

assert(
  validMockButDisabled.reason === 'server_side_feature_gate_disabled',
  'valid mock input -> server_side_feature_gate_disabled',
);
assert(validMockButDisabled.sanitizedEnablementGate.configValidatorReady === true, 'valid mock config ready');
assert(validMockButDisabled.sanitizedRequestBodyShape.fieldPresence.code === true, 'valid mock code presence=true');
assert(validMockButDisabled.sanitizedRequestBodyShape.fieldPresence.redirectUri === true, 'valid mock redirectUri presence=true');
assert(validMockButDisabled.sanitizedRequestBodyShape.fieldPresence.clientId === true, 'valid mock clientId presence=true');
assert(validMockButDisabled.sanitizedRequestBodyShape.fieldPresence.clientSecret === true, 'valid mock clientSecret presence=true');
assert(validMockButDisabled.sanitizedRequestBodyShape.tokenEndpointHost === 'api.amazon.com', 'valid mock endpoint host');
assert(validMockButDisabled.sanitizedRequestBodyShape.tokenEndpointPath === '/auth/o2/token', 'valid mock endpoint path');
assertSafeDisabledResult(validMockButDisabled, 'valid mock input');

console.log('========== Step136-F LWA request body builder mock runtime smoke passed ==========');
