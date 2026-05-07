#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const {
  AMAZON_SP_API_SANDBOX_ENV_INTERNAL_ENABLED,
  AMAZON_SP_API_REAL_ENV_ENABLED,
  AMAZON_SP_API_OAUTH_ENV_ENABLED,
  AMAZON_SP_API_TOKEN_PERSISTENCE_ENV_ENABLED,
  assertAmazonSpApiSandboxControllerDisabled,
  assertAmazonSpApiSandboxEnvironmentGate,
  assertAmazonSpApiSandboxInternalRequest,
  getAmazonSpApiSandboxEnvironmentGate,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-internal-contract.dto");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function expectReject(label, fn, expectedFragment) {
  try {
    fn();
  } catch (err) {
    const message = String((err && err.message) || err);
    if (message.includes(expectedFragment)) {
      return {
        label,
        ok: true,
        message,
      };
    }
    throw new Error(`${label} rejected with unexpected message: ${message}`);
  }

  throw new Error(`${label} should have been rejected`);
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

function buildValidRequest() {
  return {
    mode: "preview",
    sourceType: "amazon-sp-api-sandbox",
    module: "store-orders",
    filename: "step116-f-preview.json",
    orders: [
      {
        amazonOrderId: "SPAPI-STEP116-F-ORDER-1",
        purchaseDate: "2026-05-07T00:00:00Z",
        items: [
          {
            sellerSku: "SPAPI-STEP116-F-SKU-1",
            quantityOrdered: 1,
            itemPrice: { currencyCode: "JPY", amount: "1000" },
          },
        ],
      },
    ],
  };
}

