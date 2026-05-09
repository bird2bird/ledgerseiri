const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');
const apiRoot = path.join(root, 'apps/api');

const files = {
  contract: path.join(
    apiRoot,
    'src/imports/dto/amazon-sp-api-oauth-callback-dry-run-controller-wiring-contract.dto.ts',
  ),
  packageJson: path.join(apiRoot, 'package.json'),
  step139c: path.join(
    apiRoot,
    'src/imports/dto/amazon-sp-api-oauth-callback-encrypted-token-persistence-boundary-contract.dto.ts',
  ),
  service: path.join(apiRoot, 'src/imports/amazon-sp-api-token-exchange.service.ts'),
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

console.log('========== Step139-D OAuth callback dry-run-only controller wiring contract smoke ==========');

const contract = read(files.contract);
const pkg = JSON.parse(read(files.packageJson));
const step139c = read(files.step139c);
const service = read(files.service);
const controller = read(files.controller);

assertIncludes(
  'package.json',
  JSON.stringify(pkg.scripts || {}),
  'smoke:amazon-sp-api-oauth-callback-dry-run-controller-wiring-contract',
);

for (const marker of [
  "source: 'amazon-sp-api-oauth-callback-dry-run-controller-wiring-contract'",
  "step: 'Step139-D'",
  "phase: 'oauth-callback-dry-run-controller-wiring-contract-only'",
  "previousBoundaryStep: 'Step139-C'",
  "defineControllerDryRunWiringContractOnlyNow: true",
  "modifyControllerRuntimeNow: false",
  "controllerCallsServicePersistenceNow: false",
  "oauthCallbackPersistsTokenNow: false",
  "repositoryRealWriteNow: false",
  "prismaClientWriteNow: false",
  "callAmazonNow: false",
  "route: 'GET /imports/amazon-sp-api/oauth/callback'",
  "controllerMayValidateStateNow: true",
  "controllerMayResolveCompanyStoreNow: true",
  "controllerMayReturnRedactedDryRunDiagnosticNow: true",
  "controllerMustForceDryRunNow: true",
  "controllerMustNotPersistTokenNow: true",
  "controllerMustNotReturnRawAuthorizationCodeNow: true",
  "controllerMustNotReturnRawLwaResponseNow: true",
  "controllerMustNotReturnRawAccessTokenNow: true",
  "controllerMustNotReturnRawRefreshTokenNow: true",
  "wiringMode: 'contract-only-controller-dry-run-no-persistence'",
  "oauthCallbackDryRunWiringNow: false",
  "oauthCallbackPersistenceWiringNow: false",
  "tokenPersistenceDatabaseWriteNow: false",
  "plaintextTokenDatabaseWriteNow: false",
  "databaseWriteNow: false",
  "amazonNetworkCallNow: false",
  "rawAuthorizationCodeReturnedNow: false",
  "rawLwaResponseReturnedNow: false",
  "rawAccessTokenReturnedNow: false",
  "rawRefreshTokenReturnedNow: false",
  "'ImportsController.oauthCallback validates state'",
  "'AmazonSpApiTokenExchangeService.runTokenPersistenceE2eServiceOnlyTestDouble with dryRun=true'",
  "importsControllerModifiedNow: false",
  "controllerImportsE2eRunnerNow: false",
  "controllerImportsRepositoryNow: false",
  "proposedNextStep: 'Step139-E'",
  "controllerRuntimeChangeAllowedNext: true",
  "persistenceStillForbiddenNext: true",
  "repositoryRealWriteStillForbiddenNext: true",
  "rawTokenMustNeverBeReturnedNext: true",
  "nextSuggestedStep: 'Step139-E'",
]) {
  assertIncludes('contract', contract, marker);
}

for (const forbidden of [
  "modifyControllerRuntimeNow: true",
  "controllerCallsServicePersistenceNow: true",
  "oauthCallbackPersistsTokenNow: true",
  "repositoryRealWriteNow: true",
  "prismaClientWriteNow: true",
  "callAmazonNow: true",
  "oauthCallbackDryRunWiringNow: true",
  "oauthCallbackPersistenceWiringNow: true",
  "tokenPersistenceDatabaseWriteNow: true",
  "plaintextTokenDatabaseWriteNow: true",
  "databaseWriteNow: true",
  "amazonNetworkCallNow: true",
  "rawAuthorizationCodeReturnedNow: true",
  "rawLwaResponseReturnedNow: true",
  "rawAccessTokenReturnedNow: true",
  "rawRefreshTokenReturnedNow: true",
  "importsControllerModifiedNow: true",
  "controllerImportsE2eRunnerNow: true",
  "controllerImportsRepositoryNow: true",
]) {
  assertNotIncludes('contract', contract, forbidden);
}

assertIncludes('step139c', step139c, "nextSuggestedStep: 'Step139-D'");
assertIncludes('step139c', step139c, "controllerMayEnterDryRunBoundaryOnly: true");
assertIncludes('step139c', step139c, "controllerMustNotPersistTokenYet: true");

assertIncludes('service', service, 'runTokenPersistenceE2eServiceOnlyTestDouble');
assertIncludes('service', service, "serviceWiringMode: 'internal-service-only-no-controller-no-oauth-callback'");
assertIncludes('service', service, 'controllerWiringNow: false');
assertIncludes('service', service, 'oauthCallbackWiringNow: false');

assertNotIncludes('controller', controller, 'runTokenPersistenceE2eServiceOnlyTestDouble');
assertNotIncludes('controller', controller, 'AmazonSpApiTokenPersistenceE2eRunner');
assertNotIncludes('controller', controller, 'AmazonSpApiCredentialRepository');
assertNotIncludes('controller', controller, 'controllerCallsServicePersistenceNow: true');
assertNotIncludes('controller', controller, 'oauthCallbackPersistsTokenNow: true');
assertNotIncludes('controller', controller, 'oauthCallbackPersistenceWiringNow: true');

console.log('========== Step139-D OAuth callback dry-run-only controller wiring contract smoke passed ==========');
