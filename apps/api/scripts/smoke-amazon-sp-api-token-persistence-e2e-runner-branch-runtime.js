const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '../../..');
const apiRoot = path.join(root, 'apps/api');

const files = {
  runner: path.join(apiRoot, 'src/imports/amazon-sp-api-token-persistence-e2e.runner.ts'),
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

function transpile(ts, fileName, text) {
  return ts.transpileModule(text, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      experimentalDecorators: true,
      emitDecoratorMetadata: false,
      esModuleInterop: true,
    },
    fileName,
  }).outputText;
}

function loadRunnerClass() {
  const ts = require(path.join(apiRoot, 'node_modules/typescript'));

  const repositoryModule = { exports: {} };
  const repositorySandbox = {
    require,
    module: repositoryModule,
    exports: repositoryModule.exports,
    __dirname: path.dirname(files.repository),
    __filename: files.repository,
    console,
  };
  vm.runInNewContext(
    transpile(ts, files.repository, read(files.repository)),
    repositorySandbox,
    { filename: files.repository.replace(/\.ts$/, '.js') },
  );

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
  vm.runInNewContext(
    transpile(ts, files.orchestrator, read(files.orchestrator)),
    orchestratorSandbox,
    { filename: files.orchestrator.replace(/\.ts$/, '.js') },
  );

  const runnerModule = { exports: {} };
  const runnerSandbox = {
    require: (request) => {
      if (request === './amazon-sp-api-token-persistence.orchestrator') {
        return orchestratorModule.exports;
      }
      if (request === './amazon-sp-api-credential.repository') {
        return repositoryModule.exports;
      }
      return require(request);
    },
    module: runnerModule,
    exports: runnerModule.exports,
    __dirname: path.dirname(files.runner),
    __filename: files.runner,
    console,
  };
  vm.runInNewContext(
    transpile(ts, files.runner, read(files.runner)),
    runnerSandbox,
    { filename: files.runner.replace(/\.ts$/, '.js') },
  );

  return runnerModule.exports.AmazonSpApiTokenPersistenceE2eRunner;
}

