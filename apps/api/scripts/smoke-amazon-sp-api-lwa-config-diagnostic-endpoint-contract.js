const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');

const files = {
  contract: path.join(
    root,
    'apps/api/src/imports/dto/amazon-sp-api-lwa-config-diagnostic-endpoint-contract.dto.ts',
  ),
  controller: path.join(root, 'apps/api/src/imports/imports.controller.ts'),
  validatorService: path.join(
    root,
    'apps/api/src/imports/amazon-sp-api-lwa-env-config-validation.service.ts',
  ),
  module: path.join(root, 'apps/api/src/imports/imports.module.ts'),
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
const controller = read(files.controller);
const validatorService = read(files.validatorService);
const moduleText = read(files.module);

console.log('========== Step135-F LWA config diagnostic endpoint contract smoke ==========');

assertIncludes('contract', contract, "source: 'amazon-sp-api-lwa-config-diagnostic-endpoint-contract'");
assertIncludes('contract', contract, "step: 'Step135-F'");
assertIncludes('contract', contract, "phase: 'contract-only'");
assertIncludes('contract', contract, "plannedRoute: '/api/imports/internal/amazon-sp-api/lwa-config/status'");
assertIncludes('contract', contract, "plannedMethod: 'GET'");
assertIncludes('contract', contract, "plannedController: 'ImportsController'");
assertIncludes(
  'contract',
  contract,
  "plannedService:\n      'AmazonSpApiLwaEnvConfigValidationService.validateFromProcessEnv'",
);
assertIncludes('contract', contract, "requiredGuard: 'JwtAuthGuard'");
assertIncludes('contract', contract, 'requiredCompanyScope: true');
assertIncludes('contract', contract, 'internalOnly: true');
assertIncludes('contract', contract, 'frontendExposedNow: false');
assertIncludes('contract', contract, 'controllerImplementedNow: false');
assertIncludes('contract', contract, 'routeMappedNow: false');
assertIncludes('contract', contract, 'expectedUnauthenticatedStatusAfterImplementation: 401');
assertIncludes('contract', contract, "source: 'amazon-sp-api-lwa-env-config-validation-service'");
assertIncludes('contract', contract, 'realHttpEnabled: false');
assertIncludes('contract', contract, 'tokenExchangeHttpCallNow: false');
assertIncludes('contract', contract, 'lwaHttpCallNow: false');
assertIncludes('contract', contract, 'realSpApiRequestNow: false');
assertIncludes('contract', contract, 'tokenPersistenceDatabaseWriteNow: false');
assertIncludes('contract', contract, 'importJobWriteNow: false');
assertIncludes('contract', contract, 'transactionWriteNow: false');
assertIncludes('contract', contract, 'inventoryWriteNow: false');
assertIncludes('contract', contract, 'rawClientSecretReturnedNow: false');
assertIncludes('contract', contract, 'rawClientIdReturnedNow: false');
assertIncludes('contract', contract, 'rawRefreshTokenReturnedNow: false');
assertIncludes('contract', contract, 'rawAccessTokenReturnedNow: false');
assertIncludes('contract', contract, 'implementsControllerRouteNow: false');
assertIncludes('contract', contract, 'injectsValidatorIntoControllerNow: false');
assertIncludes('contract', contract, 'enablesRealLwaHttpNow: false');
assertIncludes('contract', contract, 'callsLwaTokenEndpointNow: false');
assertIncludes('contract', contract, 'callsAmazonReportsApiNow: false');
assertIncludes('contract', contract, 'returnsRawSecretNow: false');

for (const forbiddenField of [
  'clientId',
  'clientSecret',
  'accessToken',
  'refreshToken',
  'lwa_client_secret',
  'amazon_refresh_token',
  'authorizationCode',
]) {
  assertIncludes('contract', contract, `'${forbiddenField}'`);
}

assertIncludes('validatorService', validatorService, 'validateFromProcessEnv');
assertIncludes('validatorService', validatorService, 'rawClientSecretReturnedNow: false');
assertIncludes('validatorService', validatorService, 'rawClientIdReturnedNow: false');
assertIncludes('module', moduleText, 'AmazonSpApiLwaEnvConfigValidationService');

assertNotIncludes('controller', controller, "internal/amazon-sp-api/lwa-config/status");
assertNotIncludes('controller', controller, 'AmazonSpApiLwaEnvConfigValidationService');

for (const positiveFlag of [
  'implementsControllerRouteNow: true',
  'injectsValidatorIntoControllerNow: true',
  'enablesRealLwaHttpNow: true',
  'callsLwaTokenEndpointNow: true',
  'callsAmazonReportsApiNow: true',
  'createsImportJobNow: true',
  'createsTransactionNow: true',
  'createsInventoryMovementNow: true',
  'returnsRawSecretNow: true',
]) {
  assertNotIncludes('contract', contract, positiveFlag);
}

console.log('========== Step135-F LWA config diagnostic endpoint contract smoke passed ==========');
