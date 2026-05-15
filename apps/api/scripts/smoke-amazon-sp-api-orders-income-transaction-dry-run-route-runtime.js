#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const http = require("http");
const https = require("https");

const prisma = new PrismaClient();

const API_BASE =
  process.env.API_BASE ||
  process.env.LEDGERSEIRI_API_BASE ||
  "http://localhost:3001";

const EXPLICIT_IMPORT_JOB_ID =
  process.env.IMPORT_JOB_ID ||
  process.env.AMAZON_SP_API_ORDERS_IMPORT_JOB_ID ||
  "";

const EXPLICIT_COMPANY_ID =
  process.env.COMPANY_ID ||
  process.env.LEDGERSEIRI_COMPANY_ID ||
  "";

function requestJson(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https://") ? https : http;

    const req = client.get(
      url,
      {
        headers: {
          Accept: "application/json",
        },
      },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          let json = null;
          try {
            json = body ? JSON.parse(body) : null;
          } catch (err) {
            return reject(
              new Error(
                `Response was not JSON. status=${res.statusCode} body=${body.slice(0, 500)}`
              )
            );
          }

          resolve({
            status: res.statusCode,
            headers: res.headers,
            body,
            json,
          });
        });
      }
    );

    req.on("error", reject);
    req.setTimeout(15000, () => {
      req.destroy(new Error(`Request timeout for ${url}`));
    });
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function findTargetImportJob() {
  if (EXPLICIT_IMPORT_JOB_ID) {
    const job = await prisma.importJob.findFirst({
      where: {
        id: EXPLICIT_IMPORT_JOB_ID,
        ...(EXPLICIT_COMPANY_ID ? { companyId: EXPLICIT_COMPANY_ID } : {}),
      },
      select: {
        id: true,
        companyId: true,
        sourceType: true,
        module: true,
        status: true,
        totalRows: true,
        successRows: true,
        createdAt: true,
      },
    });

    assert(job, `Explicit ImportJob not found: ${EXPLICIT_IMPORT_JOB_ID}`);
    assert(
      job.sourceType === "amazon-sp-api-orders",
      `Explicit ImportJob sourceType mismatch: ${job.sourceType}`
    );

    return job;
  }

  const job = await prisma.importJob.findFirst({
    where: {
      sourceType: "amazon-sp-api-orders",
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      companyId: true,
      sourceType: true,
      module: true,
      status: true,
      totalRows: true,
      successRows: true,
      createdAt: true,
    },
  });

  assert(
    job,
    "No ImportJob found with sourceType=amazon-sp-api-orders. Run a real-importjob step first or set IMPORT_JOB_ID."
  );

  return job;
}

async function countState(companyId) {
  const [transactions, inventoryMovements, importJobs, stagingRows] =
    await Promise.all([
      prisma.transaction.count({
        where: {
          companyId,
        },
      }),
      prisma.inventoryMovement.count({
        where: {
          companyId,
        },
      }),
      prisma.importJob.count({
        where: {
          companyId,
        },
      }),
      prisma.importStagingRow.count({
        where: {
          companyId,
        },
      }),
    ]);

  return {
    transactions,
    inventoryMovements,
    importJobs,
    stagingRows,
  };
}

async function main() {
  const job = await findTargetImportJob();

  const before = await countState(job.companyId);

  const url = new URL(
    "/api/imports/amazon-sp-api/orders/income-transaction-dry-run",
    API_BASE
  );
  url.searchParams.set("importJobId", job.id);
  url.searchParams.set("companyId", job.companyId);

  const res = await requestJson(url.toString());

  const after = await countState(job.companyId);

  assert(
    res.status >= 200 && res.status < 300,
    `Expected 2xx response. status=${res.status} body=${res.body.slice(0, 800)}`
  );

  const data = res.json;

  assert(data, "Response JSON is empty");
  assert(data.dryRun === true, "dryRun must be true");
  assert(data.writesDatabase === false, "writesDatabase must be false");
  assert(data.transactionWriteNow === false, "transactionWriteNow must be false");
  assert(data.inventoryWriteNow === false, "inventoryWriteNow must be false");
  assert(
    data.source === "amazon-sp-api-orders-income-transaction-dry-run",
    `source mismatch: ${data.source}`
  );
  assert(data.route === "service-only", `route marker mismatch: ${data.route}`);
  assert(
    data.sourceType === "amazon-sp-api-orders",
    `sourceType mismatch: ${data.sourceType}`
  );
  assert(data.importJobId === job.id, "importJobId mismatch");
  assert(data.companyId === job.companyId, "companyId mismatch");

  assert(data.guardrails, "guardrails missing");
  assert(
    data.guardrails.doesNotCreateTransaction === true,
    "doesNotCreateTransaction guardrail must be true"
  );
  assert(
    data.guardrails.doesNotCreateInventoryMovement === true,
    "doesNotCreateInventoryMovement guardrail must be true"
  );
  assert(
    data.guardrails.doesNotUpdateImportJob === true,
    "doesNotUpdateImportJob guardrail must be true"
  );
  assert(
    data.guardrails.doesNotUpdateImportStagingRow === true,
    "doesNotUpdateImportStagingRow guardrail must be true"
  );

  assert(
    before.transactions === after.transactions,
    `Transaction count changed: before=${before.transactions} after=${after.transactions}`
  );
  assert(
    before.inventoryMovements === after.inventoryMovements,
    `InventoryMovement count changed: before=${before.inventoryMovements} after=${after.inventoryMovements}`
  );
  assert(
    before.importJobs === after.importJobs,
    `ImportJob count changed: before=${before.importJobs} after=${after.importJobs}`
  );
  assert(
    before.stagingRows === after.stagingRows,
    `ImportStagingRow count changed: before=${before.stagingRows} after=${after.stagingRows}`
  );

  const rows = Array.isArray(data.rows) ? data.rows : [];
  const summary = data.summary || {};

  const result = {
    ok: true,
    apiBase: API_BASE,
    requestedUrl: url.toString(),
    importJob: job,
    status: res.status,
    dryRun: data.dryRun,
    source: data.source,
    route: data.route,
    writesDatabase: data.writesDatabase,
    transactionWriteNow: data.transactionWriteNow,
    inventoryWriteNow: data.inventoryWriteNow,
    summary,
    rowCount: rows.length,
    sampleRows: rows.slice(0, 3),
    counts: {
      before,
      after,
    },
    noWriteVerified: {
      transactionCountUnchanged: before.transactions === after.transactions,
      inventoryMovementCountUnchanged:
        before.inventoryMovements === after.inventoryMovements,
      importJobCountUnchanged: before.importJobs === after.importJobs,
      importStagingRowCountUnchanged: before.stagingRows === after.stagingRows,
    },
  };

  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((err) => {
    console.error("[FAIL]", err && err.stack ? err.stack : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
