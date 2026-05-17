const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

const root = "/opt/ledgerseiri";
const api = path.join(root, "apps/api");
const schemaPath = path.join(api, "prisma/schema.prisma");
const packagePath = path.join(api, "package.json");
const controllerPath = path.join(api, "src/imports/imports.controller.ts");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function run(command, cwd = api) {
  return childProcess.execSync(command, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

console.log("========== Step149-G smoke: Prisma Client model availability ==========");

const schema = read(schemaPath);
const pkg = JSON.parse(read(packagePath));
const controller = read(controllerPath);

[
  "enum AmazonSpApiOrderSyncJobStatus",
  "enum AmazonSpApiOrderSyncSegmentStatus",
  "model AmazonSpApiOrderSyncJob",
  "model AmazonSpApiOrderSyncSegment",
  "amazonSpApiOrderSyncJobId",
  "amazonSpApiOrderSyncSegmentId",
].forEach((needle) => {
  assert(schema.includes(needle), `schema missing marker: ${needle}`);
});

const generatedCheckOutput = run(`
node - <<'NODE'
const { PrismaClient, Prisma } = require('@prisma/client');

const prisma = new PrismaClient();

const delegateNames = Object.keys(prisma).filter((key) => !key.startsWith('_') && !key.startsWith('$')).sort();
const enumKeys = Object.keys(Prisma).filter((key) => key.includes('AmazonSpApiOrderSync')).sort();

const dmmfModels = Prisma.dmmf.datamodel.models.map((model) => model.name).sort();
const dmmfEnums = Prisma.dmmf.datamodel.enums.map((item) => item.name).sort();

const result = {
  hasJobDelegate: Boolean(prisma.amazonSpApiOrderSyncJob),
  hasSegmentDelegate: Boolean(prisma.amazonSpApiOrderSyncSegment),
  delegateNames,
  enumKeys,
  dmmfModels,
  dmmfEnums,
};

console.log(JSON.stringify(result, null, 2));

prisma.$disconnect();
NODE
`);

console.log(generatedCheckOutput);

const generated = JSON.parse(generatedCheckOutput);

assert(generated.hasJobDelegate, "PrismaClient delegate missing: amazonSpApiOrderSyncJob");
assert(generated.hasSegmentDelegate, "PrismaClient delegate missing: amazonSpApiOrderSyncSegment");

assert(
  generated.dmmfModels.includes("AmazonSpApiOrderSyncJob"),
  "Prisma DMMF missing model: AmazonSpApiOrderSyncJob",
);

assert(
  generated.dmmfModels.includes("AmazonSpApiOrderSyncSegment"),
  "Prisma DMMF missing model: AmazonSpApiOrderSyncSegment",
);

assert(
  generated.dmmfEnums.includes("AmazonSpApiOrderSyncJobStatus") ||
    generated.enumKeys.includes("AmazonSpApiOrderSyncJobStatus"),
  "Prisma generated client missing enum: AmazonSpApiOrderSyncJobStatus",
);

assert(
  generated.dmmfEnums.includes("AmazonSpApiOrderSyncSegmentStatus") ||
    generated.enumKeys.includes("AmazonSpApiOrderSyncSegmentStatus"),
  "Prisma generated client missing enum: AmazonSpApiOrderSyncSegmentStatus",
);

assert(
  controller.includes("amazonSpApiOrdersHistoricalSyncDisabledControllerRoute"),
  "Step149-C disabled route must remain present",
);

assert(
  !controller.includes("amazonSpApiOrderSyncJob.") &&
    !controller.includes("amazonSpApiOrderSyncSegment.") &&
    !controller.includes("AmazonSpApiOrderSyncJob") &&
    !controller.includes("AmazonSpApiOrderSyncSegment"),
  "controller must not wire new Prisma sync models in Step149-G",
);

// Do not scan this smoke file itself, because it must contain the forbidden strings as test data.
// Do not scan the full controller either, because unrelated existing Amazon real-preview routes may legitimately
// contain Amazon transport markers. Step149-G only needs to ensure the historical-sync disabled route remains inert.
const historicalSyncRouteStart = controller.indexOf("amazonSpApiOrdersHistoricalSyncDisabledControllerRoute");
assert(historicalSyncRouteStart >= 0, "historical sync disabled route must remain present");
const historicalSyncRouteEndMarker = "\n  // Step141-G1:";
const historicalSyncRouteEnd = controller.indexOf(historicalSyncRouteEndMarker, historicalSyncRouteStart);
const historicalSyncRouteScope = controller.slice(
  historicalSyncRouteStart,
  historicalSyncRouteEnd > historicalSyncRouteStart ? historicalSyncRouteEnd : historicalSyncRouteStart + 2400,
);
const step149GExecutionSurface = [
  read(packagePath),
  historicalSyncRouteScope,
].join("\n");

[
  "prisma migrate dev",
  "prisma migrate deploy",
  "prisma db push",
  "transaction.create(",
  "inventoryMovement.create(",
  "previewAmazonSpApiOrdersReal(",
  "buildAmazonSpApiOrdersServerOnlyRawSignedTransport",
].forEach((forbidden) => {
  assert(!step149GExecutionSurface.includes(forbidden), `Step149-G must not introduce forbidden runtime command/marker: ${forbidden}`);
});

assert(
  pkg.scripts["smoke:step149-g-amazon-orders-historical-sync-prisma-client-model-availability"] ===
    "node scripts/smoke-step149-g-amazon-orders-historical-sync-prisma-client-model-availability.js",
  "package.json must register Step149-G smoke",
);

console.log("[SMOKE_OK] Step149-G Prisma Client model availability smoke passed");
