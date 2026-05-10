const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');
const apiRoot = path.join(root, 'apps/api');

const files = {
  packageJson: path.join(apiRoot, 'package.json'),
  contract: path.join(
    apiRoot,
    'src/imports/dto/amazon-sp-api-credential-repository-schema-alignment-contract.dto.ts',
  ),
  schema: path.join(apiRoot, 'prisma/schema.prisma'),
  repository: path.join(apiRoot, 'src/imports/amazon-sp-api-credential.repository.ts'),
  orchestrator: path.join(apiRoot, 'src/imports/amazon-sp-api-token-persistence.orchestrator.ts'),
  step139V: path.join(apiRoot, 'scripts/smoke-amazon-sp-api-oauth-callback-real-db-guarded-runtime.js'),
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

console.log('========== Step139-V2 Amazon SP-API credential repository schema-alignment contract smoke ==========');

const pkg = JSON.parse(read(files.packageJson));
const contract = read(files.contract);
const schema = read(files.schema);
const repository = read(files.repository);
const orchestrator = read(files.orchestrator);
const step139V = read(files.step139V);

assert(
  pkg.scripts &&
    pkg.scripts['smoke:amazon-sp-api-credential-repository-schema-alignment-contract'] ===
      'node scripts/smoke-amazon-sp-api-credential-repository-schema-alignment-contract.js',
  'package.json registers Step139-V2 smoke',
);

for (const marker of [
  "source: 'amazon-sp-api-credential-repository-schema-alignment-contract'",
  "step: 'Step139-V2'",
  "phase: 'repository-schema-alignment-contract-only'",
  "previousRealDbGuardedRuntimeSmokeStep: 'Step139-V'",
  "previousControllerRealWriteBranchRuntimeStep: 'Step139-U'",
  "previousControllerRealWriteImplementationStep: 'Step139-T'",
  'defineSchemaAlignmentContractOnlyNow: true',
  'modifyRepositoryRuntimeNow: false',
  'modifyOrchestratorRuntimeNow: false',
  'modifyControllerRuntimeNow: false',
  'modifyPrismaSchemaNow: false',
  'connectionModel: \'AmazonSpApiConnection\'',
  'credentialModel: \'AmazonSpApiCredential\'',
  'accessTokenCacheModel: \'AmazonSpApiAccessTokenCache\'',
  "scopeOwnerModel: 'AmazonSpApiConnection'",
  "'companyId'",
  "'storeId'",
  "'marketplaceId'",
  "'region'",
  "credentialUniqueKey: ['connectionId']",
  "accessTokenCacheUniqueKey: ['connectionId']",
  'repositoryStillUsesLegacySingleDelegateShape: true',
  "legacyDelegateMethod: 'prismaDelegate.upsert'",
  "legacyWhereKey: 'companyId_storeId_marketplaceId_region'",
  'realCredentialModelDoesNotOwnThoseFields: true',
  'step139VUsedSchemaAwareAdapterToBridgeMismatch: true',
  "proposedNewRepositoryMethod: 'upsertEncryptedCredentialSchemaAwareRealWrite'",
  'shouldUpsertConnectionFirst: true',
  'shouldUpsertCredentialByConnectionIdSecond: true',
  'shouldUpsertAccessTokenCacheByConnectionIdThird: true',
  "source: 'amazon-sp-api-credential-repository-schema-aware-real-write'",
  "repositoryMode: 'schema-aware-prisma-real-write'",
  "operation: 'upsertEncryptedCredentialSchemaAwareRealWrite'",
  'connectionWriteNow: true',
  'credentialWriteNow: true',
  'plaintextTokenDatabaseWriteNow: false',
  'rawTokenReturnedNow: false',
  'rawLwaResponseReturnedNow: false',
  'rawAuthorizationCodeReturnedNow: false',
  'controllerCallsRepositoryDirectly: false',
  "proposedNextStep: 'Step139-V3'",
  "nextSuggestedStep: 'Step139-V3'",
]) {
  assertIncludes(contract, marker, 'contract');
}

for (const smoke of [
  'smoke:amazon-sp-api-credential-repository-schema-alignment-contract',
  'smoke:amazon-sp-api-oauth-callback-real-db-guarded-runtime',
  'smoke:amazon-sp-api-oauth-callback-controller-real-write-branch-runtime',
  'smoke:amazon-sp-api-oauth-callback-controller-real-write-guarded-impl',
  'smoke:amazon-sp-api-token-persistence-orchestrator-real-write-branch-runtime',
]) {
  assertIncludes(contract, smoke, 'contract regression smoke list');
}

for (const marker of [
  'model AmazonSpApiConnection',
  'model AmazonSpApiCredential',
  'model AmazonSpApiAccessTokenCache',
  '@@unique([companyId, storeId, marketplaceId, region])',
  'connectionId          String   @unique',
  'encryptedAccessToken String',
]) {
  assertIncludes(schema, marker, 'schema');
}

for (const marker of [
  'upsertEncryptedCredentialRealWrite',
  'prismaDelegate.upsert',
  'companyId_storeId_marketplaceId_region',
]) {
  assertIncludes(repository, marker, 'current repository legacy shape');
}

if (repository.includes('upsertEncryptedCredentialSchemaAwareRealWrite')) {
  for (const marker of [
    'source: \'amazon-sp-api-credential-repository-schema-aware-real-write\'',
    'repositoryMode: \'schema-aware-prisma-real-write\'',
    'operation: \'upsertEncryptedCredentialSchemaAwareRealWrite\'',
    'amazonSpApiConnection.upsert',
    'amazonSpApiCredential.upsert',
    'amazonSpApiAccessTokenCache.upsert',
    'plaintextTokenDatabaseWriteNow: false',
    'rawTokenReturnedNow: false',
    'rawLwaResponseReturnedNow: false',
    'rawAuthorizationCodeReturnedNow: false',
  ]) {
    assertIncludes(repository, marker, 'repository schema-aware runtime');
  }
} else {
  assertNotIncludes(repository, 'upsertEncryptedCredentialSchemaAwareRealWrite', 'repository runtime unchanged');
}
assertIncludes(orchestrator, 'persistEncryptedTokensRealWrite', 'orchestrator');
assertIncludes(orchestrator, "repositoryMethodCalled: 'upsertEncryptedCredentialRealWrite'", 'orchestrator legacy repository method');

for (const marker of [
  'createSchemaAwareDelegate',
  'amazonSpApiConnection.upsert',
  'amazonSpApiCredential.upsert',
  'amazonSpApiAccessTokenCache.upsert',
  'schema-aware real DB',
]) {
  assertIncludes(step139V, marker, 'Step139-V schema-aware adapter smoke');
}

console.log('========== Step139-V2 Amazon SP-API credential repository schema-alignment contract smoke passed ==========');
