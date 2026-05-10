const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '../../..');
const apiRoot = path.join(root, 'apps/api');

const files = {
  packageJson: path.join(apiRoot, 'package.json'),
  service: path.join(apiRoot, 'src/imports/amazon-sp-api-oauth-callback-commit-gate.service.ts'),
  contract: path.join(
    apiRoot,
    'src/imports/dto/amazon-sp-api-oauth-callback-commit-gate-service-contract.dto.ts',
  ),
  controller: path.join(apiRoot, 'src/imports/imports.controller.ts'),
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

function assertSafe(result, label) {
  assertEqual(result.source, 'amazon-sp-api-oauth-callback-commit-gate', `${label} source`);
  assertEqual(result.gateMode, 'server-side-pure-commit-gate-no-side-effects', `${label} gate mode`);
  assertEqual(result.plaintextTokenDatabaseWriteAllowedNow, false, `${label} no plaintext token DB write`);
  assertEqual(result.rawAuthorizationCodeReturnedNow, false, `${label} no raw code`);
  assertEqual(result.rawLwaResponseReturnedNow, false, `${label} no raw LWA response`);
  assertEqual(result.rawAccessTokenReturnedNow, false, `${label} no raw access token`);
  assertEqual(result.rawRefreshTokenReturnedNow, false, `${label} no raw refresh token`);

  const serialized = JSON.stringify(result);
  for (const secret of [
    'AUTHORIZATION_CODE_SECRET',
    'ACCESS_TOKEN_SECRET_VALUE',
    'REFRESH_TOKEN_SECRET_VALUE',
    'RAW_LWA_RESPONSE_SECRET',
  ]) {
    assert(!serialized.includes(secret), `${label} does not expose ${secret}`);
  }
}

function loadServiceClass() {
  const ts = require(path.join(apiRoot, 'node_modules/typescript'));
  const source = read(files.service);
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      experimentalDecorators: true,
    },
    fileName: files.service,
  }).outputText;

  const module = { exports: {} };

  vm.runInNewContext(
    output,
    {
      require: (request) => {
        if (request === '@nestjs/common') {
          return { Injectable: () => () => undefined };
        }
        return require(request);
      },
      module,
      exports: module.exports,
      __dirname: path.dirname(files.service),
      __filename: files.service,
      console,
      Date,
      Number,
      Object,
      String,
      JSON,
    },
    { filename: files.service.replace(/\.ts$/, '.js') },
  );

  return module.exports.AmazonSpApiOauthCallbackCommitGateService;
}

function baseInput(patch = {}) {
  return {
    dryRun: false,
    requestedCommit: true,
    trustedStateAccepted: true,
    callbackStateSignatureValid: true,
    callbackStateExpired: false,
    companyId: ' company-123 ',
    storeId: ' store-456 ',
    marketplaceId: ' A1VC38T7YXB528 ',
    region: ' JP ',
    sellingPartnerIdPresent: true,
    authorizationCodePresent: true,
    operatorConfirmed: true,
    companyStoreAllowlisted: true,
    environmentAllowsPersistence: true,
    realLwaActivationGateAccepted: true,
    idempotencyKey: ' idem-123 ',
    sanitizedLwaParserAccepted: true,
    encryptedPersistenceInputAccepted: true,
    ...patch,
  };
}

function runRejectedCase(service, label, patch, expectedReason) {
  const result = service.evaluateCommitGate(baseInput(patch));
  assertSafe(result, label);
  assertEqual(result.accepted, false, `${label} rejected`);
  assertEqual(result.reason, expectedReason, `${label} reason`);
  assertEqual(result.commitAllowedNow, false, `${label} commit not allowed`);
  assertEqual(result.dryRunForcedNow, true, `${label} dry-run forced`);
  assertEqual(result.controllerMayCallOrchestratorRealWriteNow, false, `${label} controller may not call orchestrator`);
  assertEqual(result.tokenExchangeHttpCallAllowedNow, false, `${label} token exchange call not allowed`);
  assertEqual(result.amazonNetworkCallAllowedNow, false, `${label} Amazon call not allowed`);
  assertEqual(result.tokenPersistenceDatabaseWriteAllowedNow, false, `${label} token DB write not allowed`);
  assertEqual(result.databaseWriteAllowedNow, false, `${label} DB write not allowed`);
  assertEqual(result.prismaClientWriteAllowedNow, false, `${label} Prisma write not allowed`);
}

