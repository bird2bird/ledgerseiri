#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const {
  buildAmazonSpApiSandboxImportJobReadModelFrontendClientImplementationContract,
  assertAmazonSpApiSandboxImportJobReadModelFrontendClientImplementationContract,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-importjob-read-model-frontend-client-implementation.dto");

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

function assertClientImplementedButNotIntegrated(repoRoot, clientFile, shellFile) {
  const webRoot = path.resolve(repoRoot, "apps/web/src");
  const files = listFiles(webRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p));

  const endpointLeaks = [];
  const clientImportLeaks = [];
  const pageFetchLeaks = [];
  const shellFetchLeaks = [];

  for (const file of files) {
    const text = read(file);
    const rel = path.relative(repoRoot, file);

    if (file !== clientFile && text.includes("/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model")) {
      endpointLeaks.push(rel);
    }

    if (
      file !== clientFile &&
      text.includes("fetchAmazonSpApiSandboxImportJobReadModel")
    ) {
      clientImportLeaks.push(rel);
    }

    if (file !== clientFile && text.includes("amazonSpApiSandboxImportJobReadModelClient")) {
      clientImportLeaks.push(rel);
    }

    if (file !== clientFile && text.includes("fetch(")) {
      pageFetchLeaks.push(rel);
    }

    if (file === shellFile && (text.includes("fetch(") || text.includes("useEffect(") || text.includes("axios"))) {
      shellFetchLeaks.push(rel);
    }
  }

  assert(endpointLeaks.length === 0, `endpoint string must only exist in client file: ${JSON.stringify(endpointLeaks)}`);
  assert(clientImportLeaks.length === 0, `client helper must not be imported by pages/shell yet: ${JSON.stringify(clientImportLeaks)}`);
  assert(shellFetchLeaks.length === 0, `shell must still not fetch: ${JSON.stringify(shellFetchLeaks)}`);

  return {
    scannedFiles: files.length,
    endpointLeaks,
    clientImportLeaks,
    shellFetchLeaks,
    pageFetchLeakCount: pageFetchLeaks.length,
  };
}

async function main() {
  const root = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(root, "..", "..");

  const packageJson = JSON.parse(read(path.resolve(root, "package.json")));
  const contract = assertAmazonSpApiSandboxImportJobReadModelFrontendClientImplementationContract(
    buildAmazonSpApiSandboxImportJobReadModelFrontendClientImplementationContract(),
  );

  assert(
    packageJson.scripts["smoke:amazon-sp-api-sandbox-importjob-read-model-frontend-client-implementation"],
    "Step122-X npm script missing",
  );

  const clientFile = path.resolve(repoRoot, contract.clientModule.file);
  const shellFile = path.resolve(repoRoot, "apps/web/src/components/app/imports/AmazonSpApiSandboxReadModelPanelShell.tsx");

  assert(fs.existsSync(clientFile), `client file missing: ${contract.clientModule.file}`);
  assert(fs.existsSync(shellFile), "Step122-W shell file missing");

  const source = read(clientFile);

  assert(source.includes("AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_ENDPOINT"), "endpoint const missing");
  assert(source.includes("/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model"), "endpoint path missing");
  assert(source.includes("credentials: \"include\""), "fetch must use credentials include");
  assert(source.includes('params.set("dryRun", "true")'), "url builder must force dryRun=true");
  assert(!source.includes("dryRun=false"), "client must not support dryRun=false");
  // Step122-X: "companyId" may appear only as a forbidden response field.
  // The client must not put companyId into the request builder/query params.
  assert(!source.includes('params.set("companyId"'), "client must not send companyId query param");
  assert(source.includes('"companyId"'), "client must hard-fail if response projects companyId");
  assert(source.includes("response.status === 401"), "client must map 401");
  assert(source.includes("response.status === 403"), "client must map 403");
  assert(source.includes("response.status === 400"), "client must map 400");
  assert(source.includes("response.status !== 200"), "client must hard fail unexpected status");
  assert(source.includes("payload.dryRun !== true"), "client must validate dryRun");
  assert(source.includes("payload.displayOnly !== true"), "client must validate displayOnly");
  assert(source.includes('payload.sourceType !== "amazon-sp-api-sandbox"'), "client must validate sourceType");
  assert(source.includes("FORBIDDEN_RESPONSE_FIELDS"), "forbidden field guard missing");
  assert(source.includes('"rawPayloadJson"'), "rawPayloadJson forbidden field missing");
  assert(source.includes('"normalizedPayloadJson"'), "normalizedPayloadJson forbidden field missing");
  assert(source.includes('"dedupeHash"'), "dedupeHash forbidden field missing");
  assert(source.includes("export async function fetchAmazonSpApiSandboxImportJobReadModel"), "fetch helper export missing");
  assert(source.includes("export function buildAmazonSpApiSandboxImportJobReadModelUrl"), "url builder export missing");

  const integrationGuard = assertClientImplementedButNotIntegrated(repoRoot, clientFile, shellFile);

  console.log("[SMOKE_OK] amazon sp-api sandbox ImportJob read-model frontend client implementation smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "Step122-X",
        contract: {
          version: contract.version,
          implementedNow: contract.implementedNow,
          frontendClientImplementedNow: contract.frontendClientImplementedNow,
          appsWebModifiedNow: contract.appsWebModifiedNow,
          pageIntegrationNow: contract.pageIntegrationNow,
          backendChangedNow: contract.backendChangedNow,
          schemaChangedNow: contract.schemaChangedNow,
          writesDatabase: contract.writesDatabase,
          clientModule: contract.clientModule,
          parserPolicy: contract.parserPolicy,
          summary: contract.summary,
        },
        integrationGuard,
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
