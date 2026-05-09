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
  handoffContract: path.join(
    apiRoot,
    'src/imports/dto/amazon-sp-api-token-persistence-pre-wiring-final-handoff-contract.dto.ts',
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
        if (request === './amazon-sp-api-credential.repository') return repositoryModule.exports;
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
        if (request === './amazon-sp-api-token-persistence.orchestrator') return orchestratorModule.exports;
        if (request === './amazon-sp-api-credential.repository') return repositoryModule.exports;
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
        if (request === './amazon-sp-api-token-persistence-e2e.runner') return runnerModule.exports;
        if (request === './amazon-sp-api-token-persistence.orchestrator') return orchestratorModule.exports;
        if (request === './amazon-sp-api-credential.repository') return repositoryModule.exports;
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

console.log('========== Step139-A service-only E2E runner wiring smoke ==========');

const serviceSource = read(files.service);
const runnerSource = read(files.runner);
const controller = read(files.controller);
const pkg = JSON.parse(read(files.packageJson));
const handoffContract = read(files.handoffContract);

assert(
  JSON.stringify(pkg.scripts || {}).includes('smoke:amazon-sp-api-token-persistence-service-only-e2e-runner-wiring'),
  'package.json registers Step139-A smoke',
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
  'runTokenPersistenceE2eServiceOnlyTestDouble(',
  'AmazonSpApiTokenPersistenceE2eRunner',
  'AmazonSpApiTokenPersistenceOrchestrator',
  'AmazonSpApiCredentialRepository',
]) {
  assert(!controller.includes(forbidden), `controller does not contain forbidden marker: ${forbidden}`);
}

for (const forbidden of [
  'controllerWiringNow: true',
  'oauthCallbackWiringNow: true',
  'amazonNetworkCallNow: true',
  'prismaClientWriteNow: true',
  'databaseWriteNow: true',
  'tokenPersistenceDatabaseWriteNow: true',
  'plaintextTokenDatabaseWriteNow: true',
]) {
  assert(!serviceSource.includes(forbidden), `service does not contain forbidden marker: ${forbidden}`);
}

assert(runnerSource.includes('export class AmazonSpApiTokenPersistenceE2eRunner'), 'runner class exists');
assert(runnerSource.includes('runTokenPersistenceE2eTestDouble'), 'runner method exists');
assert(handoffContract.includes("nextSuggestedStep: 'Step139-A'"), 'handoff contract points to Step139-A');

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

const success = service.runTokenPersistenceE2eServiceOnlyTestDouble(baseInput);
assertEqual(success.accepted, true, 'success accepted');
assertEqual(success.reason, 'ready', 'success reason');
assertEqual(success.orchestratorAccepted, true, 'success orchestrator accepted');
assertEqual(success.repositoryAccepted, true, 'success repository accepted');
assertSafe(success, 'success');

const blocked = service.runTokenPersistenceE2eServiceOnlyTestDouble({
  ...baseInput,
  activationGateAccepted: false,
});
assertEqual(blocked.accepted, false, 'blocked accepted false');
assertEqual(blocked.reason, 'activation_gate_not_accepted', 'blocked reason');
assertEqual(blocked.orchestratorAccepted, false, 'blocked orchestrator not reached');
assertSafe(blocked, 'blocked');

const rejected = service.runTokenPersistenceE2eServiceOnlyTestDouble({
  ...baseInput,
  companyId: '',
});
assertEqual(rejected.accepted, false, 'rejected accepted false');
assertEqual(rejected.reason, 'orchestrator_rejected', 'rejected runner reason');
assertEqual(rejected.orchestratorReason, 'missing_company_id', 'rejected orchestrator reason');
assertSafe(rejected, 'rejected');

console.log('========== Step139-A service-only E2E runner wiring smoke passed ==========');
