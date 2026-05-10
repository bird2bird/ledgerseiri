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
  assertEqual(result.rawAuthorizationCodeReturnedNow, false, `${label} no raw authorization code`);
  assertEqual(result.rawLwaResponseReturnedNow, false, `${label} no raw LWA response`);
  assertEqual(result.rawAccessTokenReturnedNow, false, `${label} no raw access token`);
  assertEqual(result.rawRefreshTokenReturnedNow, false, `${label} no raw refresh token`);

  const serialized = JSON.stringify(result);
  for (const secret of [
    'AUTHORIZATION_CODE_SECRET',
    'ACCESS_TOKEN_SECRET_VALUE',
    'REFRESH_TOKEN_SECRET_VALUE',
    'RAW_LWA_RESPONSE_SECRET',
    'CLIENT_SECRET_VALUE',
    'SELLING_PARTNER_SECRET',
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

function expectReject(service, label, patch, expectedReason) {
  const result = service.evaluateCommitGate(baseInput(patch));

  assertSafe(result, label);
  assertEqual(result.accepted, false, `${label} rejected`);
  assertEqual(result.reason, expectedReason, `${label} reason`);
  assertEqual(result.commitAllowedNow, false, `${label} commit not allowed`);
  assertEqual(result.dryRunForcedNow, true, `${label} dry-run forced`);
  assertEqual(result.controllerMayCallOrchestratorRealWriteNow, false, `${label} controller may not call orchestrator`);
  assertEqual(result.tokenExchangeHttpCallAllowedNow, false, `${label} token exchange not allowed`);
  assertEqual(result.amazonNetworkCallAllowedNow, false, `${label} Amazon call not allowed`);
  assertEqual(result.tokenPersistenceDatabaseWriteAllowedNow, false, `${label} token DB write not allowed`);
  assertEqual(result.databaseWriteAllowedNow, false, `${label} DB write not allowed`);
  assertEqual(result.prismaClientWriteAllowedNow, false, `${label} Prisma write not allowed`);
  assert(typeof result.messageRedacted === 'string' && result.messageRedacted.length > 0, `${label} has redacted message`);
}

function expectSuccess(service, label, patch = {}) {
  const result = service.evaluateCommitGate(baseInput(patch));

  assertSafe(result, label);
  assertEqual(result.accepted, true, `${label} accepted`);
  assertEqual(result.reason, 'ready_for_commit', `${label} reason`);
  assertEqual(result.commitAllowedNow, true, `${label} commit allowed`);
  assertEqual(result.dryRunForcedNow, false, `${label} dry-run not forced`);
  assertEqual(result.controllerMayCallOrchestratorRealWriteNow, true, `${label} controller may call orchestrator`);
  assertEqual(result.tokenExchangeHttpCallAllowedNow, true, `${label} token exchange allowed`);
  assertEqual(result.amazonNetworkCallAllowedNow, true, `${label} Amazon call allowed`);
  assertEqual(result.tokenPersistenceDatabaseWriteAllowedNow, true, `${label} token DB write allowed`);
  assertEqual(result.databaseWriteAllowedNow, true, `${label} DB write allowed`);
  assertEqual(result.prismaClientWriteAllowedNow, true, `${label} Prisma write allowed`);
}

console.log('========== Step139-R OAuth callback commit gate branch runtime smoke ==========');

const pkg = JSON.parse(read(files.packageJson));
const serviceSource = read(files.service);
const contractSource = read(files.contract);
const controllerSource = read(files.controller);

assert(
  pkg.scripts &&
    pkg.scripts['smoke:amazon-sp-api-oauth-callback-commit-gate-branch-runtime'] ===
      'node scripts/smoke-amazon-sp-api-oauth-callback-commit-gate-branch-runtime.js',
  'package.json registers Step139-R smoke',
);

for (const marker of [
  'AmazonSpApiOauthCallbackCommitGateService',
  'evaluateCommitGate(',
  "source: 'amazon-sp-api-oauth-callback-commit-gate'",
  "gateMode: 'server-side-pure-commit-gate-no-side-effects'",
  "'ready_for_commit'",
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
  'PrismaClient',
  'prisma.',
  'upsertEncryptedCredentialRealWrite',
  'persistEncryptedTokensRealWrite',
  'decrypt',
  'rawAuthorizationCodeReturnedNow: true',
  'rawAccessTokenReturnedNow: true',
  'rawRefreshTokenReturnedNow: true',
]) {
  assert(!serviceSource.includes(forbidden), `service remains side-effect free: ${forbidden}`);
}

for (const marker of [
  "step: 'Step139-P'",
  "nextSuggestedStep: 'Step139-Q'",
  'serviceMustNotCallAmazon: true',
  'serviceMustNotCallPrisma: true',
  'serviceMustNotWriteDatabase: true',
  'serviceMustOnlyEvaluateBooleansAndPresence: true',
]) {
  assert(contractSource.includes(marker), `contract contains marker: ${marker}`);
}

const callbackStart = controllerSource.indexOf(
  'Step139-E: Amazon SP-API OAuth callback dry-run-only controller wiring implementation',
);
const callbackEnd = controllerSource.indexOf("@Post('detect-month-conflicts')", callbackStart);
assert(callbackStart >= 0 && callbackEnd > callbackStart, 'controller OAuth callback slice found');
const callbackSlice = controllerSource.slice(callbackStart, callbackEnd);

for (const marker of [
  'controller-dry-run-only-no-persistence',
  'oauthCallbackPersistenceWiringNow: false',
  'controllerCallsServicePersistenceCommitNow: false',
  'tokenPersistenceDatabaseWriteNow: false',
  'databaseWriteNow: false',
  'prismaClientWriteNow: false',
  'amazonNetworkCallNow: false',
]) {
  assert(callbackSlice.includes(marker), `controller callback still contains marker: ${marker}`);
}

const controllerHasStep139TGuardedRealWriteBranch =
  callbackSlice.includes(
    'Step139-T: guarded OAuth callback controller real-write branch implementation.',
  ) ||
  callbackSlice.includes('controller-commit-gate-to-orchestrator-real-write');

if (controllerHasStep139TGuardedRealWriteBranch) {
  for (const marker of [
    'this.amazonSpApiOauthCallbackCommitGateService.evaluateCommitGate',
    'this.amazonSpApiTokenPersistenceOrchestrator.persistEncryptedTokensRealWrite',
    'controller-commit-gate-to-orchestrator-real-write',
    'controllerCallsRepositoryDirectlyNow: false',
    'rawAuthorizationCodeReturnedNow: false',
    'rawLwaResponseReturnedNow: false',
    'rawAccessTokenReturnedNow: false',
    'rawRefreshTokenReturnedNow: false',
    'plaintextTokenDatabaseWriteNow: false',
    'amazonNetworkCallNow: false',
    'realSpApiRequestNow: false',
  ]) {
    assert(callbackSlice.includes(marker), `controller callback has guarded Step139-T marker: ${marker}`);
  }

  for (const forbidden of [
    'upsertEncryptedCredentialRealWrite',
    'AmazonSpApiCredentialRepository',
    'rawAuthorizationCodeReturnedNow: true',
    'rawLwaResponseReturnedNow: true',
    'rawAccessTokenReturnedNow: true',
    'rawRefreshTokenReturnedNow: true',
    'plaintextTokenDatabaseWriteNow: true',
    'controllerCallsRepositoryDirectlyNow: true',
  ]) {
    assert(!callbackSlice.includes(forbidden), `controller callback Step139-T still forbids: ${forbidden}`);
  }
} else {
  for (const forbidden of [
    'AmazonSpApiOauthCallbackCommitGateService',
    'evaluateCommitGate',
    'persistEncryptedTokensRealWrite',
    'upsertEncryptedCredentialRealWrite',
    'AmazonSpApiCredentialRepository',
    'oauthCallbackPersistenceWiringNow: true',
    'controllerCallsServicePersistenceCommitNow: true',
    'tokenPersistenceDatabaseWriteNow: true',
    'databaseWriteNow: true',
    'prismaClientWriteNow: true',
    'amazonNetworkCallNow: true',
  ]) {
    assert(!callbackSlice.includes(forbidden), `controller callback remains unwired: ${forbidden}`);
  }
}

const ServiceClass = loadServiceClass();
const service = new ServiceClass();

const rejectCases = [
  ['dry-run true', { dryRun: true }, 'dry_run_default'],
  ['dry-run undefined-ish', { dryRun: undefined }, 'dry_run_default'],
  ['requested commit false', { requestedCommit: false }, 'commit_not_requested'],
  ['requested commit undefined-ish', { requestedCommit: undefined }, 'commit_not_requested'],
  ['trusted state false', { trustedStateAccepted: false }, 'trusted_state_rejected'],
  ['trusted state undefined-ish', { trustedStateAccepted: undefined }, 'trusted_state_rejected'],
  ['signature false', { callbackStateSignatureValid: false }, 'state_signature_invalid'],
  ['signature undefined-ish', { callbackStateSignatureValid: undefined }, 'state_signature_invalid'],
  ['expired true', { callbackStateExpired: true }, 'state_expired'],
  ['missing company blank', { companyId: '   ' }, 'missing_company_id'],
  ['missing company null-ish', { companyId: null }, 'missing_company_id'],
  ['missing store blank', { storeId: '   ' }, 'missing_store_id'],
  ['missing marketplace blank', { marketplaceId: '   ' }, 'missing_marketplace_id'],
  ['missing region blank', { region: '   ' }, 'missing_region'],
  ['seller absent', { sellingPartnerIdPresent: false }, 'missing_selling_partner_id'],
  ['seller undefined-ish', { sellingPartnerIdPresent: undefined }, 'missing_selling_partner_id'],
  ['code absent', { authorizationCodePresent: false }, 'missing_authorization_code'],
  ['operator false', { operatorConfirmed: false }, 'operator_confirmation_required'],
  ['allowlist false', { companyStoreAllowlisted: false }, 'company_store_not_allowlisted'],
  ['environment false', { environmentAllowsPersistence: false }, 'environment_persistence_disabled'],
  ['activation false', { realLwaActivationGateAccepted: false }, 'real_lwa_activation_gate_rejected'],
  ['idempotency blank', { idempotencyKey: '   ' }, 'missing_idempotency_key'],
  ['parser false', { sanitizedLwaParserAccepted: false }, 'sanitized_lwa_parser_not_accepted'],
  ['encrypted input false', { encryptedPersistenceInputAccepted: false }, 'encrypted_persistence_input_not_accepted'],
];

for (const [label, patch, reason] of rejectCases) {
  expectReject(service, label, patch, reason);
}

expectSuccess(service, 'success trims required string inputs');
expectSuccess(service, 'success with non-expired false and clean ids', {
  companyId: 'company-clean',
  storeId: 'store-clean',
  marketplaceId: 'A1VC38T7YXB528',
  region: 'JP',
  idempotencyKey: 'idem-clean',
});

expectReject(
  service,
  'priority dry-run before trusted state',
  {
    dryRun: true,
    trustedStateAccepted: false,
    callbackStateSignatureValid: false,
    callbackStateExpired: true,
    companyId: '',
  },
  'dry_run_default',
);

expectReject(
  service,
  'priority commit request before trusted state',
  {
    requestedCommit: false,
    trustedStateAccepted: false,
    callbackStateSignatureValid: false,
  },
  'commit_not_requested',
);

expectReject(
  service,
  'priority trusted state before signature',
  {
    trustedStateAccepted: false,
    callbackStateSignatureValid: false,
    callbackStateExpired: true,
  },
  'trusted_state_rejected',
);

expectReject(
  service,
  'priority signature before expiry',
  {
    callbackStateSignatureValid: false,
    callbackStateExpired: true,
  },
  'state_signature_invalid',
);

expectReject(
  service,
  'priority company before store',
  {
    companyId: '',
    storeId: '',
    marketplaceId: '',
    region: '',
  },
  'missing_company_id',
);

console.log('========== Step139-R OAuth callback commit gate branch runtime smoke passed ==========');
