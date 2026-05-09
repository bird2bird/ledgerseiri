const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '../../..');
const apiRoot = path.join(root, 'apps/api');

const servicePath = path.join(apiRoot, 'src/imports/amazon-sp-api-token-exchange.service.ts');
const controllerPath = path.join(apiRoot, 'src/imports/imports.controller.ts');
const packagePath = path.join(apiRoot, 'package.json');

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

function loadServiceClass() {
  const ts = require(path.join(apiRoot, 'node_modules/typescript'));
  const source = read(servicePath);

  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      experimentalDecorators: true,
      emitDecoratorMetadata: false,
      esModuleInterop: true,
    },
    fileName: servicePath,
  }).outputText;

  const module = { exports: {} };
  const sandbox = {
    require,
    module,
    exports: module.exports,
    __dirname: path.dirname(servicePath),
    __filename: servicePath,
    console,
    URL,
    Buffer,
  };

  vm.runInNewContext(output, sandbox, {
    filename: servicePath.replace(/\.ts$/, '.js'),
  });

  return module.exports.AmazonSpApiTokenExchangeService;
}

function assertSafePersistenceEnvelope(result, label) {
  assertEqual(
    result.source,
    'amazon-sp-api-token-persistence-encrypted-input-builder-test-double',
    `${label} source`,
  );
  assertEqual(
    result.persistenceMode,
    'encrypted-input-test-double-no-db-write',
    `${label} persistence mode`,
  );

  for (const [key, expected] of [
    ['encryptedRefreshTokenPreparedNow', false],
    ['encryptedAccessTokenCachePreparedNow', false],
    ['tokenPersistenceDatabaseWriteNow', false],
    ['plaintextTokenDatabaseWriteNow', false],
    ['rawAccessTokenReturnedNow', false],
    ['rawRefreshTokenReturnedNow', false],
    ['prismaWriteNow', false],
    ['migrationRequiredNow', false],
  ]) {
    assertEqual(result[key], expected, `${label} ${key}`);
  }

  const serialized = JSON.stringify(result);
  assert(!serialized.includes('ACCESS_TOKEN_SECRET_VALUE'), `${label} does not expose raw access token`);
  assert(!serialized.includes('REFRESH_TOKEN_SECRET_VALUE'), `${label} does not expose raw refresh token`);
}

console.log('========== Step137-R token persistence input builder branch runtime smoke ==========');

const serviceSource = read(servicePath);
const controllerSource = read(controllerPath);
const pkg = JSON.parse(read(packagePath));

assert(
  JSON.stringify(pkg.scripts || {}).includes('smoke:amazon-sp-api-token-persistence-builder-branch-runtime'),
  'package.json registers Step137-R smoke',
);

assert(serviceSource.includes('prepareEncryptedTokenPersistenceInputLater'), 'service has persistence input builder');
assert(serviceSource.includes("source: 'amazon-sp-api-token-persistence-encrypted-input-builder-test-double'"), 'service has input builder source');
assert(serviceSource.includes("persistenceMode: 'encrypted-input-test-double-no-db-write'"), 'service has no-db persistence mode');

for (const forbidden of [
  'fetch(',
  'axios.',
  'http.request',
  'https.request',
  'encryptedRefreshTokenPreparedNow: true',
  'encryptedAccessTokenCachePreparedNow: true',
  'tokenPersistenceDatabaseWriteNow: true',
  'plaintextTokenDatabaseWriteNow: true',
  'rawAccessTokenReturnedNow: true',
  'rawRefreshTokenReturnedNow: true',
  'prismaWriteNow: true',
  'migrationRequiredNow: true',
  'ACCESS_TOKEN_SECRET_VALUE',
  'REFRESH_TOKEN_SECRET_VALUE',
]) {
  assert(!serviceSource.includes(forbidden), `service does not contain forbidden marker: ${forbidden}`);
}