console.log('========== Step139-Q OAuth callback commit gate service implementation smoke ==========');

const pkg = JSON.parse(read(files.packageJson));
const serviceSource = read(files.service);
const contractSource = read(files.contract);
const controllerSource = read(files.controller);

assert(
  pkg.scripts &&
    pkg.scripts['smoke:amazon-sp-api-oauth-callback-commit-gate-service-implementation'] ===
      'node scripts/smoke-amazon-sp-api-oauth-callback-commit-gate-service-implementation.js',
  'package.json registers Step139-Q smoke',
);

for (const marker of [
  'export class AmazonSpApiOauthCallbackCommitGateService',
  'evaluateCommitGate(',
  "source: 'amazon-sp-api-oauth-callback-commit-gate'",
  "gateMode: 'server-side-pure-commit-gate-no-side-effects'",
  "'dry_run_default'",
  "'commit_not_requested'",
  "'trusted_state_rejected'",
  "'state_signature_invalid'",
  "'state_expired'",
  "'missing_company_id'",
  "'missing_store_id'",
  "'missing_marketplace_id'",
  "'missing_region'",
  "'missing_selling_partner_id'",
  "'missing_authorization_code'",
  "'operator_confirmation_required'",
  "'company_store_not_allowlisted'",
  "'environment_persistence_disabled'",
  "'real_lwa_activation_gate_rejected'",
  "'missing_idempotency_key'",
  "'sanitized_lwa_parser_not_accepted'",
  "'encrypted_persistence_input_not_accepted'",
  "'ready_for_commit'",
  'plaintextTokenDatabaseWriteAllowedNow: false',
  'rawAuthorizationCodeReturnedNow: false',
  'rawLwaResponseReturnedNow: false',
  'rawAccessTokenReturnedNow: false',
  'rawRefreshTokenReturnedNow: false',
]) {
  assert(serviceSource.includes(marker), `service contains marker: ${marker}`);
}

for (const forbidden of [
  'fetch(',
  'axios',
  'prisma.',
  'PrismaClient',
  'upsertEncryptedCredentialRealWrite',
  'persistEncryptedTokensRealWrite',
  'decrypt',
  'rawAuthorizationCodeReturnedNow: true',
  'rawAccessTokenReturnedNow: true',
  'rawRefreshTokenReturnedNow: true',
]) {
  assert(!serviceSource.includes(forbidden), `service does not contain forbidden marker: ${forbidden}`);
}

assert(contractSource.includes("nextSuggestedStep: 'Step139-Q'"), 'Step139-P contract points to Step139-Q');

const controllerHasStep139TGuardedRealWriteBranch =
  controllerSource.includes(
    'Step139-T: guarded OAuth callback controller real-write branch implementation.',
  ) ||
  controllerSource.includes('controller-commit-gate-to-orchestrator-real-write');

if (controllerHasStep139TGuardedRealWriteBranch) {
  for (const marker of [
    'AmazonSpApiOauthCallbackCommitGateService',
    'evaluateCommitGate',
    'persistEncryptedTokensRealWrite',
    'controller-commit-gate-to-orchestrator-real-write',
    'controllerCallsRepositoryDirectlyNow: false',
    'rawAuthorizationCodeReturnedNow: false',
    'rawLwaResponseReturnedNow: false',
    'rawAccessTokenReturnedNow: false',
    'rawRefreshTokenReturnedNow: false',
    'plaintextTokenDatabaseWriteNow: false',
  ]) {
    assert(controllerSource.includes(marker), `controller has guarded Step139-T marker: ${marker}`);
  }

  for (const forbidden of [
    'AmazonSpApiCredentialRepository',
    'upsertEncryptedCredentialRealWrite',
    'rawAuthorizationCodeReturnedNow: true',
    'rawLwaResponseReturnedNow: true',
    'rawAccessTokenReturnedNow: true',
    'rawRefreshTokenReturnedNow: true',
    'plaintextTokenDatabaseWriteNow: true',
    'controllerCallsRepositoryDirectlyNow: true',
  ]) {
    assert(!controllerSource.includes(forbidden), `controller Step139-T still forbids: ${forbidden}`);
  }
} else {
  for (const forbidden of [
    'AmazonSpApiOauthCallbackCommitGateService',
    'evaluateCommitGate',
    'persistEncryptedTokensRealWrite',
    'upsertEncryptedCredentialRealWrite',
  ]) {
    assert(!controllerSource.includes(forbidden), `controller remains unwired: ${forbidden}`);
  }
}

