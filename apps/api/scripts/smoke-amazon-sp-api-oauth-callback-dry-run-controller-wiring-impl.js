const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');
const apiRoot = path.join(root, 'apps/api');

const files = {
  packageJson: path.join(apiRoot, 'package.json'),
  controller: path.join(apiRoot, 'src/imports/imports.controller.ts'),
  service: path.join(apiRoot, 'src/imports/amazon-sp-api-token-exchange.service.ts'),
  step139d: path.join(
    apiRoot,
    'src/imports/dto/amazon-sp-api-oauth-callback-dry-run-controller-wiring-contract.dto.ts',
  ),
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

console.log('========== Step139-E OAuth callback dry-run-only controller wiring implementation smoke ==========');

const pkg = JSON.parse(read(files.packageJson));
const controller = read(files.controller);
const service = read(files.service);
const step139d = read(files.step139d);

assertIncludes(
  'package.json',
  JSON.stringify(pkg.scripts || {}),
  'smoke:amazon-sp-api-oauth-callback-dry-run-controller-wiring-impl',
);

for (const marker of [
  'Step139-E: Amazon SP-API OAuth callback dry-run-only controller wiring implementation',
  "@Get('amazon-sp-api/oauth/callback')",
  'amazonSpApiOAuthCallbackBoundary',
  "source: 'amazon-sp-api-oauth-callback-dry-run-controller-wiring'",
  "wiringMode: 'controller-dry-run-only-no-persistence'",
  'step139EDryRunControllerWiringImplementedNow: true',
  'controllerWiringNow: true',
  'oauthCallbackDryRunWiringNow: true',
  'oauthCallbackPersistenceWiringNow: false',
  'controllerCallsServicePersistenceDryRunNow: false',
  'controllerCallsServicePersistenceCommitNow: false',
  'tokenExchangeHttpCallNow: false',
  'tokenPersistenceDatabaseWriteNow: false',
  'plaintextTokenDatabaseWriteNow: false',
  'databaseWriteNow: false',
  'prismaClientWriteNow: false',
  'amazonNetworkCallNow: false',
  'realSpApiRequestNow: false',
  'rawAuthorizationCodeReturnedNow: false',
  'rawLwaResponseReturnedNow: false',
  'rawAccessTokenReturnedNow: false',
  'rawRefreshTokenReturnedNow: false',
  'exchangeAuthorizationCodeDryRunnable',
  'buildPersistencePlan',
  'runTokenPersistenceE2eServiceOnlyTestDouble',
  "'dry_run_token_persistence_ready'",
  'tokenPersistenceDryRunOnly: true',
  'persistedConnection: null',
]) {
  assertIncludes('controller', controller, marker);
}

for (const forbidden of [
  'persistEncryptedRefreshCredential',
  'persistEncryptedAccessTokenCache',
  'tokenPersistenceDatabaseWriteNow: true',
  'plaintextTokenDatabaseWriteNow: true',
  'databaseWriteNow: true',
  'prismaClientWriteNow: true',
  'amazonNetworkCallNow: true',
  'realSpApiRequestNow: true',
  'rawAuthorizationCodeReturnedNow: true',
  'rawLwaResponseReturnedNow: true',
  'rawAccessTokenReturnedNow: true',
  'rawRefreshTokenReturnedNow: true',
  'controllerCallsServicePersistenceCommitNow: true',
  'oauthCallbackPersistenceWiringNow: true',
]) {
  assertNotIncludes('controller', controller, forbidden);
}

assertNotIncludes('controller', controller, 'AmazonSpApiTokenPersistenceE2eRunner');
assertNotIncludes('controller', controller, 'AmazonSpApiCredentialRepository');

assertIncludes('service', service, 'runTokenPersistenceE2eServiceOnlyTestDouble');
assertIncludes('service', service, "serviceWiringMode: 'internal-service-only-no-controller-no-oauth-callback'");
assertIncludes('step139d', step139d, "nextSuggestedStep: 'Step139-E'");
assertIncludes('step139d', step139d, 'controllerRuntimeChangeAllowedNext: true');
assertIncludes('step139d', step139d, 'persistenceStillForbiddenNext: true');

console.log('========== Step139-E OAuth callback dry-run-only controller wiring implementation smoke passed ==========');
