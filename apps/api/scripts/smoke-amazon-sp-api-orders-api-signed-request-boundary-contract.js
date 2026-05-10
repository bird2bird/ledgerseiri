#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiOrdersApiSignedRequestBoundaryContract,
  buildAmazonSpApiOrdersApiSignedRequestBoundaryContract,
} = require("../dist/src/imports/dto/amazon-sp-api-orders-api-signed-request-boundary-contract.dto");

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`[OK] ${message}`);
}

function read(file) {
  if (!fs.existsSync(file)) throw new Error(`Missing file: ${file}`);
  return fs.readFileSync(file, "utf8");
}

function listFiles(dir, predicate, acc = []) {
  if (!fs.existsSync(dir)) return acc;

  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);

    if (stat.isDirectory()) {
      if (
        name === "node_modules" ||
        name === "dist" ||
        name === ".next" ||
        name === "coverage" ||
        name === ".git"
      ) {
        continue;
      }
      listFiles(p, predicate, acc);
      continue;
    }

    if (predicate(p)) acc.push(p);
  }

  return acc;
}

function isDtoOrContractFile(file) {
  return file.includes(`${path.sep}src${path.sep}imports${path.sep}dto${path.sep}`) || file.endsWith(".dto.ts");
}

function isAllowedExistingSandboxFile(file, text) {
  return (
    text.includes("AmazonSpApiSandbox") ||
    text.includes("amazon-sp-api-sandbox") ||
    text.includes("AMAZON_ORDER_SP_API") ||
    file.includes(`${path.sep}scripts${path.sep}smoke-amazon-sp-api-sandbox`)
  );
}

function isAllowedExistingAuthOrTokenInfrastructureFile(file, text) {
  const normalized = file.replaceAll(path.sep, "/");

  if (
    normalized.endsWith("apps/api/src/imports/amazon-sp-api-token-exchange.service.ts") ||
    normalized.endsWith("apps/api/src/imports/amazon-sp-api-token-persistence.service.ts") ||
    normalized.endsWith("apps/api/src/imports/amazon-sp-api-token-persistence.repository.ts") ||
    normalized.endsWith("apps/api/src/imports/amazon-sp-api-oauth-state.service.ts") ||
    normalized.endsWith("apps/api/src/imports/amazon-sp-api-lwa-config.service.ts") ||
    normalized.endsWith("apps/api/src/imports/amazon-sp-api-lwa-activation-gate.service.ts")
  ) {
    return true;
  }

  return (
    text.includes("Step139") ||
    text.includes("Step138") ||
    text.includes("Step137") ||
    text.includes("Step136") ||
    text.includes("Step135") ||
    text.includes("Step134") ||
    text.includes("Step133") ||
    text.includes("Step132") ||
    text.includes("Step131") ||
    text.includes("Step130") ||
    text.includes("Step129") ||
    text.includes("Step128") ||
    text.includes("Step127")
  ) && (
    text.includes("token-exchange") ||
    text.includes("token persistence") ||
    text.includes("OAuth") ||
    text.includes("LWA") ||
    text.includes("LoginWithAmazon")
  );
}

