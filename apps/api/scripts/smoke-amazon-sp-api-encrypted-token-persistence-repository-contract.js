const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');

const files = {
  contract: path.join(
    root,
    'apps/api/src/imports/dto/amazon-sp-api-encrypted-token-persistence-repository-contract.dto.ts',
  ),
  packageJson: path.join(root, 'apps/api/package.json'),
  service: path.join(root, 'apps/api/src/imports/amazon-sp-api-token-exchange.service.ts'),
  controller: path.join(root, 'apps/api/src/imports/imports.controller.ts'),
  prismaSchema: path.join(root, 'apps/api/prisma/schema.prisma'),
  schemaContract: path.join(
    root,
    'apps/api/src/imports/dto/amazon-sp-api-encrypted-token-persistence-schema-contract.dto.ts',
  ),
  persistenceBoundary: path.join(
    root,
    'apps/api/src/imports/dto/amazon-sp-api-token-persistence-encrypted-boundary-contract.dto.ts',
  ),
  repositoryFile: path.join(root, 'apps/api/src/imports/amazon-sp-api-credential.repository.ts'),
};

function read(file, optional = false) {
  if (!fs.existsSync(file)) {
    if (optional) return '';
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
const schemaContract = read(files.schemaContract);
const persistenceBoundary = read(files.persistenceBoundary);
const repositoryFile = read(files.repositoryFile, true);
const credentialModel = extractModel(prismaSchema, 'AmazonSpApiCredential');

console.log('========== Step137-X encrypted token persistence repository contract smoke ==========');

assertIncludes(
  'package.json',
  JSON.stringify(pkg.scripts || {}),
  'smoke:amazon-sp-api-encrypted-token-persistence-repository-contract',
);

for (const marker of [
  "source: 'amazon-sp-api-encrypted-token-persistence-repository-contract'",
  "step: 'Step137-X'",
  "phase: 'repository-contract-only'",
  "previousSchemaContractStep: 'Step137-W'",
  "prismaModelName: 'AmazonSpApiCredential'",
  "existingPrismaModelUsed: true",
  "repositoryImplementationNow: false",
  "databaseWriteNow: false",
  "controllerWiringNow: false",
  "oauthCallbackWiringNow: false",
  "serviceRuntimePersistenceNow: false",
  "futureRepositoryName: 'AmazonSpApiCredentialRepository'",
  "futureRepositoryLocation:",
  "'apps/api/src/imports/amazon-sp-api-credential.repository.ts'",
  "sourceMethod:",
  "'AmazonSpApiTokenExchangeService.prepareEncryptedTokenPersistenceInputLater'",
  "acceptsOnlySanitizedPersistenceInput: true",
  "acceptsOnlyEncryptedRefreshToken: true",
  "acceptsOnlyOptionalEncryptedAccessTokenCache: true",
  "rejectsPlaintextAccessToken: true",
  "rejectsPlaintextRefreshToken: true",
  "rejectsRawLwaResponse: true",
  "rejectsRawAuthorizationCode: true",
  "requiresCompanyId: true",
  "requiresStoreId: true",
  "requiresMarketplaceId: true",
  "requiresRegion: true",
  "requiresSellingPartnerId: true",
  "requiresEncryptionKeyId: true",
  "requiresEncryptionAlgorithm: true",
  "requiresTokenVersion: true",
  "requiresRefreshTokenFingerprint: true",
  "upsertEncryptedCredential:",
  "findActiveCredentialForStore:",
  "markCredentialNeedsReauth:",
  "revokeCredential:",
  "updateAccessTokenCache:",
  "uniqueScopeMustIncludeCompanyId: true",
  "uniqueScopeMustIncludeStoreId: true",
  "uniqueScopeMustIncludeMarketplaceId: true",
  "uniqueScopeMustIncludeRegion: true",
  "upsertMayNotCrossCompany: true",
  "upsertMayNotCrossStore: true",
  "allReadsMustFilterCompanyId: true",
  "storeReadsMustFilterStoreId: true",
  "existingModelShapeMayBeLegacyOrRelationBased: true",
  "encryptedRefreshToken: 'required'",
  "encryptedAccessTokenCache: 'optional'",
  "refreshTokenFingerprint: 'required'",
  "tokenVersion: 'required-positive-int'",
  "repositoryMayCallAmazon: false",
  "repositoryMayParseLwaResponse: false",
  "repositoryMayOwnEncryption: false",
  "repositoryMayAcceptPlaintextTokenFields: false",
  "repositoryMayLogTokenMaterial: false",
  "repositoryMayReturnEncryptedTokenByDefault: false",
  "repositoryMayReturnPlaintextTokenEver: false",
  "controllerMayBypassRepository: false",
  "oauthCallbackMayWritePrismaDirectly: false",
  "repositoryFileCreatedNow: false",
  "prismaClientWriteNow: false",
  "tokenPersistenceDatabaseWriteNow: false",
  "plaintextTokenDatabaseWriteNow: false",
  "controllerMayPersistTokensNow: false",
  "oauthCallbackMayPersistTokensNow: false",
  "nextSuggestedStep: 'Step137-Y'",
]) {
  assertIncludes('contract', contract, marker);
}

for (const forbidden of [
  "repositoryImplementationNow: true",
  "databaseWriteNow: true",
  "controllerWiringNow: true",
  "oauthCallbackWiringNow: true",
  "serviceRuntimePersistenceNow: true",
  "repositoryMayCallAmazon: true",
  "repositoryMayParseLwaResponse: true",
  "repositoryMayOwnEncryption: true",
  "repositoryMayAcceptPlaintextTokenFields: true",
  "repositoryMayLogTokenMaterial: true",
  "repositoryMayReturnEncryptedTokenByDefault: true",
  "repositoryMayReturnPlaintextTokenEver: true",
  "controllerMayBypassRepository: true",
  "oauthCallbackMayWritePrismaDirectly: true",
  "repositoryFileCreatedNow: true",
  "prismaClientWriteNow: true",
  "tokenPersistenceDatabaseWriteNow: true",
  "plaintextTokenDatabaseWriteNow: true",
  "controllerMayPersistTokensNow: true",
  "oauthCallbackMayPersistTokensNow: true",
]) {
  assertNotIncludes('contract', contract, forbidden);
}

assert(credentialModel.length > 0, 'Prisma schema contains existing AmazonSpApiCredential model');
assertIncludes('schemaContract', schemaContract, "source: 'amazon-sp-api-encrypted-token-persistence-schema-contract'");
assertIncludes('schemaContract', schemaContract, "existingModelAllowedNow: true");
assertIncludes('persistenceBoundary', persistenceBoundary, "source: 'amazon-sp-api-token-persistence-encrypted-boundary-contract'");
assertIncludes('persistenceBoundary', persistenceBoundary, "encryptedRefreshTokenRequired: true");
assertIncludes('persistenceBoundary', persistenceBoundary, "tokenVersionRequired: true");

assertIncludes('service', service, 'prepareEncryptedTokenPersistenceInputLater');
assertIncludes('service', service, 'tokenPersistenceDatabaseWriteNow: false');
assertIncludes('service', service, 'plaintextTokenDatabaseWriteNow: false');

assertNotIncludes('service', service, 'AmazonSpApiCredentialRepository');
assertNotIncludes('service', service, 'amazonSpApiCredential');
assertNotIncludes('service', service, 'upsertEncryptedCredential');

assertNotIncludes('controller', controller, 'AmazonSpApiCredentialRepository');
assertNotIncludes('controller', controller, 'amazonSpApiCredential');
assertNotIncludes('controller', controller, 'prepareEncryptedTokenPersistenceInputLater');
assertNotIncludes('controller', controller, 'executeRealLwaTokenExchangeHttpExecutableGuardedLater');

// Step137-Y intentionally creates the repository test-double file.
// This legacy Step137-X contract smoke now allows that file to exist,
// but only as a no-Prisma-write / no-controller-wiring test double.
assertIncludes('repositoryFile', repositoryFile, 'export class AmazonSpApiCredentialRepository');
assertIncludes('repositoryFile', repositoryFile, "repositoryMode: 'test-double-no-prisma-write'");
assertIncludes('repositoryFile', repositoryFile, 'prismaClientWriteNow: false');
assertIncludes('repositoryFile', repositoryFile, 'databaseWriteNow: false');
assertIncludes('repositoryFile', repositoryFile, 'tokenPersistenceDatabaseWriteNow: false');
assertIncludes('repositoryFile', repositoryFile, 'plaintextTokenDatabaseWriteNow: false');
assertIncludes('repositoryFile', repositoryFile, 'repositoryMayCallAmazonNow: false');
assertIncludes('repositoryFile', repositoryFile, 'repositoryMayParseLwaResponseNow: false');
assertIncludes('repositoryFile', repositoryFile, 'repositoryMayOwnEncryptionNow: false');
assertIncludes('repositoryFile', repositoryFile, 'rawTokenReturnedNow: false');
assertNotIncludes('repositoryFile', repositoryFile, 'prisma.');
assertNotIncludes('repositoryFile', repositoryFile, 'amazonSpApiCredential.');
assertNotIncludes('repositoryFile', repositoryFile, 'fetch(');
assertNotIncludes('repositoryFile', repositoryFile, 'axios.');
assertNotIncludes('repositoryFile', repositoryFile, 'http.request');
assertNotIncludes('repositoryFile', repositoryFile, 'https.request');

console.log('========== Step137-X encrypted token persistence repository contract smoke passed ==========');
