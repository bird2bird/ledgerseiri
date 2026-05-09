const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '../../..');
const apiRoot = path.join(root, 'apps/api');

const files = {
  orchestrator: path.join(apiRoot, 'src/imports/amazon-sp-api-token-persistence.orchestrator.ts'),
  repository: path.join(apiRoot, 'src/imports/amazon-sp-api-credential.repository.ts'),
  tokenService: path.join(apiRoot, 'src/imports/amazon-sp-api-token-exchange.service.ts'),
  controller: path.join(apiRoot, 'src/imports/imports.controller.ts'),
  packageJson: path.join(apiRoot, 'package.json'),
  orchestrationContract: path.join(
    apiRoot,
    'src/imports/dto/amazon-sp-api-token-persistence-orchestration-contract.dto.ts',
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

function assertEqual(actual, expected, message) {
  assert(
    actual === expected,
    `${message}: expected=${JSON.stringify(expected)} actual=${JSON.stringify(actual)}`,
  );
}

function loadOrchestratorClass() {
  const ts = require(path.join(apiRoot, 'node_modules/typescript'));
  const source = read(files.orchestrator);
  const repositorySource = read(files.repository);

  const transpile = (fileName, text) =>
    ts.transpileModule(text, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        experimentalDecorators: true,
        emitDecoratorMetadata: false,
        esModuleInterop: true,
      },
      fileName,
    }).outputText;

  const repositoryModule = { exports: {} };
  const repositorySandbox = {
    require,
    module: repositoryModule,
    exports: repositoryModule.exports,
    __dirname: path.dirname(files.repository),
    __filename: files.repository,
    console,
  };

  vm.runInNewContext(transpile(files.repository, repositorySource), repositorySandbox, {
    filename: files.repository.replace(/\.ts$/, '.js'),
  });

  const orchestratorModule = { exports: {} };
  const orchestratorSandbox = {
    require: (request) => {
      if (request === './amazon-sp-api-credential.repository') {
        return repositoryModule.exports;
      }
      return require(request);
    },
    module: orchestratorModule,
    exports: orchestratorModule.exports,
    __dirname: path.dirname(files.orchestrator),
    __filename: files.orchestrator,
    console,
  };

  vm.runInNewContext(transpile(files.orchestrator, source), orchestratorSandbox, {
    filename: files.orchestrator.replace(/\.ts$/, '.js'),
  });

  return orchestratorModule.exports.AmazonSpApiTokenPersistenceOrchestrator;
}

function assertSafe(result, label) {
  assertEqual(result.source, 'amazon-sp-api-token-persistence-orchestrator', `${label} source`);
  assertEqual(result.orchestrationMode, 'test-double-no-controller-no-prisma-write', `${label} mode`);

  for (const [key, expected] of [
    ['rawTokenReturnedNow', false],
    ['rawLwaResponseReturnedNow', false],
    ['controllerWiringNow', false],
    ['oauthCallbackWiringNow', false],
    ['amazonNetworkCallNow', false],
    ['prismaClientWriteNow', false],
    ['databaseWriteNow', false],
    ['tokenPersistenceDatabaseWriteNow', false],
    ['plaintextTokenDatabaseWriteNow', false],
  ]) {
    assertEqual(result[key], expected, `${label} ${key}`);
  }

  const serialized = JSON.stringify(result);
  for (const secret of [
    'PLAINTEXT_ACCESS_TOKEN',
    'PLAINTEXT_REFRESH_TOKEN',
    'RAW_LWA_RESPONSE',
    'AUTHORIZATION_CODE_VALUE',
    'CLIENT_SECRET_VALUE',
  ]) {
    assert(!serialized.includes(secret), `${label} does not expose ${secret}`);
  }
}

console.log('========== Step138-B token persistence orchestrator test-double smoke ==========');

const orchestratorSource = read(files.orchestrator);
const repositorySource = read(files.repository);
const tokenService = read(files.tokenService);
const controller = read(files.controller);
const pkg = JSON.parse(read(files.packageJson));
const orchestrationContract = read(files.orchestrationContract);

assert(
  JSON.stringify(pkg.scripts || {}).includes('smoke:amazon-sp-api-token-persistence-orchestrator-test-double'),
  'package.json registers Step138-B smoke',
);

for (const marker of [
  'export class AmazonSpApiTokenPersistenceOrchestrator',
  'persistTokenExchangeResultTestDouble',
  "source: 'amazon-sp-api-token-persistence-orchestrator'",
  "orchestrationMode: 'test-double-no-controller-no-prisma-write'",
  "'transport_not_accepted'",
  "'parser_not_accepted'",
  "'persistence_input_not_accepted'",
  "'repository_rejected'",
  "'plaintext_token_field_rejected'",
  "'raw_lwa_response_rejected'",
  "'raw_authorization_code_rejected'",
  "'raw_client_secret_rejected'",
  'rawTokenReturnedNow: false',
  'rawLwaResponseReturnedNow: false',
  'controllerWiringNow: false',
  'oauthCallbackWiringNow: false',
  'amazonNetworkCallNow: false',
  'prismaClientWriteNow: false',
  'databaseWriteNow: false',
  'tokenPersistenceDatabaseWriteNow: false',
  'plaintextTokenDatabaseWriteNow: false',
]) {
  assert(orchestratorSource.includes(marker), `orchestrator contains marker: ${marker}`);
}

