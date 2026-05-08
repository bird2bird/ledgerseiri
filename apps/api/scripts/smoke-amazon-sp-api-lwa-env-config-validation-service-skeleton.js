const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');

const files = {
  service: path.join(root, 'apps/api/src/imports/amazon-sp-api-lwa-env-config-validation.service.ts'),
  module: path.join(root, 'apps/api/src/imports/imports.module.ts'),
  contract: path.join(
    root,
    'apps/api/src/imports/dto/amazon-sp-api-lwa-env-config-validation-contract.dto.ts',
  ),
  exchangeService: path.join(root, 'apps/api/src/imports/amazon-sp-api-token-exchange.service.ts'),
};

function read(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing file: ${path.relative(root, file)}`);
  }
  return fs.readFileSync(file, 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`[OK] ${message}`);
}

function assertIncludes(name, text, marker) {
  assert(text.includes(marker), `${name} contains marker: ${marker}`);
}

function assertNotIncludes(name, text, marker) {
  assert(!text.includes(marker), `${name} does not contain forbidden marker: ${marker}`);
}

const service = read(files.service);
const moduleText = read(files.module);
const contract = read(files.contract);
const exchangeService = read(files.exchangeService);

console.log('========== Step135-D LWA env config validation service skeleton smoke ==========');

assertIncludes('service', service, 'export class AmazonSpApiLwaEnvConfigValidationService');
assertIncludes('service', service, 'validateFromProcessEnv(env: NodeJS.ProcessEnv = process.env)');
assertIncludes('service', service, "source: 'amazon-sp-api-lwa-env-config-validation-service'");
assertIncludes('service', service, "step: 'Step135-D'");
assertIncludes('service', service, "status: AmazonSpApiLwaEnvConfigValidationStatus");
assertIncludes('service', service, "readyForRealLwaHttpTransport: status === 'ready'");
assertIncludes('service', service, 'clientIdPresent: clientId.length > 0');
assertIncludes('service', service, 'clientSecretPresent: clientSecret.length > 0');
assertIncludes('service', service, 'redirectUriPresent: redirectUri.length > 0');
assertIncludes('service', service, "marketplaceId = normalizeEnv(env.AMAZON_SP_API_MARKETPLACE_ID) || 'A1VC38T7YXB528'");
assertIncludes('service', service, "region = normalizeEnv(env.AMAZON_SP_API_REGION) || 'JP'");
assertIncludes('service', service, "tokenExchangeHttpCallNow: false");
assertIncludes('service', service, "lwaHttpCallNow: false");
assertIncludes('service', service, "realSpApiRequestNow: false");
assertIncludes('service', service, "tokenPersistenceDatabaseWriteNow: false");
assertIncludes('service', service, "rawClientSecretReturnedNow: false");
assertIncludes('service', service, "rawClientIdReturnedNow: false");
assertIncludes('service', service, "rawRefreshTokenReturnedNow: false");
assertIncludes('service', service, "rawAccessTokenReturnedNow: false");
assertIncludes('service', service, "realHttpEnabled: false");

assertIncludes('module', moduleText, "AmazonSpApiLwaEnvConfigValidationService");
assertIncludes('contract', contract, "step: 'Step135-C'");
assertIncludes('contract', contract, "readsProcessEnvNow: false");
assertIncludes('exchangeService', exchangeService, 'exchangeAuthorizationCodeWithLwaLater');
assertIncludes('exchangeService', exchangeService, 'enableRealLwaHttpTransport: false');

for (const forbidden of [
  'fetch(',
  'axios.',
  'http.request',
  'https.request',
  'method: "POST"',
  "method: 'POST'",
  'Authorization:',
  'Bearer ',
  'createReport(',
  'getReport(',
  'getReportDocument(',
  'prisma.importJob',
  'prisma.importStagingRow',
  'prisma.transaction',
  'prisma.inventory',
]) {
  assertNotIncludes('service', service, forbidden);
}

assertNotIncludes('service', service, 'clientSecret,');
assertNotIncludes('service', service, 'clientSecret:');
assertNotIncludes('service', service, 'clientId,');

console.log('========== Step135-D LWA env config validation service skeleton smoke passed ==========');
