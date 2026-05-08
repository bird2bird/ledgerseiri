const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');

const files = {
  contract: path.join(
    root,
    'apps/api/src/imports/dto/amazon-sp-api-oauth-token-exchange-boundary-contract.dto.ts',
  ),
  controller: path.join(root, 'apps/api/src/imports/imports.controller.ts'),
  exchangeService: path.join(
    root,
    'apps/api/src/imports/amazon-sp-api-token-exchange.service.ts',
  ),
  persistenceService: path.join(
    root,
    'apps/api/src/imports/amazon-sp-api-token-persistence.service.ts',
  ),
  packageJson: path.join(root, 'apps/api/package.json'),
};

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

function assertIncludes(name, text, needle) {
  assert(text.includes(needle), `${name} contains marker: ${needle}`);
}

function assertNotIncludes(name, text, needle) {
  assert(!text.includes(needle), `${name} does not contain forbidden marker: ${needle}`);
}

const contract = read(files.contract);
const controller = read(files.controller);
const exchangeService = read(files.exchangeService);
const persistenceService = read(files.persistenceService);

console.log('========== Step135-A OAuth token exchange boundary contract smoke ==========');

assertIncludes(
  'contract',
  contract,
  "source: 'amazon-sp-api-oauth-token-exchange-boundary-contract'",
);
assertIncludes('contract', contract, "step: 'Step135-A'");
assertIncludes('contract', contract, "phase: 'contract-only'");
assertIncludes('contract', contract, "callbackRoute: '/api/imports/amazon-sp-api/oauth/callback'");
assertIncludes(
  'contract',
  contract,
  "currentExchangeService:\n      'AmazonSpApiTokenExchangeService.exchangeAuthorizationCodeDryRunnable'",
);
assertIncludes(
  'contract',
  contract,
  "futureExchangeService:\n      'AmazonSpApiTokenExchangeService.exchangeAuthorizationCodeWithLwaLater'",
);
assertIncludes('contract', contract, "spapi_oauth_code: 'required-preferred'");
assertIncludes('contract', contract, "selling_partner_id: 'required'");
assertIncludes('contract', contract, 'validateOAuthStateBeforeExchange: true');
assertIncludes('contract', contract, 'redactAuthorizationCodeInLogs: true');
assertIncludes('contract', contract, 'redactRefreshTokenInLogs: true');
assertIncludes('contract', contract, 'redactAccessTokenInLogs: true');
assertIncludes('contract', contract, 'redactClientSecretInLogs: true');
assertIncludes('contract', contract, 'neverReturnRawRefreshTokenToFrontend: true');
assertIncludes('contract', contract, 'neverReturnRawAccessTokenToFrontend: true');
assertIncludes('contract', contract, 'neverReturnClientSecretToFrontend: true');
assertIncludes('contract', contract, "currentTransport: 'fake-dry-run'");
assertIncludes('contract', contract, "nextTransport: 'real-lwa-http-client-later'");
assertIncludes('contract', contract, "lwaTokenEndpointHost: 'api.amazon.com'");
assertIncludes('contract', contract, "lwaTokenEndpointPath: '/auth/o2/token'");
assertIncludes('contract', contract, "grantType: 'authorization_code'");
assertIncludes('contract', contract, 'tokenExchangeHttpCallNow: false');
assertIncludes('contract', contract, 'lwaHttpCallNow: false');
assertIncludes('contract', contract, 'realSpApiRequestNow: false');
assertIncludes('contract', contract, 'existingCallbackMayPersistFakeEncryptedCredential: true');
assertIncludes('contract', contract, 'step135AAddsNewPersistenceWrite: false');
assertIncludes('contract', contract, 'step135AChangesPersistenceSchema: false');
assertIncludes('contract', contract, 'step135AChangesCallbackRuntimeBehavior: false');
assertIncludes('contract', contract, 'implementsRealLwaHttpClientNow: false');
assertIncludes('contract', contract, 'callsLwaTokenEndpointNow: false');
assertIncludes('contract', contract, 'changesOAuthCallbackRouteNow: false');
assertIncludes('contract', contract, 'changesTokenPersistenceNow: false');
assertIncludes('contract', contract, 'callsAmazonReportsApiNow: false');
assertIncludes('contract', contract, 'createsImportJobNow: false');
assertIncludes('contract', contract, 'createsImportStagingRowNow: false');
assertIncludes('contract', contract, 'createsTransactionNow: false');
assertIncludes('contract', contract, 'createsInventoryMovementNow: false');
assertIncludes('contract', contract, 'changesFrontendNow: false');

assertIncludes('controller', controller, 'amazonSpApiOAuthCallbackBoundary');
assertIncludes('controller', controller, 'exchangeAuthorizationCodeDryRunnable');
assertIncludes('controller', controller, 'persistEncryptedRefreshCredential');
assertIncludes('controller', controller, 'persistEncryptedAccessTokenCache');

assertIncludes('exchangeService', exchangeService, 'exchangeAuthorizationCodeDryRunnable');
assertIncludes('exchangeService', exchangeService, 'tokenExchangeHttpCallNow: false');
assertIncludes('exchangeService', exchangeService, 'lwaHttpCallNow: false');
assertIncludes('exchangeService', exchangeService, 'realSpApiRequestNow: false');
assertIncludes('exchangeService', exchangeService, "transportMode: 'fake'");
assertIncludes('exchangeService', exchangeService, 'dryRun: true');

assertIncludes('persistenceService', persistenceService, 'persistEncryptedRefreshCredential');

assertNotIncludes('contract', contract, 'callsLwaTokenEndpointNow: true');
assertNotIncludes('contract', contract, 'implementsRealLwaHttpClientNow: true');
assertNotIncludes('contract', contract, 'callsAmazonReportsApiNow: true');
assertNotIncludes('contract', contract, 'createsImportJobNow: true');
assertNotIncludes('contract', contract, 'createsTransactionNow: true');
assertNotIncludes('contract', contract, 'createsInventoryMovementNow: true');

console.log('========== Step135-A OAuth token exchange boundary contract smoke passed ==========');
