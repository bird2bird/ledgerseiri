const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');
const apiRoot = path.join(root, 'apps/api');

const files = {
  contract: path.join(
    apiRoot,
    'src/imports/dto/amazon-sp-api-token-persistence-orchestrator-real-write-repository-wiring-contract.dto.ts',
  ),
  packageJson: path.join(apiRoot, 'package.json'),
  orchestrator: path.join(apiRoot, 'src/imports/amazon-sp-api-token-persistence.orchestrator.ts'),
  repository: path.join(apiRoot, 'src/imports/amazon-sp-api-credential.repository.ts'),
  controller: path.join(apiRoot, 'src/imports/imports.controller.ts'),
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

console.log('========== Step139-K token persistence orchestrator real-write repository wiring contract smoke ==========');

const contract = read(files.contract);
const pkg = JSON.parse(read(files.packageJson));
const orchestrator = read(files.orchestrator);
const repository = read(files.repository);
const controller = read(files.controller);

assertIncludes(
  'package.json',
  JSON.stringify(pkg.scripts || {}),
  'smoke:amazon-sp-api-token-persistence-orchestrator-real-write-repository-wiring-contract',
);

for (const marker of [
  "source: 'amazon-sp-api-token-persistence-orchestrator-real-write-repository-wiring-contract'",
  "step: 'Step139-K'",
  "phase: 'orchestrator-real-write-repository-wiring-contract-only'",
  "previousRepositoryImplementationStep: 'Step139-I'",
  "previousRepositoryBranchCoverageStep: 'Step139-J'",
  "previousOauthRealWriteBoundaryStep: 'Step139-G'",
  "defineOrchestratorRepositoryWiringContractOnlyNow: true",
  "modifyOrchestratorRuntimeNow: false",
  "callRepositoryRealWriteNow: false",
  "modifyControllerRuntimeNow: false",
  "enableOAuthCallbackPersistenceNow: false",
  "prismaClientWriteNow: false",
  "databaseWriteNow: false",
  "tokenPersistenceDatabaseWriteNow: false",
  "callAmazonNow: false",
  "methodName: 'persistEncryptedTokensRealWrite'",
  "className: 'AmazonSpApiTokenPersistenceOrchestrator'",
  "'AmazonSpApiCredentialRepository.upsertEncryptedCredentialRealWrite'",
  "repositoryMode: 'mocked-prisma-delegate-real-write-contract'",
  "activationGateAcceptedRequired: true",
  "executableTransportAcceptedRequired: true",
  "sanitizedParserAcceptedRequired: true",
  "encryptedPersistenceInputAcceptedRequired: true",
  "repositoryRealWriteAcceptedRequired: true",
  "dryRunMustBeFalseExplicitlyRequired: true",
  "mockedPrismaDelegateRequiredUntilControllerWiring: true",
  "idempotencyKeyRequired: true",
  "operatorConfirmationRequired: true",
  "companyIdMappedToRepositoryInput: true",
  "encryptedRefreshTokenMappedToRepositoryInput: true",
  "refreshTokenFingerprintMappedToRepositoryInput: true",
  "statusMappedToActive: true",
  "orchestratorMode: 'repository-real-write-wiring-mocked-prisma'",
  "repositoryMethodCalled: 'upsertEncryptedCredentialRealWrite'",
  "controllerWiringNow: false",
  "oauthCallbackPersistenceWiringNow: false",
  "plaintextTokenDatabaseWriteNow: false",
  "orchestratorRuntimeStillTestDoubleNow: true",
  "controllerRuntimeStillDryRunOnlyNow: true",
  "repositoryRealWriteExistsButNotOrchestratorWiredNow: true",
  "oauthCallbackPersistenceStillForbiddenNow: true",
  "noControllerRepositoryRealWriteDependencyNow: true",
  "persistEncryptedTokensRealWriteNow: false",
  "repositoryRealWriteCalledByOrchestratorNow: false",
  "controllerImportsRepositoryForRealWriteNow: false",
  "controllerCallsRepositoryRealWriteNow: false",
  "proposedNextStep: 'Step139-L'",
  "orchestratorRuntimeChangeAllowedNext: true",
  "mockedPrismaOnlyNext: true",
  "controllerPersistenceStillForbiddenNext: true",
  "oauthCallbackPersistenceStillForbiddenNext: true",
  "nextSuggestedStep: 'Step139-L'",
]) {
  assertIncludes('contract', contract, marker);
}

for (const forbidden of [
  "modifyOrchestratorRuntimeNow: true",
  "callRepositoryRealWriteNow: true",
  "modifyControllerRuntimeNow: true",
  "enableOAuthCallbackPersistenceNow: true",
  "persistEncryptedTokensRealWriteNow: true",
  "repositoryRealWriteCalledByOrchestratorNow: true",
  "controllerImportsRepositoryNow: true",
  "controllerCallsRepositoryNow: true",
  "plaintextTokenDatabaseWriteNow: true",
  "rawAccessTokenReturnedNow: true",
  "rawRefreshTokenReturnedNow: true",
  "rawLwaResponseReturnedNow: true",
]) {
  assertNotIncludes('contract', contract, forbidden);
}

assertIncludes('orchestrator', orchestrator, 'export class AmazonSpApiTokenPersistenceOrchestrator');
assertIncludes('orchestrator', orchestrator, 'tokenPersistenceDatabaseWriteNow: false');
assertIncludes('orchestrator', orchestrator, 'databaseWriteNow: false');
assertIncludes('orchestrator', orchestrator, 'prismaClientWriteNow: false');
assertNotIncludes('orchestrator', orchestrator, 'persistEncryptedTokensRealWrite');
assertNotIncludes('orchestrator', orchestrator, 'upsertEncryptedCredentialRealWrite');
assertIncludes('orchestrator', orchestrator, 'AmazonSpApiCredentialRepository');

assertIncludes('repository', repository, 'upsertEncryptedCredentialRealWrite');
assertIncludes('repository', repository, "repositoryMode: 'mocked-prisma-delegate-real-write-contract'");
assertIncludes('repository', repository, 'plaintextTokenDatabaseWriteNow: false');
assertNotIncludes('repository', repository, 'plaintextTokenDatabaseWriteNow: true');
assertNotIncludes('repository', repository, 'repositoryMayCallAmazonNow: true');
assertNotIncludes('repository', repository, 'rawTokenReturnedNow: true');

assertIncludes('controller', controller, "wiringMode: 'controller-dry-run-only-no-persistence'");
assertIncludes('controller', controller, 'tokenPersistenceDatabaseWriteNow: false');
assertIncludes('controller', controller, 'persistedConnection: null');
assertNotIncludes('controller', controller, 'AmazonSpApiCredentialRepository');
assertNotIncludes('controller', controller, 'upsertEncryptedCredentialRealWrite');
assertNotIncludes('controller', controller, 'tokenPersistenceDatabaseWriteNow: true');
assertNotIncludes('controller', controller, 'prismaClientWriteNow: true');

console.log('========== Step139-K token persistence orchestrator real-write repository wiring contract smoke passed ==========');
