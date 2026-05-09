const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');

const files = {
  contract: path.join(
    root,
    'apps/api/src/imports/dto/amazon-sp-api-lwa-env-config-validation-contract.dto.ts',
  ),
  service: path.join(root, 'apps/api/src/imports/amazon-sp-api-token-exchange.service.ts'),
  controller: path.join(root, 'apps/api/src/imports/imports.controller.ts'),
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

const contract = read(files.contract);
const service = read(files.service);
const controller = read(files.controller);

console.log('========== Step135-C LWA env/config validation contract smoke ==========');

assertIncludes('contract', contract, "source: 'amazon-sp-api-lwa-env-config-validation-contract'");
assertIncludes('contract', contract, "step: 'Step135-C'");
assertIncludes('contract', contract, "phase: 'contract-only'");
assertIncludes('contract', contract, "configOwner: 'api-server'");
assertIncludes(
  'contract',
  contract,
  "currentExchangeService:\n      'AmazonSpApiTokenExchangeService.exchangeAuthorizationCodeWithLwaLater'",
);

for (const envName of [
  'AMAZON_SP_API_LWA_CLIENT_ID',
  'AMAZON_SP_API_LWA_CLIENT_SECRET',
  'AMAZON_SP_API_OAUTH_REDIRECT_URI',
  'AMAZON_SP_API_MARKETPLACE_ID',
  'AMAZON_SP_API_REGION',
  'AMAZON_SP_API_LWA_TOKEN_ENDPOINT',
  'AMAZON_SP_API_LWA_ENVIRONMENT',
  'AMAZON_SP_API_LWA_ENABLE_REAL_HTTP',
]) {
  assertIncludes('contract', contract, envName);
}

assertIncludes('contract', contract, "defaultTokenEndpoint: 'https://api.amazon.com/auth/o2/token'");
assertIncludes('contract', contract, "defaultMarketplaceId: 'A1VC38T7YXB528'");
assertIncludes('contract', contract, "defaultRegion: 'JP'");
assertIncludes('contract', contract, 'defaultRealHttpEnabled: false');
assertIncludes('contract', contract, "validation: 'https-url'");
assertIncludes('contract', contract, "validation: 'boolean-string'");
assertIncludes('contract', contract, 'exposeRawValueToLogs: false');
assertIncludes('contract', contract, 'exposeRawValueToFrontend: false');
assertIncludes('contract', contract, 'realHttpEnabled: false');
assertIncludes('contract', contract, 'readsProcessEnvNow: false');
assertIncludes('contract', contract, 'implementsRuntimeConfigServiceNow: false');
assertIncludes('contract', contract, 'injectsConfigIntoTokenExchangeServiceNow: false');
assertIncludes('contract', contract, 'callsLwaTokenEndpointNow: false');
assertIncludes('contract', contract, 'enablesRealHttpNow: false');
assertIncludes('contract', contract, 'logsClientSecretNow: false');
assertIncludes('contract', contract, 'returnsClientSecretToFrontendNow: false');
assertIncludes('contract', contract, 'changesOAuthCallbackRouteNow: false');
assertIncludes('contract', contract, 'changesTokenPersistenceNow: false');
assertIncludes('contract', contract, 'callsAmazonReportsApiNow: false');
assertIncludes('contract', contract, 'createsImportJobNow: false');
assertIncludes('contract', contract, 'createsTransactionNow: false');
assertIncludes('contract', contract, 'createsInventoryMovementNow: false');

assertIncludes('service', service, 'exchangeAuthorizationCodeWithLwaLater');
assertIncludes('service', service, 'enableRealLwaHttpTransport: false');
assertIncludes('service', service, "nextImplementationStep: 'Step136-F'");
assertIncludes('service', service, 'lwaHttpCallNow: false');

assertIncludes('controller', controller, 'exchangeAuthorizationCodeDryRunnable');
assertNotIncludes('controller', controller, 'exchangeAuthorizationCodeWithLwaLater');

for (const forbidden of [
  'process.env.AMAZON_SP_API_LWA_CLIENT_SECRET',
  'process.env.AMAZON_SP_API_LWA_CLIENT_ID',
  'callsLwaTokenEndpointNow: true',
  'enablesRealHttpNow: true',
  'logsClientSecretNow: true',
  'returnsClientSecretToFrontendNow: true',
  'createsImportJobNow: true',
  'createsTransactionNow: true',
  'createsInventoryMovementNow: true',
]) {
  assertNotIncludes('contract', contract, forbidden);
}

console.log('========== Step135-C LWA env/config validation contract smoke passed ==========');