function assertNoStep140CImplementationLeak(repoRoot) {
  const apiRoot = path.resolve(repoRoot, "apps/api");
  const apiSrcRoot = path.resolve(apiRoot, "src");

  const implementationFiles = listFiles(apiSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p))
    .filter((file) => !isDtoOrContractFile(file));

  const routeLeaks = [];
  const serviceLeaks = [];
  const requestBuilderLeaks = [];
  const signedRequestLeaks = [];
  const cryptoLeaks = [];
  const httpLeaks = [];
  const realOrdersCallLeaks = [];
  const writeLeaks = [];
  const schemaLeaks = [];

  const routePatterns = [
    /@Get\s*\([^)]*(orders|order-items|amazon-sp-api\/orders|sp-api\/orders)/i,
    /@Post\s*\([^)]*(orders|order-items|amazon-sp-api\/orders|sp-api\/orders)/i,
  ];

  const serviceFragments = [
    "getAmazonSpApiOrders",
    "readAmazonSpApiOrders",
    "fetchAmazonSpApiOrders",
    "AmazonSpApiOrdersReadService",
    "AmazonSpApiOrdersRequestBuilderService",
    "AmazonSpApiOrdersSignedRequestService",
    "ordersApiSignedRequest",
  ];

  const requestBuilderFragments = [
    "buildAmazonSpApiOrdersApiRequest",
    "buildAmazonOrdersApiRequest",
    "buildListOrdersRequest",
    "buildGetOrderRequest",
    "buildGetOrderItemsRequest",
    "AmazonSpApiOrdersApiRequestBuilder",
    "AmazonOrdersApiRequestBuilder",
  ];

  const signedRequestFragments = [
    "buildAmazonSpApiOrdersSignedRequest",
    "buildAmazonOrdersSignedRequest",
    "createAmazonOrdersSignedRequest",
    "AmazonSpApiOrdersSignedRequestBuilder",
    "AmazonOrdersSignedRequestBuilder",
    "canonicalRequest",
    "stringToSign",
    "credentialScope",
  ];

  const cryptoFragments = [
    "crypto.createHmac",
    "crypto.createHash",
    "createHmac(",
    "createHash(",
    "SignatureV4",
    "AwsSigv4",
    "AWS4-HMAC-SHA256",
    "getSigningKey",
    "deriveSigningKey",
  ];

  const httpFragments = [
    "executeAmazonOrdersRequest",
    "AmazonOrdersApiHttpClient",
    "AmazonSpApiOrdersHttpClient",
    "fetch(",
    "axios.",
    "got(",
  ];

  const realOrdersFragments = [
    "getOrders(",
    "getOrder(",
    "getOrderItems(",
    "/orders/v0/orders",
    "orders/v0/orders",
    "GET_ORDERS_DATA",
    "ListOrders",
    "AmazonOrdersApiReadService",
    "readAmazonSpApiOrders",
    "fetchAmazonSpApiOrders",
  ];

  const writeFragments = [
    "importJob.create",
    "importJob.update",
    "importStagingRow.create",
    "importStagingRow.createMany",
    "transaction.create",
    "transaction.createMany",
    "inventoryMovement.create",
    "inventoryMovement.createMany",
    "inventoryBalance.update",
    "inventoryBalance.upsert",
    "deductInventory",
    "commitAmazonOrder",
    "commitSales",
    "bankReconciliation",
    "settlementReconciliation",
  ];

  for (const file of implementationFiles) {
    const text = read(file);
    const rel = path.relative(repoRoot, file).replaceAll(path.sep, "/");
    const allowedSandbox = isAllowedExistingSandboxFile(file, text);
    const allowedExistingAuthOrTokenInfrastructure = isAllowedExistingAuthOrTokenInfrastructureFile(file, text);

    // Step140-C:
    // Generic crypto/HTTP strings may exist in unrelated modules. Only block when the file is in Amazon Orders context.
    const hasAmazonOrdersContext =
      text.includes("amazon-sp-api") ||
      text.includes("AmazonSpApi") ||
      text.includes("sellingpartnerapi") ||
      text.includes("selling-partner-api") ||
      text.includes("orders/v0/orders") ||
      text.includes("/orders/v0/orders") ||
      text.includes("AmazonOrders") ||
      text.includes("AmazonSpApiOrders") ||
      text.includes("getOrders(") ||
      text.includes("getOrder(") ||
      text.includes("getOrderItems(");

    for (const pattern of routePatterns) {
      if (pattern.test(text) && !allowedSandbox) routeLeaks.push(rel);
    }

    if (hasAmazonOrdersContext && serviceFragments.some((fragment) => text.includes(fragment)) && !allowedSandbox) {
      serviceLeaks.push(rel);
    }

    if (hasAmazonOrdersContext && requestBuilderFragments.some((fragment) => text.includes(fragment)) && !allowedSandbox) {
      requestBuilderLeaks.push(rel);
    }

    if (
      hasAmazonOrdersContext &&
      signedRequestFragments.some((fragment) => text.includes(fragment)) &&
      !allowedSandbox &&
      !allowedExistingAuthOrTokenInfrastructure
    ) {
      signedRequestLeaks.push(rel);
    }

    if (
      hasAmazonOrdersContext &&
      cryptoFragments.some((fragment) => text.includes(fragment)) &&
      !allowedSandbox &&
      !allowedExistingAuthOrTokenInfrastructure
    ) {
      cryptoLeaks.push(rel);
    }

    if (
      hasAmazonOrdersContext &&
      httpFragments.some((fragment) => text.includes(fragment)) &&
      !allowedSandbox &&
      !allowedExistingAuthOrTokenInfrastructure
    ) {
      httpLeaks.push(rel);
    }

    if (
      hasAmazonOrdersContext &&
      realOrdersFragments.some((fragment) => text.includes(fragment)) &&
      !allowedSandbox &&
      !allowedExistingAuthOrTokenInfrastructure
    ) {
      realOrdersCallLeaks.push(rel);
    }

    const hasRealAmazonContext =
      text.includes("amazon-sp-api") ||
      text.includes("AmazonSpApi") ||
      text.includes("sellingpartnerapi") ||
      text.includes("selling-partner-api");

    if (hasRealAmazonContext && writeFragments.some((fragment) => text.includes(fragment)) && !allowedSandbox) {
      writeLeaks.push(rel);
    }
  }

  const schema = read(path.resolve(apiRoot, "prisma/schema.prisma"));
  const forbiddenSchemaMarkers = [
    "model AmazonSpApiOrder",
    "model AmazonSpApiOrderItem",
    "model AmazonOrderReadCursor",
    "model AmazonOrdersApiSyncState",
    "model AmazonOrdersApiRequest",
    "model AmazonOrdersSignedRequest",
  ];

  for (const marker of forbiddenSchemaMarkers) {
    if (schema.includes(marker)) schemaLeaks.push(marker);
  }

  assert(routeLeaks.length === 0, `no Step140-C Orders API controller route leak: ${JSON.stringify(routeLeaks)}`);
  assert(serviceLeaks.length === 0, `no Step140-C Orders API service implementation leak: ${JSON.stringify(serviceLeaks)}`);
  assert(requestBuilderLeaks.length === 0, `no Step140-C request builder implementation leak: ${JSON.stringify(requestBuilderLeaks)}`);
  assert(signedRequestLeaks.length === 0, `no Step140-C signed request implementation leak: ${JSON.stringify(signedRequestLeaks)}`);
  assert(cryptoLeaks.length === 0, `no Step140-C crypto/SigV4 execution leak: ${JSON.stringify(cryptoLeaks)}`);
  assert(httpLeaks.length === 0, `no Step140-C HTTP implementation leak: ${JSON.stringify(httpLeaks)}`);
  assert(realOrdersCallLeaks.length === 0, `no Step140-C getOrders/getOrder/getOrderItems leak: ${JSON.stringify(realOrdersCallLeaks)}`);
  assert(writeLeaks.length === 0, `no Step140-C ImportJob/StagingRow/Transaction/Inventory write leak: ${JSON.stringify(writeLeaks)}`);
  assert(schemaLeaks.length === 0, `no Step140-C Prisma schema model leak: ${JSON.stringify(schemaLeaks)}`);

  return {
    scannedApiImplementationFiles: implementationFiles.length,
    routeLeaks,
    serviceLeaks,
    requestBuilderLeaks,
    signedRequestLeaks,
    cryptoLeaks,
    httpLeaks,
    realOrdersCallLeaks,
    writeLeaks,
    schemaLeaks,
  };
}

