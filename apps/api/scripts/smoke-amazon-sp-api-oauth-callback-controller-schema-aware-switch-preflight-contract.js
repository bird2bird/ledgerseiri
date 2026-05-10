const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');
const apiRoot = path.join(root, 'apps/api');

const files = {
  packageJson: path.join(apiRoot, 'package.json'),
  contract: path.join(
    apiRoot,
    'src/imports/dto/amazon-sp-api-oauth-callback-controller-schema-aware-switch-preflight-contract.dto.ts',
  ),
  controller: path.join(apiRoot, 'src/imports/imports.controller.ts'),
  module: path.join(apiRoot, 'src/imports/imports.module.ts'),
  orchestrator: path.join(apiRoot, 'src/imports/amazon-sp-api-token-persistence.orchestrator.ts'),
  repository: path.join(apiRoot, 'src/imports/amazon-sp-api-credential.repository.ts'),
  v7Smoke: path.join(apiRoot, 'scripts/smoke-amazon-sp-api-token-persistence-orchestrator-schema-aware-real-db.js'),
};

function read(file) {
  if (!fs.existsSync(file)) throw new Error(`Missing file: ${path.relative(root, file)}`);
  return fs.readFileSync(file, 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`[OK] ${message}`);
}

function assertIncludes(source, needle, label) {
  assert(source.includes(needle), `${label} contains ${needle}`);
}

function assertNotIncludes(source, needle, label) {
  assert(!source.includes(needle), `${label} does not contain ${needle}`);
}

console.log('========== Step139-V8 OAuth callback controller schema-aware switch preflight contract smoke ==========');

const pkg = JSON.parse(read(files.packageJson));
const contract = read(files.contract);
const controller = read(files.controller);
const moduleSource = read(files.module);
const orchestrator = read(files.orchestrator);
const repository = read(files.repository);
const v7Smoke = read(files.v7Smoke);

assert(
  pkg.scripts &&
    pkg.scripts['smoke:amazon-sp-api-oauth-callback-controller-schema-aware-switch-preflight-contract'] ===
      'node scripts/smoke-amazon-sp-api-oauth-callback-controller-schema-aware-switch-preflight-contract.js',
  'package.json registers Step139-V8 smoke',
);

for (const marker of [
  "source: 'amazon-sp-api-oauth-callback-controller-schema-aware-switch-preflight-contract'",
  "step: 'Step139-V8'",
  "phase: 'controller-schema-aware-switch-preflight-contract-only'",
  "previousSchemaAwareOrchestratorRealDbSmokeStep: 'Step139-V7'",
  "previousSchemaAwareOrchestratorBranchCoverageStep: 'Step139-V6'",
  "previousSchemaAwareOrchestratorImplementationStep: 'Step139-V5'",
  "previousControllerGuardedRealWriteImplementationStep: 'Step139-T'",
  'defineControllerSwitchPreflightContractOnlyNow: true',
  'modifyControllerRuntimeNow: false',
  'modifyModuleRuntimeNow: false',
  'modifyOrchestratorRuntimeNow: false',
  'modifyRepositoryRuntimeNow: false',
  'modifyPrismaSchemaNow: false',
  "controllerMethodName: 'amazonSpApiOAuthCallbackBoundary'",
  'controllerHasGuardedCommitBranchNow: true',
  'controllerStillCallsLegacyOrchestratorMethodNow: true',
  "legacyOrchestratorMethodName: 'persistEncryptedTokensRealWrite'",
  'controllerDoesNotCallSchemaAwareOrchestratorYetNow: true',
  "schemaAwareOrchestratorMethodName: 'persistEncryptedTokensSchemaAwareRealWrite'",
  'controllerCallsRepositoryDirectlyNow: false',
  'controllerUsesCommitGateBeforePersistenceNow: true',
  "proposedNextStep: 'Step139-V9'",
  'replaceLegacyOrchestratorCallWithSchemaAwareCall: true',
  "oldMethodToRemoveFromCommitBranch: 'persistEncryptedTokensRealWrite'",
  "newMethodToCallFromCommitBranch:",
  'passPrismaServiceAsSchemaAwareClient: true',
  'preserveCommitGateBeforePersistence: true',
  'preserveNoRepositoryDirectCall: true',
  "source: 'amazon-sp-api-oauth-callback-controller-schema-aware-real-write'",
  "wiringMode:",
  'controllerCallsSchemaAwareOrchestratorNow: true',
  'controllerCallsLegacyOrchestratorNow: false',
  'connectionWriteNow: true',
  'credentialWriteNow: true',
  'plaintextTokenDatabaseWriteNow: false',
  'rawAuthorizationCodeReturnedNow: false',
  'rawLwaResponseReturnedNow: false',
  'rawAccessTokenReturnedNow: false',
  'rawRefreshTokenReturnedNow: false',
  "nextSuggestedStep: 'Step139-V9'",
]) {
  assertIncludes(contract, marker, 'contract');
}

