#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiManualMigrationDeployNoAutoExecuteRunbookContract,
  buildAmazonSpApiManualMigrationDeployNoAutoExecuteRunbookContract,
} = require("../dist/src/imports/dto/amazon-sp-api-manual-migration-deploy-no-auto-execute-runbook-contract.dto");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function assertRunbookSafe(apiRoot) {
  const runbookPath = path.resolve(apiRoot, "scripts/manual-amazon-sp-api-migration-deploy-runbook.sh");
  assert(fs.existsSync(runbookPath), "manual deploy runbook missing");

  const text = read(runbookPath);

  for (const marker of [
    "DRY_RUN=\"${DRY_RUN:-1}\"",
    "CONFIRM_AMAZON_SP_API_MIGRATION_DEPLOY",
    "AMAZON_SP_API_MIGRATION_BACKUP_CONFIRMED",
    "AMAZON_SP_API_MIGRATION_DATABASE_TARGET_CONFIRMED",
    "AMAZON_SP_API_MIGRATION_MAINTENANCE_WINDOW_CONFIRMED",
    "AMAZON_SP_API_MIGRATION_FEATURE_FLAGS_DISABLED",
    "AMAZON_SP_API_MIGRATION_ALLOW_DIRTY_DRY_RUN_SMOKE",
    "npx prisma migrate deploy",
    "if [ \"$DRY_RUN\" != \"0\" ]; then",
    "must be YES when DRY_RUN=0",
    "npm run smoke:amazon-sp-api-create-only-prisma-migration-contract",
    "npm run smoke:amazon-sp-api-migration-deploy-readiness-production-gate-contract",
  ]) {
    assert(text.includes(marker), `runbook missing safety marker: ${marker}`);
  }

  const dryRunGuardIndex = text.indexOf("if [ \"$DRY_RUN\" != \"0\" ]; then");
  const confirmationLoopIndex = text.lastIndexOf("for var in \\");
  const confirmedMarkerIndex = text.indexOf("[CONFIRMED] Executing npx prisma migrate deploy");
  const deployExecutionMatch = text.match(/^\s*npx\s+prisma\s+migrate\s+deploy\s*$/m);

  assert(dryRunGuardIndex >= 0, "DRY_RUN guard not found");
  assert(confirmationLoopIndex >= 0, "confirmation loop not found");
  assert(confirmedMarkerIndex >= 0, "confirmed execution marker not found");
  assert(deployExecutionMatch, "actual deploy command line not found");

  const deployExecutionIndex = deployExecutionMatch.index ?? -1;

  assert(deployExecutionIndex > dryRunGuardIndex, "actual deploy command must appear after DRY_RUN guard");
  assert(deployExecutionIndex > confirmationLoopIndex, "actual deploy command must appear after confirmation loop");
  assert(deployExecutionIndex > confirmedMarkerIndex, "actual deploy command must appear after explicit confirmed marker");

  assert(!/^\s*npx\s+prisma\s+db\s+push\b/m.test(text), "runbook must not contain db push command line");
  assert(!/^\s*npx\s+prisma\s+migrate\s+reset\b/m.test(text), "runbook must not contain migrate reset command line");

  return { runbookPath: path.relative(path.resolve(apiRoot, "..", ".."), runbookPath).replaceAll(path.sep, "/") };
}

async function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-manual-migration-deploy-no-auto-execute-runbook-contract"] ===
      "node scripts/smoke-amazon-sp-api-manual-migration-deploy-no-auto-execute-runbook-contract.js",
    "Step124-F npm script missing or mismatched",
  );

  const contract = assertAmazonSpApiManualMigrationDeployNoAutoExecuteRunbookContract(
    buildAmazonSpApiManualMigrationDeployNoAutoExecuteRunbookContract(),
  );

  assert(contract.sourceStep124E.summary.readyForManualMigrationDeployScript === true, "Step124-E must allow Step124-F");
  assert(contract.runbookScriptCreatedNow === true, "Step124-F must create runbook");
  assert(contract.noAutoExecute === true, "Step124-F must be no-auto-execute");
  assert(contract.defaultDryRun === true, "Step124-F must default to dry run");
  assert(contract.dryRunSmokeCanBypassCleanTreeOnlyWithExplicitSmokeFlag === true, "Step124-F dry-run smoke dirty-tree bypass must be explicit");
  assert(contract.prismaMigrateDeployNow === false, "Step124-F must not deploy now");
  assert(contract.databaseWriteNow === false, "Step124-F must not write DB now");
  assert(contract.runbookDeployCommand.notExecutedByThisStep === true, "Step124-F must not execute deploy command in this step");

  const runbookGuard = assertRunbookSafe(apiRoot);

  console.log("[SMOKE_OK] amazon sp-api manual migration deploy no-auto-execute runbook contract smoke passed");
  console.log(JSON.stringify({ ok: true, step: "Step124-F", runbookGuard, summary: contract.summary }, null, 2));
}

main().catch((err) => {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
});
