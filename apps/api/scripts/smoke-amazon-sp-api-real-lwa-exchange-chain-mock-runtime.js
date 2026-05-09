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
    state: 'state-step136-l',
    authorizationCode: 'auth-code-step136-l',
    sellingPartnerId: 'SELLING-PARTNER-STEP136L',
    redirectUri: 'https://ledgerseiri.com/api/imports/amazon-sp-api/oauth/callback',
    expectedRedirectUri: 'https://ledgerseiri.com/api/imports/amazon-sp-api/oauth/callback',
    clientId: 'client-id-step136-l',
    clientSecretConfigured: true,
    clientSecretFingerprint: 'secret-fingerprint-step136-l',
    tokenEndpoint: 'https://api.amazon.com/auth/o2/token',
    marketplaceId: 'A1VC38T7YXB528',
    region: 'JP',
    companyId: 'company-step136-l',
    storeId: 'store-step136-l',
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
    result.source === 'amazon-sp-api-real-lwa-exchange-chain-disabled',
    `${scenario}: source marker`,
  );

  assert(result.orchestratorPreparedNow === true, `${scenario}: orchestrator prepared`);
  assert(result.orchestratorImplementedNow === true, `${scenario}: disabled orchestrator implemented`);
  assert(result.callbackRuntimeChangedNow === false, `${scenario}: callback runtime unchanged`);
  assert(result.controllerRouteChangedNow === false, `${scenario}: controller route unchanged`);
  assert(result.realHttpEnabledNow === false, `${scenario}: real HTTP not enabled`);

  assert(result.tokenExchangeHttpCallNow === false, `${scenario}: token exchange HTTP not executed`);
  assert(result.lwaHttpCallNow === false, `${scenario}: LWA HTTP not executed`);
  assert(result.realSpApiRequestNow === false, `${scenario}: real SP-API request not executed`);
  assert(result.tokenPersistenceDatabaseWriteNow === false, `${scenario}: token persistence DB write not executed`);

  assert(result.requestBodyConstructedNow === false, `${scenario}: request body not constructed`);
  assert(result.requestBodyLoggedNow === false, `${scenario}: request body not logged`);
  assert(result.rawAuthorizationCodeReturnedNow === false, `${scenario}: raw auth code not returned`);
  assert(result.rawClientIdReturnedNow === false, `${scenario}: raw client id not returned`);
  assert(result.rawClientSecretReturnedNow === false, `${scenario}: raw client secret not returned`);
  assert(result.rawRequestBodyReturnedNow === false, `${scenario}: raw request body not returned`);
  assert(result.rawLwaResponseReturnedNow === false, `${scenario}: raw LWA response not returned`);
  assert(result.rawAccessTokenReturnedNow === false, `${scenario}: raw access token not returned`);
  assert(result.rawRefreshTokenReturnedNow === false, `${scenario}: raw refresh token not returned`);

  assert(
    Array.isArray(result.sanitizedChain.stageOrder),
    `${scenario}: stage order is array`,
  );
  assert(
    result.sanitizedChain.stageOrder.join('|') ===
      'validate-config|validate-callback-state|build-request-body|execute-http-transport|prepare-token-persistence-input',
    `${scenario}: stage order`,
  );
  assert(
    result.sanitizedChain.callbackStateTrustedNow === true,
    `${scenario}: callback state trusted marker`,
  );
  assert(
    result.sanitizedChain.tokenPersistencePreparedNow === false,
    `${scenario}: token persistence not prepared`,
  );
  assert(
    result.sanitizedChain.nextImplementationStep === 'Step136-L',
    `${scenario}: next implementation step`,
  );

  for (const forbidden of [
    'auth-code-step136-l',
    'client-id-step136-l',
    'secret-fingerprint-step136-l',
    'raw-request-body-step136-l',
    'raw-response-step136-l',
    'access-token-step136-l',
    'refresh-token-step136-l',
    'client-secret-step136-l',
    'authorizationCode":"',
    'clientId":"',
    'clientSecret":"',
    'client_secret":"',
    'requestBody":"',
    'rawRequestBody":"',
    'responseBody":"',
    'rawResponseBody":"',
    'accessToken":"',
    'refreshToken":"',
    'access_token":"',
    'refresh_token":"',
    'grant_type=authorization_code',
    'code=',
    'client_secret=',
    'client_id=',
  ]) {
    assert(!serialized.includes(forbidden), `${scenario}: does not serialize forbidden value ${forbidden}`);
  }
}

console.log('========== Step136-L real LWA exchange chain mock runtime smoke ==========');

const ServiceClass = loadServiceClass();
const service = new ServiceClass();

const configNotReady = service.orchestrateRealLwaExchangeChainDisabledLater(
  baseInput({
    configValidatorStatus: 'missing_required_env',
  }),
);

assert(configNotReady.reason === 'config_validator_not_ready', 'config not ready -> config_validator_not_ready');
assert(configNotReady.sanitizedChain.blockedAtStage === 'validate-config', 'config not ready blocked at validate-config');
assert(configNotReady.sanitizedChain.configValidatorReady === false, 'config not ready flag=false');
assert(configNotReady.sanitizedChain.completedStages.length === 0, 'config not ready completedStages empty');
assertSafeDisabledResult(configNotReady, 'config not ready');