for (const forbidden of [
  'prisma.',
  'amazonSpApiCredential.',
  'fetch(',
  'axios.',
  'http.request',
  'https.request',
  'rawTokenReturnedNow: true',
  'rawLwaResponseReturnedNow: true',
  'controllerWiringNow: true',
  'oauthCallbackWiringNow: true',
  'amazonNetworkCallNow: true',
  'prismaClientWriteNow: true',
  'databaseWriteNow: true',
  'tokenPersistenceDatabaseWriteNow: true',
  'plaintextTokenDatabaseWriteNow: true',
]) {
  assert(!orchestratorSource.includes(forbidden), `orchestrator does not contain forbidden marker: ${forbidden}`);
}

assert(repositorySource.includes('export class AmazonSpApiCredentialRepository'), 'repository class exists');
assert(repositorySource.includes('upsertEncryptedCredentialTestDouble'), 'repository test-double method exists');
assert(orchestrationContract.includes("nextSuggestedStep: 'Step138-B'"), 'orchestration contract points to Step138-B');

assert(!tokenService.includes('AmazonSpApiTokenPersistenceOrchestrator'), 'token service does not wire orchestrator');
assert(!tokenService.includes('AmazonSpApiCredentialRepository'), 'token service does not wire repository');
assert(!controller.includes('AmazonSpApiTokenPersistenceOrchestrator'), 'controller does not wire orchestrator');
assert(!controller.includes('AmazonSpApiCredentialRepository'), 'controller does not wire repository');

const OrchestratorClass = loadOrchestratorClass();
const orchestrator = new OrchestratorClass();

const baseInput = {
  companyId: 'company-123',
  storeId: 'store-456',
  marketplaceId: 'A1VC38T7YXB528',
  region: 'fe',
  sellingPartnerId: 'A_SELLING_PARTNER_ID',
  transportAccepted: true,
  parserAccepted: true,
  persistenceInputAccepted: true,
  encryptedRefreshToken: 'encrypted-refresh-token',
  encryptedAccessTokenCache: 'encrypted-access-token-cache',
  accessTokenExpiresAt: '2026-05-09T12:00:00.000Z',
  refreshTokenFingerprint: 'refresh-fingerprint',
  accessTokenFingerprint: 'access-fingerprint',
  encryptionKeyId: 'kms-key-id',
  encryptionAlgorithm: 'test-double-envelope-v1',
  tokenVersion: 1,
  status: 'active',
  lastValidatedAt: '2026-05-09T12:00:00.000Z',
};

const success = orchestrator.persistTokenExchangeResultTestDouble(baseInput);
assertEqual(success.accepted, true, 'success accepted');
assertEqual(success.reason, 'ready', 'success reason');
assertEqual(success.transportAccepted, true, 'success transport accepted');
assertEqual(success.parserAccepted, true, 'success parser accepted');
assertEqual(success.persistenceInputAccepted, true, 'success input accepted');
assertEqual(success.repositoryAccepted, true, 'success repository accepted');
assertEqual(success.repositoryReason, 'ready', 'success repository reason');
assertEqual(success.companyIdPresent, true, 'success company present');
assertEqual(success.storeIdPresent, true, 'success store present');
assertSafe(success, 'success');

const failureCases = [
  ['transport blocked', { transportAccepted: false }, 'transport_not_accepted'],
  ['parser blocked', { parserAccepted: false }, 'parser_not_accepted'],
  ['input blocked', { persistenceInputAccepted: false }, 'persistence_input_not_accepted'],
  ['plaintext access rejected', { plaintextAccessToken: 'PLAINTEXT_ACCESS_TOKEN' }, 'plaintext_token_field_rejected'],
  ['plaintext refresh rejected', { plaintextRefreshToken: 'PLAINTEXT_REFRESH_TOKEN' }, 'plaintext_token_field_rejected'],
  ['raw lwa response rejected', { rawLwaResponse: 'RAW_LWA_RESPONSE' }, 'raw_lwa_response_rejected'],
  ['raw auth code rejected', { rawAuthorizationCode: 'AUTHORIZATION_CODE_VALUE' }, 'raw_authorization_code_rejected'],
  ['raw client secret rejected', { rawClientSecret: 'CLIENT_SECRET_VALUE' }, 'raw_client_secret_rejected'],
  ['missing company', { companyId: '' }, 'missing_company_id'],
  ['missing store', { storeId: '' }, 'missing_store_id'],
  ['missing marketplace', { marketplaceId: '' }, 'missing_marketplace_id'],
  ['missing region', { region: '' }, 'missing_region'],
  ['missing selling partner', { sellingPartnerId: '' }, 'missing_selling_partner_id'],
  ['missing encrypted refresh', { encryptedRefreshToken: '' }, 'missing_encrypted_refresh_token'],
  ['missing refresh fingerprint', { refreshTokenFingerprint: '' }, 'missing_refresh_token_fingerprint'],
  ['missing encryption key', { encryptionKeyId: '' }, 'missing_encryption_key_id'],
  ['missing encryption algorithm', { encryptionAlgorithm: '' }, 'missing_encryption_algorithm'],
  ['invalid token version', { tokenVersion: 0 }, 'invalid_token_version'],
  ['invalid status', { status: 'pending' }, 'invalid_status'],
  ['repository rejected revoked without revokedAt', { status: 'revoked', revokedAt: null }, 'repository_rejected'],
];

for (const [label, patch, reason] of failureCases) {
  const result = orchestrator.persistTokenExchangeResultTestDouble({
    ...baseInput,
    ...patch,
  });

  assertEqual(result.accepted, false, `${label} accepted false`);
  assertEqual(result.reason, reason, `${label} reason`);
  if (reason === 'repository_rejected') {
    assertEqual(result.repositoryAccepted, false, `${label} repository accepted false`);
    assertEqual(result.repositoryReason, 'revoked_status_requires_revoked_at', `${label} repository reason`);
  }
  assertSafe(result, label);
}

console.log('========== Step138-B token persistence orchestrator test-double smoke passed ==========');
