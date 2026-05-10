const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');
const apiRoot = path.join(root, 'apps/api');

const files = {
  packageJson: path.join(apiRoot, 'package.json'),
  contract: path.join(
    apiRoot,
    'src/imports/dto/amazon-sp-api-oauth-callback-commit-gate-service-contract.dto.ts',
  ),
  step139O: path.join(
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

console.log('========== Step139-P OAuth callback commit gate service contract smoke ==========');

const pkg = JSON.parse(read(files.packageJson));
const contract = read(files.contract);
const step139O = read(files.step139O);
const step139N = read(files.step139N);
const controller = read(files.controller);
const oauthCallbackSlice = sliceControllerOauthCallback(controller);
const orchestrator = read(files.orchestrator);
const repository = read(files.repository);

assert(
  pkg.scripts &&
    pkg.scripts['smoke:amazon-sp-api-oauth-callback-commit-gate-service-contract'] ===
      'node scripts/smoke-amazon-sp-api-oauth-callback-commit-gate-service-contract.js',
  'package.json registers Step139-P smoke',
);

for (const marker of [
  "source: 'amazon-sp-api-oauth-callback-commit-gate-service-contract'",
  "step: 'Step139-P'",
  "phase: 'oauth-callback-commit-gate-service-contract-only'",
  "previousDryRunToCommitSwitchContractStep: 'Step139-O'",
  "previousControllerRealWriteWiringContractStep: 'Step139-N'",
  "previousOrchestratorRealWriteBranchCoverageStep: 'Step139-M'",
  "previousOrchestratorRealWriteImplementationStep: 'Step139-L'",
  "previousRepositoryRealWriteBranchCoverageStep: 'Step139-J'",
  "previousRepositoryRealWriteImplementationStep: 'Step139-I'",
  "previousDryRunControllerImplementationStep: 'Step139-E'",
  'defineCommitGateServiceContractOnlyNow: true',
  'implementCommitGateServiceRuntimeNow: false',
  'modifyControllerRuntimeNow: false',
  'instantiateCommitGateServiceNow: false',
  'callPersistEncryptedTokensRealWriteNow: false',
  'callRepositoryRealWriteNow: false',
  'tokenExchangeHttpCallNow: false',
  'amazonNetworkCallNow: false',
  'prismaClientWriteNow: false',
  'databaseWriteNow: false',
  'tokenPersistenceDatabaseWriteNow: false',
  'plaintextTokenDatabaseWriteNow: false',
  "serviceName: 'AmazonSpApiOauthCallbackCommitGateService'",
  "methodName: 'evaluateCommitGate'",
  "outputSource: 'amazon-sp-api-oauth-callback-commit-gate'",
  "serviceRole: 'pure-commit-eligibility-evaluator-no-side-effects'",
  "controllerUsageLater: 'controller calls gate before orchestrator real-write branch'",
  "dryRun: 'boolean'",
  "requestedCommit: 'boolean'",
  "trustedStateAccepted: 'boolean'",
  "callbackStateSignatureValid: 'boolean'",
  "callbackStateExpired: 'boolean'",
  "companyId: 'string'",
  "storeId: 'string'",
  "marketplaceId: 'string'",
  "region: 'string'",
  "sellingPartnerIdPresent: 'boolean'",
  "authorizationCodePresent: 'boolean'",
  "operatorConfirmed: 'boolean'",
  "companyStoreAllowlisted: 'boolean'",
  "environmentAllowsPersistence: 'boolean'",
  "realLwaActivationGateAccepted: 'boolean'",
  "idempotencyKey: 'string'",
  "sanitizedLwaParserAccepted: 'boolean'",
  "encryptedPersistenceInputAccepted: 'boolean'",
  "source: 'amazon-sp-api-oauth-callback-commit-gate'",
  "gateMode: 'server-side-pure-commit-gate-no-side-effects'",
  "'ready_for_commit'",
  "'dry_run_default'",
  "'commit_not_requested'",
  "'trusted_state_rejected'",
  "'state_signature_invalid'",
  "'state_expired'",
  "'missing_company_id'",
  "'missing_store_id'",
  "'missing_marketplace_id'",
  "'missing_region'",
  "'missing_selling_partner_id'",
  "'missing_authorization_code'",
  "'operator_confirmation_required'",
  "'company_store_not_allowlisted'",
  "'environment_persistence_disabled'",
  "'real_lwa_activation_gate_rejected'",
  "'missing_idempotency_key'",
  "'sanitized_lwa_parser_not_accepted'",
  "'encrypted_persistence_input_not_accepted'",
  "messageRedacted: 'string'",
  "commitAllowedNow: 'boolean'",
  "dryRunForcedNow: 'boolean'",
  "controllerMayCallOrchestratorRealWriteNow: 'boolean'",
  "tokenExchangeHttpCallAllowedNow: 'boolean'",
  "amazonNetworkCallAllowedNow: 'boolean'",
  "tokenPersistenceDatabaseWriteAllowedNow: 'boolean'",
  "databaseWriteAllowedNow: 'boolean'",
  "prismaClientWriteAllowedNow: 'boolean'",
  'plaintextTokenDatabaseWriteAllowedNow: false',
  'rawAuthorizationCodeReturnedNow: false',
  'rawLwaResponseReturnedNow: false',
  'rawAccessTokenReturnedNow: false',
  'rawRefreshTokenReturnedNow: false',
  'dryRunMustBeFalse: true',
  'requestedCommitMustBeTrue: true',
  'trustedStateAcceptedMustBeTrue: true',
  'callbackStateSignatureValidMustBeTrue: true',
  'callbackStateExpiredMustBeFalse: true',
  'companyIdPresent: true',
  'storeIdPresent: true',
  'marketplaceIdPresent: true',
  'regionPresent: true',
  'sellingPartnerIdPresent: true',
  'authorizationCodePresent: true',
  'operatorConfirmedMustBeTrue: true',
  'companyStoreAllowlistedMustBeTrue: true',
  'environmentAllowsPersistenceMustBeTrue: true',
  'realLwaActivationGateAcceptedMustBeTrue: true',
  'idempotencyKeyPresent: true',
  'sanitizedLwaParserAcceptedMustBeTrue: true',
  'encryptedPersistenceInputAcceptedMustBeTrue: true',
  'serviceMustNotCallAmazon: true',
  'serviceMustNotCallPrisma: true',
  'serviceMustNotWriteDatabase: true',
  'serviceMustNotPersistToken: true',
  'serviceMustNotDecryptToken: true',
  'serviceMustNotReturnRawAuthorizationCode: true',
  'serviceMustNotReturnRawToken: true',
  'serviceMustOnlyEvaluateBooleansAndPresence: true',
  'controllerStillDryRunOnlyNow: true',
  'controllerCommitBranchStillAbsentNow: true',
  'commitGateServiceRuntimeStillAbsentNow: true',
  'controllerDoesNotInstantiateCommitGateServiceNow: true',
  'controllerDoesNotCallOrchestratorRealWriteNow: true',
  'controllerDoesNotCallRepositoryRealWriteNow: true',
  'controllerDoesNotWritePrismaNow: true',
  'controllerDoesNotCallAmazonNow: true',
  "proposedNextStep: 'Step139-Q'",
  "nextSuggestedStep: 'Step139-Q'",
]) {
  assertIncludes(contract, marker, 'contract');
}

for (const smoke of [
  'smoke:amazon-sp-api-oauth-callback-commit-gate-service-contract',
  'smoke:amazon-sp-api-oauth-callback-dry-run-to-commit-switch-contract',
  'smoke:amazon-sp-api-oauth-callback-real-write-persistence-controller-wiring-contract',
  'smoke:amazon-sp-api-token-persistence-orchestrator-real-write-branch-runtime',
  'smoke:amazon-sp-api-oauth-callback-dry-run-controller-branch-runtime',
]) {
  assertIncludes(contract, smoke, 'contract regression smoke list');
}

assertIncludes(step139O, "step: 'Step139-O'", 'Step139-O contract');
assertIncludes(step139O, "nextSuggestedStep: 'Step139-P'", 'Step139-O contract');
assertIncludes(step139N, "step: 'Step139-N'", 'Step139-N contract');

assertIncludes(oauthCallbackSlice, 'controller-dry-run-only-no-persistence', 'controller OAuth callback');
assertIncludes(oauthCallbackSlice, 'oauthCallbackPersistenceWiringNow: false', 'controller OAuth callback');
assertIncludes(oauthCallbackSlice, 'controllerCallsServicePersistenceCommitNow: false', 'controller OAuth callback');
assertIncludes(oauthCallbackSlice, 'tokenPersistenceDatabaseWriteNow: false', 'controller OAuth callback');
assertIncludes(oauthCallbackSlice, 'databaseWriteNow: false', 'controller OAuth callback');
assertIncludes(oauthCallbackSlice, 'prismaClientWriteNow: false', 'controller OAuth callback');
assertIncludes(oauthCallbackSlice, 'amazonNetworkCallNow: false', 'controller OAuth callback');

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
  assertNotIncludes(oauthCallbackSlice, forbidden, 'controller OAuth callback runtime forbidden');
}

assertIncludes(orchestrator, 'persistEncryptedTokensRealWrite', 'orchestrator');
assertIncludes(orchestrator, "orchestratorMode: 'repository-real-write-wiring-mocked-prisma'", 'orchestrator');
assertIncludes(repository, 'upsertEncryptedCredentialRealWrite', 'repository');
assertIncludes(repository, "repositoryMode: 'mocked-prisma-delegate-real-write-contract'", 'repository');

console.log('========== Step139-P OAuth callback commit gate service contract smoke passed ==========');
