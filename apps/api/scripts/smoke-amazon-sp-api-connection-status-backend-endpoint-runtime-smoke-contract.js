#!/usr/bin/env node
"use strict";

const request = require("supertest");
const { Test } = require("@nestjs/testing");
const {
  assertAmazonSpApiConnectionStatusBackendEndpointRuntimeSmokeContract,
  buildAmazonSpApiConnectionStatusBackendEndpointRuntimeSmokeContract,
} = require("../dist/src/imports/dto/amazon-sp-api-connection-status-backend-endpoint-runtime-smoke-contract.dto");
const { ImportsController } = require("../dist/src/imports/imports.controller");
const { ImportsService } = require("../dist/src/imports/imports.service");
const {
  AmazonSpApiOauthStatePersistenceBridgeService,
} = require("../dist/src/imports/amazon-sp-api-oauth-state-persistence-bridge.service");
const {
  AmazonSpApiOauthAuthorizationUrlService,
} = require("../dist/src/imports/amazon-sp-api-oauth-authorization-url.service");
const {
  AmazonSpApiTokenExchangeService,
} = require("../dist/src/imports/amazon-sp-api-token-exchange.service");
const {
  AmazonSpApiTokenPersistenceService,
} = require("../dist/src/imports/amazon-sp-api-token-persistence.service");
function resolveJwtAuthGuardFromCompiledController() {
  const fs = require("fs");
  const path = require("path");

  const controllerJsPath = path.resolve(__dirname, "../dist/src/imports/imports.controller.js");
  const controllerJs = fs.readFileSync(controllerJsPath, "utf8");

  const requireMatches = [...controllerJs.matchAll(/require\(["']([^"']*(?:jwt|auth)[^"']*guard[^"']*)["']\)/gi)];
  const candidateRequires = requireMatches.map((match) => match[1]);

  for (const requirePath of candidateRequires) {
    const absoluteRequirePath = path.resolve(path.dirname(controllerJsPath), requirePath);
    try {
      const moduleExports = require(absoluteRequirePath);
      if (moduleExports.JwtAuthGuard) {
        return moduleExports.JwtAuthGuard;
      }
      for (const value of Object.values(moduleExports)) {
        if (typeof value === "function" && value.name === "JwtAuthGuard") {
          return value;
        }
      }
    } catch (err) {
      // Continue trying other guard-like requires.
    }
  }

  const fallbackPaths = [
    "../dist/src/auth/guards/jwt-auth.guard",
    "../dist/src/auth/jwt-auth.guard",
    "../dist/src/common/guards/jwt-auth.guard",
    "../dist/src/auth/guards/jwt.guard",
  ];

  for (const fallbackPath of fallbackPaths) {
    try {
      const moduleExports = require(fallbackPath);
      if (moduleExports.JwtAuthGuard) {
        return moduleExports.JwtAuthGuard;
      }
    } catch (err) {
      // Continue.
    }
  }

  throw new Error(
    `Unable to resolve JwtAuthGuard from compiled controller. Candidates: ${JSON.stringify(candidateRequires)}`,
  );
}

const JwtAuthGuard = resolveJwtAuthGuardFromCompiledController();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertNoSecretLeak(payload, label) {
  const serialized = JSON.stringify(payload);

  for (const forbiddenPattern of [
    /"refreshToken"\s*:/i,
    /"accessToken"\s*:/i,
    /"refresh_token"\s*:/i,
    /"access_token"\s*:/i,
    /"encryptedRefreshToken"\s*:/i,
    /"encryptedAccessToken"\s*:/i,
    /"clientSecret"\s*:/i,
    /"client_secret"\s*:/i,
    /REFRESH-STEP133C-SECRET/i,
    /ACCESS-STEP133C-SECRET/i,
    /CLIENT-SECRET-STEP133C-SECRET/i,
  ]) {
    assert(!forbiddenPattern.test(serialized), `${label} leaked forbidden secret marker: ${forbiddenPattern}`);
  }
}

function createDate(value) {
  return new Date(value);
}

function assertBoundaryFlags(body, label) {
  assert(body.tokenExchangeHttpCallNow === false, `${label} tokenExchangeHttpCallNow mismatch`);
  assert(body.tokenPersistenceDatabaseWriteNow === false, `${label} tokenPersistenceDatabaseWriteNow mismatch`);
  assert(body.realSpApiRequestNow === false, `${label} realSpApiRequestNow mismatch`);
  assert(body.importJobWriteNow === false, `${label} importJobWriteNow mismatch`);
  assert(body.transactionWriteNow === false, `${label} transactionWriteNow mismatch`);
  assert(body.inventoryWriteNow === false, `${label} inventoryWriteNow mismatch`);
}

function assertCommonResponse(body, label, expectedScope) {
  assert(body.source === "amazon-sp-api-connection-status", `${label} source mismatch`);
  assert(body.routeImplementedNow === true, `${label} routeImplementedNow mismatch`);
  assert(body.marketplaceId === expectedScope.marketplaceId, `${label} marketplaceId mismatch`);
  assert(body.region === expectedScope.region, `${label} region mismatch`);
  assert(body.storeId === expectedScope.storeId, `${label} storeId mismatch`);
  assertBoundaryFlags(body, label);
  assertNoSecretLeak(body, label);
}

async function createRuntimeApp(connectionByCase, callLog, options = {}) {
  const importsServiceMock = {
    detectMonthConflicts: () => {
      throw new Error("ImportsService.detectMonthConflicts should not be called in Step133-C");
    },
  };

  const tokenPersistenceServiceMock = {
    readConnectionStatus: async (scope) => {
      callLog.reads.push(scope);
      const key = scope.storeId;
      return connectionByCase[key] ?? null;
    },
    persistEncryptedRefreshCredential: async () => {
      callLog.writes.push("persistEncryptedRefreshCredential");
      throw new Error("persistEncryptedRefreshCredential must not be called in Step133-C");
    },
    persistEncryptedAccessTokenCache: async () => {
      callLog.writes.push("persistEncryptedAccessTokenCache");
      throw new Error("persistEncryptedAccessTokenCache must not be called in Step133-C");
    },
    revokeConnection: async () => {
      callLog.writes.push("revokeConnection");
      throw new Error("revokeConnection must not be called in Step133-C");
    },
  };

  const moduleRef = await Test.createTestingModule({
    controllers: [ImportsController],
    providers: [
      { provide: ImportsService, useValue: importsServiceMock },
      AmazonSpApiOauthStatePersistenceBridgeService,
      AmazonSpApiOauthAuthorizationUrlService,
      AmazonSpApiTokenExchangeService,
      { provide: AmazonSpApiTokenPersistenceService, useValue: tokenPersistenceServiceMock },
    ],
  })
    .overrideGuard(JwtAuthGuard)
    .useValue({
      canActivate: (context) => {
        const req = context.switchToHttp().getRequest();
        if (options.noUser) {
          req.user = {};
        } else {
          req.user = {
            userId: "user-step133c",
            companyId: "company-step133c",
          };
        }
        return true;
      },
    })
    .compile();

  const app = moduleRef.createNestApplication();
  await app.init();

  return app;
}

async function main() {
  const contract = assertAmazonSpApiConnectionStatusBackendEndpointRuntimeSmokeContract(
    buildAmazonSpApiConnectionStatusBackendEndpointRuntimeSmokeContract(),
  );

  const connectionByCase = {
    "store-connected": {
      sellingPartnerId: "A1SELLERSTEP133C999",
      status: "CONNECTED",
      connectedAt: createDate("2026-05-08T09:00:00.000Z"),
      revokedAt: null,
      lastTokenRefreshAt: createDate("2026-05-08T09:10:00.000Z"),
      lastHealthCheckAt: createDate("2026-05-08T09:20:00.000Z"),
      lastSyncAt: createDate("2026-05-08T09:30:00.000Z"),
      lastErrorCode: null,
      lastErrorMessageRedacted: null,
      encryptedRefreshToken: "REFRESH-STEP133C-SECRET",
      encryptedAccessToken: "ACCESS-STEP133C-SECRET",
      clientSecret: "CLIENT-SECRET-STEP133C-SECRET",
    },
    "store-revoked": {
      sellingPartnerId: "A1REVOKEDSTEP133C999",
      status: "REVOKED",
      connectedAt: createDate("2026-05-08T08:00:00.000Z"),
      revokedAt: createDate("2026-05-08T08:30:00.000Z"),
      lastTokenRefreshAt: null,
      lastHealthCheckAt: null,
      lastSyncAt: null,
      lastErrorCode: null,
      lastErrorMessageRedacted: null,
    },
    "store-error": {
      sellingPartnerId: "A1ERRORSTEP133C999",
      status: "CONNECTED",
      connectedAt: createDate("2026-05-08T07:00:00.000Z"),
      revokedAt: null,
      lastTokenRefreshAt: null,
      lastHealthCheckAt: null,
      lastSyncAt: null,
      lastErrorCode: "TOKEN_REFRESH_FAILED",
      lastErrorMessageRedacted: "Amazon SP-API token refresh failed.",
    },
  };

  const callLog = { reads: [], writes: [] };
  const app = await createRuntimeApp(connectionByCase, callLog);

  try {
    const server = app.getHttpServer();

    const missingStore = await request(server)
      .get("/api/imports/amazon-sp-api/connection/status")
      .query({
        marketplaceId: "A1VC38T7YXB528",
        region: "JP",
      })
      .expect(400);

    assert(JSON.stringify(missingStore.body).includes("storeId is required"), "missing storeId error mismatch");
    assert(callLog.reads.length === 0, "missing storeId must not read persistence");

    const notConnected = await request(server)
      .get("/api/imports/amazon-sp-api/connection/status")
      .query({
        storeId: "store-not-connected",
      })
      .expect(200);

    assertCommonResponse(notConnected.body, "not connected", {
      storeId: "store-not-connected",
      marketplaceId: "A1VC38T7YXB528",
      region: "JP",
    });
    assert(notConnected.body.status === "NOT_CONNECTED", "not connected status mismatch");
    assert(notConnected.body.connected === false, "not connected connected mismatch");
    assert(notConnected.body.needsReconnect === false, "not connected needsReconnect mismatch");
    assert(notConnected.body.sellingPartnerIdRedacted === null, "not connected seller should be null");

    const connected = await request(server)
      .get("/api/imports/amazon-sp-api/connection/status")
      .query({
        storeId: "store-connected",
        marketplaceId: "A1VC38T7YXB528",
        region: "jp",
      })
      .expect(200);

    assertCommonResponse(connected.body, "connected", {
      storeId: "store-connected",
      marketplaceId: "A1VC38T7YXB528",
      region: "JP",
    });
    assert(connected.body.status === "CONNECTED", "connected status mismatch");
    assert(connected.body.connected === true, "connected connected mismatch");
    assert(connected.body.needsReconnect === false, "connected needsReconnect mismatch");
    assert(connected.body.sellingPartnerIdRedacted === "A1S***999", "connected seller redaction mismatch");
    assert(connected.body.connectedAt === "2026-05-08T09:00:00.000Z", "connectedAt mismatch");
    assert(connected.body.lastTokenRefreshAt === "2026-05-08T09:10:00.000Z", "lastTokenRefreshAt mismatch");
    assert(connected.body.lastHealthCheckAt === "2026-05-08T09:20:00.000Z", "lastHealthCheckAt mismatch");
    assert(connected.body.lastSyncAt === "2026-05-08T09:30:00.000Z", "lastSyncAt mismatch");

    const revoked = await request(server)
      .get("/api/imports/amazon-sp-api/connection/status")
      .query({
        storeId: "store-revoked",
        marketplaceId: "A1VC38T7YXB528",
        region: "JP",
      })
      .expect(200);

    assertCommonResponse(revoked.body, "revoked", {
      storeId: "store-revoked",
      marketplaceId: "A1VC38T7YXB528",
      region: "JP",
    });
    assert(revoked.body.status === "RECONNECT_REQUIRED", "revoked status mismatch");
    assert(revoked.body.connected === false, "revoked connected mismatch");
    assert(revoked.body.needsReconnect === true, "revoked needsReconnect mismatch");
    assert(revoked.body.revokedAt === "2026-05-08T08:30:00.000Z", "revokedAt mismatch");

    const error = await request(server)
      .get("/api/imports/amazon-sp-api/connection/status")
      .query({
        storeId: "store-error",
        marketplaceId: "A1VC38T7YXB528",
        region: "JP",
      })
      .expect(200);

    assertCommonResponse(error.body, "error", {
      storeId: "store-error",
      marketplaceId: "A1VC38T7YXB528",
      region: "JP",
    });
    assert(error.body.status === "ERROR", "error status mismatch");
    assert(error.body.connected === false, "error connected mismatch");
    assert(error.body.needsReconnect === true, "error needsReconnect mismatch");
    assert(error.body.lastErrorCode === "TOKEN_REFRESH_FAILED", "error code mismatch");
    assert(error.body.lastErrorMessageRedacted === "Amazon SP-API token refresh failed.", "error message mismatch");

    assert(callLog.reads.length === 4, `expected 4 persistence reads, got ${callLog.reads.length}`);
    assert(callLog.writes.length === 0, "connection status endpoint must not write persistence");
  } finally {
    await app.close();
  }

  const noCompanyLog = { reads: [], writes: [] };
  const noCompanyApp = await createRuntimeApp(connectionByCase, noCompanyLog, { noUser: true });

  try {
    await request(noCompanyApp.getHttpServer())
      .get("/api/imports/amazon-sp-api/connection/status")
      .query({
        storeId: "store-connected",
      })
      .expect(403);

    assert(noCompanyLog.reads.length === 0, "missing company must not read persistence");
    assert(noCompanyLog.writes.length === 0, "missing company must not write persistence");
  } finally {
    await noCompanyApp.close();
  }

  console.log("[SMOKE_OK] amazon sp-api connection status backend endpoint runtime smoke contract passed");
  console.log(JSON.stringify({
    ok: true,
    step: "Step133-C",
    runtime: {
      missingStoreIdRejected: true,
      missingCompanyRejected: true,
      notConnectedStatus: "NOT_CONNECTED",
      connectedStatus: "CONNECTED",
      revokedStatus: "RECONNECT_REQUIRED",
      errorStatus: "ERROR",
      persistenceReads: 4,
      persistenceWrites: 0,
    },
    summary: contract.summary,
  }, null, 2));
}

main().catch((err) => {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
});