for (const smoke of [
  'smoke:amazon-sp-api-oauth-callback-controller-schema-aware-switch-preflight-contract',
  'smoke:amazon-sp-api-token-persistence-orchestrator-schema-aware-real-db',
  'smoke:amazon-sp-api-token-persistence-orchestrator-schema-aware-branch-runtime',
  'smoke:amazon-sp-api-token-persistence-orchestrator-schema-aware-real-write-implementation',
  'smoke:amazon-sp-api-credential-repository-schema-aware-real-write-implementation',
  'smoke:amazon-sp-api-oauth-callback-controller-real-write-branch-runtime',
]) {
  assertIncludes(contract, smoke, 'contract regression smoke list');
}

for (const marker of [
  'amazonSpApiOAuthCallbackBoundary',
  'Step139-T: guarded OAuth callback controller real-write branch implementation',
  'this.amazonSpApiOauthCallbackCommitGateService.evaluateCommitGate',
  'controllerCallsRepositoryDirectlyNow: false',
  'rawAuthorizationCodeReturnedNow: false',
  'rawLwaResponseReturnedNow: false',
  'rawAccessTokenReturnedNow: false',
  'rawRefreshTokenReturnedNow: false',
]) {
  assertIncludes(controller, marker, 'current controller legacy guarded runtime');
}

if (controller.includes('this.amazonSpApiTokenPersistenceOrchestrator.persistEncryptedTokensSchemaAwareRealWrite')) {
  for (const marker of [
    'this.amazonSpApiTokenPersistenceOrchestrator.persistEncryptedTokensSchemaAwareRealWrite',
    'controller-commit-gate-to-schema-aware-orchestrator-real-write',
    'controllerCallsSchemaAwareOrchestratorNow: true',
    'controllerCallsLegacyOrchestratorNow: false',
    'controllerCallsRepositoryDirectlyNow: false',
    'rawAuthorizationCodeReturnedNow: false',
    'rawLwaResponseReturnedNow: false',
    'rawAccessTokenReturnedNow: false',
    'rawRefreshTokenReturnedNow: false',
  ]) {
    assertIncludes(controller, marker, 'controller schema-aware runtime after Step139-V9');
  }

  assertNotIncludes(
    controller,
      'controller legacy orchestrator path removed after Step139-V9',
  );
} else {
  assertNotIncludes(
    controller,
    'this.amazonSpApiTokenPersistenceOrchestrator.persistEncryptedTokensSchemaAwareRealWrite',
    'current controller schema-aware path not wired before Step139-V9',
  );
}

assertNotIncludes(controller, 'AmazonSpApiCredentialRepository', 'controller repository direct call');

if (controller.includes('this.amazonSpApiTokenPersistenceOrchestrator.persistEncryptedTokensSchemaAwareRealWrite')) {
  for (const marker of [
    'this.amazonSpApiTokenPersistenceOrchestrator.persistEncryptedTokensSchemaAwareRealWrite',
    'controller-commit-gate-to-schema-aware-orchestrator-real-write',
    'controllerCallsSchemaAwareOrchestratorNow: true',
    'controllerCallsLegacyOrchestratorNow: false',
    'controllerCallsRepositoryDirectlyNow: false',
  ]) {
    assertIncludes(controller, marker, 'post-Step139-V9 controller schema-aware runtime');
  }

  assertNotIncludes(
    controller,
    'this.amazonSpApiTokenPersistenceOrchestrator.persistEncryptedTokensRealWrite',
    'post-Step139-V9 controller legacy orchestrator call removed',
  );
}

for (const marker of [
  'AmazonSpApiTokenPersistenceOrchestrator',
  'AmazonSpApiOauthCallbackCommitGateService',
]) {
  assertIncludes(moduleSource, marker, 'imports.module');
}

for (const marker of [
  'persistEncryptedTokensSchemaAwareRealWrite',
  "source: 'amazon-sp-api-token-persistence-orchestrator-schema-aware-real-write'",
  "repositoryMethodCalled: 'upsertEncryptedCredentialSchemaAwareRealWrite'",
]) {
  assertIncludes(orchestrator, marker, 'orchestrator schema-aware readiness');
}

for (const marker of [
  'upsertEncryptedCredentialSchemaAwareRealWrite',
  'amazonSpApiConnection.upsert',
  'amazonSpApiCredential.upsert',
  'amazonSpApiAccessTokenCache.upsert',
]) {
  assertIncludes(repository, marker, 'repository schema-aware readiness');
}

for (const marker of [
  'Step139-V7 schema-aware orchestrator real DB smoke',
  'persistEncryptedTokensSchemaAwareRealWrite',
  'amazonSpApiConnection.findUnique',
]) {
  assertIncludes(v7Smoke, marker, 'Step139-V7 real DB smoke');
}

console.log('========== Step139-V8 OAuth callback controller schema-aware switch preflight contract smoke passed ==========');