const missingState = service.orchestrateRealLwaExchangeChainDisabledLater(
  baseInput({
    state: '',
  }),
);

assert(missingState.reason === 'missing_state', 'missing state -> missing_state');
assert(missingState.sanitizedChain.blockedAtStage === 'validate-callback-state', 'missing state blocked at callback state');
assert(missingState.sanitizedInputs.statePresent === false, 'missing state presence=false');
assert(missingState.sanitizedChain.completedStages.join('|') === 'validate-config', 'missing state completed config only');
assertSafeDisabledResult(missingState, 'missing state');

const missingAuthorizationCode = service.orchestrateRealLwaExchangeChainDisabledLater(
  baseInput({
    authorizationCode: '',
  }),
);

assert(
  missingAuthorizationCode.reason === 'missing_authorization_code',
  'missing authorization code -> missing_authorization_code',
);
assert(
  missingAuthorizationCode.sanitizedInputs.authorizationCodePresent === false,
  'missing authorization code presence=false',
);
assertSafeDisabledResult(missingAuthorizationCode, 'missing authorization code');

const mismatchedRedirectUri = service.orchestrateRealLwaExchangeChainDisabledLater(
  baseInput({
    redirectUri: 'https://ledgerseiri.com/api/imports/amazon-sp-api/oauth/callback',
    expectedRedirectUri: 'https://ledgerseiri.com/api/imports/amazon-sp-api/oauth/callback-v2',
  }),
);

assert(mismatchedRedirectUri.reason === 'mismatched_redirect_uri', 'mismatched redirect URI -> mismatched_redirect_uri');
assert(mismatchedRedirectUri.sanitizedInputs.redirectUriMatchesExpected === false, 'redirect URI match=false');
assertSafeDisabledResult(mismatchedRedirectUri, 'mismatched redirect URI');

const missingClientSecretFingerprint = service.orchestrateRealLwaExchangeChainDisabledLater(
  baseInput({
    clientSecretFingerprint: '',
  }),
);

assert(
  missingClientSecretFingerprint.reason === 'missing_client_secret_fingerprint',
  'missing client secret fingerprint -> missing_client_secret_fingerprint',
);
assert(
  missingClientSecretFingerprint.sanitizedInputs.clientSecretFingerprintPresent === false,
  'client secret fingerprint presence=false',
);
assertSafeDisabledResult(missingClientSecretFingerprint, 'missing client secret fingerprint');

const invalidEndpoint = service.orchestrateRealLwaExchangeChainDisabledLater(
  baseInput({
    tokenEndpoint: 'http://api.amazon.com/auth/o2/token',
  }),
);

assert(invalidEndpoint.reason === 'invalid_token_endpoint', 'invalid endpoint -> invalid_token_endpoint');
assert(invalidEndpoint.sanitizedInputs.tokenEndpointHost === 'api.amazon.com', 'invalid endpoint host sanitized');
assert(invalidEndpoint.sanitizedInputs.tokenEndpointPath === '/auth/o2/token', 'invalid endpoint path sanitized');
assert(invalidEndpoint.sanitizedInputs.tokenEndpointHttps === false, 'invalid endpoint https=false');
assertSafeDisabledResult(invalidEndpoint, 'invalid endpoint');

const validMockButDisabled = service.orchestrateRealLwaExchangeChainDisabledLater(baseInput());

assert(
  validMockButDisabled.reason === 'server_side_feature_gate_disabled',
  'valid mock input -> server_side_feature_gate_disabled',
);
assert(validMockButDisabled.sanitizedChain.blockedAtStage === 'feature-gate', 'valid mock blocked at feature-gate');
assert(
  validMockButDisabled.sanitizedChain.completedStages.join('|') ===
    'validate-config|validate-callback-state|build-request-body|execute-http-transport',
  'valid mock completed disabled chain stages',
);
assert(validMockButDisabled.sanitizedChain.configValidatorReady === true, 'valid mock config ready=true');
assert(validMockButDisabled.sanitizedChain.requestBodyBuilderPrepared === true, 'valid mock request body builder prepared=true');
assert(validMockButDisabled.sanitizedChain.httpTransportPrepared === true, 'valid mock HTTP transport prepared=true');
assert(validMockButDisabled.sanitizedInputs.redirectUriMatchesExpected === true, 'valid mock redirect URI match=true');
assert(
  validMockButDisabled.sanitizedDownstreamResults.requestBodyBuilderSource ===
    'amazon-sp-api-lwa-request-body-builder-disabled',
  'valid mock downstream request body builder source',
);
assert(
  validMockButDisabled.sanitizedDownstreamResults.httpTransportSource ===
    'amazon-sp-api-lwa-http-transport-disabled',
  'valid mock downstream HTTP transport source',
);
assert(
  validMockButDisabled.sanitizedDownstreamResults.requestBodyBuilderReason ===
    'server_side_feature_gate_disabled',
  'valid mock downstream request body builder reason',
);
assert(
  validMockButDisabled.sanitizedDownstreamResults.httpTransportReason ===
    'server_side_feature_gate_disabled',
  'valid mock downstream HTTP transport reason',
);
assertSafeDisabledResult(validMockButDisabled, 'valid mock input');

console.log('========== Step136-L real LWA exchange chain mock runtime smoke passed ==========');