function assertSafe(result, label) {
  assertEqual(result.source, 'amazon-sp-api-token-persistence-e2e-runner', `${label} source`);
  assertEqual(result.runnerMode, 'test-double-no-controller-no-prisma-write-no-amazon-call', `${label} mode`);

  for (const [key, expected] of [
    ['controllerWiringNow', false],
    ['oauthCallbackWiringNow', false],
    ['amazonNetworkCallNow', false],
    ['executableHttpClientUsedNow', false],
    ['realSpApiRequestNow', false],
    ['prismaClientWriteNow', false],
    ['databaseWriteNow', false],
    ['tokenPersistenceDatabaseWriteNow', false],
    ['plaintextTokenDatabaseWriteNow', false],
    ['rawTokenReturnedNow', false],
    ['rawLwaResponseReturnedNow', false],
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

console.log('========== Step138-F token persistence E2E runner branch runtime smoke ==========');

const runnerSource = read(files.runner);
const orchestratorSource = read(files.orchestrator);
const repositorySource = read(files.repository);
const tokenService = read(files.tokenService);
const controller = read(files.controller);
const pkg = JSON.parse(read(files.packageJson));

assert(
  JSON.stringify(pkg.scripts || {}).includes('smoke:amazon-sp-api-token-persistence-e2e-runner-branch-runtime'),
  'package.json registers Step138-F smoke',
);

for (const marker of [
  'export class AmazonSpApiTokenPersistenceE2eRunner',
  'runTokenPersistenceE2eTestDouble',
  "'activation_gate_not_accepted'",
  "'executable_transport_not_accepted'",
  "'sanitized_parser_not_accepted'",
  "'encrypted_persistence_input_not_accepted'",
  "'orchestrator_rejected'",
  "'plaintext_token_field_rejected'",
  "'raw_lwa_response_rejected'",
  "'raw_authorization_code_rejected'",
  "'raw_client_secret_rejected'",
  "runnerMode: 'test-double-no-controller-no-prisma-write-no-amazon-call'",
  'controllerWiringNow: false',
  'oauthCallbackWiringNow: false',
  'amazonNetworkCallNow: false',
  'executableHttpClientUsedNow: false',
  'realSpApiRequestNow: false',
  'prismaClientWriteNow: false',
  'databaseWriteNow: false',
  'tokenPersistenceDatabaseWriteNow: false',
  'plaintextTokenDatabaseWriteNow: false',
  'rawTokenReturnedNow: false',
  'rawLwaResponseReturnedNow: false',
]) {
  assert(runnerSource.includes(marker), `runner contains marker: ${marker}`);
}

for (const forbidden of [
  'prisma.',
  'amazonSpApiCredential.',
  'fetch(',
  'axios.',
  'http.request',
  'https.request',
  'controllerWiringNow: true',
  'oauthCallbackWiringNow: true',
  'amazonNetworkCallNow: true',
  'executableHttpClientUsedNow: true',
  'realSpApiRequestNow: true',
  'prismaClientWriteNow: true',
  'databaseWriteNow: true',
  'tokenPersistenceDatabaseWriteNow: true',
  'plaintextTokenDatabaseWriteNow: true',
  'rawTokenReturnedNow: true',
  'rawLwaResponseReturnedNow: true',
]) {
  assert(!runnerSource.includes(forbidden), `runner does not contain forbidden marker: ${forbidden}`);
}

assert(orchestratorSource.includes('export class AmazonSpApiTokenPersistenceOrchestrator'), 'orchestrator class exists');
assert(repositorySource.includes('export class AmazonSpApiCredentialRepository'), 'repository class exists');
assert(!tokenService.includes('AmazonSpApiTokenPersistenceE2eRunner'), 'token service does not wire E2E runner');
assert(!tokenService.includes('AmazonSpApiTokenPersistenceOrchestrator'), 'token service does not wire orchestrator');
assert(!controller.includes('AmazonSpApiTokenPersistenceE2eRunner'), 'controller does not wire E2E runner');
assert(!controller.includes('AmazonSpApiTokenPersistenceOrchestrator'), 'controller does not wire orchestrator');
assert(!controller.includes('AmazonSpApiCredentialRepository'), 'controller does not wire repository');

const RunnerClass = loadRunnerClass();
const runner = new RunnerClass();

const baseInput = {
  activationGateAccepted: true,
  executableTransportAccepted: true,
  sanitizedParserAccepted: true,
  encryptedPersistenceInputAccepted: true,
  companyId: 'company-123',
  storeId: 'store-456',
  marketplaceId: 'A1VC38T7YXB528',
  region: 'fe',
  sellingPartnerId: 'A_SELLING_PARTNER_ID',
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

const normalizedSuccess = runner.runTokenPersistenceE2eTestDouble({
  ...baseInput,
  companyId: '  company-123  ',
  storeId: '  store-456  ',
  marketplaceId: '  A1VC38T7YXB528  ',
  region: '  fe  ',
  sellingPartnerId: '  A_SELLING_PARTNER_ID  ',
});
assertEqual(normalizedSuccess.accepted, true, 'normalized success accepted');
assertEqual(normalizedSuccess.reason, 'ready', 'normalized success reason');
assertEqual(normalizedSuccess.companyIdPresent, true, 'normalized company present');
assertEqual(normalizedSuccess.storeIdPresent, true, 'normalized store present');
assertEqual(normalizedSuccess.marketplaceIdPresent, true, 'normalized marketplace present');
assertEqual(normalizedSuccess.regionPresent, true, 'normalized region present');
assertEqual(normalizedSuccess.sellingPartnerIdPresent, true, 'normalized selling partner present');
assertEqual(normalizedSuccess.orchestratorAccepted, true, 'normalized orchestrator accepted');
assertEqual(normalizedSuccess.repositoryAccepted, true, 'normalized repository accepted');
assertSafe(normalizedSuccess, 'normalized success');

const validSuccessCases = [
  ['active success', { status: 'active' }],
  ['needs reauth success', { status: 'needs_reauth' }],
  ['error success', { status: 'error' }],
  ['revoked success', { status: 'revoked', revokedAt: '2026-05-09T12:00:00.000Z' }],
];

for (const [label, patch] of validSuccessCases) {
  const result = runner.runTokenPersistenceE2eTestDouble({
    ...baseInput,
    ...patch,
  });

  assertEqual(result.accepted, true, `${label} accepted`);
  assertEqual(result.reason, 'ready', `${label} reason`);
  assertEqual(result.orchestratorAccepted, true, `${label} orchestrator accepted`);
  assertEqual(result.repositoryAccepted, true, `${label} repository accepted`);
  assertSafe(result, label);
}

const gateCases = [
  ['activation false', { activationGateAccepted: false }, 'activation_gate_not_accepted'],
  ['activation missing', { activationGateAccepted: undefined }, 'activation_gate_not_accepted'],
  ['transport false', { executableTransportAccepted: false }, 'executable_transport_not_accepted'],
  ['transport missing', { executableTransportAccepted: undefined }, 'executable_transport_not_accepted'],
  ['parser false', { sanitizedParserAccepted: false }, 'sanitized_parser_not_accepted'],
  ['parser missing', { sanitizedParserAccepted: undefined }, 'sanitized_parser_not_accepted'],
  ['persistence false', { encryptedPersistenceInputAccepted: false }, 'encrypted_persistence_input_not_accepted'],
  ['persistence missing', { encryptedPersistenceInputAccepted: undefined }, 'encrypted_persistence_input_not_accepted'],
];

for (const [label, patch, reason] of gateCases) {
  const result = runner.runTokenPersistenceE2eTestDouble({
    ...baseInput,
    ...patch,
  });

  assertEqual(result.accepted, false, `${label} accepted false`);
  assertEqual(result.reason, reason, `${label} reason`);
  assertEqual(result.orchestratorAccepted, false, `${label} orchestrator not reached`);
  assertEqual(result.repositoryAccepted, false, `${label} repository not reached`);
  assertSafe(result, label);
}

const rawCases = [
  ['plaintext access rejected', { plaintextAccessToken: 'PLAINTEXT_ACCESS_TOKEN' }, 'plaintext_token_field_rejected'],
  ['plaintext refresh rejected', { plaintextRefreshToken: 'PLAINTEXT_REFRESH_TOKEN' }, 'plaintext_token_field_rejected'],
  ['raw response rejected', { rawLwaResponse: 'RAW_LWA_RESPONSE' }, 'raw_lwa_response_rejected'],
  ['auth code rejected', { rawAuthorizationCode: 'AUTHORIZATION_CODE_VALUE' }, 'raw_authorization_code_rejected'],
  ['client secret rejected', { rawClientSecret: 'CLIENT_SECRET_VALUE' }, 'raw_client_secret_rejected'],
];

for (const [label, patch, reason] of rawCases) {
  const result = runner.runTokenPersistenceE2eTestDouble({
    ...baseInput,
    ...patch,
  });

  assertEqual(result.accepted, false, `${label} accepted false`);
  assertEqual(result.reason, reason, `${label} reason`);
  assertEqual(result.orchestratorAccepted, false, `${label} orchestrator not reached`);
  assertSafe(result, label);
}

const orchestratorRejectedCases = [
  ['missing company', { companyId: '' }, 'missing_company_id'],
  ['missing store', { storeId: '' }, 'missing_store_id'],
  ['missing marketplace', { marketplaceId: '' }, 'missing_marketplace_id'],
  ['missing region', { region: '' }, 'missing_region'],
  ['missing selling partner', { sellingPartnerId: '' }, 'missing_selling_partner_id'],
  ['missing encrypted refresh', { encryptedRefreshToken: '' }, 'missing_encrypted_refresh_token'],
  ['missing refresh fingerprint', { refreshTokenFingerprint: '' }, 'missing_refresh_token_fingerprint'],
  ['missing encryption key', { encryptionKeyId: '' }, 'missing_encryption_key_id'],
  ['missing encryption algorithm', { encryptionAlgorithm: '' }, 'missing_encryption_algorithm'],
  ['invalid token version zero', { tokenVersion: 0 }, 'invalid_token_version'],
  ['invalid token version negative', { tokenVersion: -1 }, 'invalid_token_version'],
  ['invalid token version non-number', { tokenVersion: '1' }, 'invalid_token_version'],
  ['invalid status null', { status: null }, 'invalid_status'],
  ['invalid status unknown', { status: 'pending' }, 'invalid_status'],
  ['repository rejected revoked without revokedAt', { status: 'revoked', revokedAt: null }, 'repository_rejected'],
];

for (const [label, patch, orchestratorReason] of orchestratorRejectedCases) {
  const result = runner.runTokenPersistenceE2eTestDouble({
    ...baseInput,
    ...patch,
  });

  assertEqual(result.accepted, false, `${label} accepted false`);
  assertEqual(result.reason, 'orchestrator_rejected', `${label} runner reason`);
  assertEqual(result.orchestratorAccepted, false, `${label} orchestrator accepted false`);
  if (orchestratorReason === 'repository_rejected') {
    assertEqual(result.orchestratorReason, 'repository_rejected', `${label} orchestrator reason`);
    assertEqual(result.repositoryReason, 'revoked_status_requires_revoked_at', `${label} repository reason`);
  } else {
    assertEqual(result.orchestratorReason, orchestratorReason, `${label} orchestrator reason`);
    assertEqual(result.repositoryAccepted, false, `${label} repository not reached`);
  }
  assertSafe(result, label);
}

console.log('========== Step138-F token persistence E2E runner branch runtime smoke passed ==========');
