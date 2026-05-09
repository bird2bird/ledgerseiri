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

console.log('========== Step138-C token persistence orchestrator branch runtime smoke ==========');

const orchestratorSource = read(files.orchestrator);
const repositorySource = read(files.repository);
const tokenService = read(files.tokenService);
const controller = read(files.controller);
const pkg = JSON.parse(read(files.packageJson));

assert(
  JSON.stringify(pkg.scripts || {}).includes('smoke:amazon-sp-api-token-persistence-orchestrator-branch-runtime'),
  'package.json registers Step138-C smoke',
);

for (const marker of [
  'export class AmazonSpApiTokenPersistenceOrchestrator',
  'persistTokenExchangeResultTestDouble',
  "'transport_not_accepted'",
  "'parser_not_accepted'",
  "'persistence_input_not_accepted'",
  "'repository_rejected'",
  "'missing_company_id'",
  "'missing_store_id'",
  "'missing_marketplace_id'",
  "'missing_region'",
  "'missing_selling_partner_id'",
  "'missing_encrypted_refresh_token'",
  "'missing_refresh_token_fingerprint'",
  "'missing_encryption_key_id'",
  "'missing_encryption_algorithm'",
  "'invalid_token_version'",
  "'invalid_status'",
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

const normalizedSuccess = orchestrator.persistTokenExchangeResultTestDouble({
  ...baseInput,
  companyId: '  company-123  ',
  storeId: '  store-456  ',
  marketplaceId: '  A1VC38T7YXB528  ',
  region: '  fe  ',
  sellingPartnerId: '  A_SELLING_PARTNER_ID  ',
  encryptedRefreshToken: '  encrypted-refresh-token  ',
  refreshTokenFingerprint: '  refresh-fingerprint  ',
  encryptionKeyId: '  kms-key-id  ',
  encryptionAlgorithm: '  test-double-envelope-v1  ',
  encryptedAccessTokenCache: '',
  accessTokenFingerprint: '',
  tokenVersion: 2.9,
});

assertEqual(normalizedSuccess.accepted, true, 'normalized success accepted');
assertEqual(normalizedSuccess.reason, 'ready', 'normalized success reason');
assertEqual(normalizedSuccess.repositoryAccepted, true, 'normalized repository accepted');
assertEqual(normalizedSuccess.repositoryReason, 'ready', 'normalized repository reason');
assertEqual(normalizedSuccess.tokenVersion, 2, 'normalized token version floored');
assertSafe(normalizedSuccess, 'normalized success');

const validStatuses = ['active', 'needs_reauth', 'error'];
for (const status of validStatuses) {
  const result = orchestrator.persistTokenExchangeResultTestDouble({
    ...baseInput,
    status,
  });
  assertEqual(result.accepted, true, `${status} accepted`);
  assertEqual(result.reason, 'ready', `${status} reason`);
  assertEqual(result.status, status, `${status} status`);
  assertEqual(result.repositoryAccepted, true, `${status} repository accepted`);
  assertSafe(result, `${status} status`);
}

const revokedSuccess = orchestrator.persistTokenExchangeResultTestDouble({
  ...baseInput,
  status: 'revoked',
  revokedAt: '2026-05-09T12:00:00.000Z',
});
assertEqual(revokedSuccess.accepted, true, 'revoked success accepted');
assertEqual(revokedSuccess.status, 'revoked', 'revoked success status');
assertEqual(revokedSuccess.repositoryAccepted, true, 'revoked repository accepted');
assertSafe(revokedSuccess, 'revoked success');

const earlyGateCases = [
  ['transport false', { transportAccepted: false }, 'transport_not_accepted'],
  ['transport missing', { transportAccepted: undefined }, 'transport_not_accepted'],
  ['parser false', { parserAccepted: false }, 'parser_not_accepted'],
  ['parser missing', { parserAccepted: undefined }, 'parser_not_accepted'],
  ['persistence input false', { persistenceInputAccepted: false }, 'persistence_input_not_accepted'],
  ['persistence input missing', { persistenceInputAccepted: undefined }, 'persistence_input_not_accepted'],
];

for (const [label, patch, reason] of earlyGateCases) {
  const result = orchestrator.persistTokenExchangeResultTestDouble({
    ...baseInput,
    ...patch,
  });
  assertEqual(result.accepted, false, `${label} accepted false`);
  assertEqual(result.reason, reason, `${label} reason`);
  assertEqual(result.repositoryAccepted, false, `${label} repository not reached`);
  assertSafe(result, label);
}

const rawFieldCases = [
  ['plaintext access rejected', { plaintextAccessToken: 'PLAINTEXT_ACCESS_TOKEN' }, 'plaintext_token_field_rejected'],
  ['plaintext refresh rejected', { plaintextRefreshToken: 'PLAINTEXT_REFRESH_TOKEN' }, 'plaintext_token_field_rejected'],
  ['raw response rejected', { rawLwaResponse: 'RAW_LWA_RESPONSE' }, 'raw_lwa_response_rejected'],
  ['auth code rejected', { rawAuthorizationCode: 'AUTHORIZATION_CODE_VALUE' }, 'raw_authorization_code_rejected'],
  ['client secret rejected', { rawClientSecret: 'CLIENT_SECRET_VALUE' }, 'raw_client_secret_rejected'],
];

for (const [label, patch, reason] of rawFieldCases) {
  const result = orchestrator.persistTokenExchangeResultTestDouble({
    ...baseInput,
    ...patch,
  });
  assertEqual(result.accepted, false, `${label} accepted false`);
  assertEqual(result.reason, reason, `${label} reason`);
  assertEqual(result.repositoryAccepted, false, `${label} repository not reached`);
  assertSafe(result, label);
}

const validationCases = [
  ['missing company whitespace', { companyId: '   ' }, 'missing_company_id'],
  ['missing store whitespace', { storeId: '   ' }, 'missing_store_id'],
  ['missing marketplace whitespace', { marketplaceId: '   ' }, 'missing_marketplace_id'],
  ['missing region whitespace', { region: '   ' }, 'missing_region'],
  ['missing selling partner whitespace', { sellingPartnerId: '   ' }, 'missing_selling_partner_id'],
  ['missing encrypted refresh whitespace', { encryptedRefreshToken: '   ' }, 'missing_encrypted_refresh_token'],
  ['missing refresh fingerprint whitespace', { refreshTokenFingerprint: '   ' }, 'missing_refresh_token_fingerprint'],
  ['missing encryption key whitespace', { encryptionKeyId: '   ' }, 'missing_encryption_key_id'],
  ['missing encryption algorithm whitespace', { encryptionAlgorithm: '   ' }, 'missing_encryption_algorithm'],
  ['invalid token version zero', { tokenVersion: 0 }, 'invalid_token_version'],
  ['invalid token version negative', { tokenVersion: -1 }, 'invalid_token_version'],
  ['invalid token version non-number', { tokenVersion: '1' }, 'invalid_token_version'],
  ['invalid status null', { status: null }, 'invalid_status'],
  ['invalid status unknown', { status: 'pending' }, 'invalid_status'],
];

for (const [label, patch, reason] of validationCases) {
  const result = orchestrator.persistTokenExchangeResultTestDouble({
    ...baseInput,
    ...patch,
  });
  assertEqual(result.accepted, false, `${label} accepted false`);
  assertEqual(result.reason, reason, `${label} reason`);
  assertEqual(result.repositoryAccepted, false, `${label} repository not reached`);
  assertSafe(result, label);
}

const repositoryRejected = orchestrator.persistTokenExchangeResultTestDouble({
  ...baseInput,
  status: 'revoked',
  revokedAt: null,
});
assertEqual(repositoryRejected.accepted, false, 'repository rejected accepted false');
assertEqual(repositoryRejected.reason, 'repository_rejected', 'repository rejected reason');
assertEqual(repositoryRejected.repositoryAccepted, false, 'repository rejected repository accepted false');
assertEqual(repositoryRejected.repositoryReason, 'revoked_status_requires_revoked_at', 'repository rejected reason detail');
assertSafe(repositoryRejected, 'repository rejected');

console.log('========== Step138-C token persistence orchestrator branch runtime smoke passed ==========');
