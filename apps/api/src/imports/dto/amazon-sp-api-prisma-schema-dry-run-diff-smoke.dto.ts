import {
  assertAmazonSpApiActualPrismaSchemaMigrationPlanContract,
  buildAmazonSpApiActualPrismaSchemaMigrationPlanContract,
  type AmazonSpApiPrismaMigrationPlanContract,
} from './amazon-sp-api-actual-prisma-schema-migration-plan-contract.dto';

export const AMAZON_SP_API_PRISMA_SCHEMA_DRY_RUN_DIFF_SMOKE_VERSION =
  'amazon-sp-api-prisma-schema-dry-run-diff-smoke-v1' as const;

export const AMAZON_SP_API_PROPOSED_PRISMA_SCHEMA_BLOCK = String.raw`
enum AmazonSpApiConnectionStatus {
  AUTHORIZATION_PENDING
  CONNECTED
  REVOKED
  EXPIRED
  ERROR
}

model AmazonSpApiConnection {
  id                       String    @id @default(cuid())
  companyId                String
  storeId                  String
  marketplaceId            String
  region                   String
  sellingPartnerId         String
  appId                    String
  status                   AmazonSpApiConnectionStatus @default(AUTHORIZATION_PENDING)
  connectedAt              DateTime?
  revokedAt                DateTime?
  lastTokenRefreshAt       DateTime?
  lastHealthCheckAt        DateTime?
  lastSyncAt               DateTime?
  lastErrorCode            String?
  lastErrorMessageRedacted String?
  createdAt                DateTime  @default(now())
  updatedAt                DateTime  @updatedAt

  company                  Company   @relation(fields: [companyId], references: [id])
  store                    Store     @relation(fields: [storeId], references: [id])
  credential               AmazonSpApiCredential?
  accessTokenCache         AmazonSpApiAccessTokenCache?
  audits                   AmazonSpApiConnectionAudit[]

  @@unique([companyId, storeId, marketplaceId, region])
  @@unique([sellingPartnerId, marketplaceId, region])
  @@index([companyId])
  @@index([storeId])
  @@index([marketplaceId])
  @@index([region])
  @@index([status])
  @@index([lastSyncAt])
}

model AmazonSpApiCredential {
  id                    String   @id @default(cuid())
  connectionId          String   @unique
  encryptedRefreshToken String
  encryptionKeyId       String
  encryptionAlgorithm   String
  tokenVersion          Int
  rotatedAt             DateTime
  revokedAt             DateTime?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  connection            AmazonSpApiConnection @relation(fields: [connectionId], references: [id])
}

model AmazonSpApiAccessTokenCache {
  id                   String   @id @default(cuid())
  connectionId         String   @unique
  encryptedAccessToken String
  tokenType            String
  scope                String?
  expiresAt            DateTime
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  connection           AmazonSpApiConnection @relation(fields: [connectionId], references: [id])

  @@index([expiresAt])
}

model AmazonSpApiConnectionAudit {
  id              String   @id @default(cuid())
  connectionId    String
  companyId       String
  storeId         String
  eventType       String
  messageRedacted String?
  metadataJson    Json?
  createdAt       DateTime @default(now())

  connection      AmazonSpApiConnection @relation(fields: [connectionId], references: [id])
  company         Company @relation(fields: [companyId], references: [id])
  store           Store @relation(fields: [storeId], references: [id])

  @@index([companyId])
  @@index([storeId])
  @@index([connectionId])
  @@index([eventType])
  @@index([createdAt])
}
`;

