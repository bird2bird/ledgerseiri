const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');
const apiRoot = path.join(root, 'apps/api');

const files = {
  packageJson: path.join(apiRoot, 'package.json'),
  contract: path.join(
    apiRoot,
    'src/imports/dto/amazon-sp-api-token-persistence-orchestrator-schema-aware-wiring-contract.dto.ts',
  ),
  repository: path.join(apiRoot, 'src/imports/amazon-sp-api-credential.repository.ts'),
  orchestrator: path.join(apiRoot, 'src/imports/amazon-sp-api-token-persistence.orchestrator.ts'),
  schema: path.join(apiRoot, 'prisma/schema.prisma'),
  v3Smoke: path.join(apiRoot, 'scripts/smoke-amazon-sp-api-credential-repository-schema-aware-real-write-implementation.js'),
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

console.log('========== Step139-V4 token persistence orchestrator schema-aware wiring contract smoke ==========');

const pkg = JSON.parse(read(files.packageJson));
const contract = read(files.contract);
const repository = read(files.repository);
const orchestrator = read(files.orchestrator);
const schema = read(files.schema);
const v3Smoke = read(files.v3Smoke);

assert(
  pkg.scripts &&
    pkg.scripts['smoke:amazon-sp-api-token-persistence-orchestrator-schema-aware-wiring-contract'] ===
      'node scripts/smoke-amazon-sp-api-token-persistence-orchestrator-schema-aware-wiring-contract.js',
  'package.json registers Step139-V4 smoke',
);

for (const marker of [
  "source: 'amazon-sp-api-token-persistence-orchestrator-schema-aware-wiring-contract'",
  "step: 'Step139-V4'",
  "phase: 'orchestrator-schema-aware-wiring-contract-only'",
  "previousRepositorySchemaAwareImplementationStep: 'Step139-V3'",
  "previousRepositorySchemaAlignmentContractStep: 'Step139-V2'",
  "previousSchemaAwareRealDbAdapterSmokeStep: 'Step139-V'",
  "previousControllerRealWriteBranchRuntimeStep: 'Step139-U'",
  "previousControllerRealWriteImplementationStep: 'Step139-T'",
  'defineOrchestratorSchemaAwareWiringContractOnlyNow: true',
  'modifyOrchestratorRuntimeNow: false',
  'modifyRepositoryRuntimeNow: false',
  'modifyControllerRuntimeNow: false',
  'modifyPrismaSchemaNow: false',
  'repositorySchemaAwareMethodExistsNow: true',
  "repositorySchemaAwareMethodName: 'upsertEncryptedCredentialSchemaAwareRealWrite'",
  'orchestratorStillCallsLegacyRepositoryMethodNow: true',
  "legacyRepositoryMethodName: 'upsertEncryptedCredentialRealWrite'",
  "proposedNewOrchestratorMethod: 'persistEncryptedTokensSchemaAwareRealWrite'",
  'shouldPreserveExistingLegacyMethodTemporarily: true',
  'shouldCallRepositorySchemaAwareMethod: true',
  'shouldNotCallLegacyRepositoryMethodInNewPath: true',
  "source: 'amazon-sp-api-token-persistence-orchestrator-schema-aware-real-write'",
  "orchestratorMode: 'repository-schema-aware-real-write-wiring'",
  "repositoryMethodCalled: 'upsertEncryptedCredentialSchemaAwareRealWrite'",
  'connectionWriteNow',
  'credentialWriteNow',
  'accessTokenCacheWriteNow',
  'plaintextTokenDatabaseWriteNow: false',
  'amazonNetworkCallNow: false',
  'rawAccessTokenReturnedNow: false',
  'rawRefreshTokenReturnedNow: false',
  'rawAuthorizationCodeReturnedNow: false',
  'rawLwaResponseReturnedNow: false',
  'validateTransportParserPersistenceGatesBeforeRepositoryCall: true',
  'rejectWhenSchemaAwarePrismaClientMissing: true',
  'callRepositorySchemaAwareMethodOnlyWhenReady: true',
  'preserveLegacyMethodForCompatibility: true',
  "proposedNextStep: 'Step139-V5'",
  "nextSuggestedStep: 'Step139-V5'",
]) {
  assertIncludes(contract, marker, 'contract');
}

for (const smoke of [
  'smoke:amazon-sp-api-token-persistence-orchestrator-schema-aware-wiring-contract',
  'smoke:amazon-sp-api-credential-repository-schema-aware-real-write-implementation',
  'smoke:amazon-sp-api-credential-repository-schema-alignment-contract',
  'smoke:amazon-sp-api-oauth-callback-real-db-guarded-runtime',
  'smoke:amazon-sp-api-token-persistence-orchestrator-real-write-branch-runtime',
]) {
  assertIncludes(contract, smoke, 'contract regression smoke list');
}

for (const marker of [
  'upsertEncryptedCredentialSchemaAwareRealWrite',
  "source: 'amazon-sp-api-credential-repository-schema-aware-real-write'",
  "repositoryMode: 'schema-aware-prisma-real-write'",
  "operation: 'upsertEncryptedCredentialSchemaAwareRealWrite'",
  'amazonSpApiConnection.upsert',
  'amazonSpApiCredential.upsert',
  'amazonSpApiAccessTokenCache.upsert',
]) {
  assertIncludes(repository, marker, 'repository Step139-V3 runtime');
}

for (const marker of [
  'persistEncryptedTokensRealWrite',
  "repositoryMethodCalled: 'upsertEncryptedCredentialRealWrite'",
  'upsertEncryptedCredentialRealWrite',
]) {
  assertIncludes(orchestrator, marker, 'orchestrator legacy runtime');
}

assertNotIncludes(orchestrator, 'persistEncryptedTokensSchemaAwareRealWrite', 'orchestrator runtime unchanged before V5');

for (const marker of [
  'model AmazonSpApiConnection',
  'model AmazonSpApiCredential',
  'model AmazonSpApiAccessTokenCache',
  '@@unique([companyId, storeId, marketplaceId, region])',
]) {
  assertIncludes(schema, marker, 'schema');
}

assertIncludes(v3Smoke, 'Step139-V3 schema-aware repository real-write implementation smoke', 'Step139-V3 smoke');
assertIncludes(v3Smoke, 'upsertEncryptedCredentialSchemaAwareRealWrite', 'Step139-V3 smoke');

console.log('========== Step139-V4 token persistence orchestrator schema-aware wiring contract smoke passed ==========');