assert(!controllerSource.includes('prepareEncryptedTokenPersistenceInputLater'), 'controller does not reference persistence input builder');
assert(!controllerSource.includes('parseRealLwaHttpResponseSanitizedLater'), 'controller does not reference parser');
assert(!controllerSource.includes('executeRealLwaTokenExchangeHttpGuardedLater'), 'controller does not wire guarded transport');

const ServiceClass = loadServiceClass();
const service = new ServiceClass();

assert(
  typeof service.prepareEncryptedTokenPersistenceInputLater === 'function',
  'persistence input builder is callable',
);

const baseInput = {
  companyId: 'company-123',
  storeId: 'store-456',
  marketplaceId: 'A1VC38T7YXB528',
  region: 'fe',
  sellingPartnerId: 'A_SELLING_PARTNER_ID',
  tokenType: 'bearer',
  expiresInSeconds: 3600,
  scope: 'sellingpartnerapi::migration',
  accessTokenFingerprint: 'access-token-fingerprint',
  refreshTokenFingerprint: 'refresh-token-fingerprint',
  accessTokenLength: 24,
  refreshTokenLength: 25,
  encryptionKeyId: 'kms-test-key',
  encryptionAlgorithm: 'test-double-envelope-v1',
  tokenVersion: 1,
  operatorApprovedPersistenceBoundary: true,
};

const success = service.prepareEncryptedTokenPersistenceInputLater(baseInput);

assertEqual(success.accepted, true, 'success accepted');
assertEqual(success.reason, 'ready', 'success reason');
assertEqual(success.sanitizedPersistenceInputReady, true, 'success ready');
assertEqual(success.companyIdPresent, true, 'success company present');
assertEqual(success.storeIdPresent, true, 'success store present');
assertEqual(success.marketplaceIdPresent, true, 'success marketplace present');
assertEqual(success.regionPresent, true, 'success region present');
assertEqual(success.sellingPartnerIdPresent, true, 'success selling partner present');
assertEqual(success.tokenType, 'bearer', 'success token type');
assertEqual(success.expiresInSeconds, 3600, 'success expires');
assertEqual(success.scope, 'sellingpartnerapi::migration', 'success scope');
assertEqual(success.accessTokenFingerprintPresent, true, 'success access fingerprint present');
assertEqual(success.refreshTokenFingerprintPresent, true, 'success refresh fingerprint present');
assertEqual(success.accessTokenLength, 24, 'success access token length metadata');
assertEqual(success.refreshTokenLength, 25, 'success refresh token length metadata');
assertEqual(success.encryptionKeyIdPresent, true, 'success encryption key present');
assertEqual(success.encryptionAlgorithm, 'test-double-envelope-v1', 'success encryption algorithm');
assertEqual(success.tokenVersion, 1, 'success token version');
assertEqual(success.operatorApprovedPersistenceBoundary, true, 'success operator boundary');
assertSafePersistenceEnvelope(success, 'success');

const normalizedSuccess = service.prepareEncryptedTokenPersistenceInputLater({
  ...baseInput,
  companyId: '  company-123  ',
  storeId: '  store-456  ',
  marketplaceId: '  A1VC38T7YXB528  ',
  region: '  fe  ',
  sellingPartnerId: '  A_SELLING_PARTNER_ID  ',
  scope: '',
  expiresInSeconds: 3600.9,
  accessTokenLength: 24.7,
  refreshTokenLength: 25.2,
  tokenVersion: 2.9,
});

assertEqual(normalizedSuccess.accepted, true, 'normalized success accepted');
assertEqual(normalizedSuccess.scope, null, 'blank scope normalized to null');
assertEqual(normalizedSuccess.expiresInSeconds, 3600, 'expires floored');
assertEqual(normalizedSuccess.accessTokenLength, 24, 'access length floored');
assertEqual(normalizedSuccess.refreshTokenLength, 25, 'refresh length floored');
assertEqual(normalizedSuccess.tokenVersion, 2, 'token version floored');
assertSafePersistenceEnvelope(normalizedSuccess, 'normalized success');

