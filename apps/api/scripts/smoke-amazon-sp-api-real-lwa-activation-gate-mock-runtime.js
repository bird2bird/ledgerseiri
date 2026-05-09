const fs = require('fs');
const path = require('path');
const Module = require('module');
const ts = require('typescript');

const root = path.resolve(__dirname, '../../..');

const serviceFile = path.join(
  root,
  'apps/api/src/imports/amazon-sp-api-real-lwa-activation-gate.service.ts',
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
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

  const ServiceClass = m.exports.AmazonSpApiRealLwaActivationGateService;

  assert(
    typeof ServiceClass === 'function',
    'AmazonSpApiRealLwaActivationGateService can be loaded from TypeScript source',
  );

  return ServiceClass;
}

function baseInput(overrides = {}) {
  return {
    configValidatorStatus: 'ready',
    clientIdPresent: true,
    clientSecretPresent: true,
    redirectUriPresent: true,
    marketplaceIdPresent: true,
    regionPresent: true,
    tokenEndpointHttps: true,
    callbackStateTrusted: true,
    companyIdResolvedFromTrustedState: true,
    storeIdResolvedFromTrustedState: true,
    sellingPartnerIdPresent: true,
    authorizationCodePresent: true,
    redirectUriMatchesAuthorizationRequest: true,
    serverSideRuntimeGateEnabled: true,
    environmentAllowsRealLwaHttp: true,
    companyStoreAllowlisted: true,
    explicitOperatorConfirmed: true,
    ...overrides,
  };
}

