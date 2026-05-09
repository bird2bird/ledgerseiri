const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');
const apiRoot = path.join(root, 'apps/api');

const files = {
  contract: path.join(
    apiRoot,
    'src/imports/dto/amazon-sp-api-oauth-callback-encrypted-token-persistence-boundary-contract.dto.ts',
  ),
  packageJson: path.join(apiRoot, 'package.json'),
  service: path.join(apiRoot, 'src/imports/amazon-sp-api-token-exchange.service.ts'),
  runner: path.join(apiRoot, 'src/imports/amazon-sp-api-token-persistence-e2e.runner.ts'),
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

console.log('========== Step139-C OAuth callback encrypted token persistence boundary contract smoke ==========');

const contract = read(files.contract);
const pkg = JSON.parse(read(files.packageJson));
const service = read(files.service);
const runner = read(files.runner);
const orchestrator = read(files.orchestrator);
const repository = read(files.repository);
const controller = read(files.controller);

assertIncludes(
  'package.json',
  JSON.stringify(pkg.scripts || {}),
  'smoke:amazon-sp-api-oauth-callback-encrypted-token-persistence-boundary-contract',
);

for (const marker of [
  "source: 'amazon-sp-api-oauth-callback-encrypted-token-persistence-boundary-contract'",
  "step: 'Step139-C'",
  "phase: 'oauth-callback-persistence-boundary-contract-only'",
  "previousServiceOnlyWiringStep: 'Step139-A'",
  "previousServiceOnlyBranchCoverageStep: 'Step139-B'",
  "defineOAuthCallbackPersistenceBoundaryOnlyNow: true",
  "modifyControllerRuntimeNow: false",
  "wireOAuthCallbackNow: false",
  "callServicePersistenceMethodFromControllerNow: false",
  "modifyRepositoryNow: false",
  "writePrismaNow: false",
  "callAmazonNow: false",
  "persistTokenNow: false",
  "authorizationCodeRequired: true",
  "stateRequired: true",
  "sellingPartnerIdRequired: true",
  "marketplaceIdRequired: true",
  "regionRequired: true",
  "companyIdMustResolveFromTrustedState: true",
  "storeIdMustResolveFromTrustedState: true",
  "operatorConfirmationRequiredForPersistence: true",
  "stateSignatureTrusted: true",
  "stateNotExpired: true",
  "companyIdResolved: true",
  "storeIdResolved: true",
  "marketplaceIdAllowed: true",
  "regionAllowed: true",
  "companyStoreAllowlisted: true",
  "environmentAllowsPersistence: true",
  "dryRunMustBeFalseForPersistence: true",
  "operatorConfirmationPresent: true",
  "'AmazonSpApiTokenExchangeService.runTokenPersistenceE2eServiceOnlyTestDouble'",
  "'AmazonSpApiTokenPersistenceE2eRunner.runTokenPersistenceE2eTestDouble'",
  "'AmazonSpApiTokenPersistenceOrchestrator.persistTokenExchangeResultTestDouble'",
  "'AmazonSpApiCredentialRepository.upsertEncryptedCredentialTestDouble'",
  "boundaryMode: 'contract-only-no-controller-wiring-no-prisma-write'",
  "controllerWiringNow: false",
  "oauthCallbackPersistenceWiringNow: false",
  "amazonNetworkCallNow: false",
  "prismaClientWriteNow: false",
  "databaseWriteNow: false",
  "tokenPersistenceDatabaseWriteNow: false",
  "plaintextTokenDatabaseWriteNow: false",
  "rawAuthorizationCodeReturnedNow: false",
  "rawLwaResponseReturnedNow: false",
  "rawAccessTokenReturnedNow: false",
  "rawRefreshTokenReturnedNow: false",
  "controllerCallsServicePersistenceNow: false",
  "controllerImportsE2eRunnerNow: false",
  "controllerImportsRepositoryNow: false",
  "oauthCallbackPersistsTokenNow: false",
  "proposedNextStep: 'Step139-D'",
  "controllerMayEnterDryRunBoundaryOnly: true",
  "controllerMustNotPersistTokenYet: true",
  "repositoryRealWriteStillForbidden: true",
  "rawTokenMustNeverBeReturned: true",
  "nextSuggestedStep: 'Step139-D'",
]) {
  assertIncludes('contract', contract, marker);
}

for (const forbidden of [
  "modifyControllerRuntimeNow: true",
  "wireOAuthCallbackNow: true",
  "callServicePersistenceMethodFromControllerNow: true",
  "writePrismaNow: true",
  "callAmazonNow: true",
  "persistTokenNow: true",
  "controllerWiringNow: true",
  "oauthCallbackPersistenceWiringNow: true",
  "amazonNetworkCallNow: true",
  "prismaClientWriteNow: true",
  "databaseWriteNow: true",
  "tokenPersistenceDatabaseWriteNow: true",
  "plaintextTokenDatabaseWriteNow: true",
  "rawAuthorizationCodeReturnedNow: true",
  "rawLwaResponseReturnedNow: true",
  "rawAccessTokenReturnedNow: true",
  "rawRefreshTokenReturnedNow: true",
  "controllerCallsServicePersistenceNow: true",
  "controllerImportsE2eRunnerNow: true",
  "controllerImportsRepositoryNow: true",
  "oauthCallbackPersistsTokenNow: true",
]) {
  assertNotIncludes('contract', contract, forbidden);
}

assertIncludes('service', service, 'runTokenPersistenceE2eServiceOnlyTestDouble');
assertIncludes('service', service, "serviceWiringMode: 'internal-service-only-no-controller-no-oauth-callback'");
assertIncludes('service', service, 'controllerWiringNow: false');
assertIncludes('service', service, 'oauthCallbackWiringNow: false');
assertIncludes('service', service, 'amazonNetworkCallNow: false');
assertIncludes('service', service, 'prismaClientWriteNow: false');
assertIncludes('service', service, 'tokenPersistenceDatabaseWriteNow: false');
assertIncludes('service', service, 'plaintextTokenDatabaseWriteNow: false');

assertIncludes('runner', runner, 'export class AmazonSpApiTokenPersistenceE2eRunner');
assertIncludes('orchestrator', orchestrator, 'export class AmazonSpApiTokenPersistenceOrchestrator');
assertIncludes('repository', repository, 'export class AmazonSpApiCredentialRepository');
assertIncludes('repository', repository, 'upsertEncryptedCredentialTestDouble');

assertNotIncludes('controller', controller, 'runTokenPersistenceE2eServiceOnlyTestDouble');
assertNotIncludes('controller', controller, 'AmazonSpApiTokenPersistenceE2eRunner');
assertNotIncludes('controller', controller, 'AmazonSpApiTokenPersistenceOrchestrator');
assertNotIncludes('controller', controller, 'AmazonSpApiCredentialRepository');

// Controller may contain historical contract/diagnostic marker strings from earlier guarded
// handoff DTOs. Step139-C must only fail if the OAuth callback is actually wired to the
// service persistence path or explicitly marks callback persistence as active.
assertNotIncludes('controller', controller, 'controllerCallsServicePersistenceNow: true');
assertNotIncludes('controller', controller, 'oauthCallbackPersistsTokenNow: true');
assertNotIncludes('controller', controller, 'callServicePersistenceMethodFromControllerNow: true');
assertNotIncludes('controller', controller, 'oauthCallbackPersistenceWiringNow: true');

console.log('========== Step139-C OAuth callback encrypted token persistence boundary contract smoke passed ==========');
