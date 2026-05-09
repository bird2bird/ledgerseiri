const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');
const apiRoot = path.join(root, 'apps/api');

const files = {
  contract: path.join(
    apiRoot,
    'src/imports/dto/amazon-sp-api-token-persistence-e2e-handoff-contract.dto.ts',
  ),
  packageJson: path.join(apiRoot, 'package.json'),
  tokenService: path.join(apiRoot, 'src/imports/amazon-sp-api-token-exchange.service.ts'),
  repository: path.join(apiRoot, 'src/imports/amazon-sp-api-credential.repository.ts'),
  orchestrator: path.join(apiRoot, 'src/imports/amazon-sp-api-token-persistence.orchestrator.ts'),
  controller: path.join(apiRoot, 'src/imports/imports.controller.ts'),
  e2eRunner: path.join(apiRoot, 'src/imports/amazon-sp-api-token-persistence-e2e.runner.ts'),
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

console.log('========== Step138-D token persistence E2E handoff contract smoke ==========');

const contract = read(files.contract);
const pkg = JSON.parse(read(files.packageJson));
const tokenService = read(files.tokenService);
const repository = read(files.repository);
const orchestrator = read(files.orchestrator);
const controller = read(files.controller);
const e2eRunner = read(files.e2eRunner, true);

assertIncludes(
  'package.json',
  JSON.stringify(pkg.scripts || {}),
  'smoke:amazon-sp-api-token-persistence-e2e-handoff-contract',
);

for (const marker of [
  "source: 'amazon-sp-api-token-persistence-e2e-handoff-contract'",
  "step: 'Step138-D'",
  "phase: 'e2e-test-double-handoff-contract-only'",
  "previousTransportStep: 'Step137-U'",
  "previousTransportBranchCoverageStep: 'Step137-V'",
  "previousRepositoryStep: 'Step137-Y'",
  "previousRepositoryBranchCoverageStep: 'Step137-Z'",
  "previousOrchestrationContractStep: 'Step138-A'",
  "previousOrchestratorStep: 'Step138-B'",
  "previousOrchestratorBranchCoverageStep: 'Step138-C'",
  "defineE2eHandoffContractOnlyNow: true",
  "createE2eRunnerNow: false",
  "modifyTokenExchangeServiceNow: false",
  "modifyRepositoryNow: false",
  "modifyOrchestratorNow: false",
  "wireControllerNow: false",
  "wireOAuthCallbackNow: false",
  "callAmazonNow: false",
  "writePrismaNow: false",
  "persistTokenNow: false",
  "'executeRealLwaTokenExchangeHttpExecutableGuardedLater'",
  "'parseRealLwaHttpResponseSanitizedLater'",
  "'prepareEncryptedTokenPersistenceInputLater'",
  "'AmazonSpApiTokenPersistenceOrchestrator.persistTokenExchangeResultTestDouble'",
  "'AmazonSpApiCredentialRepository.upsertEncryptedCredentialTestDouble'",
  "activationGateAccepted: true",
  "executableTransportAccepted: true",
  "sanitizedParserAccepted: true",
  "encryptedPersistenceInputAccepted: true",
  "repositoryTestDoubleAccepted: true",
  "orchestratorTestDoubleAccepted: true",
  "trustedCompanyIdRequired: true",
  "trustedStoreIdRequired: true",
  "transportBlockedStopsBeforeParser: true",
  "parserRejectedStopsBeforeBuilder: true",
  "persistenceInputRejectedStopsBeforeRepository: true",
  "repositoryRejectedStopsBeforePersistenceSuccess: true",
  "plaintextTokenRejectedAnywhere: true",
  "rawLwaResponseRejectedAnywhere: true",
  "source: 'amazon-sp-api-token-persistence-e2e-handoff'",
  "handoffMode: 'contract-only-no-runner-no-controller-no-prisma-write'",
  "controllerWiringNow: false",
  "oauthCallbackWiringNow: false",
  "amazonNetworkCallNow: false",
  "prismaClientWriteNow: false",
  "databaseWriteNow: false",
  "rawTokenReturnedNow: false",
  "rawLwaResponseReturnedNow: false",
  "e2eRunnerFileCreatedNow: false",
  "repositoryRealWriteNow: false",
  "tokenPersistenceDatabaseWriteNow: false",
  "plaintextTokenDatabaseWriteNow: false",
  "'smoke:amazon-sp-api-token-persistence-e2e-handoff-contract'",
  "'smoke:amazon-sp-api-token-persistence-orchestrator-branch-runtime'",
  "'smoke:amazon-sp-api-token-persistence-orchestrator-test-double'",
  "'smoke:amazon-sp-api-encrypted-token-repository-branch-runtime'",
  "'smoke:amazon-sp-api-executable-lwa-http-transport-branch-runtime'",
  "nextSuggestedStep: 'Step138-E'",
]) {
  assertIncludes('contract', contract, marker);
}

for (const forbidden of [
  "createE2eRunnerNow: true",
  "modifyTokenExchangeServiceNow: true",
  "modifyRepositoryNow: true",
  "modifyOrchestratorNow: true",
  "wireControllerNow: true",
  "wireOAuthCallbackNow: true",
  "callAmazonNow: true",
  "writePrismaNow: true",
  "persistTokenNow: true",
  "e2eRunnerFileCreatedNow: true",
  "repositoryRealWriteNow: true",
  "amazonNetworkCallNow: true",
  "prismaClientWriteNow: true",
  "databaseWriteNow: true",
  "tokenPersistenceDatabaseWriteNow: true",
  "plaintextTokenDatabaseWriteNow: true",
  "rawTokenReturnedNow: true",
  "rawLwaResponseReturnedNow: true",
]) {
  assertNotIncludes('contract', contract, forbidden);
}

assertIncludes('tokenService', tokenService, 'executeRealLwaTokenExchangeHttpExecutableGuardedLater');
assertIncludes('tokenService', tokenService, 'parseRealLwaHttpResponseSanitizedLater');
assertIncludes('tokenService', tokenService, 'prepareEncryptedTokenPersistenceInputLater');

assertIncludes('repository', repository, 'export class AmazonSpApiCredentialRepository');
assertIncludes('repository', repository, 'upsertEncryptedCredentialTestDouble');
assertIncludes('repository', repository, "repositoryMode: 'test-double-no-prisma-write'");

assertIncludes('orchestrator', orchestrator, 'export class AmazonSpApiTokenPersistenceOrchestrator');
assertIncludes('orchestrator', orchestrator, 'persistTokenExchangeResultTestDouble');
assertIncludes('orchestrator', orchestrator, "orchestrationMode: 'test-double-no-controller-no-prisma-write'");

// Step138-E intentionally creates the E2E runner test-double file.
// This legacy Step138-D contract smoke now allows that file to exist,
// but only as a no-controller / no-Prisma-write / no-Amazon-call test double.
assertIncludes('e2eRunner', e2eRunner, 'export class AmazonSpApiTokenPersistenceE2eRunner');
assertIncludes('e2eRunner', e2eRunner, 'runTokenPersistenceE2eTestDouble');
assertIncludes('e2eRunner', e2eRunner, "runnerMode: 'test-double-no-controller-no-prisma-write-no-amazon-call'");
assertIncludes('e2eRunner', e2eRunner, 'controllerWiringNow: false');
assertIncludes('e2eRunner', e2eRunner, 'oauthCallbackWiringNow: false');
assertIncludes('e2eRunner', e2eRunner, 'amazonNetworkCallNow: false');
assertIncludes('e2eRunner', e2eRunner, 'executableHttpClientUsedNow: false');
assertIncludes('e2eRunner', e2eRunner, 'realSpApiRequestNow: false');
assertIncludes('e2eRunner', e2eRunner, 'prismaClientWriteNow: false');
assertIncludes('e2eRunner', e2eRunner, 'databaseWriteNow: false');
assertIncludes('e2eRunner', e2eRunner, 'tokenPersistenceDatabaseWriteNow: false');
assertIncludes('e2eRunner', e2eRunner, 'plaintextTokenDatabaseWriteNow: false');
assertIncludes('e2eRunner', e2eRunner, 'rawTokenReturnedNow: false');
assertIncludes('e2eRunner', e2eRunner, 'rawLwaResponseReturnedNow: false');
assertNotIncludes('e2eRunner', e2eRunner, 'prisma.');
assertNotIncludes('e2eRunner', e2eRunner, 'amazonSpApiCredential.');
assertNotIncludes('e2eRunner', e2eRunner, 'fetch(');
assertNotIncludes('e2eRunner', e2eRunner, 'axios.');
assertNotIncludes('e2eRunner', e2eRunner, 'http.request');
assertNotIncludes('e2eRunner', e2eRunner, 'https.request');

assertNotIncludes('tokenService', tokenService, 'AmazonSpApiTokenPersistenceOrchestrator');
assertNotIncludes('tokenService', tokenService, 'AmazonSpApiCredentialRepository');
assertNotIncludes('controller', controller, 'AmazonSpApiTokenPersistenceOrchestrator');
assertNotIncludes('controller', controller, 'AmazonSpApiCredentialRepository');
assertNotIncludes('controller', controller, 'executeRealLwaTokenExchangeHttpExecutableGuardedLater');
assertNotIncludes('controller', controller, 'prepareEncryptedTokenPersistenceInputLater');

console.log('========== Step138-D token persistence E2E handoff contract smoke passed ==========');
