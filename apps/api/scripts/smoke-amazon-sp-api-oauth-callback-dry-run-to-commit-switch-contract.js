const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');
const apiRoot = path.join(root, 'apps/api');

const files = {
  packageJson: path.join(apiRoot, 'package.json'),
  contract: path.join(
    apiRoot,
    'src/imports/dto/amazon-sp-api-oauth-callback-dry-run-to-commit-switch-contract.dto.ts',
  ),
  step139N: path.join(
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
  const startMarker =
    'Step139-E: Amazon SP-API OAuth callback dry-run-only controller wiring implementation';
  const endMarker = "@Post('detect-month-conflicts')";
  const start = controllerSource.indexOf(startMarker);
  const end = controllerSource.indexOf(endMarker, start);

  assert(start >= 0, 'controller has Step139-E OAuth callback marker');
  assert(end > start, 'controller OAuth callback slice end marker found');

  return controllerSource.slice(start, end);
}

console.log('========== Step139-O OAuth callback dry-run-to-commit switch contract smoke ==========');

const pkg = JSON.parse(read(files.packageJson));
const contract = read(files.contract);
const step139N = read(files.step139N);
const controller = read(files.controller);
const oauthCallbackSlice = sliceControllerOauthCallback(controller);
const orchestrator = read(files.orchestrator);
const repository = read(files.repository);

assert(
  pkg.scripts &&
    pkg.scripts['smoke:amazon-sp-api-oauth-callback-dry-run-to-commit-switch-contract'] ===
      'node scripts/smoke-amazon-sp-api-oauth-callback-dry-run-to-commit-switch-contract.js',
  'package.json registers Step139-O smoke',
);

for (const marker of [
  "source: 'amazon-sp-api-oauth-callback-dry-run-to-commit-switch-contract'",
  "step: 'Step139-O'",
  "phase: 'oauth-callback-dry-run-to-commit-switch-contract-only'",
  "previousControllerRealWriteWiringContractStep: 'Step139-N'",
  "previousOrchestratorRealWriteBranchCoverageStep: 'Step139-M'",
  "previousOrchestratorRealWriteImplementationStep: 'Step139-L'",
  "previousRepositoryRealWriteBranchCoverageStep: 'Step139-J'",
  "previousRepositoryRealWriteImplementationStep: 'Step139-I'",
  "previousDryRunControllerImplementationStep: 'Step139-E'",
  'defineDryRunToCommitSwitchContractOnlyNow: true',
  'modifyControllerRuntimeNow: false',
  'addCommitRuntimeBranchNow: false',
  'callPersistEncryptedTokensRealWriteNow: false',
  'callRepositoryRealWriteNow: false',
  'tokenExchangeHttpCallNow: false',
  'amazonNetworkCallNow: false',
  'prismaClientWriteNow: false',
  'databaseWriteNow: false',
  'tokenPersistenceDatabaseWriteNow: false',
  'plaintextTokenDatabaseWriteNow: false',
  "defaultMode: 'dry-run'",
  "commitMode: 'server-gated-explicit-commit'",
  'queryParameterAloneMayEnableCommit: false',
  'frontendFlagAloneMayEnableCommit: false',
  'controllerLocalBooleanAloneMayEnableCommit: false',
  'serverSideCommitGateRequired: true',
  'operatorConfirmationRequired: true',
  'companyStoreAllowlistRequired: true',
  'idempotencyKeyRequired: true',
  'environmentPersistenceGateRequired: true',
  'realLwaActivationGateRequired: true',
  'trustedStateRequired: true',
  "companyId: 'trusted-state-derived'",
  "storeId: 'trusted-state-derived'",
  "marketplaceId: 'trusted-state-derived'",
  "region: 'trusted-state-derived'",
  "sellingPartnerId: 'callback-query-required-but-redacted'",
  'authorizationCodePresent: true',
  'callbackStateAccepted: true',
  'callbackStateSignatureValid: true',
  'callbackStateNotExpired: true',
  'companyStoreAllowlisted: true',
  'environmentAllowsPersistence: true',
  'realLwaActivationGateAccepted: true',
  'dryRunIsFalse: true',
  'requestedCommitIsTrue: true',
  'operatorConfirmationAccepted: true',
  'idempotencyKeyPresent: true',
  'trustedStateAccepted: true',
  'trustedStateSignatureValid: true',
  'trustedStateNotExpired: true',
  'companyIdResolvedFromTrustedState: true',
  'storeIdResolvedFromTrustedState: true',
  'marketplaceIdResolvedFromTrustedState: true',
  'regionResolvedFromTrustedState: true',
  'sanitizedLwaParserAccepted: true',
  'encryptedPersistenceInputAccepted: true',
  'orchestratorRealWriteAccepted: true',
  'dryRunMissing: true',
  'dryRunTrue: true',
  'requestedCommitMissing: true',
  'requestedCommitFalse: true',
  'operatorConfirmationMissing: true',
  'idempotencyKeyMissing: true',
  'trustedStateRejected: true',
  'trustedStateExpired: true',
  'trustedStateSignatureInvalid: true',
  'companyStoreNotAllowlisted: true',
  'environmentPersistenceDisabled: true',
  'realLwaActivationGateRejected: true',
  'commitEnabledByPublicQueryOnly: false',
  'commitEnabledByFrontendLocalStorageOnly: false',
  'commitEnabledByCookieOnly: false',
  'commitEnabledByUnsignedState: false',
  'companyIdFromCallbackQueryTrusted: false',
  'storeIdFromCallbackQueryTrusted: false',
  'marketplaceIdFromCallbackQueryTrusted: false',
  'regionFromCallbackQueryTrusted: false',
  'rawAuthorizationCodeReturned: false',
  'rawAccessTokenReturned: false',
  'rawRefreshTokenReturned: false',
  'rawLwaResponseReturned: false',
  "source: 'amazon-sp-api-oauth-callback-dry-run-to-commit-switch'",
  "mode: 'dry-run' | 'commit'",
  "commitAllowedNow: 'boolean'",
  "dryRunForcedNow: 'boolean'",
  "reason: 'ready_for_commit' | 'dry_run_default' | 'commit_gate_rejected'",
  'controllerWiringNow: true',
  "oauthCallbackPersistenceWiringNow: 'only-when-commitAllowedNow'",
  "tokenPersistenceDatabaseWriteNow: 'only-when-commitAllowedNow'",
  "databaseWriteNow: 'only-when-commitAllowedNow'",
  "prismaClientWriteNow: 'only-when-commitAllowedNow'",
  'rawAuthorizationCodeReturnedNow: false',
  'rawLwaResponseReturnedNow: false',
  'rawAccessTokenReturnedNow: false',
  'rawRefreshTokenReturnedNow: false',
  'controllerStillDryRunOnlyNow: true',
  'controllerCommitBranchStillAbsentNow: true',
  'controllerDoesNotCallOrchestratorRealWriteNow: true',
  'controllerDoesNotCallRepositoryRealWriteNow: true',
  'controllerDoesNotWritePrismaNow: true',
  'controllerDoesNotCallAmazonNow: true',
  'controllerDoesNotReturnRawSecretsNow: true',
  "proposedNextStep: 'Step139-P'",
  "nextSuggestedStep: 'Step139-P'",
]) {
  assertIncludes(contract, marker, 'contract');
}

for (const smoke of [
  'smoke:amazon-sp-api-oauth-callback-dry-run-to-commit-switch-contract',
  'smoke:amazon-sp-api-oauth-callback-real-write-persistence-controller-wiring-contract',
  'smoke:amazon-sp-api-token-persistence-orchestrator-real-write-branch-runtime',
  'smoke:amazon-sp-api-token-persistence-orchestrator-real-write-mocked-prisma',
  'smoke:amazon-sp-api-encrypted-token-repository-real-write-branch-runtime',
  'smoke:amazon-sp-api-oauth-callback-dry-run-controller-branch-runtime',
]) {
  assertIncludes(contract, smoke, 'contract regression smoke list');
}

assertIncludes(step139N, "step: 'Step139-N'", 'Step139-N contract');
assertIncludes(step139N, "nextSuggestedStep: 'Step139-O'", 'Step139-N contract');

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
assertIncludes(repository, 'upsertEncryptedCredentialRealWrite', 'repository');
assertIncludes(repository, "repositoryMode: 'mocked-prisma-delegate-real-write-contract'", 'repository');

console.log('========== Step139-O OAuth callback dry-run-to-commit switch contract smoke passed ==========');
