#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiTokenPersistenceRepositoryServiceImplementationContract,
  buildAmazonSpApiTokenPersistenceRepositoryServiceImplementationContract,
} = require("../dist/src/imports/dto/amazon-sp-api-token-persistence-repository-service-implementation-contract.dto");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");

  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));
  assert(
    packageJson.scripts["smoke:amazon-sp-api-token-persistence-repository-service-implementation-contract"] ===
      "node scripts/smoke-amazon-sp-api-token-persistence-repository-service-implementation-contract.js",
    "Step125-B npm script missing or mismatched",
  );

  const repoFile = path.resolve(apiRoot, "src/imports/amazon-sp-api-token-persistence.repository.ts");
  const serviceFile = path.resolve(apiRoot, "src/imports/amazon-sp-api-token-persistence.service.ts");
  const moduleFile = path.resolve(apiRoot, "src/imports/imports.module.ts");
  const controllerFile = path.resolve(apiRoot, "src/imports/imports.controller.ts");

  const repoText = read(repoFile);
  const serviceText = read(serviceFile);
  const moduleText = read(moduleFile);
  const controllerText = fs.existsSync(controllerFile) ? read(controllerFile) : "";

  for (const marker of [
    "export class AmazonSpApiTokenPersistenceRepository",
    "upsertConnectionWithEncryptedRefreshCredential",
    "upsertAccessTokenCache",
    "readConnectionStatus",
    "revokeConnection",
    "appendAudit",
    "encryptedRefreshToken",
    "encryptedAccessToken",
    "companyId_storeId_marketplaceId_region",
    "appId",
    "connectedAt",
    "revokedAt",
    "rotatedAt",
    "scope:",
    "messageRedacted",
    "AmazonSpApiConnectionStatus.CONNECTED",
    "AmazonSpApiConnectionStatus.REVOKED",
  ]) {
    assert(repoText.includes(marker), `Repository missing marker: ${marker}`);
  }

  for (const marker of [
    "export class AmazonSpApiTokenPersistenceService",
    "persistEncryptedRefreshCredential",
    "persistEncryptedAccessTokenCache",
    "readConnectionStatus",
    "revokeConnection",
    "assertNonEmpty",
    "assertPositiveInteger",
    "appId",
  ]) {
    assert(serviceText.includes(marker), `Service missing marker: ${marker}`);
  }

  for (const marker of [
    "AmazonSpApiTokenPersistenceRepository",
    "AmazonSpApiTokenPersistenceService",
    "providers: [",
    "exports: [ImportsService, AmazonSpApiTokenPersistenceService]",
  ]) {
    assert(moduleText.includes(marker), `ImportsModule missing marker: ${marker}`);
  }

  assert(!repoText.includes("lastAuthorizedAt"), "Repository must not use non-schema field lastAuthorizedAt");
  assert(!repoText.includes("disconnectedAt"), "Repository must not use non-schema field disconnectedAt");
  assert(!repoText.includes("scopeJson"), "Repository must not use non-schema field scopeJson");
  // Only reject real object-literal fields named `message:`.
  // Do not reject harmless local variables or function parameters like
  // `redactSecretLikeText(message: string | undefined)`.
  assert(!/(^|[,{\\n])\\s*message\\s*:/.test(repoText), "Repository must use messageRedacted object fields, not message object fields");
  assert(!/return\s+.*encryptedRefreshToken/.test(repoText), "Repository must not return encryptedRefreshToken");
  assert(!/return\s+.*encryptedAccessToken/.test(repoText), "Repository must not return encryptedAccessToken");
  assert(!/fetch\s*\(/.test(repoText + serviceText), "Step125-B must not perform HTTP token exchange");
  assert(!/amazon\.com\/auth\/o2\/token|api\.amazon\.com\/auth\/o2\/token/i.test(repoText + serviceText), "Step125-B must not include LWA token endpoint");
  assert(!/@(Get|Post|Patch|Delete)\s*\([^)]*(oauth|lwa|callback|authorization|authorize|token|credential|connection)/i.test(controllerText), "Step125-B must not add OAuth/token routes");

  const contract = assertAmazonSpApiTokenPersistenceRepositoryServiceImplementationContract(
    buildAmazonSpApiTokenPersistenceRepositoryServiceImplementationContract(),
  );

  assert(contract.sourceStep125A.summary.readyForStep125BTokenPersistenceRepositoryServiceImplementation === true, "Step125-A must allow Step125-B");
  assert(contract.repositoryImplementationNow === true, "Step125-B must implement repository");
  assert(contract.tokenPersistenceServiceImplementationNow === true, "Step125-B must implement service");
  assert(contract.oauthCallbackRouteAddedNow === false, "Step125-B must not add OAuth callback route");
  assert(contract.tokenExchangeHttpCallNow === false, "Step125-B must not add LWA token exchange");
  assert(contract.schemaAlignedFields.appIdRequired === true, "Step125-B must require appId");
  assert(contract.summary.readyForStep125CTokenPersistenceRuntimeSmoke === true, "Step125-B should enable Step125-C");

  console.log("[SMOKE_OK] amazon sp-api token persistence repository/service implementation contract smoke passed");
  console.log(JSON.stringify({
    ok: true,
    step: "Step125-B",
    files: {
      repository: path.relative(repoRoot, repoFile).replaceAll(path.sep, "/"),
      service: path.relative(repoRoot, serviceFile).replaceAll(path.sep, "/"),
      module: path.relative(repoRoot, moduleFile).replaceAll(path.sep, "/"),
    },
    summary: contract.summary,
  }, null, 2));
}

try {
  main();
} catch (err) {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
}
