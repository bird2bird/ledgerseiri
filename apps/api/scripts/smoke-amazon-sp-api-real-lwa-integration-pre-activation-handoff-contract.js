const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');

const files = {
  contract: path.join(
    root,
    'apps/api/src/imports/dto/amazon-sp-api-real-lwa-integration-pre-activation-handoff-contract.dto.ts',
  ),
  service: path.join(root, 'apps/api/src/imports/amazon-sp-api-token-exchange.service.ts'),
  controller: path.join(root, 'apps/api/src/imports/imports.controller.ts'),
  packageJson: path.join(root, 'apps/api/package.json'),
  parserContract: path.join(
    root,
    'apps/api/src/imports/dto/amazon-sp-api-sanitized-lwa-http-response-parser-contract.dto.ts',
  ),
  persistenceContract: path.join(
    root,
    'apps/api/src/imports/dto/amazon-sp-api-token-persistence-encrypted-boundary-contract.dto.ts',
  ),
  transitionContract: path.join(
    root,
    'apps/api/src/imports/dto/amazon-sp-api-real-http-activation-transition-contract.dto.ts',
  ),
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

function assertIncludes(name, text, marker) {
  assert(text.includes(marker), `${name} contains marker: ${marker}`);
}

function assertNotIncludes(name, text, marker) {
  assert(!text.includes(marker), `${name} does not contain forbidden marker: ${marker}`);
}

const contract = read(files.contract);
const service = read(files.service);
const controller = read(files.controller);
const pkg = JSON.parse(read(files.packageJson));
const parserContract = read(files.parserContract);
const persistenceContract = read(files.persistenceContract);
const transitionContract = read(files.transitionContract);

console.log('========== Step137-S real LWA integration pre-activation handoff contract smoke ==========');

assertIncludes(
  'package.json',
  JSON.stringify(pkg.scripts || {}),
  'smoke:amazon-sp-api-real-lwa-integration-pre-activation-handoff-contract',
);

for (const marker of [
  "source: 'amazon-sp-api-real-lwa-integration-pre-activation-handoff-contract'",
  "step: 'Step137-S'",
  "phase: 'pre-activation-handoff-contract-only'",
  "completedGuardrailRange: 'Step137-H-through-Step137-R'",
  "latestRuntimeCoverageStep: 'Step137-R'",
  "guardedHttpTransportTestDouble: true",
  "sanitizedLwaResponseParser: true",
  "tokenPersistenceInputBuilderTestDouble: true",
  "realHttpNetworkTransport: false",
  "encryptedTokenPersistenceDatabaseWrite: false",
  "oauthCallbackWiring: false",
  "controllerRuntimeWiring: false",
  "prismaSchemaOrMigration: false",
  "guardedTransportMethod:",
  "'AmazonSpApiTokenExchangeService.executeRealLwaTokenExchangeHttpGuardedLater'",
  "sanitizedParserMethod:",
  "'AmazonSpApiTokenExchangeService.parseRealLwaHttpResponseSanitizedLater'",
  "persistenceInputBuilderMethod:",
  "'AmazonSpApiTokenExchangeService.prepareEncryptedTokenPersistenceInputLater'",
  "guardedTransportMode: 'test-double-no-network'",
  "parserMode: 'sanitized-only'",
  "persistenceMode: 'encrypted-input-test-double-no-db-write'",
  "controllerMayCallGuardedTransport: false",
  "controllerMayCallParser: false",
  "controllerMayCallPersistenceInputBuilder: false",
  "oauthCallbackMayCallRealLwaHttp: false",
  "oauthCallbackMayPersistTokens: false",
  "diagnosticEndpointMayEnableRealHttp: false",
  "frontendMayEnableRealHttp: false",
  "queryParamMayEnableRealHttp: false",
  "envFlagAloneMayEnableRealHttp: false",
  "realAmazonNetworkCallMayExecute: false",
  "tokenPersistenceDatabaseWriteMayExecute: false",
  "plaintextTokenDatabaseWriteMayExecute: false",
  "prismaSchemaMayChange: false",
  "migrationMayBeAdded: false",
  "'Step137-T: define executable real HTTP transport replacement contract'",
  "'Step137-U: implement real HTTP transport behind server-side activation gate only'",
  "'Step137-V: define encrypted token persistence schema contract'",
  "'Step137-W: add Prisma model and migration only after encrypted persistence contract'",
  "'Step137-X: implement encrypted persistence write service with no controller wiring'",
  "'Step137-Y: wire OAuth callback to gated transport, parser, and encrypted persistence only after all smokes pass'",
  "'smoke:amazon-sp-api-real-lwa-integration-pre-activation-handoff-contract'",
  "'smoke:amazon-sp-api-token-persistence-builder-branch-runtime'",
  "'smoke:amazon-sp-api-token-persistence-input-builder-test-double'",
  "'smoke:amazon-sp-api-token-persistence-encrypted-boundary-contract'",
  "'smoke:amazon-sp-api-sanitized-lwa-parser-branch-runtime'",
  "'smoke:amazon-sp-api-sanitized-lwa-http-response-parser-test-double'",
  "'smoke:amazon-sp-api-sanitized-lwa-http-response-parser-contract'",
  "'smoke:amazon-sp-api-real-http-activation-transition-contract'",
  "'smoke:amazon-sp-api-guarded-lwa-http-activation-handoff-contract'",
  "'smoke:amazon-sp-api-guarded-lwa-http-transport-branch-runtime'",
  "'smoke:amazon-sp-api-guarded-lwa-http-transport-test-double'",
  "'smoke:amazon-sp-api-real-lwa-guarded-http-activation-contract'",
  "'smoke:amazon-sp-api-lwa-activation-gate-diagnostic-endpoint'",
  "'smoke:amazon-sp-api-real-lwa-activation-gate-mock-runtime'",
  "'smoke:amazon-sp-api-real-lwa-exchange-chain-mock-runtime'",
  "rawAuthorizationCodeReturnedNow: false",
  "rawClientSecretReturnedNow: false",
  "rawRequestBodyReturnedNow: false",
  "rawLwaResponseReturnedNow: false",
  "rawAccessTokenReturnedNow: false",
  "rawRefreshTokenReturnedNow: false",
  "plaintextAccessTokenDatabaseWriteNow: false",
  "plaintextRefreshTokenDatabaseWriteNow: false",
  "encryptedRefreshTokenDatabaseWriteNow: false",
  "encryptedAccessTokenCacheDatabaseWriteNow: false",
  "activationGateDefined: true",
  "guardedTransportDefined: true",
  "guardedTransportBranchCovered: true",
  "parserDefined: true",
  "parserBranchCovered: true",
  "persistenceBoundaryDefined: true",
  "persistenceBuilderDefined: true",
  "persistenceBuilderBranchCovered: true",
  "realNetworkActivationReadyNow: false",
  "encryptedPersistenceReadyNow: false",
  "oauthCallbackReadyForRealTokenExchangeNow: false",
  "nextSuggestedStep: 'Step137-T'",
]) {
  assertIncludes('contract', contract, marker);
}

for (const forbidden of [
  "realHttpNetworkTransport: true",
  "encryptedTokenPersistenceDatabaseWrite: true",
  "oauthCallbackWiring: true",
  "controllerRuntimeWiring: true",
  "prismaSchemaOrMigration: true",
  "controllerMayCallGuardedTransport: true",
  "controllerMayCallParser: true",
  "controllerMayCallPersistenceInputBuilder: true",
  "oauthCallbackMayCallRealLwaHttp: true",
  "oauthCallbackMayPersistTokens: true",
  "diagnosticEndpointMayEnableRealHttp: true",
  "frontendMayEnableRealHttp: true",
  "queryParamMayEnableRealHttp: true",
  "envFlagAloneMayEnableRealHttp: true",
  "realAmazonNetworkCallMayExecute: true",
  "tokenPersistenceDatabaseWriteMayExecute: true",
  "plaintextTokenDatabaseWriteMayExecute: true",
  "prismaSchemaMayChange: true",
  "migrationMayBeAdded: true",
  "rawAuthorizationCodeReturnedNow: true",
  "rawClientSecretReturnedNow: true",
  "rawRequestBodyReturnedNow: true",
  "rawLwaResponseReturnedNow: true",
  "rawAccessTokenReturnedNow: true",
  "rawRefreshTokenReturnedNow: true",
  "plaintextAccessTokenDatabaseWriteNow: true",
  "plaintextRefreshTokenDatabaseWriteNow: true",
  "encryptedRefreshTokenDatabaseWriteNow: true",
  "encryptedAccessTokenCacheDatabaseWriteNow: true",
  "realNetworkActivationReadyNow: true",
  "encryptedPersistenceReadyNow: true",
  "oauthCallbackReadyForRealTokenExchangeNow: true",
]) {
  assertNotIncludes('contract', contract, forbidden);
}

assertIncludes('service', service, 'executeRealLwaTokenExchangeHttpGuardedLater');
assertIncludes('service', service, 'parseRealLwaHttpResponseSanitizedLater');
assertIncludes('service', service, 'prepareEncryptedTokenPersistenceInputLater');
assertIncludes('service', service, "transportMode: 'test-double-no-network'");
assertIncludes('service', service, "parserMode: 'sanitized-only'");
assertIncludes('service', service, "persistenceMode: 'encrypted-input-test-double-no-db-write'");
assertIncludes('service', service, 'tokenPersistenceDatabaseWriteNow: false');
assertIncludes('service', service, 'plaintextTokenDatabaseWriteNow: false');
assertIncludes('service', service, 'rawAccessTokenReturnedNow: false');
assertIncludes('service', service, 'rawRefreshTokenReturnedNow: false');

assertIncludes('parserContract', parserContract, "source: 'amazon-sp-api-sanitized-lwa-http-response-parser-contract'");
assertIncludes('persistenceContract', persistenceContract, "source: 'amazon-sp-api-token-persistence-encrypted-boundary-contract'");
assertIncludes('transitionContract', transitionContract, "source: 'amazon-sp-api-real-http-activation-transition-contract'");

assertIncludes('controller', controller, 'exchangeAuthorizationCodeDryRunnable');
assertNotIncludes('controller', controller, 'executeRealLwaTokenExchangeHttpGuardedLater');
assertNotIncludes('controller', controller, 'parseRealLwaHttpResponseSanitizedLater');
assertNotIncludes('controller', controller, 'prepareEncryptedTokenPersistenceInputLater');

console.log('========== Step137-S real LWA integration pre-activation handoff contract smoke passed ==========');