export const AMAZON_SP_API_PROPOSED_MIGRATION_SQL_PREVIEW = String.raw`
-- Step123-O dry-run preview only. Do not execute.
CREATE TYPE "AmazonSpApiConnectionStatus" AS ENUM ('AUTHORIZATION_PENDING', 'CONNECTED', 'REVOKED', 'EXPIRED', 'ERROR');

CREATE TABLE "AmazonSpApiConnection" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "marketplaceId" TEXT NOT NULL,
  "region" TEXT NOT NULL,
  "sellingPartnerId" TEXT NOT NULL,
  "appId" TEXT NOT NULL,
  "status" "AmazonSpApiConnectionStatus" NOT NULL DEFAULT 'AUTHORIZATION_PENDING',
  "connectedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "lastTokenRefreshAt" TIMESTAMP(3),
  "lastHealthCheckAt" TIMESTAMP(3),
  "lastSyncAt" TIMESTAMP(3),
  "lastErrorCode" TEXT,
  "lastErrorMessageRedacted" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AmazonSpApiConnection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AmazonSpApiCredential" (
  "id" TEXT NOT NULL,
  "connectionId" TEXT NOT NULL,
  "encryptedRefreshToken" TEXT NOT NULL,
  "encryptionKeyId" TEXT NOT NULL,
  "encryptionAlgorithm" TEXT NOT NULL,
  "tokenVersion" INTEGER NOT NULL,
  "rotatedAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AmazonSpApiCredential_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AmazonSpApiAccessTokenCache" (
  "id" TEXT NOT NULL,
  "connectionId" TEXT NOT NULL,
  "encryptedAccessToken" TEXT NOT NULL,
  "tokenType" TEXT NOT NULL,
  "scope" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AmazonSpApiAccessTokenCache_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AmazonSpApiConnectionAudit" (
  "id" TEXT NOT NULL,
  "connectionId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "messageRedacted" TEXT,
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AmazonSpApiConnectionAudit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AmazonSpApiConnection_companyId_storeId_marketplaceId_region_key" ON "AmazonSpApiConnection"("companyId", "storeId", "marketplaceId", "region");
CREATE UNIQUE INDEX "AmazonSpApiConnection_sellingPartnerId_marketplaceId_region_key" ON "AmazonSpApiConnection"("sellingPartnerId", "marketplaceId", "region");
CREATE UNIQUE INDEX "AmazonSpApiCredential_connectionId_key" ON "AmazonSpApiCredential"("connectionId");
CREATE UNIQUE INDEX "AmazonSpApiAccessTokenCache_connectionId_key" ON "AmazonSpApiAccessTokenCache"("connectionId");

CREATE INDEX "AmazonSpApiConnection_companyId_idx" ON "AmazonSpApiConnection"("companyId");
CREATE INDEX "AmazonSpApiConnection_storeId_idx" ON "AmazonSpApiConnection"("storeId");
CREATE INDEX "AmazonSpApiConnection_marketplaceId_idx" ON "AmazonSpApiConnection"("marketplaceId");
CREATE INDEX "AmazonSpApiConnection_region_idx" ON "AmazonSpApiConnection"("region");
CREATE INDEX "AmazonSpApiConnection_status_idx" ON "AmazonSpApiConnection"("status");
CREATE INDEX "AmazonSpApiConnection_lastSyncAt_idx" ON "AmazonSpApiConnection"("lastSyncAt");
CREATE INDEX "AmazonSpApiAccessTokenCache_expiresAt_idx" ON "AmazonSpApiAccessTokenCache"("expiresAt");
CREATE INDEX "AmazonSpApiConnectionAudit_companyId_idx" ON "AmazonSpApiConnectionAudit"("companyId");
CREATE INDEX "AmazonSpApiConnectionAudit_storeId_idx" ON "AmazonSpApiConnectionAudit"("storeId");
CREATE INDEX "AmazonSpApiConnectionAudit_connectionId_idx" ON "AmazonSpApiConnectionAudit"("connectionId");
CREATE INDEX "AmazonSpApiConnectionAudit_eventType_idx" ON "AmazonSpApiConnectionAudit"("eventType");
CREATE INDEX "AmazonSpApiConnectionAudit_createdAt_idx" ON "AmazonSpApiConnectionAudit"("createdAt");

ALTER TABLE "AmazonSpApiConnection" ADD CONSTRAINT "AmazonSpApiConnection_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AmazonSpApiConnection" ADD CONSTRAINT "AmazonSpApiConnection_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AmazonSpApiCredential" ADD CONSTRAINT "AmazonSpApiCredential_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "AmazonSpApiConnection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AmazonSpApiAccessTokenCache" ADD CONSTRAINT "AmazonSpApiAccessTokenCache_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "AmazonSpApiConnection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AmazonSpApiConnectionAudit" ADD CONSTRAINT "AmazonSpApiConnectionAudit_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "AmazonSpApiConnection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AmazonSpApiConnectionAudit" ADD CONSTRAINT "AmazonSpApiConnectionAudit_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AmazonSpApiConnectionAudit" ADD CONSTRAINT "AmazonSpApiConnectionAudit_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
`;

