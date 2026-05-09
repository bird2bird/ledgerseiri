const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');

const files = {
  contract: path.join(
    root,
    'apps/api/src/imports/dto/amazon-sp-api-sanitized-lwa-http-response-parser-contract.dto.ts',
  ),
  transition: path.join(
    root,
    'apps/api/src/imports/dto/amazon-sp-api-real-http-activation-transition-contract.dto.ts',
  ),
  service: path.join(root, 'apps/api/src/imports/amazon-sp-api-token-exchange.service.ts'),
  controller: path.join(root, 'apps/api/src/imports/imports.controller.ts'),
  packageJson: path.join(root, 'apps/api/package.json'),
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

function assertIncludes(name, text, marker) {
  assert(text.includes(marker), `${name} contains marker: ${marker}`);
}

function assertNotIncludes(name, text, marker) {
  assert(!text.includes(marker), `${name} does not contain forbidden marker: ${marker}`);
}

const contract = read(files.contract);
const transition = read(files.transition);
const service = read(files.service);
const controller = read(files.controller);
const pkg = JSON.parse(read(files.packageJson));

console.log('========== Step137-M sanitized LWA HTTP response parser contract smoke ==========');

assertIncludes(
  'package.json',
  JSON.stringify(pkg.scripts || {}),
  'smoke:amazon-sp-api-sanitized-lwa-http-response-parser-contract',
);

for (const marker of [
  "source: 'amazon-sp-api-sanitized-lwa-http-response-parser-contract'",
  "step: 'Step137-M'",
  "phase: 'parser-contract-only'",
  "previousTransitionStep: 'Step137-L'",
  "parserTarget: 'LWA authorization_code token response'",
  "futureParserPath:",
  "'AmazonSpApiTokenExchangeService.parseRealLwaHttpResponseSanitizedLater'",
  "defineParserContractOnlyNow: true",
  "implementParserNow: false",
  "invokeParserNow: false",
  "executeHttpNow: false",
  "wireControllerNow: false",
  "wireOAuthCallbackNow: false",
  "persistTokensNow: false",
  "rawLwaHttpStatusMayEnterParserLater: true",
  "rawLwaResponseBodyMayEnterParserLater: true",
  "rawLwaResponseHeadersMayEnterParserLater: true",
  "rawLwaResponseMayExistOnlyInLocalFunctionScopeLater: true",
  "acceptedHttpStatusRange: '200-299'",
  "'access_token'",
  "'refresh_token'",
  "'token_type'",
  "'expires_in'",
  "'scope'",
  "source: 'amazon-sp-api-sanitized-lwa-http-response-parser'",
  "parserMode: 'sanitized-only'",
  "tokenTypeMustBeBearer: true",
  "expiresInSecondsMustBePositive: true",
  "accessTokenPresent: true",
  "refreshTokenPresent: true",
  "accessTokenLengthMayBeReturned: true",
  "refreshTokenLengthMayBeReturned: true",
  "accessTokenFingerprintMayBeReturned: true",
  "refreshTokenFingerprintMayBeReturned: true",
  "rawAccessTokenMayBeReturned: false",
  "rawRefreshTokenMayBeReturned: false",
  "rawLwaResponseMayBeReturned: false",
  "rawResponseBodyMayBeReturned: false",
  "rawResponseHeadersMayBeReturned: false",
  "'http_status_not_success'",
  "'missing_response_body'",
  "'malformed_json'",
  "'missing_access_token'",
  "'missing_refresh_token'",
  "'missing_token_type'",
  "'invalid_token_type'",
  "'missing_expires_in'",
  "'invalid_expires_in'",
  "'response_body_too_large'",
  "'unexpected_parser_exception'",
  "sanitizedReasonRequired: true",
  "sanitizedMessageRequired: true",
  "httpStatusMayBeReturned: true",
  "responseBodyLengthMayBeReturned: true",
  "responseBodyFingerprintMayBeReturned: true",
  "amazonErrorCodeMayBeReturned: true",
  "amazonErrorDescriptionMustBeRedacted: true",
  "redactAccessTokenInAllOutputs: true",
  "redactRefreshTokenInAllOutputs: true",
  "redactClientSecretInAllOutputs: true",
  "redactAuthorizationCodeInAllOutputs: true",
  "redactRawResponseBodyInErrors: true",
  "redactAmazonErrorDescriptionWhenSuspicious: true",
  "noRawTokenInLogs: true",
  "noRawTokenInThrownErrors: true",
  "noRawTokenInReturnedEnvelope: true",
  "noPlaintextTokenDatabaseWrite: true",
  "parseRuntimeResponseNow: false",
  "callAmazonNow: false",
  "createHttpClientNow: false",
  "mutateTokenPersistenceNow: false",
  "encryptTokensNow: false",
  "writeDatabaseNow: false",
  "createImportJobNow: false",
  "createTransactionNow: false",
  "createInventoryMovementNow: false",
  "changeOAuthCallbackNow: false",
  "changeDiagnosticEndpointNow: false",
  "'smoke:amazon-sp-api-sanitized-lwa-http-response-parser-contract'",
  "'smoke:amazon-sp-api-real-http-activation-transition-contract'",
  "'smoke:amazon-sp-api-guarded-lwa-http-activation-handoff-contract'",
  "'smoke:amazon-sp-api-guarded-lwa-http-transport-branch-runtime'",
  "'smoke:amazon-sp-api-guarded-lwa-http-transport-test-double'",
  "'smoke:amazon-sp-api-real-lwa-guarded-http-activation-contract'",
  "nextSuggestedStep: 'Step137-N'",
]) {
  assertIncludes('contract', contract, marker);
}

for (const forbidden of [
  "implementParserNow: true",
  "invokeParserNow: true",
  "executeHttpNow: true",
  "wireControllerNow: true",
  "wireOAuthCallbackNow: true",
  "persistTokensNow: true",
  "rawAccessTokenMayBeReturned: true",
  "rawRefreshTokenMayBeReturned: true",
  "rawLwaResponseMayBeReturned: true",
  "rawResponseBodyMayBeReturned: true",
  "rawResponseHeadersMayBeReturned: true",
  "parseRuntimeResponseNow: true",
  "callAmazonNow: true",
  "createHttpClientNow: true",
  "mutateTokenPersistenceNow: true",
  "encryptTokensNow: true",
  "writeDatabaseNow: true",
  "createImportJobNow: true",
  "createTransactionNow: true",
  "createInventoryMovementNow: true",
  "changeOAuthCallbackNow: true",
  "changeDiagnosticEndpointNow: true",
  "noPlaintextTokenDatabaseWrite: false",
  "noRawTokenInLogs: false",
  "noRawTokenInThrownErrors: false",
  "noRawTokenInReturnedEnvelope: false",
]) {
  assertNotIncludes('contract', contract, forbidden);
}

assertIncludes('transition', transition, "source: 'amazon-sp-api-real-http-activation-transition-contract'");
assertIncludes('transition', transition, "step: 'Step137-L'");
assertIncludes('transition', transition, "nextSuggestedStep: 'Step137-M'");

assertIncludes('service', service, 'executeRealLwaTokenExchangeHttpGuardedLater');
assertIncludes('service', service, "transportMode: 'test-double-no-network'");
assertIncludes('service', service, 'networkCallNow: false');
assertIncludes('service', service, 'executableHttpClientUsedNow: false');
assertIncludes('service', service, 'tokenPersistenceDatabaseWriteNow: false');
assertIncludes('service', service, 'rawAccessTokenReturnedNow: false');
assertIncludes('service', service, 'rawRefreshTokenReturnedNow: false');
// Step137-N intentionally implements the planned sanitized parser test double.
// Keep this legacy Step137-M contract smoke focused on parser safety boundaries:
// parser exists, but controller/HTTP/persistence/raw-token exposure remain forbidden.
assertIncludes('service', service, 'parseRealLwaHttpResponseSanitizedLater');
assertIncludes('service', service, "source: 'amazon-sp-api-sanitized-lwa-http-response-parser'");
assertIncludes('service', service, "parserMode: 'sanitized-only'");
assertIncludes('service', service, 'rawLwaResponseReturnedNow: false');
assertIncludes('service', service, 'rawResponseBodyReturnedNow: false');
assertIncludes('service', service, 'rawResponseHeadersReturnedNow: false');
assertIncludes('service', service, 'rawAccessTokenReturnedNow: false');
assertIncludes('service', service, 'rawRefreshTokenReturnedNow: false');
assertIncludes('service', service, 'tokenPersistenceDatabaseWriteNow: false');

assertIncludes('controller', controller, 'exchangeAuthorizationCodeDryRunnable');
assertIncludes('controller', controller, "Get('internal/amazon-sp-api/lwa-activation-gate/status')");
assertNotIncludes('controller', controller, 'parseRealLwaHttpResponseSanitizedLater');
assertNotIncludes('controller', controller, 'executeRealLwaTokenExchangeHttpGuardedLater');
assertNotIncludes('controller', controller, 'executeRealLwaTokenExchangeHttpLater');

console.log('========== Step137-M sanitized LWA HTTP response parser contract smoke passed ==========');
