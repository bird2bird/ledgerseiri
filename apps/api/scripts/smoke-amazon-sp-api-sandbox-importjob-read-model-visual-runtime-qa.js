#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const {
  assertStep122ReadModelFrontendBoundary,
} = require("./lib/step122-read-model-frontend-boundary");
const {
  buildAmazonSpApiSandboxImportJobReadModelVisualRuntimeQaContract,
  assertAmazonSpApiSandboxImportJobReadModelVisualRuntimeQaContract,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-importjob-read-model-visual-runtime-qa.dto");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function countOccurrences(text, needle) {
  return text.split(needle).length - 1;
}

function assertContainsAll(source, checks, label) {
  for (const [needle, message] of checks) {
    assert(source.includes(needle), `${label}: ${message}`);
  }
}

function assertNotContainsAny(source, checks, label) {
  for (const [needle, message] of checks) {
    assert(!source.includes(needle), `${label}: ${message}`);
  }
}

async function main() {
  const root = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(root, "..", "..");

  const packageJson = JSON.parse(read(path.resolve(root, "package.json")));
  const contract = assertAmazonSpApiSandboxImportJobReadModelVisualRuntimeQaContract(
    buildAmazonSpApiSandboxImportJobReadModelVisualRuntimeQaContract(),
  );

  assert(
    packageJson.scripts["smoke:amazon-sp-api-sandbox-importjob-read-model-visual-runtime-qa"],
    "Step122-Z npm script missing",
  );

  const shellFile = path.resolve(repoRoot, "apps/web/src/components/app/imports/AmazonSpApiSandboxReadModelPanelShell.tsx");
  const clientFile = path.resolve(repoRoot, "apps/web/src/lib/api/amazonSpApiSandboxImportJobReadModelClient.ts");
  const importPageFile = path.resolve(repoRoot, "apps/web/src/app/[lang]/app/data/import/page.tsx");
  const boundaryFile = path.resolve(repoRoot, "apps/api/scripts/lib/step122-read-model-frontend-boundary.js");
  const controllerFile = path.resolve(root, "src/imports/imports.controller.ts");
  const serviceFile = path.resolve(root, "src/imports/imports.service.ts");
  const schemaFile = path.resolve(root, "prisma/schema.prisma");

  for (const file of [shellFile, clientFile, importPageFile, boundaryFile, controllerFile, serviceFile, schemaFile]) {
    assert(fs.existsSync(file), `required file missing: ${path.relative(repoRoot, file)}`);
  }

  const shellSource = read(shellFile);
  const clientSource = read(clientFile);
  const importPageSource = read(importPageFile);
  const boundarySource = read(boundaryFile);
  const controllerSource = read(controllerFile);
  const serviceSource = read(serviceFile);
  const schemaSource = read(schemaFile);

  assertContainsAll(
    shellSource,
    [
      ['"use client";', "runtime panel must be client component"],
      ["data-step122-w", "Step122-W marker missing"],
      ["data-step122-y", "Step122-Y marker missing"],
      ["fetchAmazonSpApiSandboxImportJobReadModel", "typed client helper usage missing"],
      ["useEffect(", "runtime load useEffect missing"],
      ["setLoading(true)", "loading state missing"],
      ["対象データはありません", "empty state copy missing"],
      ["ログインが必要です", "401 copy missing"],
      ["このデータを表示する権限がありません", "403 copy missing"],
      ["検索条件が正しくありません", "400 copy missing"],
      ["安全でないレスポンス", "unsafe response copy missing"],
      ["フィルター", "filter label missing"],
      ["並び順", "sort label missing"],
      ["表示件数", "page size label missing"],
      ["前へ", "previous pagination label missing"],
      ["次へ", "next pagination label missing"],
      ["売上計上は無効", "commit disabled copy missing"],
      ["在庫反映は無効", "inventory disabled copy missing"],
      ["disabled", "disabled action marker missing"],
    ],
    "runtime panel",
  );

  assertNotContainsAny(
    shellSource,
    [
      ["fetch(", "runtime panel must not use raw fetch"],
      ["axios", "runtime panel must not use axios"],
      ["XMLHttpRequest", "runtime panel must not use XMLHttpRequest"],
      ["commitSales: true", "commit sales must not be enabled"],
      ["executeInventory: true", "inventory execution must not be enabled"],
    ],
    "runtime panel",
  );

  assertContainsAll(
    clientSource,
    [
      ["AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_ENDPOINT", "endpoint const missing"],
      ['credentials: "include"', "credentials include missing"],
      ['params.set("dryRun", "true")', "dryRun=true builder missing"],
      ["response.status === 400", "400 parser missing"],
      ["response.status === 401", "401 parser missing"],
      ["response.status === 403", "403 parser missing"],
      ["response.status !== 200", "unexpected status guard missing"],
      ["payload.dryRun !== true", "dryRun response guard missing"],
      ["payload.displayOnly !== true", "displayOnly response guard missing"],
      ['payload.sourceType !== "amazon-sp-api-sandbox"', "sourceType guard missing"],
      ["FORBIDDEN_RESPONSE_FIELDS", "forbidden fields guard missing"],
      ['"companyId"', "companyId forbidden field missing"],
      ['"rawPayloadJson"', "rawPayloadJson forbidden field missing"],
      ['"normalizedPayloadJson"', "normalizedPayloadJson forbidden field missing"],
      ['"dedupeHash"', "dedupeHash forbidden field missing"],
    ],
    "client helper",
  );

  assertNotContainsAny(
    clientSource,
    [
      ["params.set(\"companyId\"", "client must not send companyId"],
      ["dryRun=false", "client must not support dryRun=false"],
      ["commitSales: true", "client must not enable commit sales"],
      ["executeInventory: true", "client must not enable inventory execution"],
    ],
    "client helper",
  );

  assertContainsAll(
    importPageSource,
    [
      ["AmazonSpApiSandboxReadModelPanelShell", "Import Center must import/mount runtime panel"],
      ["<AmazonSpApiSandboxReadModelPanelShell />", "Import Center must mount runtime panel component"],
    ],
    "Import Center page",
  );

  assert(
    countOccurrences(importPageSource, "<AmazonSpApiSandboxReadModelPanelShell />") === 1,
    "Import Center page must mount runtime panel exactly once",
  );

  assertContainsAll(
    boundarySource,
    [
      ["assertStep122ReadModelFrontendBoundary", "shared frontend boundary helper missing"],
      ["CLIENT_REL", "client path constant missing"],
      ["RUNTIME_PANEL_REL", "runtime panel path constant missing"],
      ["REAL_SP_API_OR_OAUTH_FRAGMENTS", "real SP-API/OAuth guard missing"],
      ["runtime panel must use typed helper, not raw fetch", "raw fetch guard missing"],
    ],
    "shared boundary helper",
  );

  assertContainsAll(
    controllerSource,
    [
      ["@UseGuards(JwtAuthGuard)", "backend route must remain JWT guarded"],
      ["dryRun: true", "backend route must force dryRun=true"],
      ["req.user?.companyId", "backend route must derive companyId from authenticated user"],
    ],
    "controller",
  );

  assertContainsAll(
    serviceSource,
    [
      ["async ['listAmazonSpApiSandboxImportJobsReadModelDryRun'](", "read-model dry-run service missing"],
      ["STEP122_F_READ_MODEL_DRY_RUN_REQUIRED", "dryRun service guard missing"],
      ["projectAmazonSpApiSandboxImportJobListRows", "projection helper usage missing"],
    ],
    "service",
  );

  assertNotContainsAny(
    schemaSource,
    [
      ["model AmazonSpApiCredential", "schema must not add Amazon credentials"],
      ["model AmazonSpApiToken", "schema must not add Amazon token"],
      ["model AmazonSpApiSandboxImportJobReadModel", "schema must not add read-model table"],
      ["model CrossSourceDedupe", "schema must not add cross-source dedupe"],
    ],
    "schema",
  );

  const boundary = assertStep122ReadModelFrontendBoundary(repoRoot, {
    allowClientHelper: true,
    allowRuntimePanelHelperUse: true,
  });

  console.log("[SMOKE_OK] amazon sp-api sandbox ImportJob read-model visual/runtime QA smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "Step122-Z",
        contract: {
          version: contract.version,
          qaOnly: contract.qaOnly,
          appsWebChangedNow: contract.appsWebChangedNow,
          backendChangedNow: contract.backendChangedNow,
          schemaChangedNow: contract.schemaChangedNow,
          writesDatabase: contract.writesDatabase,
          qaCoverage: contract.qaCoverage,
          forbiddenNow: contract.forbiddenNow,
          summary: contract.summary,
        },
        runtimePanel: {
          mountedExactlyOnce: true,
          hasLoadingState: true,
          hasEmptyState: true,
          hasErrorStates: ["400", "401", "403", "unsafe-response"],
          hasControls: ["filter", "sort", "pageSize", "pagination"],
          commitDisabled: true,
          inventoryDisabled: true,
        },
        boundary,
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
