const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');
const apiRoot = path.join(root, 'apps/api');

const files = {
  contract: path.join(
    apiRoot,
    'src/imports/dto/amazon-sp-api-token-persistence-pre-wiring-final-handoff-contract.dto.ts',
  ),
  packageJson: path.join(apiRoot, 'package.json'),
  tokenService: path.join(apiRoot, 'src/imports/amazon-sp-api-token-exchange.service.ts'),
  repository: path.join(apiRoot, 'src/imports/amazon-sp-api-credential.repository.ts'),
  orchestrator: path.join(apiRoot, 'src/imports/amazon-sp-api-token-persistence.orchestrator.ts'),
  e2eRunner: path.join(apiRoot, 'src/imports/amazon-sp-api-token-persistence-e2e.runner.ts'),
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

console.log('========== Step138-G token persistence pre-wiring final handoff contract smoke ==========');

const contract = read(files.contract);
const pkg = JSON.parse(read(files.packageJson));
const tokenService = read(files.tokenService);
const repository = read(files.repository);
const orchestrator = read(files.orchestrator);
const e2eRunner = read(files.e2eRunner);
const controller = read(files.controller);

assertIncludes(
  'package.json',
  JSON.stringify(pkg.scripts || {}),
  'smoke:amazon-sp-api-token-persistence-pre-wiring-final-handoff-contract',
);

for (const marker of [
  "source: 'amazon-sp-api-token-persistence-pre-wiring-final-handoff-contract'",
  "step: 'Step138-G'",
  "phase: 'pre-wiring-final-handoff-contract-only'",
  "guardedExecutableLwaHttpTransport: 'Step137-U'",
  "guardedExecutableLwaHttpTransportBranchCoverage: 'Step137-V'",
  "encryptedTokenRepositoryContract: 'Step137-X'",
  "encryptedTokenRepositoryTestDouble: 'Step137-Y'",
  "encryptedTokenRepositoryBranchCoverage: 'Step137-Z'",
  "tokenPersistenceOrchestrationContract: 'Step138-A'",
  "tokenPersistenceOrchestratorTestDouble: 'Step138-B'",
  "tokenPersistenceOrchestratorBranchCoverage: 'Step138-C'",
  "tokenPersistenceE2eHandoffContract: 'Step138-D'",
  "tokenPersistenceE2eRunnerTestDouble: 'Step138-E'",
  "tokenPersistenceE2eRunnerBranchCoverage: 'Step138-F'",
  "definePreWiringHandoffOnlyNow: true",
  "modifyTokenExchangeServiceNow: false",
  "modifyRepositoryNow: false",
  "modifyOrchestratorNow: false",
  "modifyE2eRunnerNow: false",
  "wireControllerNow: false",
  "wireOAuthCallbackNow: false",
  "callAmazonNow: false",
  "writePrismaNow: false",
  "persistTokenNow: false",
  "'AmazonSpApiTokenExchangeService.executeRealLwaTokenExchangeHttpExecutableGuardedLater'",
  "'AmazonSpApiTokenExchangeService.parseRealLwaHttpResponseSanitizedLater'",
  "'AmazonSpApiTokenExchangeService.prepareEncryptedTokenPersistenceInputLater'",
  "'AmazonSpApiCredentialRepository.upsertEncryptedCredentialTestDouble'",
  "'AmazonSpApiTokenPersistenceOrchestrator.persistTokenExchangeResultTestDouble'",
  "'AmazonSpApiTokenPersistenceE2eRunner.runTokenPersistenceE2eTestDouble'",
  "'smoke:amazon-sp-api-token-persistence-e2e-runner-branch-runtime'",
  "tokenExchangeServiceWiringNow: false",
  "importsControllerWiringNow: false",
  "oauthCallbackWiringNow: false",
  "amazonNetworkCallNow: false",
  "executableHttpClientUsedNow: false",
  "realSpApiRequestNow: false",
  "prismaClientWriteNow: false",
  "databaseWriteNow: false",
  "tokenPersistenceDatabaseWriteNow: false",
  "plaintextTokenDatabaseWriteNow: false",
  "rawTokenReturnedNow: false",
  "rawLwaResponseReturnedNow: false",
  "proposedNextStep: 'Step139-A'",
  "firstAllowedWiringTarget:",
  "'AmazonSpApiTokenExchangeService internal test-double-only method'",
  "controllerMustRemainUnwired: true",
  "oauthCallbackMustRemainUnwired: true",
  "realAmazonHttpMustRemainGuarded: true",
  "prismaWriteMustRemainDisabledUntilRepositoryRealWriteStep: true",
  "plaintextTokenMustNeverBePersisted: true",
  "rawLwaResponseMustNeverBeReturned: true",
  "'Step139-A internal service-only E2E runner wiring test double'",
  "'Step139-G final guarded callback persistence activation handoff'",
  "tokenExchangeServiceImportsRunnerNow: false",
  "controllerImportsRunnerNow: false",
  "controllerCallsRunnerNow: false",
  "oauthCallbackCallsRunnerNow: false",
  "nextSuggestedStep: 'Step139-A'",
]) {
  assertIncludes('contract', contract, marker);
}

for (const forbidden of [
  "modifyTokenExchangeServiceNow: true",
  "modifyRepositoryNow: true",
  "modifyOrchestratorNow: true",
  "modifyE2eRunnerNow: true",
  "wireControllerNow: true",
  "wireOAuthCallbackNow: true",
  "callAmazonNow: true",
  "writePrismaNow: true",
  "persistTokenNow: true",
  "tokenExchangeServiceWiringNow: true",
  "importsControllerWiringNow: true",
  "oauthCallbackWiringNow: true",
  "amazonNetworkCallNow: true",
  "executableHttpClientUsedNow: true",
  "realSpApiRequestNow: true",
  "prismaClientWriteNow: true",
  "databaseWriteNow: true",
  "tokenPersistenceDatabaseWriteNow: true",
  "plaintextTokenDatabaseWriteNow: true",
  "rawTokenReturnedNow: true",
  "rawLwaResponseReturnedNow: true",
  "tokenExchangeServiceImportsRunnerNow: true",
  "controllerImportsRunnerNow: true",
  "controllerCallsRunnerNow: true",
  "oauthCallbackCallsRunnerNow: true",
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

assertIncludes('e2eRunner', e2eRunner, 'export class AmazonSpApiTokenPersistenceE2eRunner');
assertIncludes('e2eRunner', e2eRunner, 'runTokenPersistenceE2eTestDouble');
assertIncludes('e2eRunner', e2eRunner, "runnerMode: 'test-double-no-controller-no-prisma-write-no-amazon-call'");

assertIncludes('tokenService', tokenService, 'AmazonSpApiTokenPersistenceE2eRunner');
assertIncludes('tokenService', tokenService, 'runTokenPersistenceE2eServiceOnlyTestDouble');
assertIncludes('tokenService', tokenService, "serviceWiringMode: 'internal-service-only-no-controller-no-oauth-callback'");
assertIncludes('tokenService', tokenService, 'controllerWiringNow: false');
assertIncludes('tokenService', tokenService, 'oauthCallbackWiringNow: false');
assertIncludes('tokenService', tokenService, 'amazonNetworkCallNow: false');
assertIncludes('tokenService', tokenService, 'prismaClientWriteNow: false');
assertNotIncludes('tokenService', tokenService, 'AmazonSpApiTokenPersistenceOrchestrator');
assertNotIncludes('tokenService', tokenService, 'AmazonSpApiCredentialRepository');

assertNotIncludes('controller', controller, 'AmazonSpApiTokenPersistenceE2eRunner');
assertNotIncludes('controller', controller, 'AmazonSpApiTokenPersistenceOrchestrator');
assertNotIncludes('controller', controller, 'AmazonSpApiCredentialRepository');
assertNotIncludes('controller', controller, 'executeRealLwaTokenExchangeHttpExecutableGuardedLater');
assertNotIncludes('controller', controller, 'runTokenPersistenceE2eTestDouble');

console.log('========== Step138-G token persistence pre-wiring final handoff contract smoke passed ==========');