export type AmazonSpApiPrismaSchemaDryRunDiffSmokeContract = {
  version: typeof AMAZON_SP_API_PRISMA_SCHEMA_DRY_RUN_DIFF_SMOKE_VERSION;
  sourceStep123N: AmazonSpApiPrismaMigrationPlanContract;

  contractOnly: false;
  dryRunOnly: true;
  proposedSchemaTextGeneratedNow: true;
  proposedMigrationSqlPreviewGeneratedNow: true;
  schemaPrismaEditedNow: false;
  migrationFileAddedNow: false;
  prismaGenerateNow: false;
  prismaMigrateNow: false;
  databaseWriteNow: false;
  backendRouteAddedNow: false;
  frontendAddedNow: false;
  tokenPersistenceWriteNow: false;
  realSpApiRequestNow: false;
  writesDatabase: false;

  dryRunBoundary: {
    purpose: 'validate-proposed-amazon-sp-api-prisma-schema-without-writing-schema';
    proposedSchemaTextOnly: true;
    proposedMigrationSqlPreviewOnly: true;
    noSchemaPrismaWrite: true;
    noMigrationFileWrite: true;
    noPrismaGenerate: true;
    noPrismaMigrate: true;
    noDatabaseWrite: true;
    noRouteNow: true;
    noFrontendNow: true;
  };

  proposedModelValidation: {
    amazonSpApiConnectionPresent: true;
    amazonSpApiCredentialPresent: true;
    amazonSpApiAccessTokenCachePresent: true;
    amazonSpApiConnectionAuditPresent: true;
    connectionStatusEnumPresent: true;
    requiredRelationsPresent: true;
    requiredIndexesPresent: true;
    requiredUniqueConstraintsPresent: true;
  };

  secretSafetyValidation: {
    plaintextRefreshTokenFieldForbidden: true;
    plaintextAccessTokenFieldForbidden: true;
    clientSecretFieldForbidden: true;
    authorizationCodeFieldForbidden: true;
    rawOAuthStateFieldForbidden: true;
    encryptedRefreshTokenRequired: true;
    encryptedAccessTokenRequired: true;
    redactedMessageFieldRequired: true;
  };

  destructiveDiffValidation: {
    dropTableForbidden: true;
    dropColumnForbidden: true;
    alterExistingTransactionForbidden: true;
    alterExistingImportJobForbidden: true;
    alterExistingInventoryForbidden: true;
    alterExistingCompanyForbiddenExceptForeignKeyReferences: true;
    alterExistingStoreForbiddenExceptForeignKeyReferences: true;
    deleteStatementForbidden: true;
    truncateStatementForbidden: true;
  };

  forbiddenNow: {
    schemaPrismaEdit: true;
    prismaMigrationFile: true;
    prismaGenerate: true;
    prismaMigrateDev: true;
    prismaMigrateDeploy: true;
    databaseWrite: true;
    tokenPersistenceDatabaseWrite: true;
    tokenExchangeHttpCall: true;
    callbackControllerRoute: true;
    authorizationControllerRoute: true;
    frontendButton: true;
    frontendApiClient: true;
    realSpApiHttpCall: true;
    createReportCall: true;
    getReportCall: true;
    getReportDocumentCall: true;
    importJobWrite: true;
    transactionWrite: true;
    inventoryWrite: true;
  };

  summary: {
    readyForActualPrismaSchemaEditScript: true;
    readyForActualPrismaSchemaMigration: false;
    readyForPrismaGenerate: false;
    readyForTokenPersistenceDatabaseImplementation: false;
    readyForTokenExchangeHttpImplementation: false;
    readyForCallbackRouteImplementation: false;
    readyForRealSpApiReportRequest: false;
    readyForCommittedSales: false;
    readyForInventoryExecution: false;
  };
};

function assertContains(haystack: string, needle: string, label: string): void {
  if (!haystack.includes(needle)) {
    throw new Error(`Step123-O Prisma schema dry-run diff smoke violation: missing ${label}: ${needle}`);
  }
}

function assertDoesNotContain(haystack: string, needle: string, label: string): void {
  if (haystack.includes(needle)) {
    throw new Error(`Step123-O Prisma schema dry-run diff smoke violation: forbidden ${label}: ${needle}`);
  }
}

