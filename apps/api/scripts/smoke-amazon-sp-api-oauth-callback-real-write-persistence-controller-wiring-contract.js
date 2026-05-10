const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');
const apiRoot = path.join(root, 'apps/api');

const files = {
  packageJson: path.join(apiRoot, 'package.json'),
  contract: path.join(
    apiRoot,
    'src/imports/dto/amazon-sp-api-oauth-callback-real-write-persistence-controller-wiring-contract.dto.ts',
  ),
  controller: path.join(apiRoot, 'src/imports/imports.controller.ts'),
  orchestrator: path.join(apiRoot, 'src/imports/amazon-sp-api-token-persistence.orchestrator.ts'),
  repository: path.join(apiRoot, 'src/imports/amazon-sp-api-credential.repository.ts'),
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

function assertIncludes(source, needle, label) {
  assert(source.includes(needle), `${label} contains ${needle}`);
}

function assertNotIncludes(source, needle, label) {
  assert(!source.includes(needle), `${label} does not contain ${needle}`);
}

function sliceControllerOauthCallback(controllerSource) {
  const startMarker = 'Step139-E: Amazon SP-API OAuth callback dry-run-only controller wiring implementation';
  const endMarker = "@Post('detect-month-conflicts')";
  const start = controllerSource.indexOf(startMarker);
  const end = controllerSource.indexOf(endMarker, start);

  assert(start >= 0, 'controller has Step139-E OAuth callback marker');
  assert(end > start, 'controller OAuth callback slice end marker found');

  return controllerSource.slice(start, end);
}

console.log('========== Step139-N OAuth callback real-write persistence controller wiring contract smoke ==========');

const pkg = JSON.parse(read(files.packageJson));
const contract = read(files.contract);
const controller = read(files.controller);
const oauthCallbackSlice = sliceControllerOauthCallback(controller);
const orchestrator = read(files.orchestrator);
const repository = read(files.repository);

assert(
  pkg.scripts &&
    pkg.scripts['smoke:amazon-sp-api-oauth-callback-real-write-persistence-controller-wiring-contract'] ===
      'node scripts/smoke-amazon-sp-api-oauth-callback-real-write-persistence-controller-wiring-contract.js',
  'package.json registers Step139-N smoke',
);

for (const marker of [
  "source: 'amazon-sp-api-oauth-callback-real-write-persistence-controller-wiring-contract'",
  "step: 'Step139-N'",
  "phase: 'oauth-callback-real-write-persistence-controller-wiring-contract-only'",
  "previousDryRunControllerImplementationStep: 'Step139-E'",
  "previousDryRunControllerBranchCoverageStep: 'Step139-F'",
  "previousOauthRealWriteBoundaryStep: 'Step139-G'",
  "previousRepositoryRealWriteContractStep: 'Step139-H'",
  "previousRepositoryRealWriteMockedPrismaStep: 'Step139-I'",
  "previousRepositoryRealWriteBranchCoverageStep: 'Step139-J'",
  "previousOrchestratorRealWriteWiringContractStep: 'Step139-K'",
  "previousOrchestratorRealWriteMockedPrismaStep: 'Step139-L'",
  "previousOrchestratorRealWriteBranchCoverageStep: 'Step139-M'",
  'defineControllerRealWritePersistenceWiringContractOnlyNow: true',
  'modifyControllerRuntimeNow: false',
  'callPersistEncryptedTokensRealWriteNow: false',
  'callUpsertEncryptedCredentialRealWriteNow: false',
  'importCredentialRepositoryIntoControllerNow: false',
  'enableOAuthCallbackPersistenceNow: false',
  'tokenExchangeHttpCallNow: false',
  'amazonNetworkCallNow: false',
  'prismaClientWriteNow: false',
  'databaseWriteNow: false',
  'tokenPersistenceDatabaseWriteNow: false',
  'plaintextTokenDatabaseWriteNow: false',
  'trustedStateAcceptedRequired: true',
  'callbackStateSignatureRequired: true',
  'callbackStateExpiryRequired: true',
  'companyIdResolvedFromTrustedStateRequired: true',
  'storeIdResolvedFromTrustedStateRequired: true',
  'marketplaceIdResolvedFromTrustedStateRequired: true',
  'regionResolvedFromTrustedStateRequired: true',
  'authorizationCodeRequired: true',
  'sellingPartnerIdRequired: true',
  'lwaTransportAcceptedRequired: true',
  'sanitizedParserAcceptedRequired: true',
  'encryptedPersistenceInputAcceptedRequired: true',
  'orchestratorRealWriteAcceptedRequired: true',
  'dryRunMustBeFalseExplicitlyRequired: true',
  'operatorConfirmationRequired: true',
  'companyStoreAllowlistedRequired: true',
  'environmentAllowsPersistenceRequired: true',
  'idempotencyKeyRequired: true',
  'companyIdMustComeFromTrustedStateNotQuery: true',
  'storeIdMustComeFromTrustedStateNotQuery: true',
  'marketplaceIdMustComeFromTrustedStateNotQuery: true',
  'regionMustComeFromTrustedStateNotQuery: true',
  'authorizationCodeMustNeverBeReturned: true',
  "source: 'amazon-sp-api-oauth-callback-real-write-persistence-controller-wiring'",
  "wiringMode: 'server-gated-controller-to-orchestrator-real-write'",
  'controllerWiringNow: true',
  'oauthCallbackPersistenceWiringNow: true',
  'controllerCallsServicePersistenceCommitNow: true',
  'rawAuthorizationCodeReturnedNow: false',
  'rawLwaResponseReturnedNow: false',
  'rawAccessTokenReturnedNow: false',
  'rawRefreshTokenReturnedNow: false',
  'controllerDryRunOnlyStillActiveNow: true',
  'controllerRuntimeMustNotCallRealWriteOrchestratorNow: true',
  'controllerRuntimeMustNotCallRepositoryNow: true',
  'controllerRuntimeMustNotWritePrismaNow: true',
  'controllerRuntimeMustNotCallAmazonNow: true',
  "proposedNextStep: 'Step139-O'",
  "nextSuggestedStep: 'Step139-O'",
]) {
  assertIncludes(contract, marker, 'contract');
}

for (const smoke of [
  'smoke:amazon-sp-api-oauth-callback-real-write-persistence-controller-wiring-contract',
  'smoke:amazon-sp-api-token-persistence-orchestrator-real-write-branch-runtime',
  'smoke:amazon-sp-api-token-persistence-orchestrator-real-write-mocked-prisma',
  'smoke:amazon-sp-api-token-persistence-orchestrator-real-write-repository-wiring-contract',
  'smoke:amazon-sp-api-encrypted-token-repository-real-write-branch-runtime',
  'smoke:amazon-sp-api-oauth-callback-dry-run-controller-branch-runtime',
  'smoke:amazon-sp-api-oauth-callback-dry-run-controller-wiring-impl',
  'smoke:amazon-sp-api-oauth-callback-encrypted-token-persistence-real-write-boundary-contract',
]) {
  assertIncludes(contract, smoke, 'contract regression smoke list');
}

assertIncludes(oauthCallbackSlice, 'controller-dry-run-only-no-persistence', 'controller OAuth callback');
assertIncludes(oauthCallbackSlice, 'oauthCallbackPersistenceWiringNow: false', 'controller OAuth callback');
assertIncludes(oauthCallbackSlice, 'controllerCallsServicePersistenceCommitNow: false', 'controller OAuth callback');
assertIncludes(oauthCallbackSlice, 'tokenPersistenceDatabaseWriteNow: false', 'controller OAuth callback');
assertIncludes(oauthCallbackSlice, 'databaseWriteNow: false', 'controller OAuth callback');
assertIncludes(oauthCallbackSlice, 'prismaClientWriteNow: false', 'controller OAuth callback');
assertIncludes(oauthCallbackSlice, 'amazonNetworkCallNow: false', 'controller OAuth callback');
assertIncludes(oauthCallbackSlice, 'rawAuthorizationCodeReturnedNow: false', 'controller OAuth callback');
assertIncludes(oauthCallbackSlice, 'rawLwaResponseReturnedNow: false', 'controller OAuth callback');
assertIncludes(oauthCallbackSlice, 'rawAccessTokenReturnedNow: false', 'controller OAuth callback');
assertIncludes(oauthCallbackSlice, 'rawRefreshTokenReturnedNow: false', 'controller OAuth callback');

for (const forbidden of [
  'persistEncryptedTokensRealWrite',
  'upsertEncryptedCredentialRealWrite',
  'AmazonSpApiCredentialRepository',
  'oauthCallbackPersistenceWiringNow: true',
  'controllerCallsServicePersistenceCommitNow: true',
  'tokenPersistenceDatabaseWriteNow: true',
  'databaseWriteNow: true',
  'prismaClientWriteNow: true',
  'amazonNetworkCallNow: true',
  'rawAuthorizationCodeReturnedNow: true',
  'rawLwaResponseReturnedNow: true',
  'rawAccessTokenReturnedNow: true',
  'rawRefreshTokenReturnedNow: true',
]) {
  assertNotIncludes(oauthCallbackSlice, forbidden, 'controller OAuth callback runtime forbidden');
}

assertIncludes(orchestrator, 'persistEncryptedTokensRealWrite', 'orchestrator');
assertIncludes(orchestrator, "orchestratorMode: 'repository-real-write-wiring-mocked-prisma'", 'orchestrator');
assertIncludes(orchestrator, 'oauthCallbackPersistenceWiringNow: false', 'orchestrator');
assertIncludes(repository, 'upsertEncryptedCredentialRealWrite', 'repository');
assertIncludes(repository, "repositoryMode: 'mocked-prisma-delegate-real-write-contract'", 'repository');

console.log('========== Step139-N OAuth callback real-write persistence controller wiring contract smoke passed ==========');
