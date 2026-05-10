const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');
const apiRoot = path.join(root, 'apps/api');

const files = {
  contract: path.join(
    apiRoot,
    'src/imports/dto/amazon-sp-api-oauth-callback-encrypted-token-persistence-real-write-boundary-contract.dto.ts',
  ),
  packageJson: path.join(apiRoot, 'package.json'),
  controller: path.join(apiRoot, 'src/imports/imports.controller.ts'),
  service: path.join(apiRoot, 'src/imports/amazon-sp-api-token-exchange.service.ts'),
  repository: path.join(apiRoot, 'src/imports/amazon-sp-api-credential.repository.ts'),
  step139d: path.join(
    apiRoot,
    'src/imports/dto/amazon-sp-api-oauth-callback-dry-run-controller-wiring-contract.dto.ts',
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

console.log('========== Step139-G OAuth callback encrypted token persistence real-write boundary contract smoke ==========');

const contract = read(files.contract);
const pkg = JSON.parse(read(files.packageJson));
const controller = read(files.controller);
const service = read(files.service);
const repository = read(files.repository);
const step139d = read(files.step139d);

assertIncludes(
  'package.json',
  JSON.stringify(pkg.scripts || {}),
  'smoke:amazon-sp-api-oauth-callback-encrypted-token-persistence-real-write-boundary-contract',
);

for (const marker of [
  "source: 'amazon-sp-api-oauth-callback-encrypted-token-persistence-real-write-boundary-contract'",
  "step: 'Step139-G'",
  "phase: 'oauth-callback-real-write-boundary-contract-only'",
  "previousDryRunControllerImplementationStep: 'Step139-E'",
  "previousDryRunBranchCoverageStep: 'Step139-F'",
  "defineRealWriteBoundaryOnlyNow: true",
  "modifyControllerRuntimeNow: false",
  "enableOAuthCallbackPersistenceNow: false",
  "repositoryRealWriteImplementationNow: false",
  "prismaClientWriteNow: false",
  "databaseWriteNow: false",
  "callAmazonNow: false",
  "persistTokenNow: false",
  "trustedStateRequired: true",
  "callbackStateSignatureRequired: true",
  "callbackStateExpiryRequired: true",
  "companyIdMustResolveFromTrustedState: true",
  "storeIdMustResolveFromTrustedState: true",
  "marketplaceIdMustMatchTrustedState: true",
  "regionMustMatchTrustedState: true",
  "sellingPartnerIdRequired: true",
  "authorizationCodeRequired: true",
  "sanitizedLwaParserAcceptedRequired: true",
  "encryptedPersistenceInputAcceptedRequired: true",
  "environmentAllowsTokenPersistenceRequired: true",
  "companyStoreAllowlistedRequired: true",
  "operatorConfirmationRequired: true",
  "dryRunMustBeFalseExplicitlyRequired: true",
  "idempotencyKeyRequired: true",
  "encryptedRefreshTokenRequired: true",
  "refreshTokenFingerprintRequired: true",
  "encryptionKeyIdRequired: true",
  "encryptionAlgorithmRequired: true",
  "tokenVersionRequired: true",
  "statusRequired: 'active'",
  "'AmazonSpApiCredentialRepository performs real Prisma upsert with encrypted tokens only'",
  "wiringMode: 'server-gated-real-write-encrypted-token-persistence'",
  "plaintextTokenDatabaseWriteNow: false",
  "rawAuthorizationCodeReturnedNow: false",
  "rawLwaResponseReturnedNow: false",
  "rawAccessTokenReturnedNow: false",
  "rawRefreshTokenReturnedNow: false",
  "controllerDryRunOnlyStillActiveNow: true",
  "controllerRuntimeMustNotPersistNow: true",
  "controllerRuntimeMustNotWritePrismaNow: true",
  "controllerRuntimeMustNotCallAmazonNow: true",
  "persistEncryptedRefreshCredentialNow: false",
  "persistEncryptedAccessTokenCacheNow: false",
  "proposedNextStep: 'Step139-H'",
  "repositoryContractAllowedNext: true",
  "controllerPersistenceStillForbiddenNext: true",
  "rawTokenMustNeverBeReturnedNext: true",
  "nextSuggestedStep: 'Step139-H'",
]) {
  assertIncludes('contract', contract, marker);
}

for (const forbidden of [
  "modifyControllerRuntimeNow: true",
  "enableOAuthCallbackPersistenceNow: true",
  "repositoryRealWriteImplementationNow: true",
  "callAmazonNow: true",
  "persistTokenNow: true",
  "plaintextTokenDatabaseWriteNow: true",
  "rawAuthorizationCodeReturnedNow: true",
  "rawLwaResponseReturnedNow: true",
  "rawAccessTokenReturnedNow: true",
  "rawRefreshTokenReturnedNow: true",
  "persistEncryptedRefreshCredentialNow: true",
  "persistEncryptedAccessTokenCacheNow: true",
]) {
  assertNotIncludes('contract', contract, forbidden);
}

assertIncludes('controller', controller, 'Step139-E: Amazon SP-API OAuth callback dry-run-only controller wiring implementation');
assertIncludes('controller', controller, "wiringMode: 'controller-dry-run-only-no-persistence'");
assertIncludes('controller', controller, 'runTokenPersistenceE2eServiceOnlyTestDouble');
assertIncludes('controller', controller, 'oauthCallbackPersistenceWiringNow: false');
assertIncludes('controller', controller, 'tokenPersistenceDatabaseWriteNow: false');
assertIncludes('controller', controller, 'plaintextTokenDatabaseWriteNow: false');
assertIncludes('controller', controller, 'persistedConnection: null');

for (const forbidden of [
  'persistEncryptedRefreshCredential',
  'persistEncryptedAccessTokenCache',
  'tokenPersistenceDatabaseWriteNow: true',
  'plaintextTokenDatabaseWriteNow: true',
  'databaseWriteNow: true',
  'prismaClientWriteNow: true',
  'amazonNetworkCallNow: true',
  'realSpApiRequestNow: true',
  'rawAuthorizationCodeReturnedNow: true',
  'rawLwaResponseReturnedNow: true',
  'rawAccessTokenReturnedNow: true',
  'rawRefreshTokenReturnedNow: true',
  'oauthCallbackPersistenceWiringNow: true',
  'controllerCallsServicePersistenceCommitNow: true',
]) {
  assertNotIncludes('controller', controller, forbidden);
}

assertIncludes('service', service, 'runTokenPersistenceE2eServiceOnlyTestDouble');
assertIncludes('service', service, "serviceWiringMode: 'internal-service-only-no-controller-no-oauth-callback'");
assertIncludes('repository', repository, 'upsertEncryptedCredentialTestDouble');
assertIncludes('step139d', step139d, "nextSuggestedStep: 'Step139-E'");

console.log('========== Step139-G OAuth callback encrypted token persistence real-write boundary contract smoke passed ==========');
