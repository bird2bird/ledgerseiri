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
  assert(!serialized.includes('ACCESS_TOKEN_SECRET_VALUE'), `${label} does not expose access token`);
  assert(!serialized.includes('REFRESH_TOKEN_SECRET_VALUE'), `${label} does not expose refresh token`);
}

console.log('========== Step137-Q token persistence input builder test-double smoke ==========');

const serviceSource = read(servicePath);
const controllerSource = read(controllerPath);
const pkg = JSON.parse(read(packagePath));

assert(
  JSON.stringify(pkg.scripts || {}).includes('smoke:amazon-sp-api-token-persistence-input-builder-test-double'),
  'package.json registers Step137-Q smoke',
);

for (const marker of [
  'AmazonSpApiEncryptedTokenPersistenceInputBuilderInput',
  'AmazonSpApiEncryptedTokenPersistenceInputBuilderResult',
  'prepareEncryptedTokenPersistenceInputLater',
  "source: 'amazon-sp-api-token-persistence-encrypted-input-builder-test-double'",
  "persistenceMode: 'encrypted-input-test-double-no-db-write'",
  "'missing_company_id'",
  "'missing_store_id'",
  "'missing_marketplace_id'",
  "'missing_region'",
  "'missing_selling_partner_id'",
  "'invalid_token_type'",
  "'invalid_expires_in'",
  "'missing_access_token_fingerprint'",
  "'missing_refresh_token_fingerprint'",
  "'invalid_access_token_length'",
  "'invalid_refresh_token_length'",
  "'missing_encryption_key_id'",
  "'invalid_encryption_algorithm'",
  "'invalid_token_version'",
  "'operator_boundary_not_approved'",
  "'ready'",
  'encryptedRefreshTokenPreparedNow: false',
  'encryptedAccessTokenCachePreparedNow: false',
  'tokenPersistenceDatabaseWriteNow: false',
  'plaintextTokenDatabaseWriteNow: false',
  'rawAccessTokenReturnedNow: false',
  'rawRefreshTokenReturnedNow: false',
  'prismaWriteNow: false',
  'migrationRequiredNow: false',
]) {
  assert(serviceSource.includes(marker), `service contains marker: ${marker}`);
}

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
assertEqual(success.sanitizedPersistenceInputReady, true, 'success ready flag');
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
assertEqual(success.encryptionKeyIdPresent, true, 'success encryption key present');
assertEqual(success.encryptionAlgorithm, 'test-double-envelope-v1', 'success encryption algorithm');
assertEqual(success.tokenVersion, 1, 'success token version');
assertEqual(success.operatorApprovedPersistenceBoundary, true, 'success operator boundary');
assertSafePersistenceEnvelope(success, 'success');

const cases = [
  ['missing_company_id', { companyId: '' }],
  ['missing_store_id', { storeId: '' }],
  ['missing_marketplace_id', { marketplaceId: '' }],
  ['missing_region', { region: '' }],
  ['missing_selling_partner_id', { sellingPartnerId: '' }],
  ['invalid_token_type', { tokenType: 'mac' }],
  ['invalid_expires_in', { expiresInSeconds: 0 }],
  ['missing_access_token_fingerprint', { accessTokenFingerprint: '' }],
  ['missing_refresh_token_fingerprint', { refreshTokenFingerprint: '' }],
  ['invalid_access_token_length', { accessTokenLength: 0 }],
  ['invalid_refresh_token_length', { refreshTokenLength: 0 }],
  ['missing_encryption_key_id', { encryptionKeyId: '' }],
  ['invalid_encryption_algorithm', { encryptionAlgorithm: 'aes-gcm-real-later' }],
  ['invalid_token_version', { tokenVersion: 0 }],
  ['operator_boundary_not_approved', { operatorApprovedPersistenceBoundary: false }],
];

for (const [reason, patch] of cases) {
  const result = service.prepareEncryptedTokenPersistenceInputLater({
    ...baseInput,
    ...patch,
  });

  assertEqual(result.accepted, false, `${reason} accepted false`);
  assertEqual(result.reason, reason, `${reason} reason`);
  assertEqual(result.sanitizedPersistenceInputReady, false, `${reason} ready false`);
  assertSafePersistenceEnvelope(result, reason);
}

console.log('========== Step137-Q token persistence input builder test-double smoke passed ==========');