export function assertAmazonSpApiProposedPrismaSchemaDryRunDiff(): {
  proposedSchemaBlock: string;
  proposedMigrationSqlPreview: string;
} {
  const schema = AMAZON_SP_API_PROPOSED_PRISMA_SCHEMA_BLOCK;
  const sql = AMAZON_SP_API_PROPOSED_MIGRATION_SQL_PREVIEW;

  for (const marker of [
    'enum AmazonSpApiConnectionStatus',
    'model AmazonSpApiConnection',
    'model AmazonSpApiCredential',
    'model AmazonSpApiAccessTokenCache',
    'model AmazonSpApiConnectionAudit',
    'companyId                String',
    'storeId                  String',
    'marketplaceId            String',
    'region                   String',
    'sellingPartnerId         String',
    'appId                    String',
    'encryptedRefreshToken String',
    'encryptedAccessToken String',
    'lastErrorMessageRedacted String?',
    '@@unique([companyId, storeId, marketplaceId, region])',
    '@@unique([sellingPartnerId, marketplaceId, region])',
    '@@index([companyId])',
    '@@index([storeId])',
    '@@index([expiresAt])',
  ]) {
    assertContains(schema, marker, 'proposed schema marker');
  }

  for (const forbidden of [
    'refreshToken ',
    'accessToken ',
    'clientSecret',
    'authorizationCode',
    'spapiOAuthCode',
    'rawOAuthState',
    'ON DELETE CASCADE',
    'onDelete: Cascade',
  ]) {
    assertDoesNotContain(schema, forbidden, 'proposed schema plaintext/destructive marker');
  }

  for (const marker of [
    'CREATE TYPE "AmazonSpApiConnectionStatus"',
    'CREATE TABLE "AmazonSpApiConnection"',
    'CREATE TABLE "AmazonSpApiCredential"',
    'CREATE TABLE "AmazonSpApiAccessTokenCache"',
    'CREATE TABLE "AmazonSpApiConnectionAudit"',
    'CREATE UNIQUE INDEX "AmazonSpApiConnection_companyId_storeId_marketplaceId_region_key"',
    'CREATE UNIQUE INDEX "AmazonSpApiConnection_sellingPartnerId_marketplaceId_region_key"',
    'CREATE UNIQUE INDEX "AmazonSpApiCredential_connectionId_key"',
    'CREATE UNIQUE INDEX "AmazonSpApiAccessTokenCache_connectionId_key"',
    'ON DELETE RESTRICT ON UPDATE CASCADE',
  ]) {
    assertContains(sql, marker, 'proposed migration SQL marker');
  }

  for (const forbidden of [
    'DROP TABLE',
    'DROP COLUMN',
    'DROP INDEX',
    'TRUNCATE',
    'DELETE FROM',
    'ALTER TABLE "Transaction"',
    'ALTER TABLE "ImportJob"',
    'ALTER TABLE "ImportStagingRow"',
    'ALTER TABLE "InventoryBalance"',
    'ALTER TABLE "InventoryMovement"',
    'ALTER TABLE "Product"',
    'ALTER TABLE "ProductSku"',
  ]) {
    assertDoesNotContain(sql, forbidden, 'destructive SQL marker');
  }

  return {
    proposedSchemaBlock: schema,
    proposedMigrationSqlPreview: sql,
  };
}

