const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');

const serviceFile = path.join(
  root,
  'apps/api/src/imports/amazon-sp-api-lwa-env-config-validation.service.ts',
);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
  console.log(`[OK] ${message}`);
}

function loadServiceClass() {
  const source = fs.readFileSync(serviceFile, 'utf8');

  const stripped = source
    .replace(/import\s+\{[^}]+\}\s+from\s+'@nestjs\/common';\n/, '')
    .replace(/export type[\s\S]*?;\n\nfunction normalizeEnv/, 'function normalizeEnv')
    .replace(/@Injectable\(\)\n/g, '')
    .replace(/export class AmazonSpApiLwaEnvConfigValidationService/, 'class AmazonSpApiLwaEnvConfigValidationService')
    .replace(/: NodeJS\.ProcessEnv/g, '')
    .replace(/: AmazonSpApiLwaEnvConfigValidationResult\['environment'\]/g, '')
    .replace(/: AmazonSpApiLwaEnvConfigValidationStatus/g, '')
    .replace(/: AmazonSpApiLwaEnvConfigValidationResult/g, '')
    .replace(/: string\[\]/g, '')
    .replace(/: string \| undefined/g, '')
    .replace(/: string \| null/g, '')
    .replace(/: string/g, '')
    .replace(/: boolean/g, '')
    .replace(/ as const/g, '')
    .concat('\nreturn AmazonSpApiLwaEnvConfigValidationService;');

  const factory = new Function(stripped);
  return factory();
}

function assertSafeResult(result, scenario) {
  const serialized = JSON.stringify(result);

  assert(result.source === 'amazon-sp-api-lwa-env-config-validation-service', `${scenario}: source marker`);
  assert(result.step === 'Step135-D', `${scenario}: step marker`);
  assert(result.realHttpEnabled === false, `${scenario}: real HTTP remains disabled`);
  assert(result.tokenExchangeHttpCallNow === false, `${scenario}: token exchange HTTP call disabled`);
  assert(result.lwaHttpCallNow === false, `${scenario}: LWA HTTP call disabled`);
  assert(result.realSpApiRequestNow === false, `${scenario}: real SP-API request disabled`);
  assert(result.tokenPersistenceDatabaseWriteNow === false, `${scenario}: token persistence DB write disabled`);
  assert(result.rawClientSecretReturnedNow === false, `${scenario}: raw client secret return disabled`);
  assert(result.rawClientIdReturnedNow === false, `${scenario}: raw client id return disabled`);
  assert(result.rawRefreshTokenReturnedNow === false, `${scenario}: raw refresh token return disabled`);
  assert(result.rawAccessTokenReturnedNow === false, `${scenario}: raw access token return disabled`);

  assert(!serialized.includes('super-secret-step135-e'), `${scenario}: raw client secret is not serialized`);
  assert(!serialized.includes('client-id-step135-e'), `${scenario}: raw client id is not serialized`);
  assert(!serialized.includes('refresh_token'), `${scenario}: no refresh_token field`);
  assert(!serialized.includes('access_token'), `${scenario}: no access_token field`);
  assert(!serialized.includes('client_secret'), `${scenario}: no client_secret field`);
}

console.log('========== Step135-E LWA env/config validation runtime smoke ==========');

const ServiceClass = loadServiceClass();
const service = new ServiceClass();

const missing = service.validateFromProcessEnv({});
assert(missing.status === 'missing_required_env', 'missing env -> missing_required_env');
assert(missing.readyForRealLwaHttpTransport === false, 'missing env is not ready');
assert(missing.clientIdPresent === false, 'missing env clientIdPresent=false');
assert(missing.clientSecretPresent === false, 'missing env clientSecretPresent=false');
assert(missing.redirectUriPresent === false, 'missing env redirectUriPresent=false');
assert(missing.missingRequiredEnv.includes('AMAZON_SP_API_LWA_CLIENT_ID'), 'missing env reports client id');
assert(missing.missingRequiredEnv.includes('AMAZON_SP_API_LWA_CLIENT_SECRET'), 'missing env reports client secret');
assertSafeResult(missing, 'missing env');