function assertSafeBlockedResult(result, scenario) {
  const serialized = JSON.stringify(result);

  assert(result.accepted === false, `${scenario}: accepted=false`);
  assert(
    result.source === 'amazon-sp-api-real-lwa-activation-gate-service-skeleton',
    `${scenario}: source marker`,
  );
  assert(result.gateDecision === 'blocked', `${scenario}: gateDecision=blocked`);

  assert(result.activationGatePreparedNow === true, `${scenario}: activation gate prepared`);
  assert(result.activationGateImplementedNow === true, `${scenario}: activation gate implemented`);
  assert(result.realHttpAllowedNow === false, `${scenario}: real HTTP not allowed`);
  assert(result.realHttpEnabledNow === false, `${scenario}: real HTTP not enabled`);
  assert(result.tokenExchangeHttpCallNow === false, `${scenario}: token exchange HTTP not executed`);
  assert(result.lwaHttpCallNow === false, `${scenario}: LWA HTTP not executed`);
  assert(result.realSpApiRequestNow === false, `${scenario}: real SP-API request not executed`);
  assert(result.tokenPersistenceDatabaseWriteNow === false, `${scenario}: token persistence DB write not executed`);

  assert(result.callbackRuntimeChangedNow === false, `${scenario}: callback runtime unchanged`);
  assert(result.controllerRouteChangedNow === false, `${scenario}: controller route unchanged`);
  assert(result.reportsApiCallNow === false, `${scenario}: Reports API not called`);
  assert(result.importJobWriteNow === false, `${scenario}: ImportJob not written`);
  assert(result.importStagingRowWriteNow === false, `${scenario}: ImportStagingRow not written`);
  assert(result.transactionWriteNow === false, `${scenario}: Transaction not written`);
  assert(result.inventoryWriteNow === false, `${scenario}: Inventory not written`);

  assert(result.rawAuthorizationCodeReturnedNow === false, `${scenario}: raw authorization code not returned`);
  assert(result.rawClientIdReturnedNow === false, `${scenario}: raw client id not returned`);
  assert(result.rawClientSecretReturnedNow === false, `${scenario}: raw client secret not returned`);
  assert(result.rawRequestBodyReturnedNow === false, `${scenario}: raw request body not returned`);
  assert(result.rawLwaResponseReturnedNow === false, `${scenario}: raw LWA response not returned`);
  assert(result.rawAccessTokenReturnedNow === false, `${scenario}: raw access token not returned`);
  assert(result.rawRefreshTokenReturnedNow === false, `${scenario}: raw refresh token not returned`);

  assert(result.sanitizedDecision.envFlagAloneAccepted === false, `${scenario}: env flag alone not accepted`);
  assert(result.sanitizedDecision.frontendCanEnableRealHttp === false, `${scenario}: frontend cannot enable HTTP`);
  assert(result.sanitizedDecision.queryParamCanEnableRealHttp === false, `${scenario}: query param cannot enable HTTP`);
  assert(result.sanitizedDecision.callbackParamCanEnableRealHttp === false, `${scenario}: callback param cannot enable HTTP`);
  assert(
    result.sanitizedDecision.nextImplementationStep === 'Step137-C',
    `${scenario}: next implementation step`,
  );

  for (const forbidden of [
    'raw-authorization-code-step137-c',
    'raw-client-id-step137-c',
    'raw-client-secret-step137-c',
    'raw-request-body-step137-c',
    'raw-lwa-response-step137-c',
    'access-token-step137-c',
    'refresh-token-step137-c',
    'authorizationCode":"',
    'clientId":"',
    'clientSecret":"',
    'client_secret":"',
    'requestBody":"',
    'rawRequestBody":"',
    'responseBody":"',
    'rawLwaResponse":"',
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

console.log('========== Step137-C real LWA activation gate mock runtime smoke ==========');

const ServiceClass = loadServiceClass();
const service = new ServiceClass();

const configNotReady = service.evaluateRealLwaActivationLater(
  baseInput({
    configValidatorStatus: 'missing_required_env',
  }),
);
assert(configNotReady.reason === 'config_not_ready', 'config not ready -> config_not_ready');
assert(configNotReady.sanitizedDecision.configReady === false, 'configReady=false');
assertSafeBlockedResult(configNotReady, 'config not ready');

const clientIdMissing = service.evaluateRealLwaActivationLater(
  baseInput({
    clientIdPresent: false,
  }),
);
assert(clientIdMissing.reason === 'client_id_missing', 'client id missing -> client_id_missing');
assert(clientIdMissing.sanitizedDecision.clientIdPresent === false, 'clientIdPresent=false');
assertSafeBlockedResult(clientIdMissing, 'client id missing');

const clientSecretMissing = service.evaluateRealLwaActivationLater(
  baseInput({
    clientSecretPresent: false,
  }),
);
assert(clientSecretMissing.reason === 'client_secret_missing', 'client secret missing -> client_secret_missing');
assert(clientSecretMissing.sanitizedDecision.clientSecretPresent === false, 'clientSecretPresent=false');
assertSafeBlockedResult(clientSecretMissing, 'client secret missing');

const tokenEndpointNotHttps = service.evaluateRealLwaActivationLater(
  baseInput({
    tokenEndpointHttps: false,
  }),
);
assert(
  tokenEndpointNotHttps.reason === 'token_endpoint_not_https',
  'token endpoint not https -> token_endpoint_not_https',
);
assert(tokenEndpointNotHttps.sanitizedDecision.tokenEndpointHttps === false, 'tokenEndpointHttps=false');
assertSafeBlockedResult(tokenEndpointNotHttps, 'token endpoint not https');

const callbackStateNotTrusted = service.evaluateRealLwaActivationLater(
  baseInput({
    callbackStateTrusted: false,
  }),
);
assert(
  callbackStateNotTrusted.reason === 'callback_state_not_trusted',
  'callback state not trusted -> callback_state_not_trusted',
);
assert(callbackStateNotTrusted.sanitizedDecision.callbackStateTrusted === false, 'callbackStateTrusted=false');
assertSafeBlockedResult(callbackStateNotTrusted, 'callback state not trusted');

const companyIdNotResolved = service.evaluateRealLwaActivationLater(
  baseInput({
    companyIdResolvedFromTrustedState: false,
  }),
);
assert(
  companyIdNotResolved.reason === 'company_id_not_resolved',
  'company id not resolved -> company_id_not_resolved',
);
assert(
  companyIdNotResolved.sanitizedDecision.companyIdResolvedFromTrustedState === false,
  'companyIdResolvedFromTrustedState=false',
);
assertSafeBlockedResult(companyIdNotResolved, 'company id not resolved');

const storeIdNotResolved = service.evaluateRealLwaActivationLater(
  baseInput({
    storeIdResolvedFromTrustedState: false,
  }),
);
assert(storeIdNotResolved.reason === 'store_id_not_resolved', 'store id not resolved -> store_id_not_resolved');
assert(
  storeIdNotResolved.sanitizedDecision.storeIdResolvedFromTrustedState === false,
  'storeIdResolvedFromTrustedState=false',
);
assertSafeBlockedResult(storeIdNotResolved, 'store id not resolved');

const serverSideGateDisabled = service.evaluateRealLwaActivationLater(
  baseInput({
    serverSideRuntimeGateEnabled: false,
  }),
);
assert(
  serverSideGateDisabled.reason === 'server_side_runtime_gate_disabled',
  'server-side runtime gate disabled -> server_side_runtime_gate_disabled',
);
assert(
  serverSideGateDisabled.sanitizedDecision.serverSideRuntimeGateEnabled === false,
  'serverSideRuntimeGateEnabled=false',
);
assertSafeBlockedResult(serverSideGateDisabled, 'server-side runtime gate disabled');

const environmentNotAllowed = service.evaluateRealLwaActivationLater(
  baseInput({
    environmentAllowsRealLwaHttp: false,
  }),
);
assert(
  environmentNotAllowed.reason === 'environment_not_allowed',
  'environment not allowed -> environment_not_allowed',
);
assert(environmentNotAllowed.sanitizedDecision.environmentAllowsRealLwaHttp === false, 'environmentAllowsRealLwaHttp=false');
assertSafeBlockedResult(environmentNotAllowed, 'environment not allowed');

const companyStoreNotAllowlisted = service.evaluateRealLwaActivationLater(
  baseInput({
    companyStoreAllowlisted: false,
  }),
);
assert(
  companyStoreNotAllowlisted.reason === 'company_store_not_allowlisted',
  'company/store not allowlisted -> company_store_not_allowlisted',
);
assert(companyStoreNotAllowlisted.sanitizedDecision.companyStoreAllowlisted === false, 'companyStoreAllowlisted=false');
assertSafeBlockedResult(companyStoreNotAllowlisted, 'company/store not allowlisted');

const operatorConfirmationMissing = service.evaluateRealLwaActivationLater(
  baseInput({
    explicitOperatorConfirmed: false,
  }),
);
assert(
  operatorConfirmationMissing.reason === 'operator_confirmation_missing',
  'operator confirmation missing -> operator_confirmation_missing',
);
assert(operatorConfirmationMissing.sanitizedDecision.explicitOperatorConfirmed === false, 'explicitOperatorConfirmed=false');
assertSafeBlockedResult(operatorConfirmationMissing, 'operator confirmation missing');

const allConditionsTrue = service.evaluateRealLwaActivationLater(baseInput());
assert(
  allConditionsTrue.reason === 'activation_gate_skeleton',
  'all conditions true -> activation_gate_skeleton still blocked',
);
assert(allConditionsTrue.sanitizedDecision.configReady === true, 'all true configReady=true');
assert(allConditionsTrue.sanitizedDecision.clientIdPresent === true, 'all true clientIdPresent=true');
assert(allConditionsTrue.sanitizedDecision.clientSecretPresent === true, 'all true clientSecretPresent=true');
assert(allConditionsTrue.sanitizedDecision.redirectUriPresent === true, 'all true redirectUriPresent=true');
assert(allConditionsTrue.sanitizedDecision.marketplaceIdPresent === true, 'all true marketplaceIdPresent=true');
assert(allConditionsTrue.sanitizedDecision.regionPresent === true, 'all true regionPresent=true');
assert(allConditionsTrue.sanitizedDecision.tokenEndpointHttps === true, 'all true tokenEndpointHttps=true');
assert(allConditionsTrue.sanitizedDecision.callbackStateTrusted === true, 'all true callbackStateTrusted=true');
assert(
  allConditionsTrue.sanitizedDecision.companyIdResolvedFromTrustedState === true,
  'all true companyIdResolvedFromTrustedState=true',
);
assert(
  allConditionsTrue.sanitizedDecision.storeIdResolvedFromTrustedState === true,
  'all true storeIdResolvedFromTrustedState=true',
);
assert(allConditionsTrue.sanitizedDecision.sellingPartnerIdPresent === true, 'all true sellingPartnerIdPresent=true');
assert(allConditionsTrue.sanitizedDecision.authorizationCodePresent === true, 'all true authorizationCodePresent=true');
assert(
  allConditionsTrue.sanitizedDecision.redirectUriMatchesAuthorizationRequest === true,
  'all true redirectUriMatchesAuthorizationRequest=true',
);
assert(
  allConditionsTrue.sanitizedDecision.serverSideRuntimeGateEnabled === true,
  'all true serverSideRuntimeGateEnabled=true',
);
assert(
  allConditionsTrue.sanitizedDecision.environmentAllowsRealLwaHttp === true,
  'all true environmentAllowsRealLwaHttp=true',
);
assert(allConditionsTrue.sanitizedDecision.companyStoreAllowlisted === true, 'all true companyStoreAllowlisted=true');
assert(allConditionsTrue.sanitizedDecision.explicitOperatorConfirmed === true, 'all true explicitOperatorConfirmed=true');
assertSafeBlockedResult(allConditionsTrue, 'all conditions true');

console.log('========== Step137-C real LWA activation gate mock runtime smoke passed ==========');
