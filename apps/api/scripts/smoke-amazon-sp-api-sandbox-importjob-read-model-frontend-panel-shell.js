#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const {
  buildAmazonSpApiSandboxImportJobReadModelFrontendPanelShellContract,
  assertAmazonSpApiSandboxImportJobReadModelFrontendPanelShellContract,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-importjob-read-model-frontend-panel-shell.dto");

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

function assertNoFetchOrEndpointLeak(repoRoot, shellFile) {
  const webRoot = path.resolve(repoRoot, "apps/web/src");
  const files = listFiles(webRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p));
  const endpointLeaks = [];
  const fetchLeaks = [];
  const clientLeaks = [];

  for (const file of files) {
    const text = read(file);
    const rel = path.relative(repoRoot, file);

    if (text.includes("/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model")) {
      endpointLeaks.push(rel);
    }

    if (text.includes("fetchAmazonSpApiSandboxImportJobReadModel") || text.includes("amazonSpApiSandboxImportJobReadModelClient")) {
      clientLeaks.push(rel);
    }

    if (file === shellFile) {
      if (text.includes("fetch(") || text.includes("useEffect(") || text.includes("axios") || text.includes("XMLHttpRequest")) {
        fetchLeaks.push(rel);
      }
    }
  }

  assert(endpointLeaks.length === 0, `Step122-W shell must not expose backend endpoint in apps/web: ${JSON.stringify(endpointLeaks)}`);
  assert(clientLeaks.length === 0, `Step122-W must not implement frontend client helper yet: ${JSON.stringify(clientLeaks)}`);
  assert(fetchLeaks.length === 0, `Step122-W shell must not fetch data: ${JSON.stringify(fetchLeaks)}`);

  return {
    scannedFiles: files.length,
    endpointLeaks,
    clientLeaks,
    fetchLeaks,
  };
}

async function main() {
  const root = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(root, "..", "..");

  const packageJson = JSON.parse(read(path.resolve(root, "package.json")));
  const contract = assertAmazonSpApiSandboxImportJobReadModelFrontendPanelShellContract(
    buildAmazonSpApiSandboxImportJobReadModelFrontendPanelShellContract(),
  );

  assert(
    packageJson.scripts["smoke:amazon-sp-api-sandbox-importjob-read-model-frontend-panel-shell"],
    "Step122-W npm script missing",
  );

  const shellFile = path.resolve(repoRoot, contract.component.file);
  assert(fs.existsSync(shellFile), `Step122-W shell file missing: ${contract.component.file}`);

  const shellSource = read(shellFile);
  assert(shellSource.includes("data-step122-w"), "shell must expose data-step122-w marker");
  assert(shellSource.includes("dryRun=true"), "shell must show dryRun=true");
  assert(shellSource.includes("displayOnly"), "shell must show displayOnly");
  assert(shellSource.includes("売上計上は無効"), "shell must show disabled commit copy");
  assert(shellSource.includes("在庫反映は無効"), "shell must show disabled inventory copy");
  assert(shellSource.includes("ログインが必要です"), "shell must show 401 copy");
  assert(shellSource.includes("表示権限がありません"), "shell must show 403 copy");
  assert(shellSource.includes("検索条件を確認してください"), "shell must show 400 copy");
  assert(shellSource.includes("対象データはありません"), "shell must show empty copy");

  assert(!shellSource.includes("/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model"), "shell must not contain backend endpoint");
  assert(!shellSource.includes("fetch("), "shell must not fetch");
  assert(!shellSource.includes("useEffect("), "shell must not use effect for data loading");

  const webRoot = path.resolve(repoRoot, "apps/web/src");
  const files = listFiles(webRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p));
  const mounts = [];

  for (const file of files) {
    const text = read(file);
    if (file !== shellFile && text.includes("<AmazonSpApiSandboxReadModelPanelShell")) {
      mounts.push(path.relative(repoRoot, file));
    }
  }

  assert(mounts.length === 1, `shell must be mounted exactly once outside shell file, got ${JSON.stringify(mounts)}`);

  const frontendGuard = assertNoFetchOrEndpointLeak(repoRoot, shellFile);

  console.log("[SMOKE_OK] amazon sp-api sandbox ImportJob read-model frontend panel shell smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "Step122-W",
        contract: {
          version: contract.version,
          implementedNow: contract.implementedNow,
          appsWebModifiedNow: contract.appsWebModifiedNow,
          uiShellOnly: contract.uiShellOnly,
          frontendFetchImplementedNow: contract.frontendFetchImplementedNow,
          backendChangedNow: contract.backendChangedNow,
          schemaChangedNow: contract.schemaChangedNow,
          writesDatabase: contract.writesDatabase,
          component: contract.component,
          uiShellContract: contract.uiShellContract,
          summary: contract.summary,
        },
        mounts,
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