const invalid = service.validateFromProcessEnv({
  AMAZON_SP_API_LWA_CLIENT_ID: 'client-id-step135-e',
  AMAZON_SP_API_LWA_CLIENT_SECRET: 'super-secret-step135-e',
  AMAZON_SP_API_OAUTH_REDIRECT_URI: 'http://not-https.example/callback',
  AMAZON_SP_API_MARKETPLACE_ID: 'A1VC38T7YXB528',
  AMAZON_SP_API_REGION: 'Japan',
  AMAZON_SP_API_LWA_TOKEN_ENDPOINT: 'http://api.amazon.com/auth/o2/token',
  AMAZON_SP_API_LWA_ENVIRONMENT: 'invalid-env',
});

assert(invalid.status === 'invalid_env', 'invalid env -> invalid_env');
assert(invalid.readyForRealLwaHttpTransport === false, 'invalid env is not ready');
assert(invalid.clientIdPresent === true, 'invalid env clientIdPresent=true');
assert(invalid.clientSecretPresent === true, 'invalid env clientSecretPresent=true');
assert(invalid.invalidEnv.includes('AMAZON_SP_API_OAUTH_REDIRECT_URI'), 'invalid env reports redirect URI');
assert(invalid.invalidEnv.includes('AMAZON_SP_API_LWA_TOKEN_ENDPOINT'), 'invalid env reports token endpoint');
assert(invalid.invalidEnv.includes('AMAZON_SP_API_REGION'), 'invalid env reports region');
assert(invalid.invalidEnv.includes('AMAZON_SP_API_LWA_ENVIRONMENT'), 'invalid env reports environment');
assertSafeResult(invalid, 'invalid env');

const ready = service.validateFromProcessEnv({
  AMAZON_SP_API_LWA_CLIENT_ID: 'client-id-step135-e',
  AMAZON_SP_API_LWA_CLIENT_SECRET: 'super-secret-step135-e',
  AMAZON_SP_API_OAUTH_REDIRECT_URI: 'https://ledgerseiri.com/api/imports/amazon-sp-api/oauth/callback',
  AMAZON_SP_API_MARKETPLACE_ID: 'A1VC38T7YXB528',
  AMAZON_SP_API_REGION: 'JP',
  AMAZON_SP_API_LWA_TOKEN_ENDPOINT: 'https://api.amazon.com/auth/o2/token',
  AMAZON_SP_API_LWA_ENVIRONMENT: 'production',
  AMAZON_SP_API_LWA_ENABLE_REAL_HTTP: 'true',
});

assert(ready.status === 'ready', 'valid mock env -> ready');
assert(ready.readyForRealLwaHttpTransport === true, 'valid mock env reports config ready');
assert(ready.clientIdPresent === true, 'valid mock env clientIdPresent=true');
assert(ready.clientSecretPresent === true, 'valid mock env clientSecretPresent=true');
assert(ready.redirectUriPresent === true, 'valid mock env redirectUriPresent=true');
assert(ready.marketplaceId === 'A1VC38T7YXB528', 'valid mock env marketplace retained');
assert(ready.region === 'JP', 'valid mock env region retained');
assert(ready.tokenEndpointHost === 'api.amazon.com', 'valid mock env exposes token endpoint host only');
assert(ready.environment === 'production', 'valid mock env environment retained');
assert(ready.realHttpEnabled === false, 'valid mock env still does not enable real HTTP even when env flag is true');
assert(Array.isArray(ready.missingRequiredEnv) && ready.missingRequiredEnv.length === 0, 'valid mock env has no missing env');
assert(Array.isArray(ready.invalidEnv) && ready.invalidEnv.length === 0, 'valid mock env has no invalid env');
assertSafeResult(ready, 'valid mock env');

console.log('========== Step135-E LWA env/config validation runtime smoke passed ==========');