async function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");

  console.log("========== Step140-C Amazon SP-API Orders API signed request boundary contract smoke ==========");

  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));
  assert(
    packageJson.scripts["smoke:amazon-sp-api-orders-api-signed-request-boundary-contract"] ===
      "node scripts/smoke-amazon-sp-api-orders-api-signed-request-boundary-contract.js",
    "apps/api package.json registers Step140-C smoke",
  );

  assert(
    packageJson.scripts["smoke:amazon-sp-api-orders-api-request-builder-contract"],
    "Step140-B request builder regression smoke remains registered",
  );

  const step140BDtoSource = read(
    path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-orders-api-request-builder-contract.dto.ts"),
  );

  assert(
    step140BDtoSource.includes("readyForOrdersApiSignedRequestContract: true"),
    "Step140-B source allows Step140-C signed request contract",
  );

  const dtoSource = read(
    path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-orders-api-signed-request-boundary-contract.dto.ts"),
  );

  const smokeSource = read(
    path.resolve(apiRoot, "scripts/smoke-amazon-sp-api-orders-api-signed-request-boundary-contract.js"),
  );

  const requiredSmokeMarkers = [
    "Step140-C",
    "hasAmazonOrdersContext",
    "Generic crypto/HTTP strings may exist in unrelated modules",
    "no Step140-C crypto/SigV4 execution leak",
  ];

  for (const marker of requiredSmokeMarkers) {
    assert(smokeSource.includes(marker), `Step140-C smoke scanner marker exists: ${marker}`);
  }

  const requiredDtoMarkers = [
    "AMAZON_SP_API_ORDERS_API_SIGNED_REQUEST_BOUNDARY_CONTRACT_VERSION",
    "buildAmazonSpApiOrdersApiSignedRequestBoundaryContract",
    "assertAmazonSpApiOrdersApiSignedRequestBoundaryContract",
    "assertAmazonSpApiOrdersApiRequestBuilderContract",
    "sourceStep140B",
    "design-amazon-sp-api-orders-api-signed-request-boundary-contract-only",
    "canonicalRequestDesignOnly",
    "stringToSignDesignOnly",
    "signingKeyDerivationDesignOnly",
    "authorizationHeaderDesignOnly",
    "noCryptoExecution",
    "noAwsCredentialRead",
    "algorithm: 'AWS4-HMAC-SHA256'",
    "service: 'execute-api'",
    "requestTerminator: 'aws4_request'",
    "feEndpointUsesUsWest2RegionInFuture",
    "canonicalRequestMustNotBeLoggedRaw",
    "hostHeaderRequired",
    "xAmzAccessTokenHeaderRequired",
    "xAmzDateHeaderRequired",
    "authorizationHeaderRequiredAfterSigningFuture",
    "rawAwsSecretKeyForbiddenAlways",
    "debugCanonicalRequestHashOnly",
    "debugStringToSignHashOnly",
    "sampleSigV4Region: 'us-west-2'",
    "sampleEndpoint: 'https://sellingpartnerapi-fe.amazon.com'",
    "samplePath: '/orders/v0/orders'",
    "sampleAlgorithm: 'AWS4-HMAC-SHA256'",
    "readyForOrdersApiSignedRequestImplementation",
    "readyForOrdersApiHttpClientContract",
  ];

  for (const marker of requiredDtoMarkers) {
    assert(dtoSource.includes(marker), `Step140-C DTO marker exists: ${marker}`);
  }

  const forbiddenDtoMarkers = [
    "crypto.createHmac",
    "crypto.createHash",
    "createHmac(",
    "createHash(",
    "SignatureV4(",
    "fetch(",
    "axios.",
    "got(",
    "getOrders({",
    "getOrder({",
    "getOrderItems({",
    "prisma.importJob.create",
    "prisma.importStagingRow.create",
    "prisma.transaction.create",
    "prisma.inventoryMovement.create",
  ];

  for (const marker of forbiddenDtoMarkers) {
    assert(!dtoSource.includes(marker), `Step140-C DTO does not contain implementation marker: ${marker}`);
  }

  const contract = assertAmazonSpApiOrdersApiSignedRequestBoundaryContract(
    buildAmazonSpApiOrdersApiSignedRequestBoundaryContract(),
  );

  assert(contract.step === "Step140-C", "contract step is Step140-C");
  assert(contract.contractOnly === true, "contract remains contract-only");
  assert(contract.implementationNow === false, "implementationNow remains false");
  assert(contract.realCryptoExecutionNow === false, "real crypto execution remains disabled");
  assert(contract.awsCredentialReadNow === false, "AWS credential read remains disabled");
  assert(contract.realOrdersApiHttpCallNow === false, "real Orders API HTTP call remains disabled");
  assert(contract.writesDatabase === false, "contract does not write database");
  assert(contract.sigV4ScopeContract.algorithm === "AWS4-HMAC-SHA256", "SigV4 algorithm is explicit");
  assert(contract.sigV4ScopeContract.service === "execute-api", "SigV4 service is explicit");
  assert(contract.sampleSignedRequestContract.sampleSigV4Region === "us-west-2", "FE signing region is explicit");
  assert(contract.forbiddenNow.cryptoCreateHmac === true, "crypto.createHmac is forbidden now");
  assert(contract.forbiddenNow.cryptoCreateHash === true, "crypto.createHash is forbidden now");
  assert(contract.forbiddenNow.awsCredentialRead === true, "AWS credential read is forbidden now");
  assert(contract.forbiddenNow.accessTokenRefresh === true, "access token refresh is forbidden now");
  assert(contract.forbiddenNow.restrictedDataTokenRequest === true, "RDT request is forbidden now");
  assert(contract.forbiddenNow.getOrdersExecution === true, "getOrders execution is forbidden now");
  assert(contract.forbiddenNow.importJobWrite === true, "ImportJob write is forbidden now");
  assert(contract.forbiddenNow.importStagingRowWrite === true, "ImportStagingRow write is forbidden now");
  assert(contract.forbiddenNow.transactionWrite === true, "Transaction write is forbidden now");
  assert(contract.forbiddenNow.inventoryDeduction === true, "Inventory deduction is forbidden now");
  assert(contract.summary.readyForOrdersApiSignedRequestImplementation === false, "signed request implementation is not allowed yet");
  assert(contract.summary.readyForOrdersApiHttpClientContract === true, "next HTTP client contract step is allowed");
  assert(contract.summary.readyForOrdersApiHttpClientImplementation === false, "real HTTP implementation is not allowed yet");

  const implementationGuard = assertNoStep140CImplementationLeak(repoRoot);

  console.log("[SMOKE_OK] Step140-C Amazon SP-API Orders API signed request boundary contract smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "Step140-C",
        contract: {
          version: contract.version,
          step: contract.step,
          contractOnly: contract.contractOnly,
          implementationNow: contract.implementationNow,
          controllerRouteAddedNow: contract.controllerRouteAddedNow,
          frontendRouteAddedNow: contract.frontendRouteAddedNow,
          serviceMethodAddedNow: contract.serviceMethodAddedNow,
          requestBuilderImplementationNow: contract.requestBuilderImplementationNow,
          signedRequestImplementationNow: contract.signedRequestImplementationNow,
          httpClientAddedNow: contract.httpClientAddedNow,
          realCryptoExecutionNow: contract.realCryptoExecutionNow,
          awsCredentialReadNow: contract.awsCredentialReadNow,
          accessTokenRefreshNow: contract.accessTokenRefreshNow,
          restrictedDataTokenRequestNow: contract.restrictedDataTokenRequestNow,
          realOrdersApiHttpCallNow: contract.realOrdersApiHttpCallNow,
          importJobWriteNow: contract.importJobWriteNow,
          importStagingRowWriteNow: contract.importStagingRowWriteNow,
          transactionWriteNow: contract.transactionWriteNow,
          inventoryWriteNow: contract.inventoryWriteNow,
          schemaChangedNow: contract.schemaChangedNow,
          migrationAddedNow: contract.migrationAddedNow,
          writesDatabase: contract.writesDatabase,
          signedRequestBoundary: contract.signedRequestBoundary,
          sigV4ScopeContract: contract.sigV4ScopeContract,
          canonicalRequestShapeContract: contract.canonicalRequestShapeContract,
          requiredHeadersContract: contract.requiredHeadersContract,
          signingInputContract: contract.signingInputContract,
          signedOutputContract: contract.signedOutputContract,
          sampleSignedRequestContract: contract.sampleSignedRequestContract,
          redactionContract: contract.redactionContract,
          isolationContract: contract.isolationContract,
          forbiddenNow: contract.forbiddenNow,
          summary: contract.summary,
        },
        implementationGuard,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
});
