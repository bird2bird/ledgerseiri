const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');
const apiRoot = path.join(root, 'apps/api');

const files = {
  packageJson: path.join(apiRoot, 'package.json'),
  contract: path.join(
    apiRoot,
    'src/imports/dto/amazon-sp-api-oauth-callback-controller-real-write-preflight-contract.dto.ts',
  ),
  controller: path.join(apiRoot, 'src/imports/imports.controller.ts'),
  commitGateService: path.join(apiRoot, 'src/imports/amazon-sp-api-oauth-callback-commit-gate.service.ts'),
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

console.log('========== Step139-S OAuth callback controller real-write preflight contract smoke ==========');

const pkg = JSON.parse(read(files.packageJson));
const contract = read(files.contract);
const controller = read(files.controller);
const callbackSlice = sliceControllerOauthCallback(controller);
const commitGateService = read(files.commitGateService);
const orchestrator = read(files.orchestrator);
const repository = read(files.repository);

assert(
  pkg.scripts &&
    pkg.scripts['smoke:amazon-sp-api-oauth-callback-controller-real-write-preflight-contract'] ===
      'node scripts/smoke-amazon-sp-api-oauth-callback-controller-real-write-preflight-contract.js',
  'package.json registers Step139-S smoke',
);

for (const marker of [
  "source: 'amazon-sp-api-oauth-callback-controller-real-write-preflight-contract'",
  "step: 'Step139-S'",
  "phase: 'oauth-callback-controller-real-write-preflight-contract-only'",
  "previousCommitGateBranchCoverageStep: 'Step139-R'",
  "previousCommitGateImplementationStep: 'Step139-Q'",
  "previousCommitGateContractStep: 'Step139-P'",
  "previousDryRunToCommitSwitchContractStep: 'Step139-O'",
  "previousControllerRealWriteWiringContractStep: 'Step139-N'",
  "previousOrchestratorRealWriteBranchCoverageStep: 'Step139-M'",
  "previousOrchestratorRealWriteImplementationStep: 'Step139-L'",
  "previousRepositoryRealWriteBranchCoverageStep: 'Step139-J'",
  "previousRepositoryRealWriteImplementationStep: 'Step139-I'",
  "previousDryRunControllerImplementationStep: 'Step139-E'",
  'defineControllerRealWritePreflightContractOnlyNow: true',
  'modifyControllerRuntimeNow: false',
  'injectCommitGateServiceNow: false',
  'callEvaluateCommitGateNow: false',
  'callPersistEncryptedTokensRealWriteNow: false',
  'callRepositoryRealWriteNow: false',
  'tokenExchangeHttpCallNow: false',
  'amazonNetworkCallNow: false',
  'prismaClientWriteNow: false',
  'databaseWriteNow: false',
  'tokenPersistenceDatabaseWriteNow: false',
  'plaintextTokenDatabaseWriteNow: false',
  'addAmazonSpApiOauthCallbackCommitGateServiceToConstructor: true',
  'addAmazonSpApiTokenPersistenceOrchestratorToConstructor: true',
  'neverAddAmazonSpApiCredentialRepositoryToController: true',
  'repositoryAccessOnlyThroughOrchestrator: true',
  'callbackHasNoAmazonError: true',
  'trustedStateAccepted: true',
  'trustedStateSignatureValid: true',
  'trustedStateNotExpired: true',
  'commitGateAccepted: true',
  'commitGateReasonReadyForCommit: true',
  'sanitizedLwaParserAccepted: true',
  'encryptedPersistenceInputAccepted: true',
  'orchestratorRealWriteAccepted: true',
  'companyIdMustComeFromTrustedState: true',
  'storeIdMustComeFromTrustedState: true',
  'marketplaceIdMustComeFromTrustedState: true',
  'regionMustComeFromTrustedState: true',
  'companyIdFromCallbackQueryMustBeIgnored: true',
  'storeIdFromCallbackQueryMustBeIgnored: true',
  'marketplaceIdFromCallbackQueryMustBeIgnored: true',
  'regionFromCallbackQueryMustBeIgnored: true',
  'returnToMustBeSanitized: true',
  'evaluate AmazonSpApiOauthCallbackCommitGateService.evaluateCommitGate',
  'if commit gate accepted call AmazonSpApiTokenPersistenceOrchestrator.persistEncryptedTokensRealWrite',
  'directRepositoryCallFromController: false',
  'controllerImportsCredentialRepository: false',
  'controllerReturnsRawAuthorizationCode: false',
  'controllerReturnsRawLwaResponse: false',
  'controllerReturnsRawAccessToken: false',
  'controllerReturnsRawRefreshToken: false',
  "source: 'amazon-sp-api-oauth-callback-controller-real-write'",
  "wiringMode: 'controller-commit-gate-to-orchestrator-real-write'",
  'controllerWiringNow: true',
  'commitGateEvaluatedNow: true',
  'oauthCallbackPersistenceWiringNow: true',
  'controllerCallsServicePersistenceCommitNow: true',
  'controllerCallsRepositoryDirectlyNow: false',
  'plaintextTokenDatabaseWriteNow: false',
  'rawAuthorizationCodeReturnedNow: false',
  'rawLwaResponseReturnedNow: false',
  'rawAccessTokenReturnedNow: false',
  'rawRefreshTokenReturnedNow: false',
  'controllerStillDryRunOnlyNow: true',
  'controllerCommitBranchStillAbsentNow: true',
  'commitGateServiceExistsButControllerUnwiredNow: true',
  'orchestratorRealWriteExistsButControllerUnwiredNow: true',
  'repositoryRealWriteExistsButControllerUnwiredNow: true',
  "proposedNextStep: 'Step139-T'",
  "nextSuggestedStep: 'Step139-T'",
]) {
  assertIncludes(contract, marker, 'contract');
}

for (const smoke of [
  'smoke:amazon-sp-api-oauth-callback-controller-real-write-preflight-contract',
  'smoke:amazon-sp-api-oauth-callback-commit-gate-branch-runtime',
  'smoke:amazon-sp-api-oauth-callback-commit-gate-service-implementation',
  'smoke:amazon-sp-api-oauth-callback-commit-gate-service-contract',
  'smoke:amazon-sp-api-oauth-callback-dry-run-to-commit-switch-contract',
  'smoke:amazon-sp-api-oauth-callback-real-write-persistence-controller-wiring-contract',
  'smoke:amazon-sp-api-token-persistence-orchestrator-real-write-branch-runtime',
  'smoke:amazon-sp-api-oauth-callback-dry-run-controller-branch-runtime',
]) {
  assertIncludes(contract, smoke, 'contract regression smoke list');
}

assertIncludes(commitGateService, 'export class AmazonSpApiOauthCallbackCommitGateService', 'commit gate service');
assertIncludes(commitGateService, 'evaluateCommitGate(', 'commit gate service');
assertIncludes(commitGateService, "reason: 'ready_for_commit'", 'commit gate service');
assertIncludes(orchestrator, 'persistEncryptedTokensRealWrite', 'orchestrator');
assertIncludes(repository, 'upsertEncryptedCredentialRealWrite', 'repository');

for (const marker of [
  'controller-dry-run-only-no-persistence',
  'oauthCallbackPersistenceWiringNow: false',
  'controllerCallsServicePersistenceCommitNow: false',
  'tokenPersistenceDatabaseWriteNow: false',
  'databaseWriteNow: false',
  'prismaClientWriteNow: false',
  'amazonNetworkCallNow: false',
  'rawAuthorizationCodeReturnedNow: false',
  'rawLwaResponseReturnedNow: false',
  'rawAccessTokenReturnedNow: false',
  'rawRefreshTokenReturnedNow: false',
]) {
  assertIncludes(callbackSlice, marker, 'controller OAuth callback');
}

for (const forbidden of [
  'AmazonSpApiOauthCallbackCommitGateService',
  'evaluateCommitGate',
  'persistEncryptedTokensRealWrite',
  'upsertEncryptedCredentialRealWrite',
  'AmazonSpApiCredentialRepository',
  'oauthCallbackPersistenceWiringNow: true',
  'controllerCallsServicePersistenceCommitNow: true',
  'tokenPersistenceDatabaseWriteNow: true',
  'databaseWriteNow: true',
  'prismaClientWriteNow: true',
  'amazonNetworkCallNow: true',
]) {
  assertNotIncludes(callbackSlice, forbidden, 'controller OAuth callback runtime forbidden');
}

console.log('========== Step139-S OAuth callback controller real-write preflight contract smoke passed ==========');
