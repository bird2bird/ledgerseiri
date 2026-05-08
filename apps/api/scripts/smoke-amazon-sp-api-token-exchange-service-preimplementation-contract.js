#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiTokenExchangeServicePreimplementationContract,
  buildAmazonSpApiTokenExchangeServicePreimplementationContract,
} = require("../dist/src/imports/dto/amazon-sp-api-token-exchange-service-preimplementation-contract.dto");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function assertNoForbiddenImplementationSyntax(dtoText) {
  const lines = dtoText.split(/\r?\n/);

  for (const [index, rawLine] of lines.entries()) {
    const lineNumber = index + 1;
    const line = rawLine.trim();

    if (/^import\s+.*\baxios\b/.test(line)) {
      throw new Error(`Step128-A DTO must not import axios at line ${lineNumber}`);
    }

    if (/require\s*\(\s*["']axios["']\s*\)/.test(line)) {
      throw new Error(`Step128-A DTO must not require axios at line ${lineNumber}`);
    }

    if (/\baxios\s*\./.test(line)) {
      throw new Error(`Step128-A DTO must not call axios at line ${lineNumber}`);
    }

    if (/^import\s+\{[^}]*\bPrismaClient\b[^}]*\}\s+from\s+["']@prisma\/client["']/.test(line)) {
      throw new Error(`Step128-A DTO must not import PrismaClient at line ${lineNumber}`);
    }

    if (/\bnew\s+PrismaClient\s*\(/.test(line)) {
      throw new Error(`Step128-A DTO must not instantiate PrismaClient at line ${lineNumber}`);
    }

    if (/\bPrismaClient\s*\./.test(line)) {
      throw new Error(`Step128-A DTO must not call PrismaClient at line ${lineNumber}`);
    }

    if (/\bfetch\s*\(/.test(line)) {
      throw new Error(`Step128-A DTO must not call fetch at line ${lineNumber}`);
    }

    if (/persistEncryptedRefreshCredential\s*\(/.test(line)) {
      throw new Error(`Step128-A DTO must not write refresh credential at line ${lineNumber}`);
    }

    if (/persistEncryptedAccessTokenCache\s*\(/.test(line)) {
      throw new Error(`Step128-A DTO must not write access token cache at line ${lineNumber}`);
    }
  }
}

function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");
  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-token-exchange-service-preimplementation-contract"] ===
      "node scripts/smoke-amazon-sp-api-token-exchange-service-preimplementation-contract.js",
    "Step128-A smoke script missing or mismatched",
  );

  const dtoFile = path.resolve(
    apiRoot,
    "src/imports/dto/amazon-sp-api-token-exchange-service-preimplementation-contract.dto.ts",
  );
  const dtoText = read(dtoFile);

  for (const marker of [
    "AMAZON_SP_API_TOKEN_EXCHANGE_SERVICE_PREIMPLEMENTATION_CONTRACT_VERSION",
    "sourceStep127D",
    "sourceStep123E",
    "AmazonSpApiTokenExchangeService",
    "exchangeAuthorizationCodeDryRunnable",
    "readyForStep128BTokenExchangeServiceFakeTransportImplementation",
    "noFetchImportNow",
    "noAxiosImportNow",
    "noAmazonLwaEndpointCallNow",
    "noPrismaClientNow",
    "noTokenRepositoryWriteNow",
  ]) {
    assert(dtoText.includes(marker), `Step128-A DTO missing marker: ${marker}`);
  }

  assert(
    dtoText.includes("https://api.amazon.com/auth/o2/token"),
    "Step128-A must preserve planned LWA endpoint as data contract",
  );

  assertNoForbiddenImplementationSyntax(dtoText);

  const plannedServiceFile = path.resolve(apiRoot, "src/imports/amazon-sp-api-token-exchange.service.ts");
  const step128BDtoFile = path.resolve(
    apiRoot,
    "src/imports/dto/amazon-sp-api-token-exchange-service-fake-transport-implementation-contract.dto.ts",
  );

  const step128BPhaseActive =
    fs.existsSync(step128BDtoFile) &&
    packageJson.scripts["smoke:amazon-sp-api-token-exchange-service-fake-transport-implementation-contract"] ===
      "node scripts/smoke-amazon-sp-api-token-exchange-service-fake-transport-implementation-contract.js";

  if (!step128BPhaseActive) {
    assert(!fs.existsSync(plannedServiceFile), "Step128-A must not add concrete token exchange service file before Step128-B");
  } else {
    assert(fs.existsSync(plannedServiceFile), "Step128-B phase requires concrete fake-transport token exchange service file");

    const serviceText = read(plannedServiceFile);

    for (const marker of [
      "AmazonSpApiTokenExchangeService",
      "exchangeAuthorizationCodeDryRunnable",
      "transportMode: 'fake'",
      "tokenExchangeHttpCallNow: false",
      "tokenPersistenceDatabaseWriteNow: false",
    ]) {
      assert(serviceText.includes(marker), `Step128-B phase service missing marker while running Step128-A regression: ${marker}`);
    }

    assert(!/api\.amazon\.com\/auth\/o2\/token|lwa\.amazon\.com\/auth\/o2\/token/i.test(serviceText), "Step128-B phase service must not reference real LWA endpoint");
    assert(!/\bfetch\s*\(/.test(serviceText), "Step128-B phase service must not call fetch");
    assert(!/\baxios\s*\./.test(serviceText), "Step128-B phase service must not call axios");
    assert(!/\bhttpService\s*\./.test(serviceText), "Step128-B phase service must not call httpService");
    assert(!/PrismaClient/.test(serviceText), "Step128-B phase service must not access PrismaClient");
    assert(!/persistEncryptedRefreshCredential\s*\(/.test(serviceText), "Step128-B phase service must not write refresh credential");
    assert(!/persistEncryptedAccessTokenCache\s*\(/.test(serviceText), "Step128-B phase service must not write access token cache");
  }

  const contract = assertAmazonSpApiTokenExchangeServicePreimplementationContract(
    buildAmazonSpApiTokenExchangeServicePreimplementationContract(),
  );

  assert(contract.sourceStep127D.summary.readyForStep128ATokenExchangeServicePreimplementationContract === true, "Step127-D must allow Step128-A");
  assert(contract.sourceStep123E.tokenExchangeBoundary.httpCallForbiddenNow === true, "Step123-E preflight must still forbid HTTP");
  assert(contract.contractOnly === true, "Step128-A must remain contract-only");
  assert(contract.serviceImplementationNow === false, "Step128-A must not implement service");
  assert(contract.serviceFileAddedNow === false, "Step128-A must not add concrete service file");
  assert(contract.controllerIntegrationNow === false, "Step128-A must not integrate controller");
  assert(contract.callbackRouteCallsServiceNow === false, "Step128-A callback route must not call service");
  assert(contract.tokenExchangeHttpCallNow === false, "Step128-A must not call token exchange");
  assert(contract.tokenPersistenceDatabaseWriteNow === false, "Step128-A must not write token DB");
  assert(contract.summary.readyForStep128BTokenExchangeServiceFakeTransportImplementation === true, "Step128-B readiness mismatch");

  console.log("[SMOKE_OK] amazon sp-api token exchange service preimplementation contract passed");
  console.log(JSON.stringify({
    ok: true,
    step: "Step128-A",
    files: {
      dto: path.relative(repoRoot, dtoFile).replaceAll(path.sep, "/"),
      smoke: path.relative(repoRoot, __filename).replaceAll(path.sep, "/"),
    },
    plannedNext: "Step128-B: token exchange service fake-transport implementation boundary",
    summary: contract.summary,
  }, null, 2));
}

try {
  main();
} catch (err) {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
}
