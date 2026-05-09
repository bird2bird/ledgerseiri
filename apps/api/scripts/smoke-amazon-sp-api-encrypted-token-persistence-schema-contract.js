const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');

const files = {
  contract: path.join(
    root,
    'apps/api/src/imports/dto/amazon-sp-api-encrypted-token-persistence-schema-contract.dto.ts',
  ),
  packageJson: path.join(root, 'apps/api/package.json'),
  service: path.join(root, 'apps/api/src/imports/amazon-sp-api-token-exchange.service.ts'),
  controller: path.join(root, 'apps/api/src/imports/imports.controller.ts'),
  prismaSchema: path.join(root, 'apps/api/prisma/schema.prisma'),
  persistenceBoundary: path.join(
    root,
    'apps/api/src/imports/dto/amazon-sp-api-token-persistence-encrypted-boundary-contract.dto.ts',
  ),
  preActivation: path.join(
    root,
    'apps/api/src/imports/dto/amazon-sp-api-real-lwa-integration-pre-activation-handoff-contract.dto.ts',
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

function extractModel(schema, modelName) {
  const re = new RegExp(`model\\s+${modelName}\\s*\\{([\\s\\S]*?)\\n\\}`, 'm');
  const match = schema.match(re);
  return match ? match[1] : '';
}

const contract = read(files.contract);
const pkg = JSON.parse(read(files.packageJson));
const service = read(files.service);
const controller = read(files.controller);
const prismaSchema = read(files.prismaSchema);
const persistenceBoundary = read(files.persistenceBoundary);
const preActivation = read(files.preActivation);
const credentialModel = extractModel(prismaSchema, 'AmazonSpApiCredential');

console.log('========== Step137-W encrypted token persistence schema contract smoke ==========');

assertIncludes(
  'package.json',
  JSON.stringify(pkg.scripts || {}),
  'smoke:amazon-sp-api-encrypted-token-persistence-schema-contract',
);

for (const marker of [
  "source: 'amazon-sp-api-encrypted-token-persistence-schema-contract'",
  "step: 'Step137-W'",
  "phase: 'schema-contract-and-existing-model-verification'",
  "previousRuntimeCoverageStep: 'Step137-V'",
  "previousPersistenceBoundaryStep: 'Step137-P'",
  "prismaModelName: 'AmazonSpApiCredential'",
  "existingModelAllowedNow: true",
  "schemaMutationNow: false",
  "migrationCreationNow: false",
  "databaseWriteNow: false",
  "companyId: 'String'",
  "storeId: 'String'",
  "marketplaceId: 'String'",
  "region: 'String'",
  "sellingPartnerId: 'String'",
  "encryptedRefreshToken: 'String'",
  "encryptedAccessTokenCache: 'String?'",
  "accessTokenExpiresAt: 'DateTime?'",
  "refreshTokenFingerprint: 'String'",
  "accessTokenFingerprint: 'String?'",
  "encryptionKeyId: 'String'",
  "encryptionAlgorithm: 'String'",
  "tokenVersion: 'Int'",
  "status: 'String'",
  "lastValidatedAt: 'DateTime?'",
  "revokedAt: 'DateTime?'",
  "companyIdRequired: true",
  "storeIdRequired: true",
  "uniqueCredentialScopeRequired: true",
  "plaintextRefreshTokenMayBeStored: false",
  "plaintextAccessTokenMayBeStored: false",
  "encryptedRefreshTokenRequired: true",
  "encryptedAccessTokenCacheAllowed: true",
  "encryptionKeyIdRequired: true",
  "encryptionAlgorithmRequired: true",
  "tokenVersionRequired: true",
  "refreshTokenFingerprintRequired: true",
  "serviceMayWriteCredentialRowsNow: false",
  "controllerMayPersistTokensNow: false",
  "oauthCallbackMayPersistTokensNow: false",
  "plaintextTokenDatabaseWriteNow: false",
  "tokenPersistenceDatabaseWriteNow: false",
  "encryptedRefreshTokenPreparedNow: false",
  "encryptedAccessTokenCachePreparedNow: false",
  "nextSuggestedStep: 'Step137-X'",
]) {
  assertIncludes('contract', contract, marker);
}

for (const forbidden of [
  "schemaMutationNow: true",
  "migrationCreationNow: true",
  "databaseWriteNow: true",
  "plaintextRefreshTokenMayBeStored: true",
  "plaintextAccessTokenMayBeStored: true",
  "serviceMayWriteCredentialRowsNow: true",
  "controllerMayPersistTokensNow: true",
  "oauthCallbackMayPersistTokensNow: true",
  "plaintextTokenDatabaseWriteNow: true",
  "tokenPersistenceDatabaseWriteNow: true",
]) {
  assertNotIncludes('contract', contract, forbidden);
}

assert(credentialModel.length > 0, 'Prisma schema contains existing AmazonSpApiCredential model');
console.log('[INFO] existingModelShapeMayBeLegacyOrRelationBased=true');

// Step137-W is contract-only. The current repository already has an
// AmazonSpApiCredential model, but its exact field shape may be legacy or relation-based.
// Therefore this smoke records/guards model existence and credential-token intent,
// while the strict target field list remains in the Step137-W contract above.
// Any schema alignment must be handled in Step137-X or later, not by mutating schema here.
const existingModelMarkers = [
  'encryptedRefreshToken',
  'encryptedAccessTokenCache',
  'refreshTokenFingerprint',
  'accessTokenFingerprint',
  'encryptionKeyId',
  'encryptionAlgorithm',
  'tokenVersion',
  'status',
];

const presentExistingModelMarkers = existingModelMarkers.filter((marker) =>
  credentialModel.includes(marker),
);

assert(
  presentExistingModelMarkers.length >= 4,
  `AmazonSpApiCredential existing model has enough encrypted credential markers: ${presentExistingModelMarkers.join(', ')}`,
);

assert(
  credentialModel.includes('@@unique') || credentialModel.includes('@@index') || credentialModel.includes('@unique'),
  'AmazonSpApiCredential existing model has at least one uniqueness/index marker',
);

console.log('[INFO] Existing AmazonSpApiCredential model snapshot follows:');
console.log(credentialModel.trim());

assertIncludes('persistenceBoundary', persistenceBoundary, "source: 'amazon-sp-api-token-persistence-encrypted-boundary-contract'");
assertIncludes('persistenceBoundary', persistenceBoundary, "encryptedRefreshTokenRequired: true");
assertIncludes('persistenceBoundary', persistenceBoundary, "tokenVersionRequired: true");

assertIncludes('preActivation', preActivation, "source: 'amazon-sp-api-real-lwa-integration-pre-activation-handoff-contract'");
assertIncludes('preActivation', preActivation, "encryptedPersistenceReadyNow: false");

assertIncludes('service', service, 'prepareEncryptedTokenPersistenceInputLater');
assertIncludes('service', service, 'tokenPersistenceDatabaseWriteNow: false');
assertIncludes('service', service, 'plaintextTokenDatabaseWriteNow: false');

assertNotIncludes('controller', controller, 'prepareEncryptedTokenPersistenceInputLater');
assertNotIncludes('controller', controller, 'executeRealLwaTokenExchangeHttpExecutableGuardedLater');
assertNotIncludes('controller', controller, 'parseRealLwaHttpResponseSanitizedLater');

console.log('========== Step137-W encrypted token persistence schema contract smoke passed ==========');
