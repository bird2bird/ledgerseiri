const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');
const apiRoot = path.join(root, 'apps/api');

const files = {
  contract: path.join(
    apiRoot,
    'src/imports/dto/amazon-sp-api-token-persistence-orchestration-contract.dto.ts',
  ),
  packageJson: path.join(apiRoot, 'package.json'),
  tokenService: path.join(apiRoot, 'src/imports/amazon-sp-api-token-exchange.service.ts'),
  repository: path.join(apiRoot, 'src/imports/amazon-sp-api-credential.repository.ts'),
  controller: path.join(apiRoot, 'src/imports/imports.controller.ts'),
  orchestrator: path.join(apiRoot, 'src/imports/amazon-sp-api-token-persistence.orchestrator.ts'),
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

console.log('========== Step138-A token persistence orchestration contract smoke ==========');

const contract = read(files.contract);
const pkg = JSON.parse(read(files.packageJson));
const tokenService = read(files.tokenService);
const repository = read(files.repository);
const controller = read(files.controller);
const orchestrator = read(files.orchestrator, true);

assertIncludes(
  'package.json',
  JSON.stringify(pkg.scripts || {}),
  'smoke:amazon-sp-api-token-persistence-orchestration-contract',
);

for (const marker of [
  "source: 'amazon-sp-api-token-persistence-orchestration-contract'",
  "step: 'Step138-A'",
  "phase: 'orchestration-contract-only'",
  "previousTransportCoverageStep: 'Step137-V'",
  "previousRepositoryCoverageStep: 'Step137-Z'",
  "futureOrchestratorName: 'AmazonSpApiTokenPersistenceOrchestrator'",
  "futureOrchestratorLocation:",
  "'apps/api/src/imports/amazon-sp-api-token-persistence.orchestrator.ts'",
  "defineContractOnlyNow: true",
  "createOrchestratorFileNow: false",
  "wireControllerNow: false",
  "wireOAuthCallbackNow: false",
  "callAmazonNow: false",
  "writePrismaNow: false",
  "persistTokenNow: false",
  "'executeRealLwaTokenExchangeHttpExecutableGuardedLater'",
  "'parseRealLwaHttpResponseSanitizedLater'",
  "'prepareEncryptedTokenPersistenceInputLater'",
  "'AmazonSpApiCredentialRepository.upsertEncryptedCredentialTestDouble'",
  "trustedCompanyId: true",
  "trustedStoreId: true",
  "marketplaceId: true",
  "region: true",
  "sellingPartnerId: true",
  "operatorApprovedPersistenceBoundary: true",
  "encryptedRefreshToken: true",
  "optionalEncryptedAccessTokenCache: true",
  "refreshTokenFingerprint: true",
  "encryptionKeyId: true",
  "encryptionAlgorithm: true",
  "tokenVersion: true",
  "transportMustBeServerGated: true",
  "parserMustReturnSanitizedEnvelope: true",
  "builderMustNotReturnRawTokens: true",
  "repositoryMustAcceptOnlyEncryptedPayload: true",
  "controllerMayNotBypassOrchestrator: true",
  "oauthCallbackMayNotWritePrismaDirectly: true",
  "orchestratorMayNotLogTokenMaterial: true",
  "orchestratorMayNotReturnPlaintextToken: true",
  "orchestratorMayNotReturnRawLwaResponse: true",
  "orchestratorFileCreatedNow: false",
  "serviceWiringNow: false",
  "controllerWiringNow: false",
  "oauthCallbackWiringNow: false",
  "amazonNetworkCallNow: false",
  "prismaClientWriteNow: false",
  "tokenPersistenceDatabaseWriteNow: false",
  "plaintextTokenDatabaseWriteNow: false",
  "encryptedTokenDatabaseWriteNow: false",
  "source: 'amazon-sp-api-token-persistence-orchestrator'",
  "orchestrationMode: 'test-double-no-controller-no-prisma-write'",
  "rawTokenReturnedNow: false",
  "databaseWriteNow: false",
  "'smoke:amazon-sp-api-token-persistence-orchestration-contract'",
  "'smoke:amazon-sp-api-encrypted-token-repository-branch-runtime'",
  "'smoke:amazon-sp-api-encrypted-token-repository-test-double'",
  "'smoke:amazon-sp-api-executable-lwa-http-transport-branch-runtime'",
  "'smoke:amazon-sp-api-sanitized-lwa-parser-branch-runtime'",
  "'smoke:amazon-sp-api-token-persistence-builder-branch-runtime'",
  "nextSuggestedStep: 'Step138-B'",
]) {
  assertIncludes('contract', contract, marker);
}

for (const forbidden of [
  "createOrchestratorFileNow: true",
  "wireControllerNow: true",
  "wireOAuthCallbackNow: true",
  "callAmazonNow: true",
  "writePrismaNow: true",
  "persistTokenNow: true",
  "orchestratorFileCreatedNow: true",
  "serviceWiringNow: true",
  "controllerWiringNow: true",
  "oauthCallbackWiringNow: true",
  "amazonNetworkCallNow: true",
  "prismaClientWriteNow: true",
  "tokenPersistenceDatabaseWriteNow: true",
  "plaintextTokenDatabaseWriteNow: true",
  "encryptedTokenDatabaseWriteNow: true",
  "rawTokenReturnedNow: true",
  "databaseWriteNow: true",
]) {
  assertNotIncludes('contract', contract, forbidden);
}

assertIncludes('tokenService', tokenService, 'executeRealLwaTokenExchangeHttpExecutableGuardedLater');
assertIncludes('tokenService', tokenService, 'parseRealLwaHttpResponseSanitizedLater');
assertIncludes('tokenService', tokenService, 'prepareEncryptedTokenPersistenceInputLater');

assertIncludes('repository', repository, 'export class AmazonSpApiCredentialRepository');
assertIncludes('repository', repository, 'upsertEncryptedCredentialTestDouble');
assertIncludes('repository', repository, "repositoryMode: 'test-double-no-prisma-write'");
assertIncludes('repository', repository, 'prismaClientWriteNow: false');

assert(orchestrator.length === 0, 'orchestrator implementation file is not created in Step138-A');

assertNotIncludes('tokenService', tokenService, 'AmazonSpApiTokenPersistenceOrchestrator');
assertNotIncludes('tokenService', tokenService, 'AmazonSpApiCredentialRepository');
assertNotIncludes('controller', controller, 'AmazonSpApiTokenPersistenceOrchestrator');
assertNotIncludes('controller', controller, 'AmazonSpApiCredentialRepository');
assertNotIncludes('controller', controller, 'executeRealLwaTokenExchangeHttpExecutableGuardedLater');
assertNotIncludes('controller', controller, 'prepareEncryptedTokenPersistenceInputLater');

console.log('========== Step138-A token persistence orchestration contract smoke passed ==========');
