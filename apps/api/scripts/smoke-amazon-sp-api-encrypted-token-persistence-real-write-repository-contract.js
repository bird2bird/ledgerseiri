const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');
const apiRoot = path.join(root, 'apps/api');

const files = {
  contract: path.join(
    apiRoot,
    'src/imports/dto/amazon-sp-api-encrypted-token-persistence-real-write-repository-contract.dto.ts',
  ),
  packageJson: path.join(apiRoot, 'package.json'),
  repository: path.join(apiRoot, 'src/imports/amazon-sp-api-credential.repository.ts'),
  controller: path.join(apiRoot, 'src/imports/imports.controller.ts'),
  step139g: path.join(
    apiRoot,
    'src/imports/dto/amazon-sp-api-oauth-callback-encrypted-token-persistence-real-write-boundary-contract.dto.ts',
  ),
  step137x: path.join(
    apiRoot,
    'src/imports/dto/amazon-sp-api-encrypted-token-persistence-repository-contract.dto.ts',
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

console.log('========== Step139-H encrypted token persistence real-write repository contract smoke ==========');

const contract = read(files.contract);
const pkg = JSON.parse(read(files.packageJson));
const repository = read(files.repository);
const controller = read(files.controller);
const step139g = read(files.step139g);
const step137x = read(files.step137x);

assertIncludes(
  'package.json',
  JSON.stringify(pkg.scripts || {}),
  'smoke:amazon-sp-api-encrypted-token-persistence-real-write-repository-contract',
);

for (const marker of [
  "source: 'amazon-sp-api-encrypted-token-persistence-real-write-repository-contract'",
  "step: 'Step139-H'",
  "phase: 'repository-real-write-contract-only'",
  "previousOauthBoundaryStep: 'Step139-G'",
  "previousRepositoryBoundaryStep: 'Step137-X'",
  "currentRepositoryImplementationMode: 'test-double-only'",
  "defineRepositoryRealWriteContractOnlyNow: true",
  "modifyRepositoryRuntimeNow: false",
  "implementPrismaWriteNow: false",
  "modifyControllerRuntimeNow: false",
  "enableOAuthCallbackPersistenceNow: false",
  "databaseWriteNow: false",
  "prismaClientWriteNow: false",
  "callAmazonNow: false",
  "persistTokenNow: false",
  "methodName: 'upsertEncryptedCredentialRealWrite'",
  "className: 'AmazonSpApiCredentialRepository'",
  "prismaModel: 'AmazonSpApiCredential'",
  "writeType: 'upsert'",
  "encryptedRefreshTokenWriteRequired: true",
  "encryptedAccessTokenCacheWriteAllowed: true",
  "plaintextTokenWriteForbidden: true",
  "refreshTokenFingerprintRequired: true",
  "accessTokenFingerprintAllowed: true",
  "idempotencyKeyRequired: true",
  "auditMetadataRequired: true",
  "rejectPlaintextAccessToken: true",
  "rejectPlaintextRefreshToken: true",
  "rejectRawLwaResponse: true",
  "rejectRawAuthorizationCode: true",
  "rejectRawClientSecret: true",
  "repositoryMode: 'real-prisma-upsert-encrypted-token-only'",
  "tokenPersistenceDatabaseWriteNow: true",
  "plaintextTokenDatabaseWriteNow: false",
  "rawAccessTokenReturnedNow: false",
  "rawRefreshTokenReturnedNow: false",
  "repositoryStillUsesTestDoubleNow: true",
  "realPrismaWriteStillForbiddenNow: true",
  "controllerPersistenceStillForbiddenNow: true",
  "oauthCallbackStillDryRunOnlyNow: true",
  "upsertEncryptedCredentialRealWriteNow: false",
  "proposedNextStep: 'Step139-I'",
  "repositoryRuntimeChangeAllowedNext: true",
  "mockedPrismaOnlyNext: true",
  "controllerPersistenceStillForbiddenNext: true",
  "nextSuggestedStep: 'Step139-I'",
]) {
  assertIncludes('contract', contract, marker);
}

for (const forbidden of [
  "modifyRepositoryRuntimeNow: true",
  "implementPrismaWriteNow: true",
  "modifyControllerRuntimeNow: true",
  "enableOAuthCallbackPersistenceNow: true",
  "callAmazonNow: true",
  "persistTokenNow: true",
  "upsertEncryptedCredentialRealWriteNow: true",
  "plaintextTokenDatabaseWriteNow: true",
  "rawAccessTokenReturnedNow: true",
  "rawRefreshTokenReturnedNow: true",
  "rawLwaResponseReturnedNow: true",
]) {
  assertNotIncludes('contract', contract, forbidden);
}

assertIncludes('repository', repository, 'export class AmazonSpApiCredentialRepository');
assertIncludes('repository', repository, 'upsertEncryptedCredentialTestDouble');
assertIncludes('repository', repository, 'prismaClientWriteNow: false');
assertIncludes('repository', repository, 'databaseWriteNow: false');
assertIncludes('repository', repository, 'tokenPersistenceDatabaseWriteNow: false');
assertIncludes('repository', repository, 'plaintextTokenDatabaseWriteNow: false');

assertIncludes('repository', repository, 'plaintextAccessToken?: never');
assertIncludes('repository', repository, 'plaintextRefreshToken?: never');
assertIncludes('repository', repository, "hasOwn(unsafeInput, 'plaintextAccessToken')");
assertIncludes('repository', repository, "hasOwn(unsafeInput, 'plaintextRefreshToken')");

assertIncludes('repository', repository, 'upsertEncryptedCredentialRealWrite(');
assertIncludes('repository', repository, "repositoryMode: 'mocked-prisma-delegate-real-write-contract'");
assertIncludes('repository', repository, 'mockedPrismaDelegateUsedNow');
assertIncludes('repository', repository, 'prismaClientWriteNow: true');
assertIncludes('repository', repository, 'databaseWriteNow: true');
assertIncludes('repository', repository, 'tokenPersistenceDatabaseWriteNow: true');
assertIncludes('repository', repository, 'plaintextTokenDatabaseWriteNow: false');

for (const forbidden of [
  'plaintextTokenDatabaseWriteNow: true',
  'repositoryMayCallAmazonNow: true',
  'repositoryMayParseLwaResponseNow: true',
  'repositoryMayOwnEncryptionNow: true',
  'rawTokenReturnedNow: true',
]) {
  assertNotIncludes('repository', repository, forbidden);
}

assertIncludes('controller', controller, "wiringMode: 'controller-dry-run-only-no-persistence'");
assertIncludes('controller', controller, 'oauthCallbackPersistenceWiringNow: false');
assertIncludes('controller', controller, 'tokenPersistenceDatabaseWriteNow: false');
assertIncludes('controller', controller, 'persistedConnection: null');

for (const forbidden of [
  'AmazonSpApiCredentialRepository',
  'persistEncryptedRefreshCredential',
  'persistEncryptedAccessTokenCache',
  'tokenPersistenceDatabaseWriteNow: true',
  'prismaClientWriteNow: true',
  'databaseWriteNow: true',
]) {
  assertNotIncludes('controller', controller, forbidden);
}

assertIncludes('step139g', step139g, "nextSuggestedStep: 'Step139-H'");
assertIncludes('step139g', step139g, "repositoryContractAllowedNext: true");
assertIncludes('step139g', step139g, "controllerPersistenceStillForbiddenNext: true");
assertIncludes('step137x', step137x, 'AmazonSpApiCredential');

console.log('========== Step139-H encrypted token persistence real-write repository contract smoke passed ==========');