const cases = [
  {
    reason: 'missing_company_id',
    patch: { companyId: '' },
    expectations(result) {
      assertEqual(result.companyIdPresent, false, 'missing company present false');
    },
  },
  {
    reason: 'missing_store_id',
    patch: { storeId: '' },
    expectations(result) {
      assertEqual(result.storeIdPresent, false, 'missing store present false');
    },
  },
  {
    reason: 'missing_marketplace_id',
    patch: { marketplaceId: '' },
    expectations(result) {
      assertEqual(result.marketplaceIdPresent, false, 'missing marketplace present false');
    },
  },
  {
    reason: 'missing_region',
    patch: { region: '' },
    expectations(result) {
      assertEqual(result.regionPresent, false, 'missing region present false');
    },
  },
  {
    reason: 'missing_selling_partner_id',
    patch: { sellingPartnerId: '' },
    expectations(result) {
      assertEqual(result.sellingPartnerIdPresent, false, 'missing selling partner present false');
    },
  },
  {
    reason: 'invalid_token_type',
    patch: { tokenType: 'mac' },
    expectations(result) {
      assertEqual(result.tokenType, null, 'invalid token type becomes null');
    },
  },
  {
    reason: 'invalid_expires_in',
    patch: { expiresInSeconds: 0 },
    expectations(result) {
      assertEqual(result.expiresInSeconds, 0, 'invalid expires zero retained as metadata');
    },
  },
  {
    reason: 'missing_access_token_fingerprint',
    patch: { accessTokenFingerprint: '' },
    expectations(result) {
      assertEqual(result.accessTokenFingerprintPresent, false, 'missing access fingerprint present false');
    },
  },
  {
    reason: 'missing_refresh_token_fingerprint',
    patch: { refreshTokenFingerprint: '' },
    expectations(result) {
      assertEqual(result.refreshTokenFingerprintPresent, false, 'missing refresh fingerprint present false');
    },
  },
  {
    reason: 'invalid_access_token_length',
    patch: { accessTokenLength: 0 },
    expectations(result) {
      assertEqual(result.accessTokenLength, 0, 'invalid access length retained as metadata');
    },
  },
  {
    reason: 'invalid_refresh_token_length',
    patch: { refreshTokenLength: 0 },
    expectations(result) {
      assertEqual(result.refreshTokenLength, 0, 'invalid refresh length retained as metadata');
    },
  },
  {
    reason: 'missing_encryption_key_id',
    patch: { encryptionKeyId: '' },
    expectations(result) {
      assertEqual(result.encryptionKeyIdPresent, false, 'missing encryption key present false');
    },
  },
  {
    reason: 'invalid_encryption_algorithm',
    patch: { encryptionAlgorithm: 'aes-gcm-real-later' },
    expectations(result) {
      assertEqual(result.encryptionAlgorithm, null, 'invalid encryption algorithm null');
    },
  },
  {
    reason: 'invalid_token_version',
    patch: { tokenVersion: 0 },
    expectations(result) {
      assertEqual(result.tokenVersion, 0, 'invalid token version retained as metadata');
    },
  },
  {
    reason: 'operator_boundary_not_approved',
    patch: { operatorApprovedPersistenceBoundary: false },
    expectations(result) {
      assertEqual(result.operatorApprovedPersistenceBoundary, false, 'operator boundary false');
    },
  },
];

for (const testCase of cases) {
  const result = service.prepareEncryptedTokenPersistenceInputLater({
    ...baseInput,
    ...testCase.patch,
  });

  assertEqual(result.accepted, false, `${testCase.reason} accepted false`);
  assertEqual(result.reason, testCase.reason, `${testCase.reason} reason`);
  assertEqual(result.sanitizedPersistenceInputReady, false, `${testCase.reason} ready false`);
  assertSafePersistenceEnvelope(result, testCase.reason);
  testCase.expectations(result);
}

console.log('========== Step137-R token persistence input builder branch runtime smoke passed ==========');
