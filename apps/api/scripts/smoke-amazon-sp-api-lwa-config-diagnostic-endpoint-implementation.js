const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');

const files = {
  controller: path.join(root, 'apps/api/src/imports/imports.controller.ts'),
  service: path.join(root, 'apps/api/src/imports/amazon-sp-api-lwa-env-config-validation.service.ts'),
  contract: path.join(
    root,
    'apps/api/src/imports/dto/amazon-sp-api-lwa-config-diagnostic-endpoint-contract.dto.ts',
  ),
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

const controller = read(files.controller);
const service = read(files.service);
const contract = read(files.contract);

console.log('========== Step135-G LWA config diagnostic endpoint implementation smoke ==========');

assertIncludes('controller', controller, "import { AmazonSpApiLwaEnvConfigValidationService }");
assertIncludes(
  'controller',
  controller,
  'private readonly amazonSpApiLwaEnvConfigValidationService: AmazonSpApiLwaEnvConfigValidationService',
);
assertIncludes('controller', controller, 'Step135-G: Amazon SP-API LWA config diagnostic endpoint implementation');
assertIncludes('controller', controller, '@UseGuards(JwtAuthGuard)');
assertIncludes('controller', controller, "@Get('internal/amazon-sp-api/lwa-config/status')");
assertIncludes('controller', controller, 'amazonSpApiLwaConfigDiagnosticEndpoint');
assertIncludes('controller', controller, 'STEP135_G_LWA_CONFIG_DIAGNOSTIC_COMPANY_REQUIRED');
assertIncludes('controller', controller, 'this.amazonSpApiLwaEnvConfigValidationService.validateFromProcessEnv()');
assertIncludes('controller', controller, 'endpointImplementedNow: true as const');
assertIncludes('controller', controller, "guardedBy: 'JwtAuthGuard' as const");
assertIncludes('controller', controller, 'companyScoped: true as const');
assertIncludes('controller', controller, 'frontendExposedNow: false as const');
assertIncludes('controller', controller, 'rawSecretReturnedNow: false as const');
assertIncludes('controller', controller, 'importJobWriteNow: false as const');
assertIncludes('controller', controller, 'transactionWriteNow: false as const');
assertIncludes('controller', controller, 'inventoryWriteNow: false as const');

assertIncludes('service', service, 'validateFromProcessEnv');
assertIncludes('service', service, 'rawClientSecretReturnedNow: false');
assertIncludes('service', service, 'rawClientIdReturnedNow: false');
assertIncludes('service', service, 'realHttpEnabled: false');
assertIncludes('service', service, 'lwaHttpCallNow: false');

assertIncludes('contract', contract, "plannedRoute: '/api/imports/internal/amazon-sp-api/lwa-config/status'");
assertIncludes('contract', contract, "requiredGuard: 'JwtAuthGuard'");
assertIncludes('contract', contract, 'controllerImplementedNow: false');

for (const forbidden of [
  'fetch(',
  'axios.',
  'http.request',
  'https.request',
  'createReport(',
  'getReport(',
  'getReportDocument(',
  'prisma.importJob',
  'prisma.importStagingRow',
  'prisma.transaction',
  'prisma.inventory',
]) {
  assertNotIncludes('controller', controller, forbidden);
}

const endpointStart = controller.indexOf('amazonSpApiLwaConfigDiagnosticEndpoint');
const endpointEnd = controller.indexOf('// Step133-B:', endpointStart);

assert(endpointStart >= 0, 'controller endpoint block start can be isolated');
assert(endpointEnd > endpointStart, 'controller endpoint block end can be isolated');

const endpointBlock = controller.slice(endpointStart, endpointEnd);

for (const forbiddenReturn of [
  'clientSecret:',
  'clientSecret,',
  'clientId:',
  'clientId,',
  'accessToken:',
  'refreshToken:',
  'authorizationCode:',
]) {
  assertNotIncludes('diagnostic endpoint block', endpointBlock, forbiddenReturn);
}

console.log('========== Step135-G LWA config diagnostic endpoint implementation smoke passed ==========');
