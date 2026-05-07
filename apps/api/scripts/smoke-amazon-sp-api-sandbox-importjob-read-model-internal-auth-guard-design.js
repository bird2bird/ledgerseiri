#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const {
  buildAmazonSpApiSandboxImportJobReadModelInternalAuthGuardDesign,
  assertAmazonSpApiSandboxImportJobReadModelInternalAuthGuardDesign,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-importjob-read-model-internal-auth-guard-design.dto");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function listFiles(dir, predicate, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) listFiles(p, predicate, acc);
    else if (predicate(p)) acc.push(p);
  }
  return acc;
}

function routeSourceFrom(controllerSource) {
  const marker = "Step122-O: Amazon SP-API sandbox ImportJob read-model readonly controller service-call implementation.";
  const start = controllerSource.indexOf(marker);
  const end = controllerSource.indexOf("@Post('detect-month-conflicts')", start);

  assert(start >= 0, "Step122-O route marker missing");
  assert(end > start, "Step122-O route end anchor missing");

  return controllerSource.slice(start, end);
}

function assertNoFrontendLeak(repoRoot) {
  const webSrcRoot = path.resolve(repoRoot, "apps/web/src");
  const files = listFiles(webSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p));
  const leaks = [];

  for (const file of files) {
    const text = read(file);
    if (
      text.includes("/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model") ||
      text.includes("internal/amazon-sp-api-sandbox/import-jobs/read-model") ||
      text.includes("listAmazonSpApiSandboxImportJobsReadModelDryRun")
    ) {
      leaks.push(path.relative(repoRoot, file));
    }
  }

  assert(leaks.length === 0, `frontend leak detected: ${JSON.stringify(leaks)}`);

  return {
    scannedFiles: files.length,
    leaks,
  };
}

