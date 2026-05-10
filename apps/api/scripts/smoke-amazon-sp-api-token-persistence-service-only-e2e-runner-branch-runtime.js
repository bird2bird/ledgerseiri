const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '../../..');
const apiRoot = path.join(root, 'apps/api');

const files = {
  service: path.join(apiRoot, 'src/imports/amazon-sp-api-token-exchange.service.ts'),
  runner: path.join(apiRoot, 'src/imports/amazon-sp-api-token-persistence-e2e.runner.ts'),
  orchestrator: path.join(apiRoot, 'src/imports/amazon-sp-api-token-persistence.orchestrator.ts'),
  repository: path.join(apiRoot, 'src/imports/amazon-sp-api-credential.repository.ts'),
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

function loadServiceClass() {
  const ts = require(path.join(apiRoot, 'node_modules/typescript'));

  const repositoryModule = { exports: {} };
  vm.runInNewContext(
    transpile(ts, files.repository, read(files.repository)),
    {
      require,
      module: repositoryModule,
      exports: repositoryModule.exports,
      __dirname: path.dirname(files.repository),
      __filename: files.repository,
      console,
    },
    { filename: files.repository.replace(/\.ts$/, '.js') },
  );

  const orchestratorModule = { exports: {} };
  vm.runInNewContext(
    transpile(ts, files.orchestrator, read(files.orchestrator)),
    {
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
    },
    { filename: files.orchestrator.replace(/\.ts$/, '.js') },
  );

  const runnerModule = { exports: {} };
  vm.runInNewContext(
    transpile(ts, files.runner, read(files.runner)),
    {
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
    },
    { filename: files.runner.replace(/\.ts$/, '.js') },
  );

  const serviceModule = { exports: {} };
  vm.runInNewContext(
    transpile(ts, files.service, read(files.service)),
    {
      require: (request) => {
        if (request === './amazon-sp-api-token-persistence-e2e.runner') {
          return runnerModule.exports;
        }
        if (request === './amazon-sp-api-token-persistence.orchestrator') {
          return orchestratorModule.exports;
        }
        if (request === './amazon-sp-api-credential.repository') {
          return repositoryModule.exports;
        }
        try {
          return require(request);
        } catch (error) {
          return {};
        }
      },
      module: serviceModule,
      exports: serviceModule.exports,
      __dirname: path.dirname(files.service),
      __filename: files.service,
      console,
    },
    { filename: files.service.replace(/\.ts$/, '.js') },
  );

  return serviceModule.exports.AmazonSpApiTokenExchangeService;
}

function assertSafe(result, label) {
  assertEqual(result.serviceSource, 'amazon-sp-api-token-exchange-service-e2e-runner-wiring-test-double', `${label} service source`);
  assertEqual(result.serviceWiringMode, 'internal-service-only-no-controller-no-oauth-callback', `${label} service wiring mode`);
  assertEqual(result.tokenExchangeServiceWiringNow, true, `${label} service wiring enabled`);
  assertEqual(result.controllerWiringNow, false, `${label} controller wiring false`);
  assertEqual(result.oauthCallbackWiringNow, false, `${label} oauth callback wiring false`);
  assertEqual(result.amazonNetworkCallNow, false, `${label} amazon network false`);
  assertEqual(result.prismaClientWriteNow, false, `${label} prisma false`);
  assertEqual(result.databaseWriteNow, false, `${label} database false`);
  assertEqual(result.tokenPersistenceDatabaseWriteNow, false, `${label} token persistence db false`);
  assertEqual(result.plaintextTokenDatabaseWriteNow, false, `${label} plaintext db false`);

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

console.log('========== Step139-B service-only E2E runner wiring branch runtime smoke ==========');

const serviceSource = read(files.service);
const runnerSource = read(files.runner);
const orchestratorSource = read(files.orchestrator);
const repositorySource = read(files.repository);
const controller = read(files.controller);
const pkg = JSON.parse(read(files.packageJson));

assert(
  JSON.stringify(pkg.scripts || {}).includes('smoke:amazon-sp-api-token-persistence-service-only-e2e-runner-branch-runtime'),
  'package.json registers Step139-B smoke',
);

for (const marker of [
  'AmazonSpApiTokenPersistenceE2eRunner',
  'AmazonSpApiTokenPersistenceE2eRunnerInput',
  'AmazonSpApiTokenPersistenceE2eRunnerResult',
  'runTokenPersistenceE2eServiceOnlyTestDouble',
  "serviceSource: 'amazon-sp-api-token-exchange-service-e2e-runner-wiring-test-double'",
  "serviceWiringMode: 'internal-service-only-no-controller-no-oauth-callback'",
  'tokenExchangeServiceWiringNow: true',
  'controllerWiringNow: false',
  'oauthCallbackWiringNow: false',
  'amazonNetworkCallNow: false',
  'prismaClientWriteNow: false',
  'databaseWriteNow: false',
  'tokenPersistenceDatabaseWriteNow: false',
  'plaintextTokenDatabaseWriteNow: false',
]) {
  assert(serviceSource.includes(marker), `service contains marker: ${marker}`);
}

for (const forbidden of [
  'controllerWiringNow: true',
  'oauthCallbackWiringNow: true',
  'amazonNetworkCallNow: true',
  'prismaClientWriteNow: true',
  'databaseWriteNow: true',
  'tokenPersistenceDatabaseWriteNow: true',
  'plaintextTokenDatabaseWriteNow: true',
  'rawTokenReturnedNow: true',
  'rawLwaResponseReturnedNow: true',
]) {
  assert(!serviceSource.includes(forbidden), `service does not contain forbidden marker: ${forbidden}`);
}

// Step139-E allows controller to call the service-only E2E method, but only through
// a dry-run-only OAuth callback boundary. Direct runner/orchestrator/repository wiring
// and persistence/DB writes remain forbidden.
assert(controller.includes('runTokenPersistenceE2eServiceOnlyTestDouble'), 'controller may call service-only E2E method after Step139-E dry-run wiring');
assert(controller.includes("wiringMode: 'controller-dry-run-only-no-persistence'"), 'controller remains dry-run-only after Step139-E');
assert(controller.includes('controllerCallsServicePersistenceDryRunNow: true'), 'controller marks dry-run service call only');
assert(controller.includes('oauthCallbackPersistenceWiringNow: false'), 'controller keeps persistence wiring disabled');
assert(controller.includes('tokenPersistenceDatabaseWriteNow: false'), 'controller keeps token persistence DB write disabled');

for (const forbidden of [
  'AmazonSpApiTokenPersistenceE2eRunner',
  'AmazonSpApiTokenPersistenceOrchestrator',
  'AmazonSpApiCredentialRepository',
  'controllerCallsServicePersistenceCommitNow: true',
  'oauthCallbackPersistenceWiringNow: true',
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
  'persistEncryptedRefreshCredential',
  'persistEncryptedAccessTokenCache',
]) {
  assert(!controller.includes(forbidden), `controller does not contain forbidden marker: ${forbidden}`);
}

assert(runnerSource.includes('export class AmazonSpApiTokenPersistenceE2eRunner'), 'runner class exists');
assert(runnerSource.includes('runTokenPersistenceE2eTestDouble'), 'runner method exists');
assert(orchestratorSource.includes('export class AmazonSpApiTokenPersistenceOrchestrator'), 'orchestrator class exists');
assert(repositorySource.includes('export class AmazonSpApiCredentialRepository'), 'repository class exists');

const ServiceClass = loadServiceClass();
const service = new ServiceClass();

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

const normalizedSuccess = service.runTokenPersistenceE2eServiceOnlyTestDouble({
  ...baseInput,
  companyId: '  company-123  ',
  storeId: '  store-456  ',
  marketplaceId: '  A1VC38T7YXB528  ',
  region: '  fe  ',
  sellingPartnerId: '  A_SELLING_PARTNER_ID  ',
});
assertEqual(normalizedSuccess.accepted, true, 'normalized success accepted');
assertEqual(normalizedSuccess.reason, 'ready', 'normalized success reason');
assertEqual(normalizedSuccess.orchestratorAccepted, true, 'normalized orchestrator accepted');
assertEqual(normalizedSuccess.repositoryAccepted, true, 'normalized repository accepted');
assertSafe(normalizedSuccess, 'normalized success');

const validStatuses = [
  ['active success', { status: 'active' }],
  ['needs reauth success', { status: 'needs_reauth' }],
  ['error success', { status: 'error' }],
  ['revoked success', { status: 'revoked', revokedAt: '2026-05-09T12:00:00.000Z' }],
];

for (const [label, patch] of validStatuses) {
  const result = service.runTokenPersistenceE2eServiceOnlyTestDouble({
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
  const result = service.runTokenPersistenceE2eServiceOnlyTestDouble({
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
  const result = service.runTokenPersistenceE2eServiceOnlyTestDouble({
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
  const result = service.runTokenPersistenceE2eServiceOnlyTestDouble({
    ...baseInput,
    ...patch,
  });

  assertEqual(result.accepted, false, `${label} accepted false`);
  assertEqual(result.reason, 'orchestrator_rejected', `${label} service-level reason`);
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

console.log('========== Step139-B service-only E2E runner wiring branch runtime smoke passed ==========');
