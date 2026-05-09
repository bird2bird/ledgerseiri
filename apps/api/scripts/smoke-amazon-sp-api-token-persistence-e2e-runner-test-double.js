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
  e2eHandoffContract: path.join(
    apiRoot,
    'src/imports/dto/amazon-sp-api-token-persistence-e2e-handoff-contract.dto.ts',
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

console.log('========== Step138-E token persistence E2E runner test-double smoke ==========');

const runnerSource = read(files.runner);
const orchestratorSource = read(files.orchestrator);
const repositorySource = read(files.repository);
const tokenService = read(files.tokenService);
const controller = read(files.controller);
const pkg = JSON.parse(read(files.packageJson));
const e2eHandoffContract = read(files.e2eHandoffContract);

assert(
  JSON.stringify(pkg.scripts || {}).includes('smoke:amazon-sp-api-token-persistence-e2e-runner-test-double'),
  'package.json registers Step138-E smoke',
);

for (const marker of [
  'export class AmazonSpApiTokenPersistenceE2eRunner',
  'runTokenPersistenceE2eTestDouble',
  "source: 'amazon-sp-api-token-persistence-e2e-runner'",
  "runnerMode: 'test-double-no-controller-no-prisma-write-no-amazon-call'",
  "'activation_gate_not_accepted'",
  "'executable_transport_not_accepted'",
  "'sanitized_parser_not_accepted'",
  "'encrypted_persistence_input_not_accepted'",
  "'orchestrator_rejected'",
  "'plaintext_token_field_rejected'",
  "'raw_lwa_response_rejected'",
  "'raw_authorization_code_rejected'",
  "'raw_client_secret_rejected'",
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
assert(orchestratorSource.includes('persistTokenExchangeResultTestDouble'), 'orchestrator test-double method exists');
assert(repositorySource.includes('export class AmazonSpApiCredentialRepository'), 'repository class exists');
assert(repositorySource.includes('upsertEncryptedCredentialTestDouble'), 'repository test-double method exists');
assert(e2eHandoffContract.includes("nextSuggestedStep: 'Step138-E'"), 'E2E handoff contract points to Step138-E');

assert(tokenService.includes('AmazonSpApiTokenPersistenceE2eRunner'), 'token service wires E2E runner only in Step139-A service-only method');
assert(tokenService.includes('runTokenPersistenceE2eServiceOnlyTestDouble'), 'token service exposes Step139-A service-only E2E runner method');
assert(tokenService.includes("serviceWiringMode: 'internal-service-only-no-controller-no-oauth-callback'"), 'token service marks service-only wiring mode');
assert(tokenService.includes('controllerWiringNow: false'), 'token service keeps controller wiring disabled');
assert(tokenService.includes('oauthCallbackWiringNow: false'), 'token service keeps OAuth callback wiring disabled');
assert(tokenService.includes('amazonNetworkCallNow: false'), 'token service keeps Amazon network disabled');
assert(tokenService.includes('prismaClientWriteNow: false'), 'token service keeps Prisma write disabled');
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

const success = runner.runTokenPersistenceE2eTestDouble(baseInput);
assertEqual(success.accepted, true, 'success accepted');
assertEqual(success.reason, 'ready', 'success reason');
assertEqual(success.activationGateAccepted, true, 'success activation accepted');
assertEqual(success.executableTransportAccepted, true, 'success transport accepted');
assertEqual(success.sanitizedParserAccepted, true, 'success parser accepted');
assertEqual(success.encryptedPersistenceInputAccepted, true, 'success persistence input accepted');
assertEqual(success.orchestratorAccepted, true, 'success orchestrator accepted');
assertEqual(success.repositoryAccepted, true, 'success repository accepted');
assertEqual(success.orchestratorReason, 'ready', 'success orchestrator reason');
assertEqual(success.repositoryReason, 'ready', 'success repository reason');
assertSafe(success, 'success');

const gateCases = [
  ['activation blocked', { activationGateAccepted: false }, 'activation_gate_not_accepted'],
  ['transport blocked', { executableTransportAccepted: false }, 'executable_transport_not_accepted'],
  ['parser blocked', { sanitizedParserAccepted: false }, 'sanitized_parser_not_accepted'],
  ['persistence input blocked', { encryptedPersistenceInputAccepted: false }, 'encrypted_persistence_input_not_accepted'],
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

const orchestratorRejected = runner.runTokenPersistenceE2eTestDouble({
  ...baseInput,
  companyId: '',
});
assertEqual(orchestratorRejected.accepted, false, 'orchestrator rejected accepted false');
assertEqual(orchestratorRejected.reason, 'orchestrator_rejected', 'orchestrator rejected reason');
assertEqual(orchestratorRejected.orchestratorAccepted, false, 'orchestrator rejected orchestrator false');
assertEqual(orchestratorRejected.repositoryAccepted, false, 'orchestrator rejected repository false');
assertEqual(orchestratorRejected.orchestratorReason, 'missing_company_id', 'orchestrator rejected detail');
assertSafe(orchestratorRejected, 'orchestrator rejected');

console.log('========== Step138-E token persistence E2E runner test-double smoke passed ==========');