export function buildAmazonSpApiPrismaSchemaDryRunDiffSmokeContract(): AmazonSpApiPrismaSchemaDryRunDiffSmokeContract {
  const step123N = assertAmazonSpApiActualPrismaSchemaMigrationPlanContract(
    buildAmazonSpApiActualPrismaSchemaMigrationPlanContract(),
  );

  assertAmazonSpApiProposedPrismaSchemaDryRunDiff();

  return {
    version: AMAZON_SP_API_PRISMA_SCHEMA_DRY_RUN_DIFF_SMOKE_VERSION,
    sourceStep123N: step123N,

    contractOnly: false,
    dryRunOnly: true,
    proposedSchemaTextGeneratedNow: true,
    proposedMigrationSqlPreviewGeneratedNow: true,
    schemaPrismaEditedNow: false,
    migrationFileAddedNow: false,
    prismaGenerateNow: false,
    prismaMigrateNow: false,
    databaseWriteNow: false,
    backendRouteAddedNow: false,
    frontendAddedNow: false,
    tokenPersistenceWriteNow: false,
    realSpApiRequestNow: false,
    writesDatabase: false,

    dryRunBoundary: {
      purpose: 'validate-proposed-amazon-sp-api-prisma-schema-without-writing-schema',
      proposedSchemaTextOnly: true,
      proposedMigrationSqlPreviewOnly: true,
      noSchemaPrismaWrite: true,
      noMigrationFileWrite: true,
      noPrismaGenerate: true,
      noPrismaMigrate: true,
      noDatabaseWrite: true,
      noRouteNow: true,
      noFrontendNow: true,
    },

    proposedModelValidation: {
      amazonSpApiConnectionPresent: true,
      amazonSpApiCredentialPresent: true,
      amazonSpApiAccessTokenCachePresent: true,
      amazonSpApiConnectionAuditPresent: true,
      connectionStatusEnumPresent: true,
      requiredRelationsPresent: true,
      requiredIndexesPresent: true,
      requiredUniqueConstraintsPresent: true,
    },

    secretSafetyValidation: {
      plaintextRefreshTokenFieldForbidden: true,
      plaintextAccessTokenFieldForbidden: true,
      clientSecretFieldForbidden: true,
      authorizationCodeFieldForbidden: true,
      rawOAuthStateFieldForbidden: true,
      encryptedRefreshTokenRequired: true,
      encryptedAccessTokenRequired: true,
      redactedMessageFieldRequired: true,
    },

    destructiveDiffValidation: {
      dropTableForbidden: true,
      dropColumnForbidden: true,
      alterExistingTransactionForbidden: true,
      alterExistingImportJobForbidden: true,
      alterExistingInventoryForbidden: true,
      alterExistingCompanyForbiddenExceptForeignKeyReferences: true,
      alterExistingStoreForbiddenExceptForeignKeyReferences: true,
      deleteStatementForbidden: true,
      truncateStatementForbidden: true,
    },

    forbiddenNow: {
      schemaPrismaEdit: true,
      prismaMigrationFile: true,
      prismaGenerate: true,
      prismaMigrateDev: true,
      prismaMigrateDeploy: true,
      databaseWrite: true,
      tokenPersistenceDatabaseWrite: true,
      tokenExchangeHttpCall: true,
      callbackControllerRoute: true,
      authorizationControllerRoute: true,
      frontendButton: true,
      frontendApiClient: true,
      realSpApiHttpCall: true,
      createReportCall: true,
      getReportCall: true,
      getReportDocumentCall: true,
      importJobWrite: true,
      transactionWrite: true,
      inventoryWrite: true,
    },

    summary: {
      readyForActualPrismaSchemaEditScript: true,
      readyForActualPrismaSchemaMigration: false,
      readyForPrismaGenerate: false,
      readyForTokenPersistenceDatabaseImplementation: false,
      readyForTokenExchangeHttpImplementation: false,
      readyForCallbackRouteImplementation: false,
      readyForRealSpApiReportRequest: false,
      readyForCommittedSales: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiPrismaSchemaDryRunDiffSmokeContract(
  contract: AmazonSpApiPrismaSchemaDryRunDiffSmokeContract,
): AmazonSpApiPrismaSchemaDryRunDiffSmokeContract {
  if (contract.version !== AMAZON_SP_API_PRISMA_SCHEMA_DRY_RUN_DIFF_SMOKE_VERSION) {
    throw new Error('Step123-O Prisma schema dry-run diff smoke violation: version mismatch.');
  }

  assertAmazonSpApiActualPrismaSchemaMigrationPlanContract(contract.sourceStep123N);

  if (
    contract.dryRunOnly !== true ||
    contract.proposedSchemaTextGeneratedNow !== true ||
    contract.proposedMigrationSqlPreviewGeneratedNow !== true ||
    contract.schemaPrismaEditedNow !== false ||
    contract.migrationFileAddedNow !== false ||
    contract.prismaGenerateNow !== false ||
    contract.prismaMigrateNow !== false ||
    contract.databaseWriteNow !== false ||
    contract.backendRouteAddedNow !== false ||
    contract.frontendAddedNow !== false ||
    contract.tokenPersistenceWriteNow !== false ||
    contract.realSpApiRequestNow !== false ||
    contract.writesDatabase !== false
  ) {
    throw new Error('Step123-O Prisma schema dry-run diff smoke violation: dry-run boundary mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    dryRunBoundary: contract.dryRunBoundary,
    proposedModelValidation: contract.proposedModelValidation,
    secretSafetyValidation: contract.secretSafetyValidation,
    destructiveDiffValidation: contract.destructiveDiffValidation,
    forbiddenNow: contract.forbiddenNow,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (key === 'purpose') continue;
      if (value !== true) {
        throw new Error(`Step123-O Prisma schema dry-run diff smoke violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.summary.readyForActualPrismaSchemaEditScript !== true ||
    contract.summary.readyForActualPrismaSchemaMigration !== false ||
    contract.summary.readyForPrismaGenerate !== false ||
    contract.summary.readyForTokenPersistenceDatabaseImplementation !== false ||
    contract.summary.readyForTokenExchangeHttpImplementation !== false ||
    contract.summary.readyForCallbackRouteImplementation !== false ||
    contract.summary.readyForRealSpApiReportRequest !== false ||
    contract.summary.readyForCommittedSales !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step123-O Prisma schema dry-run diff smoke violation: summary readiness mismatch.');
  }

  return contract;
}