const ServiceClass = loadServiceClass();
const service = new ServiceClass();

runRejectedCase(service, 'dry run default', { dryRun: true }, 'dry_run_default');
runRejectedCase(service, 'commit not requested', { requestedCommit: false }, 'commit_not_requested');
runRejectedCase(service, 'trusted state rejected', { trustedStateAccepted: false }, 'trusted_state_rejected');
runRejectedCase(service, 'state signature invalid', { callbackStateSignatureValid: false }, 'state_signature_invalid');
runRejectedCase(service, 'state expired', { callbackStateExpired: true }, 'state_expired');
runRejectedCase(service, 'missing company', { companyId: '   ' }, 'missing_company_id');
runRejectedCase(service, 'missing store', { storeId: '   ' }, 'missing_store_id');
runRejectedCase(service, 'missing marketplace', { marketplaceId: '   ' }, 'missing_marketplace_id');
runRejectedCase(service, 'missing region', { region: '   ' }, 'missing_region');
runRejectedCase(service, 'missing seller', { sellingPartnerIdPresent: false }, 'missing_selling_partner_id');
runRejectedCase(service, 'missing code', { authorizationCodePresent: false }, 'missing_authorization_code');
runRejectedCase(service, 'operator missing', { operatorConfirmed: false }, 'operator_confirmation_required');
runRejectedCase(service, 'allowlist rejected', { companyStoreAllowlisted: false }, 'company_store_not_allowlisted');
runRejectedCase(service, 'env disabled', { environmentAllowsPersistence: false }, 'environment_persistence_disabled');
runRejectedCase(service, 'activation rejected', { realLwaActivationGateAccepted: false }, 'real_lwa_activation_gate_rejected');
runRejectedCase(service, 'missing idempotency', { idempotencyKey: '   ' }, 'missing_idempotency_key');
runRejectedCase(service, 'parser rejected', { sanitizedLwaParserAccepted: false }, 'sanitized_lwa_parser_not_accepted');
runRejectedCase(service, 'encrypted input rejected', { encryptedPersistenceInputAccepted: false }, 'encrypted_persistence_input_not_accepted');

{
  const result = service.evaluateCommitGate(baseInput());
  assertSafe(result, 'success');
  assertEqual(result.accepted, true, 'success accepted');
  assertEqual(result.reason, 'ready_for_commit', 'success reason');
  assertEqual(result.commitAllowedNow, true, 'success commit allowed');
  assertEqual(result.dryRunForcedNow, false, 'success dry-run not forced');
  assertEqual(result.controllerMayCallOrchestratorRealWriteNow, true, 'success controller may call orchestrator');
  assertEqual(result.tokenExchangeHttpCallAllowedNow, true, 'success token exchange allowed');
  assertEqual(result.amazonNetworkCallAllowedNow, true, 'success Amazon call allowed');
  assertEqual(result.tokenPersistenceDatabaseWriteAllowedNow, true, 'success token DB write allowed');
  assertEqual(result.databaseWriteAllowedNow, true, 'success DB write allowed');
  assertEqual(result.prismaClientWriteAllowedNow, true, 'success Prisma write allowed');
}

console.log('========== Step139-Q OAuth callback commit gate service implementation smoke passed ==========');
