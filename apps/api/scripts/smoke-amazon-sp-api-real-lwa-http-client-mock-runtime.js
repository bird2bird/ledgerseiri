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
    state: 'state-step136-c',
    authorizationCode: 'auth-code-step136-c',
    sellingPartnerId: 'SELLING-PARTNER-STEP136C',
    redirectUri: 'https://ledgerseiri.com/api/imports/amazon-sp-api/oauth/callback',
    clientId: 'client-id-step136-c',
    clientSecretConfigured: true,
    tokenEndpoint: 'https://api.amazon.com/auth/o2/token',
    marketplaceId: 'A1VC38T7YXB528',
    region: 'JP',
    companyId: 'company-step136-c',
    storeId: 'store-step136-c',
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
    result.source === 'amazon-sp-api-real-lwa-http-client-disabled-by-default',
    `${scenario}: source marker`,
  );
  assert(result.transportMode === 'real-lwa-http-disabled', `${scenario}: disabled transport mode`);
  assert(result.httpClientPreparedNow === true, `${scenario}: HTTP client shape prepared`);
  assert(result.tokenExchangeHttpCallNow === false, `${scenario}: token exchange HTTP not executed`);
  assert(result.lwaHttpCallNow === false, `${scenario}: LWA HTTP not executed`);
  assert(result.realSpApiRequestNow === false, `${scenario}: real SP-API request not executed`);
  assert(result.tokenPersistenceDatabaseWriteNow === false, `${scenario}: token persistence not written`);

  assert(result.rawAuthorizationCodeReturnedNow === false, `${scenario}: raw auth code not returned`);
  assert(result.rawClientIdReturnedNow === false, `${scenario}: raw client id not returned`);
  assert(result.rawClientSecretReturnedNow === false, `${scenario}: raw client secret not returned`);
  assert(result.rawRefreshTokenReturnedNow === false, `${scenario}: raw refresh token not returned`);
  assert(result.rawAccessTokenReturnedNow === false, `${scenario}: raw access token not returned`);

  assert(result.sanitizedHttpRequestShape.method === 'POST', `${scenario}: sanitized method shape`);
  assert(
    result.sanitizedHttpRequestShape.contentType === 'application/x-www-form-urlencoded',
    `${scenario}: sanitized content type`,
  );
  assert(result.sanitizedHttpRequestShape.grantType === 'authorization_code', `${scenario}: grant type`);
  assert(
    result.sanitizedHttpRequestShape.requestBodyConstructedNow === false,
    `${scenario}: request body not constructed`,
  );
  assert(
    result.sanitizedHttpRequestShape.requestBodyLoggedNow === false,
    `${scenario}: request body not logged`,
  );
  assert(
    result.sanitizedHttpRequestShape.responseBodyParsedNow === false,
    `${scenario}: response body not parsed`,
  );
  assert(
    result.sanitizedHttpRequestShape.nextImplementationStep === 'Step136-L',
    `${scenario}: next implementation step`,
  );

  assert(result.sanitizedEnablementGate.serverSideFeatureGateEnabled === false, `${scenario}: feature gate false`);
  assert(result.sanitizedEnablementGate.envFlagAloneAccepted === false, `${scenario}: env flag alone rejected`);
  assert(result.sanitizedEnablementGate.realLwaHttpTransportEnabled === false, `${scenario}: real transport disabled`);

  for (const forbidden of [
    'super-secret-step136-c',
    'auth-code-step136-c',
    'client-id-step136-c',
    'refresh_token',
    'access_token',
    'authorization_code_value',
    'clientSecret":"',
    'clientId":"',
    'authorizationCode":"',
    'refreshToken":"',
    'accessToken":"',
  ]) {
    assert(!serialized.includes(forbidden), `${scenario}: does not serialize forbidden value ${forbidden}`);
  }

  // The enum reason "client_secret_not_configured" is allowed and expected.
  // What is forbidden is returning a raw client secret value or a raw clientSecret/client_secret field.
  assert(!serialized.includes('client_secret":"'), `${scenario}: does not serialize raw client_secret field`);
  assert(!serialized.includes('clientSecret":"'), `${scenario}: does not serialize raw clientSecret field`);
}