function main() {
  const root = path.resolve(__dirname, "..");
  const srcRoot = path.resolve(root, "src");
  const importsControllerTs = path.resolve(root, "src/imports/imports.controller.ts");

  assert(AMAZON_SP_API_SANDBOX_ENV_INTERNAL_ENABLED === "AMAZON_SP_API_SANDBOX_INTERNAL_ENABLED", "sandbox env name mismatch");
  assert(AMAZON_SP_API_REAL_ENV_ENABLED === "AMAZON_SP_API_REAL_ENABLED", "real env name mismatch");
  assert(AMAZON_SP_API_OAUTH_ENV_ENABLED === "AMAZON_SP_API_OAUTH_ENABLED", "oauth env name mismatch");
  assert(
    AMAZON_SP_API_TOKEN_PERSISTENCE_ENV_ENABLED === "AMAZON_SP_API_TOKEN_PERSISTENCE_ENABLED",
    "token persistence env name mismatch",
  );

  assertAmazonSpApiSandboxControllerDisabled();

  const defaultGate = getAmazonSpApiSandboxEnvironmentGate({});
  assert(defaultGate.internalSandboxEnabled === false, "default internal sandbox should be false");
  assert(defaultGate.realSpApiEnabled === false, "default real SP-API should be false");
  assert(defaultGate.oauthEnabled === false, "default OAuth should be false");
  assert(defaultGate.tokenPersistenceEnabled === false, "default token persistence should be false");
  assert(defaultGate.controllerEnabled === false, "controller should remain false");
  assert(defaultGate.canPreviewSandbox === false, "default canPreviewSandbox should be false");
  assert(defaultGate.canCommitSandboxStagingDryRun === false, "default canCommitSandboxStagingDryRun should be false");
  assert(defaultGate.canCallRealSpApi === false, "canCallRealSpApi should remain false");
  assert(defaultGate.canPersistToken === false, "canPersistToken should remain false");

  const defaultAssertGate = assertAmazonSpApiSandboxEnvironmentGate({ env: {} });
  assert(defaultAssertGate.internalSandboxEnabled === false, "default assert gate internal sandbox mismatch");

  const requireInternalRejected = expectReject(
    "require internal sandbox without env",
    () => assertAmazonSpApiSandboxEnvironmentGate({ env: {}, requireInternalSandbox: true }),
    "AMAZON_SP_API_SANDBOX_INTERNAL_ENABLED",
  );

  const internalEnabledGate = assertAmazonSpApiSandboxEnvironmentGate({
    env: {
      AMAZON_SP_API_SANDBOX_INTERNAL_ENABLED: "true",
    },
    requireInternalSandbox: true,
  });

  assert(internalEnabledGate.internalSandboxEnabled === true, "internal sandbox should be enabled by env");
  assert(internalEnabledGate.canPreviewSandbox === true, "canPreviewSandbox should be true when internal env is true");
  assert(
    internalEnabledGate.canCommitSandboxStagingDryRun === true,
    "canCommitSandboxStagingDryRun should be true when internal env is true",
  );
  assert(internalEnabledGate.canCallRealSpApi === false, "real SP-API must still be disabled");
  assert(internalEnabledGate.canPersistToken === false, "token persistence must still be disabled");

  const truthyVariants = ["1", "true", "TRUE", "yes", "on"];
  for (const value of truthyVariants) {
    const gate = getAmazonSpApiSandboxEnvironmentGate({
      AMAZON_SP_API_SANDBOX_INTERNAL_ENABLED: value,
    });
    assert(gate.internalSandboxEnabled === true, `truthy variant ${value} should enable internal sandbox`);
  }

  const falseyGate = getAmazonSpApiSandboxEnvironmentGate({
    AMAZON_SP_API_SANDBOX_INTERNAL_ENABLED: "false",
  });
  assert(falseyGate.internalSandboxEnabled === false, "false string should not enable internal sandbox");

  const rejectReal = expectReject(
    "real SP-API env",
    () =>
      assertAmazonSpApiSandboxEnvironmentGate({
        env: {
          AMAZON_SP_API_SANDBOX_INTERNAL_ENABLED: "true",
          AMAZON_SP_API_REAL_ENABLED: "true",
        },
      }),
    "AMAZON_SP_API_REAL_ENABLED",
  );

  const rejectOauth = expectReject(
    "oauth env",
    () =>
      assertAmazonSpApiSandboxEnvironmentGate({
        env: {
          AMAZON_SP_API_SANDBOX_INTERNAL_ENABLED: "true",
          AMAZON_SP_API_OAUTH_ENABLED: "true",
        },
      }),
    "AMAZON_SP_API_OAUTH_ENABLED",
  );

  const rejectToken = expectReject(
    "token persistence env",
    () =>
      assertAmazonSpApiSandboxEnvironmentGate({
        env: {
          AMAZON_SP_API_SANDBOX_INTERNAL_ENABLED: "true",
          AMAZON_SP_API_TOKEN_PERSISTENCE_ENABLED: "true",
        },
      }),
    "AMAZON_SP_API_TOKEN_PERSISTENCE_ENABLED",
  );

  const validRequest = assertAmazonSpApiSandboxInternalRequest(buildValidRequest());
  assert(validRequest.mode === "preview", "valid request mode mismatch");

  const controllerSource = read(importsControllerTs);
  assert(!controllerSource.includes("AMAZON_SP_API_SANDBOX_INTERNAL_ENABLED"), "controller must not read sandbox env gate");
  assert(!controllerSource.includes("previewAmazonSpApiSandboxOrders"), "controller must not expose preview method");
  assert(!controllerSource.includes("commitAmazonSpApiSandboxOrdersToStaging"), "controller must not expose commit method");

  const controllerFiles = listFiles(srcRoot, (p) => p.endsWith(".controller.ts"));
  const exposedRoutes = [];

  for (const file of controllerFiles) {
    const text = read(file);
    const routeRegex = /@(Get|Post|Put|Patch|Delete)\(\s*['"`]([^'"`]*(sp-api|sandbox)[^'"`]*)['"`]\s*\)/gi;
    let match;
    while ((match = routeRegex.exec(text))) {
      const route = String(match[2] || "").toLowerCase();
      if (route.includes("sp-api") || (route.includes("sandbox") && route.includes("amazon"))) {
        exposedRoutes.push({
          file: path.relative(root, file),
          method: match[1],
          route: match[2],
        });
      }
    }
  }

  assert(exposedRoutes.length === 0, `controller route leak: ${JSON.stringify(exposedRoutes)}`);

  console.log("[SMOKE_OK] amazon sp-api sandbox environment gate smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        defaultGate,
        internalEnabledGate,
        rejected: [requireInternalRejected, rejectReal, rejectOauth, rejectToken],
        controllerGuard: {
          scannedControllerFiles: controllerFiles.map((file) => path.relative(root, file)),
          exposedRoutes,
        },
      },
      null,
      2,
    ),
  );
}

try {
  main();
} catch (err) {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
}
