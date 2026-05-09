const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');

const files = {
  controller: path.join(root, 'apps/api/src/imports/imports.controller.ts'),
  gateService: path.join(root, 'apps/api/src/imports/amazon-sp-api-real-lwa-activation-gate.service.ts'),
  contract: path.join(
    root,
    'apps/api/src/imports/dto/amazon-sp-api-lwa-activation-gate-diagnostic-endpoint-contract.dto.ts',
  ),
};

function read(file) {
  if (!fs.existsSync(file)) throw new Error(`Missing file: ${path.relative(root, file)}`);
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
const gateService = read(files.gateService);
const contract = read(files.contract);

console.log('========== Step137-E LWA activation gate diagnostic endpoint implementation smoke ==========');

for (const marker of [
  "import { AmazonSpApiRealLwaActivationGateService } from './amazon-sp-api-real-lwa-activation-gate.service';",
  'private readonly amazonSpApiRealLwaActivationGateService: AmazonSpApiRealLwaActivationGateService',
  "Step137-E: Amazon SP-API real LWA activation gate diagnostic endpoint implementation",
  "@Get('internal/amazon-sp-api/lwa-activation-gate/status')",
  'amazonSpApiLwaActivationGateDiagnosticEndpoint',
  'this.amazonSpApiLwaEnvConfigValidationService.validateFromProcessEnv()',
  'this.amazonSpApiRealLwaActivationGateService.evaluateRealLwaActivationLater',
  "source: 'amazon-sp-api-lwa-activation-gate-diagnostic' as const",
  "endpointImplementedNow: true as const",
  "controllerRoute: '/api/imports/internal/amazon-sp-api/lwa-activation-gate/status'",
  "guardedBy: 'JwtAuthGuard' as const",
  "companyScoped: true as const",
  "frontendExposedNow: false as const",
  "callbackRuntimeChangedNow: false as const",
  "oauthCallbackRouteChangedNow: false as const",
  "rawSecretReturnedNow: false as const",
  "rawAuthorizationCodeReturnedNow: false as const",
  "rawClientIdReturnedNow: false as const",
  "rawClientSecretReturnedNow: false as const",
  "rawRequestBodyReturnedNow: false as const",
  "rawLwaResponseReturnedNow: false as const",
  "rawAccessTokenReturnedNow: false as const",
  "rawRefreshTokenReturnedNow: false as const",
  "realHttpAllowedNow: false as const",
  "realHttpEnabledNow: false as const",
  "tokenExchangeHttpCallNow: false as const",
  "lwaHttpCallNow: false as const",
  "realSpApiRequestNow: false as const",
  "tokenPersistenceDatabaseWriteNow: false as const",
  "reportsApiCallNow: false as const",
  "importJobWriteNow: false as const",
  "importStagingRowWriteNow: false as const",
  "transactionWriteNow: false as const",
  "inventoryWriteNow: false as const",
  "callbackStateTrusted: false",
  "sellingPartnerIdPresent: false",
  "authorizationCodePresent: false",
  "serverSideRuntimeGateEnabled: false",
  "environmentAllowsRealLwaHttp: false",
  "companyStoreAllowlisted: false",
  "explicitOperatorConfirmed: false",
  "STEP137_E_LWA_ACTIVATION_GATE_COMPANY_REQUIRED",
  "STEP137_E_LWA_ACTIVATION_GATE_BAD_REQUEST: storeId is required.",
]) {
  assertIncludes('controller', controller, marker);
}

assertIncludes('gateService', gateService, 'export class AmazonSpApiRealLwaActivationGateService');
assertIncludes('gateService', gateService, 'evaluateRealLwaActivationLater');
assertIncludes('gateService', gateService, 'realHttpAllowedNow: false');

assertIncludes('contract', contract, "step: 'Step137-D'");
assertIncludes('contract', contract, "plannedControllerRoute:\n      '/api/imports/internal/amazon-sp-api/lwa-activation-gate/status'");

for (const forbidden of [
  'fetch(',
  'axios.',
  'http.request',
  'https.request',
  'request.write(',
  '.post(',
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

for (const forbiddenPositive of [
  'frontendExposedNow: true as const',
  'callbackRuntimeChangedNow: true as const',
  'oauthCallbackRouteChangedNow: true as const',
  'rawSecretReturnedNow: true as const',
  'rawAuthorizationCodeReturnedNow: true as const',
  'rawClientIdReturnedNow: true as const',
  'rawClientSecretReturnedNow: true as const',
  'rawRequestBodyReturnedNow: true as const',
  'rawLwaResponseReturnedNow: true as const',
  'rawAccessTokenReturnedNow: true as const',
  'rawRefreshTokenReturnedNow: true as const',
  'realHttpAllowedNow: true as const',
  'realHttpEnabledNow: true as const',
  'tokenExchangeHttpCallNow: true as const',
  'lwaHttpCallNow: true as const',
  'realSpApiRequestNow: true as const',
  'tokenPersistenceDatabaseWriteNow: true as const',
  'reportsApiCallNow: true as const',
  'importJobWriteNow: true as const',
  'importStagingRowWriteNow: true as const',
  'transactionWriteNow: true as const',
  'inventoryWriteNow: true as const',
]) {
  assertNotIncludes('controller', controller, forbiddenPositive);
}

const callbackStart = controller.indexOf("async amazonSpApiOAuthCallbackBoundary");
assert(callbackStart >= 0, 'OAuth callback method still exists');
const callbackChunk = controller.slice(callbackStart, controller.indexOf("@Post('detect-month-conflicts')", callbackStart));
assert(callbackChunk.includes('exchangeAuthorizationCodeDryRunnable'), 'OAuth callback still uses dry-runnable exchange');
assert(!callbackChunk.includes('evaluateRealLwaActivationLater'), 'OAuth callback does not call activation gate');
assert(!callbackChunk.includes('orchestrateRealLwaExchangeChainDisabledLater'), 'OAuth callback does not call real LWA chain');
assert(!callbackChunk.includes('executeRealLwaTokenExchangeHttpLater'), 'OAuth callback does not call HTTP transport');

console.log('========== Step137-E LWA activation gate diagnostic endpoint implementation smoke passed ==========');
