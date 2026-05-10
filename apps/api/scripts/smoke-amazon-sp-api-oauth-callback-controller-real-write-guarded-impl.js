const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');
const apiRoot = path.join(root, 'apps/api');

const files = {
  packageJson: path.join(apiRoot, 'package.json'),
  controller: path.join(apiRoot, 'src/imports/imports.controller.ts'),
  module: path.join(apiRoot, 'src/imports/imports.module.ts'),
  commitGateService: path.join(apiRoot, 'src/imports/amazon-sp-api-oauth-callback-commit-gate.service.ts'),
  orchestrator: path.join(apiRoot, 'src/imports/amazon-sp-api-token-persistence.orchestrator.ts'),
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

function assertOccurrenceCount(source, needle, expected, label) {
  const actual = source.split(needle).length - 1;
  assert(
    actual === expected,
    `${label} contains ${needle} exactly ${expected} time(s), actual=${actual}`,
  );
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

console.log('========== Step139-T OAuth callback controller guarded real-write implementation smoke ==========');

const pkg = JSON.parse(read(files.packageJson));
const controller = read(files.controller);
const moduleSource = read(files.module);
const callbackSlice = sliceControllerOauthCallback(controller);
const commitGateService = read(files.commitGateService);
const orchestrator = read(files.orchestrator);

assert(
  pkg.scripts &&
    pkg.scripts['smoke:amazon-sp-api-oauth-callback-controller-real-write-guarded-impl'] ===
      'node scripts/smoke-amazon-sp-api-oauth-callback-controller-real-write-guarded-impl.js',
  'package.json registers Step139-T smoke',
);

for (const marker of [
  "import { AmazonSpApiOauthCallbackCommitGateService } from './amazon-sp-api-oauth-callback-commit-gate.service';",
  "import { AmazonSpApiTokenPersistenceOrchestrator } from './amazon-sp-api-token-persistence.orchestrator';",
  'private readonly amazonSpApiOauthCallbackCommitGateService: AmazonSpApiOauthCallbackCommitGateService',
  'private readonly amazonSpApiTokenPersistenceOrchestrator: AmazonSpApiTokenPersistenceOrchestrator',
]) {
  assertIncludes(controller, marker, 'controller');
}

for (const marker of [
  "import { AmazonSpApiOauthCallbackCommitGateService } from './amazon-sp-api-oauth-callback-commit-gate.service';",
  "import { AmazonSpApiTokenPersistenceOrchestrator } from './amazon-sp-api-token-persistence.orchestrator';",
  'AmazonSpApiOauthCallbackCommitGateService,',
  'AmazonSpApiTokenPersistenceOrchestrator,',
]) {
  assertIncludes(moduleSource, marker, 'imports.module');
}

assertOccurrenceCount(
  moduleSource,
  'AmazonSpApiOauthCallbackCommitGateService,',
  1,
  'imports.module providers',
);
assertOccurrenceCount(
  moduleSource,
  'AmazonSpApiTokenPersistenceOrchestrator,',
  1,
  'imports.module providers',
);

for (const marker of [
  'Step139-T: guarded OAuth callback controller real-write branch implementation.',
  "controller-commit-gate-to-orchestrator-real-write",
  'this.amazonSpApiOauthCallbackCommitGateService.evaluateCommitGate',
  'this.amazonSpApiTokenPersistenceOrchestrator.persistEncryptedTokensRealWrite',
  'AMAZON_SP_API_OAUTH_CALLBACK_COMMIT_ENABLED',
  'AMAZON_SP_API_OAUTH_CALLBACK_OPERATOR_CONFIRMED',
  'AMAZON_SP_API_OAUTH_CALLBACK_COMPANY_STORE_ALLOWLISTED',
  'AMAZON_SP_API_OAUTH_CALLBACK_PERSISTENCE_ENABLED',
  'AMAZON_SP_API_OAUTH_CALLBACK_TRUSTED_STATE_SIGNATURE_VALID',
  'AMAZON_SP_API_OAUTH_CALLBACK_REAL_LWA_GATE_ACCEPTED',
  'AMAZON_SP_API_OAUTH_CALLBACK_USE_MOCKED_PRISMA_DELEGATE',
  'controllerCallsRepositoryDirectlyNow: false',
  'oauthCallbackPersistenceWiringNow: true',
  'controllerCallsServicePersistenceCommitNow: true',
  'rawAuthorizationCodeReturnedNow: false',
  'rawLwaResponseReturnedNow: false',
  'rawAccessTokenReturnedNow: false',
  'rawRefreshTokenReturnedNow: false',
  'plaintextTokenDatabaseWriteNow: false',
  'amazonNetworkCallNow: false',
  'realSpApiRequestNow: false',
]) {
  assertIncludes(callbackSlice, marker, 'controller OAuth callback');
}

for (const forbidden of [
  'AmazonSpApiCredentialRepository',
  'new PrismaClient',
  'prisma.',
  'rawAuthorizationCodeReturnedNow: true',
  'rawLwaResponseReturnedNow: true',
  'rawAccessTokenReturnedNow: true',
  'rawRefreshTokenReturnedNow: true',
  'plaintextTokenDatabaseWriteNow: true',
  'controllerCallsRepositoryDirectlyNow: true',
]) {
  assertNotIncludes(callbackSlice, forbidden, 'controller OAuth callback forbidden');
}

assertIncludes(callbackSlice, 'controller-dry-run-only-no-persistence', 'controller OAuth callback default dry-run preserved');
assertIncludes(callbackSlice, 'oauthCallbackDryRunWiringNow: true', 'controller OAuth callback default dry-run preserved');
assertIncludes(callbackSlice, 'tokenPersistenceDatabaseWriteNow: false', 'controller OAuth callback default dry-run preserved');
assertIncludes(callbackSlice, 'databaseWriteNow: false', 'controller OAuth callback default dry-run preserved');
assertIncludes(callbackSlice, 'prismaClientWriteNow: false', 'controller OAuth callback default dry-run preserved');

assertIncludes(commitGateService, 'export class AmazonSpApiOauthCallbackCommitGateService', 'commit gate service');
assertIncludes(commitGateService, 'evaluateCommitGate(', 'commit gate service');
assertIncludes(orchestrator, 'persistEncryptedTokensRealWrite', 'orchestrator');

console.log('========== Step139-T OAuth callback controller guarded real-write implementation smoke passed ==========');