async function main() {
  const root = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(root, "..", "..");

  const packageJson = JSON.parse(read(path.resolve(root, "package.json")));
  const importsController = read(path.resolve(root, "src/imports/imports.controller.ts"));
  const importsService = read(path.resolve(root, "src/imports/imports.service.ts"));
  const jwtGuard = read(path.resolve(root, "src/auth/jwt.guard.ts"));
  const jwtStrategy = read(path.resolve(root, "src/auth/jwt.strategy.ts"));
  const authController = read(path.resolve(root, "src/auth/auth.controller.ts"));
  const authModule = read(path.resolve(root, "src/auth/auth.module.ts"));
  const schema = read(path.resolve(root, "prisma/schema.prisma"));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-sandbox-importjob-read-model-internal-auth-guard-design"],
    "Step122-R smoke script missing",
  );

  const contract = assertAmazonSpApiSandboxImportJobReadModelInternalAuthGuardDesign(
    buildAmazonSpApiSandboxImportJobReadModelInternalAuthGuardDesign(),
  );

  assert(contract.designOnly === true, "Step122-R must remain design-only");
  assert(contract.authGuardImplementedNow === false, "Step122-R must not implement auth guard");
  assert(contract.endpointStillRuntimeCallableNow === true, "Step122-R must keep runtime endpoint callable");
  assert(contract.frontendExposedNow === false, "frontend must remain disabled");
  assert(contract.writesDatabase === false, "writes must remain disabled");

  assert(jwtGuard.includes("extends AuthGuard('jwt')"), "JwtAuthGuard must wrap AuthGuard('jwt')");
  assert(jwtStrategy.includes("ExtractJwt.fromAuthHeaderAsBearerToken()"), "JwtStrategy must support Bearer token");
  assert(jwtStrategy.includes("req?.cookies?.access_token"), "JwtStrategy must support access_token cookie");
  assert(jwtStrategy.includes("companyId: dbUser.companyId"), "JwtStrategy must expose companyId on req.user");
  assert(authModule.includes("PassportModule"), "AuthModule must import PassportModule");
  assert(authModule.includes("JwtStrategy"), "AuthModule must provide JwtStrategy");
  assert(authController.includes("@UseGuards(JwtAuthGuard)"), "Existing auth controller must demonstrate JwtAuthGuard usage");

  const routeSource = routeSourceFrom(importsController);

  assert(routeSource.includes("@Get('internal/amazon-sp-api-sandbox/import-jobs/read-model')"), "target GET route missing");
  assert(routeSource.includes("assertAmazonSpApiSandboxEnvironmentGate({ requireInternalSandbox: true })"), "env gate missing");
  assert(routeSource.includes("normalizeAmazonSpApiSandboxImportJobReadModelControllerQuery(query)"), "query normalization missing");
  assert(routeSource.includes("STEP122_P_HTTP_QUERY_VALIDATION_BAD_REQUEST"), "HTTP 400 validation boundary missing");
  assert(routeSource.includes("this.service['listAmazonSpApiSandboxImportJobsReadModelDryRun']"), "readonly service call missing");
  assert(routeSource.includes("dryRun: true"), "dryRun=true enforcement missing");

  // Step122-S-aware guard implementation compatibility:
  // Step122-R originally required no guard implementation. After Step122-S,
  // the same smoke remains useful by validating that the implemented guard follows the Step122-R design.
  if (routeSource.includes("@UseGuards(JwtAuthGuard)")) {
    assert(importsController.includes("import { JwtAuthGuard }"), "Step122-S must import JwtAuthGuard");
    assert(routeSource.includes("@Req() req: Step122SAuthenticatedRequest"), "Step122-S must accept authenticated request");
    assert(routeSource.includes("req.user?.companyId"), "Step122-S must derive companyId from req.user.companyId");
    assert(routeSource.includes("STEP122_S_AUTH_COMPANY_REQUIRED"), "Step122-S must reject missing companyId");
  } else {
    assert(!importsController.includes("import { JwtAuthGuard }"), "pre-Step122-S controller must not import JwtAuthGuard");
    assert(!routeSource.includes("@Req()") && !routeSource.includes("req.user"), "pre-Step122-S route must not add req.user based implementation");
  }

  assert(
    importsService.includes("async ['listAmazonSpApiSandboxImportJobsReadModelDryRun']("),
    "read-model service method missing",
  );

  for (const forbidden of [
    "rawPayloadJson",
    "normalizedPayloadJson",
    "dedupeHash",
    "transaction.find",
    "inventoryMovement.find",
    "inventoryBalance.find",
    "transaction.create",
    "inventoryMovement.create",
    "inventoryBalance.create",
    "deleteMany",
    "createMany",
    "updateMany",
  ]) {
    assert(!routeSource.includes(forbidden), `route must not contain forbidden fragment: ${forbidden}`);
  }

  for (const forbiddenModel of [
    "AmazonSpApiSandboxImportJobReadModel",
    "AmazonSpApiCredential",
    "AmazonSpApiToken",
    "CrossSourceDedupe",
  ]) {
    assert(!schema.includes(forbiddenModel), `schema must not contain ${forbiddenModel}`);
  }

  const frontendGuard = assertNoFrontendLeak(repoRoot);

  console.log("[SMOKE_OK] amazon sp-api sandbox ImportJob read-model internal auth guard design smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "Step122-R",
        contract: {
          version: contract.version,
          designOnly: contract.designOnly,
          authGuardImplementedNow: contract.authGuardImplementedNow,
          endpointStillRuntimeCallableNow: contract.endpointStillRuntimeCallableNow,
          frontendExposedNow: contract.frontendExposedNow,
          writesDatabase: contract.writesDatabase,
          targetEndpoint: contract.targetEndpoint,
          existingAuthFoundation: contract.existingAuthFoundation,
          futureGuardPolicy: contract.futureGuardPolicy,
          futureImplementationShape: contract.futureImplementationShape,
          summary: contract.summary,
        },
        guards: {
          jwtGuardExists: true,
          jwtStrategyExists: true,
          bearerTokenSupported: true,
          accessCookieSupported: true,
          requestUserCompanyIdSupported: true,
          importsControllerGuardMatchesDesign: true,
          frontendStillDisabled: true,
          schemaStillDisabled: true,
        },
        frontendGuard,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error("[SMOKE_ERROR]", err);
    process.exitCode = 1;
  });
