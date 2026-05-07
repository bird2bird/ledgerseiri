#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { ImportsService } = require("../dist/src/imports/imports.service");
const {
  AMAZON_SP_API_SANDBOX_INTERNAL_CONTRACT_VERSION,
  AMAZON_SP_API_SANDBOX_CONTROLLER_ENABLED,
  AMAZON_SP_API_SANDBOX_REAL_SP_API_ENABLED,
  AMAZON_SP_API_SANDBOX_OAUTH_ENABLED,
  AMAZON_SP_API_SANDBOX_TOKEN_PERSISTENCE_ENABLED,
  assertAmazonSpApiSandboxControllerDisabled,
  assertAmazonSpApiSandboxInternalRequest,
  getAmazonSpApiSandboxInternalSafetyGuard,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-internal-contract.dto");

const prisma = new PrismaClient();

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function listFiles(dir, predicate, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      listFiles(p, predicate, acc);
    } else if (predicate(p)) {
      acc.push(p);
    }
  }
  return acc;
}

async function main() {
  const root = path.resolve(__dirname, "..");
  const srcRoot = path.resolve(root, "src");
  const importsControllerTs = path.resolve(root, "src/imports/imports.controller.ts");

  assert(
    AMAZON_SP_API_SANDBOX_INTERNAL_CONTRACT_VERSION === "amazon-sp-api-sandbox-internal-v1",
    "internal contract version mismatch",
  );
  assert(AMAZON_SP_API_SANDBOX_CONTROLLER_ENABLED === false, "controller must remain disabled");
  assert(AMAZON_SP_API_SANDBOX_REAL_SP_API_ENABLED === false, "real SP-API must remain disabled");
  assert(AMAZON_SP_API_SANDBOX_OAUTH_ENABLED === false, "OAuth must remain disabled");
  assert(AMAZON_SP_API_SANDBOX_TOKEN_PERSISTENCE_ENABLED === false, "token persistence must remain disabled");

  const guard = getAmazonSpApiSandboxInternalSafetyGuard();
  assert(guard.controllerEnabled === false, "guard.controllerEnabled mismatch");
  assert(guard.realSpApiEnabled === false, "guard.realSpApiEnabled mismatch");
  assert(guard.oauthEnabled === false, "guard.oauthEnabled mismatch");
  assert(guard.tokenPersistenceEnabled === false, "guard.tokenPersistenceEnabled mismatch");

  assertAmazonSpApiSandboxControllerDisabled();

  const validPreviewRequest = assertAmazonSpApiSandboxInternalRequest({
    mode: "preview",
    sourceType: "amazon-sp-api-sandbox",
    module: "store-orders",
    filename: "step116-e-preview.json",
    orders: [
      {
        amazonOrderId: "SPAPI-STEP116-E-ORDER-1",
        purchaseDate: "2026-05-07T00:00:00Z",
        items: [
          {
            sellerSku: "SPAPI-STEP116-E-SKU-1",
            quantityOrdered: 1,
            itemPrice: { currencyCode: "JPY", amount: "1000" },
          },
        ],
      },
    ],
  });

  assert(validPreviewRequest.mode === "preview", "valid preview request mode mismatch");

  const validCommitDryRunRequest = assertAmazonSpApiSandboxInternalRequest({
    mode: "commit-staging-dry-run",
    sourceType: "amazon-sp-api-sandbox",
    module: "store-orders",
    filename: "step116-e-commit-dry-run.json",
    dryRun: true,
    orders: [
      {
        amazonOrderId: "SPAPI-STEP116-E-ORDER-2",
        purchaseDate: "2026-05-07T00:00:00Z",
        items: [
          {
            sellerSku: "SPAPI-STEP116-E-SKU-2",
            quantityOrdered: 1,
            itemPrice: { currencyCode: "JPY", amount: "2000" },
          },
        ],
      },
    ],
  });

  assert(validCommitDryRunRequest.mode === "commit-staging-dry-run", "valid commit request mode mismatch");

  let rejectedUnsafeCommit = false;
  try {
    assertAmazonSpApiSandboxInternalRequest({
      mode: "commit-staging-dry-run",
      sourceType: "amazon-sp-api-sandbox",
      module: "store-orders",
      filename: "unsafe.json",
      dryRun: false,
      orders: [
        {
          amazonOrderId: "SPAPI-UNSAFE",
          purchaseDate: "2026-05-07T00:00:00Z",
          items: [{ sellerSku: "UNSAFE", quantityOrdered: 1 }],
        },
      ],
    });
  } catch (err) {
    rejectedUnsafeCommit = String(err && err.message).includes("dryRun=true");
  }

  assert(rejectedUnsafeCommit, "unsafe dryRun=false request should be rejected by internal contract");

  const service = new ImportsService(prisma);
  assert(
    typeof service.previewAmazonSpApiSandboxOrders === "function",
    "previewAmazonSpApiSandboxOrders missing",
  );
  assert(
    typeof service.commitAmazonSpApiSandboxOrdersToStaging === "function",
    "commitAmazonSpApiSandboxOrdersToStaging missing",
  );
  assert(
    typeof service.dryRunAmazonSpApiSandboxImportBoundary === "function",
    "dryRunAmazonSpApiSandboxImportBoundary compatibility wrapper missing",
  );

  const controllerSource = read(importsControllerTs);

  assert(
    !controllerSource.includes("amazon-sp-api-sandbox-internal-contract"),
    "ImportsController must not import SP-API sandbox internal contract",
  );
  assert(
    !controllerSource.includes("previewAmazonSpApiSandboxOrders"),
    "ImportsController must not call previewAmazonSpApiSandboxOrders",
  );
  assert(
    !controllerSource.includes("commitAmazonSpApiSandboxOrdersToStaging"),
    "ImportsController must not call commitAmazonSpApiSandboxOrdersToStaging",
  );
  assert(
    !controllerSource.includes("dryRunAmazonSpApiSandboxImportBoundary"),
    "ImportsController must not call dryRunAmazonSpApiSandboxImportBoundary",
  );

  const controllerFiles = listFiles(srcRoot, (p) => p.endsWith(".controller.ts"));
  const exposedSpApiRoutes = [];

  for (const file of controllerFiles) {
    const text = read(file);
    const routeRegex = /@(Get|Post|Put|Patch|Delete)\(\s*['"`]([^'"`]*sp-api[^'"`]*)['"`]\s*\)/gi;
    let match;
    while ((match = routeRegex.exec(text))) {
      exposedSpApiRoutes.push({
        file: path.relative(root, file),
        method: match[1],
        route: match[2],
      });
    }

    const sandboxRouteRegex = /@(Get|Post|Put|Patch|Delete)\(\s*['"`]([^'"`]*sandbox[^'"`]*)['"`]\s*\)/gi;
    while ((match = sandboxRouteRegex.exec(text))) {
      const route = String(match[2] || "").toLowerCase();
      if (route.includes("amazon") || route.includes("sp")) {
        exposedSpApiRoutes.push({
          file: path.relative(root, file),
          method: match[1],
          route: match[2],
        });
      }
    }
  }

  assert(
    exposedSpApiRoutes.length === 0,
    `SP-API sandbox controller routes must remain disabled: ${JSON.stringify(exposedSpApiRoutes)}`,
  );

  const distContract = path.resolve(
    root,
    "dist/src/imports/dto/amazon-sp-api-sandbox-internal-contract.dto.js",
  );
  assert(fs.existsSync(distContract), "compiled internal contract file missing in dist");

  console.log("[SMOKE_OK] amazon sp-api sandbox controller-disabled internal contract guard passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        guard,
        serviceBoundary: {
          previewMethod: true,
          commitStagingMethod: true,
          dryRunWrapper: true,
        },
        controllerGuard: {
          scannedControllerFiles: controllerFiles.map((file) => path.relative(root, file)),
          exposedSpApiRoutes,
          controllerEnabled: false,
        },
        rejectedUnsafeCommit,
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
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