console.log('========== Step136-C real LWA HTTP client mock runtime smoke ==========');

const ServiceClass = loadServiceClass();
const service = new ServiceClass();

const configNotReady = service.prepareRealLwaHttpExchangeRequestDisabled(
  baseInput({
    configValidatorStatus: 'missing_required_env',
  }),
);

assert(configNotReady.reason === 'config_validator_not_ready', 'config not ready -> config_validator_not_ready');
assert(configNotReady.sanitizedEnablementGate.configValidatorReady === false, 'config not ready gate=false');
assertSafeDisabledResult(configNotReady, 'config not ready');

const invalidEndpoint = service.prepareRealLwaHttpExchangeRequestDisabled(
  baseInput({
    tokenEndpoint: 'http://api.amazon.com/auth/o2/token',
  }),
);

assert(invalidEndpoint.reason === 'invalid_token_endpoint', 'invalid token endpoint -> invalid_token_endpoint');
assert(invalidEndpoint.sanitizedHttpRequestShape.tokenEndpointHost === 'api.amazon.com', 'invalid endpoint host sanitized');
assert(invalidEndpoint.sanitizedHttpRequestShape.tokenEndpointPath === '/auth/o2/token', 'invalid endpoint path sanitized');
assertSafeDisabledResult(invalidEndpoint, 'invalid endpoint');

const missingAuthorizationCode = service.prepareRealLwaHttpExchangeRequestDisabled(
  baseInput({
    authorizationCode: '',
  }),
);

assert(
  missingAuthorizationCode.reason === 'missing_authorization_code',
  'missing authorization code -> missing_authorization_code',
);
assert(
  missingAuthorizationCode.sanitizedHttpRequestShape.formFieldPresence.authorizationCode === false,
  'missing authorization code presence=false',
);
assertSafeDisabledResult(missingAuthorizationCode, 'missing authorization code');

const missingClientSecret = service.prepareRealLwaHttpExchangeRequestDisabled(
  baseInput({
    clientSecretConfigured: false,
  }),
);

assert(
  missingClientSecret.reason === 'client_secret_not_configured',
  'missing client secret -> client_secret_not_configured',
);
assert(
  missingClientSecret.sanitizedHttpRequestShape.formFieldPresence.clientSecret === false,
  'missing client secret presence=false',
);
assertSafeDisabledResult(missingClientSecret, 'missing client secret');

const readyButDisabled = service.prepareRealLwaHttpExchangeRequestDisabled(baseInput());

assert(
  readyButDisabled.reason === 'server_side_feature_gate_disabled',
  'valid mock input -> server_side_feature_gate_disabled',
);
assert(
  readyButDisabled.sanitizedEnablementGate.configValidatorReady === true,
  'valid mock input configValidatorReady=true',
);
assert(
  readyButDisabled.sanitizedHttpRequestShape.tokenEndpointHost === 'api.amazon.com',
  'valid mock input token endpoint host',
);
assert(
  readyButDisabled.sanitizedHttpRequestShape.tokenEndpointPath === '/auth/o2/token',
  'valid mock input token endpoint path',
);
assert(
  readyButDisabled.sanitizedHttpRequestShape.formFieldPresence.authorizationCode === true,
  'valid mock input auth code presence=true',
);
assert(
  readyButDisabled.sanitizedHttpRequestShape.formFieldPresence.clientId === true,
  'valid mock input client id presence=true',
);
assert(
  readyButDisabled.sanitizedHttpRequestShape.formFieldPresence.clientSecret === true,
  'valid mock input client secret presence=true',
);
assertSafeDisabledResult(readyButDisabled, 'valid mock input');

console.log('========== Step136-C real LWA HTTP client mock runtime smoke passed ==========');
