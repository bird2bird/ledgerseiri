const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');

const files = {
  contract: path.join(
    root,
    'apps/api/src/imports/dto/amazon-sp-api-token-persistence-encrypted-boundary-contract.dto.ts',
  ),
  service: path.join(root, 'apps/api/src/imports/amazon-sp-api-token-exchange.service.ts'),
  controller: path.join(root, 'apps/api/src/imports/imports.controller.ts'),
  parserContract: path.join(
    root,
    'apps/api/src/imports/dto/amazon-sp-api-sanitized-lwa-http-response-parser-contract.dto.ts',
  ),
  transitionContract: path.join(
    root,
    'apps/api/src/imports/dto/amazon-sp-api-real-http-activation-transition-contract.dto.ts',
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

function assertIncludes(name, text, marker) {
  assert(text.includes(marker), `${name} contains marker: ${marker}`);
}

function assertNotIncludes(name, text, marker) {
  assert(!text.includes(marker), `${name} does not contain forbidden marker: ${marker}`);
}

const contract = read(files.contract);
const service = read(files.service);
const controller = read(files.controller);
const parserContract = read(files.parserContract);
const transitionContract = read(files.transitionContract);
const pkg = JSON.parse(read(files.packageJson));

console.log('========== Step137-P token persistence encrypted boundary contract smoke ==========');

assertIncludes(
  'package.json',
  JSON.stringify(pkg.scripts || {}),
  'smoke:amazon-sp-api-token-persistence-encrypted-boundary-contract',
);

for (const marker of [
  "source: 'amazon-sp-api-token-persistence-encrypted-boundary-contract'",
  "step: 'Step137-P'",
  "phase: 'persistence-boundary-contract-only'",
  "previousParserRuntimeStep: 'Step137-O'",
  "previousParserMethod:",
  "'AmazonSpApiTokenExchangeService.parseRealLwaHttpResponseSanitizedLater'",
  "futurePersistenceBoundaryPath:",
  "'AmazonSpApiTokenExchangeService.prepareEncryptedTokenPersistenceInputLater'",
  "definePersistenceBoundaryOnlyNow: true",
  "implementEncryptionNow: false",
  "implementPersistenceInputBuilderNow: false",
  "writeDatabaseNow: false",
  "addPrismaModelNow: false",
  "addMigrationNow: false",
  "wireOAuthCallbackNow: false",
  "wireControllerNow: false",
  "callAmazonNow: false",
  "startsAfterSanitizedParserSuccess: true",
  "requiresTrustedCompanyId: true",
  "requiresTrustedStoreId: true",
  "requiresMarketplaceId: true",
  "requiresRegion: true",
  "requiresSellingPartnerId: true",
  "requiresAccessTokenPresent: true",
  "requiresRefreshTokenPresent: true",
  "requiresTokenTypeBearer: true",
  "requiresPositiveExpiresInSeconds: true",
  "requiresEncryptionKeyId: true",
  "requiresEncryptionAlgorithm: true",
  "requiresTokenVersion: true",
  "requiresOperatorApprovedPersistenceBoundary: true",
  "plaintextAccessTokenMayEnterOnlyEncryptionInputLater: true",
  "plaintextRefreshTokenMayEnterOnlyEncryptionInputLater: true",
  "plaintextAccessTokenMayBeLogged: false",
  "plaintextRefreshTokenMayBeLogged: false",
  "plaintextAccessTokenMayBeReturned: false",
  "plaintextRefreshTokenMayBeReturned: false",
  "plaintextAccessTokenMayBeStoredInDatabase: false",
  "plaintextRefreshTokenMayBeStoredInDatabase: false",
  "plaintextTokenMayAppearInImportJob: false",
  "plaintextTokenMayAppearInImportStagingRow: false",
  "plaintextTokenMayAppearInTransaction: false",
  "plaintextTokenMayAppearInInventory: false",
  "encryptedRefreshTokenRequired: true",
  "encryptedAccessTokenCacheAllowed: true",
  "accessTokenExpiresAtRequired: true",
  "refreshTokenFingerprintRequired: true",
  "accessTokenFingerprintRequired: true",
  "tokenType: 'bearer'",
  "scopeMayBeStored: true",
  "encryptionKeyIdRequired: true",
  "encryptionAlgorithmRequired: true",
  "tokenVersionRequired: true",
  "controllerMayPersistTokensDirectly: false",
  "oauthCallbackMayPersistTokensBeforeBoundary: false",
  "parserMayWriteDatabase: false",
  "httpTransportMayWriteDatabase: false",
  "diagnosticEndpointMayPersistTokens: false",
  "frontendMaySendPlaintextTokens: false",
  "importJobMayStorePlaintextTokens: false",
  "transactionMayStorePlaintextTokens: false",
  "inventoryMayStorePlaintextTokens: false",
  "envFlagAloneMayEnablePersistence: false",
  "tokenPersistenceImplementedNow: false",
  "tokenPersistenceDatabaseWriteNow: false",
  "plaintextTokenDatabaseWriteNow: false",
  "encryptedCredentialDatabaseWriteNow: false",
  "oauthCallbackRuntimeChangedNow: false",
  "controllerWiringChangedNow: false",
  "prismaSchemaChangedNow: false",
  "migrationAddedNow: false",
  "rawAccessTokenReturnedNow: false",
  "rawRefreshTokenReturnedNow: false",
  "realSpApiRequestNow: false",
  "'smoke:amazon-sp-api-token-persistence-encrypted-boundary-contract'",
  "'smoke:amazon-sp-api-sanitized-lwa-parser-branch-runtime'",
  "'smoke:amazon-sp-api-sanitized-lwa-http-response-parser-test-double'",
  "'smoke:amazon-sp-api-sanitized-lwa-http-response-parser-contract'",
  "'smoke:amazon-sp-api-real-http-activation-transition-contract'",
  "'smoke:amazon-sp-api-guarded-lwa-http-activation-handoff-contract'",
  "'smoke:amazon-sp-api-guarded-lwa-http-transport-branch-runtime'",
  "'smoke:amazon-sp-api-guarded-lwa-http-transport-test-double'",
  "nextSuggestedStep: 'Step137-Q'",
]) {
  assertIncludes('contract', contract, marker);
}

for (const forbidden of [
  "implementEncryptionNow: true",
  "implementPersistenceInputBuilderNow: true",
  "writeDatabaseNow: true",
  "addPrismaModelNow: true",
  "addMigrationNow: true",
  "wireOAuthCallbackNow: true",
  "wireControllerNow: true",
  "callAmazonNow: true",
  "plaintextAccessTokenMayBeLogged: true",
  "plaintextRefreshTokenMayBeLogged: true",
  "plaintextAccessTokenMayBeReturned: true",
  "plaintextRefreshTokenMayBeReturned: true",
  "plaintextAccessTokenMayBeStoredInDatabase: true",
  "plaintextRefreshTokenMayBeStoredInDatabase: true",
  "controllerMayPersistTokensDirectly: true",
  "oauthCallbackMayPersistTokensBeforeBoundary: true",
  "parserMayWriteDatabase: true",
  "httpTransportMayWriteDatabase: true",
  "diagnosticEndpointMayPersistTokens: true",
  "frontendMaySendPlaintextTokens: true",
  "tokenPersistenceImplementedNow: true",
  "tokenPersistenceDatabaseWriteNow: true",
  "plaintextTokenDatabaseWriteNow: true",
  "encryptedCredentialDatabaseWriteNow: true",
  "prismaSchemaChangedNow: true",
  "migrationAddedNow: true",
  "rawAccessTokenReturnedNow: true",
  "rawRefreshTokenReturnedNow: true",
  "realSpApiRequestNow: true",
]) {
  assertNotIncludes('contract', contract, forbidden);
}

assertIncludes('parserContract', parserContract, "source: 'amazon-sp-api-sanitized-lwa-http-response-parser-contract'");
assertIncludes('transitionContract', transitionContract, "tokenPersistenceRequiresDedicatedEncryptedBoundary: true");
assertIncludes('transitionContract', transitionContract, "plaintextTokenDatabaseWriteAllowed: false");

assertIncludes('service', service, 'parseRealLwaHttpResponseSanitizedLater');
assertIncludes('service', service, 'tokenPersistenceDatabaseWriteNow: false');
assertNotIncludes('service', service, 'prepareEncryptedTokenPersistenceInputLater');

assertIncludes('controller', controller, 'exchangeAuthorizationCodeDryRunnable');
assertNotIncludes('controller', controller, 'prepareEncryptedTokenPersistenceInputLater');
assertNotIncludes('controller', controller, 'parseRealLwaHttpResponseSanitizedLater');
assertNotIncludes('controller', controller, 'executeRealLwaTokenExchangeHttpGuardedLater');
assertNotIncludes('controller', controller, 'executeRealLwaTokenExchangeHttpLater');

console.log('========== Step137-P token persistence encrypted boundary contract smoke passed ==========');
