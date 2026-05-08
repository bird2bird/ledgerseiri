import {
  assertAmazonSpApiActualPrismaSchemaEditContract,
  buildAmazonSpApiActualPrismaSchemaEditContract,
  type AmazonSpApiActualPrismaSchemaEditContract,
} from './amazon-sp-api-actual-prisma-schema-edit-contract.dto';

export const AMAZON_SP_API_PRISMA_CLIENT_GENERATION_MODEL_AVAILABILITY_VERSION =
  'amazon-sp-api-prisma-client-generation-model-availability-v1' as const;

export type AmazonSpApiPrismaClientGenerationModelAvailabilityContract = {
  version: typeof AMAZON_SP_API_PRISMA_CLIENT_GENERATION_MODEL_AVAILABILITY_VERSION;
  sourceStep124A: AmazonSpApiActualPrismaSchemaEditContract;

  prismaGenerateNow: true;
  prismaClientAvailabilitySmokeNow: true;
  apiBuildNow: true;

  migrationFileAddedNow: false;
  prismaMigrateNow: false;
  databaseWriteNow: false;
  backendRouteAddedNow: false;
  frontendAddedNow: false;
  tokenPersistenceWriteNow: false;
  tokenExchangeHttpCallNow: false;
  realSpApiRequestNow: false;
  writesDatabase: false;

  expectedPrismaDelegates: {
    amazonSpApiConnection: true;
    amazonSpApiCredential: true;
    amazonSpApiAccessTokenCache: true;
    amazonSpApiConnectionAudit: true;
  };

  expectedGeneratedEnum: {
    AmazonSpApiConnectionStatus: true;
    AUTHORIZATION_PENDING: true;
    CONNECTED: true;
    REVOKED: true;
    EXPIRED: true;
    ERROR: true;
  };

  clientAvailabilityBoundary: {
    prismaClientGeneratedFromCurrentSchema: true;
    delegateAvailabilityChecked: true;
    enumAvailabilityChecked: true;
    noDatabaseConnectionRequired: true;
    noPrismaMigrateRequired: true;
    noMigrationFileRequired: true;
    noServiceImplementationNow: true;
    noRouteImplementationNow: true;
    noFrontendImplementationNow: true;
  };

  forbiddenNow: {
    prismaMigrationFile: true;
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
    readyForMigrationFileCreationPlan: true;
    readyForActualMigrationFileCreation: false;
    readyForTokenPersistenceServiceImplementation: false;
    readyForTokenExchangeHttpImplementation: false;
    readyForCallbackRouteImplementation: false;
    readyForRealSpApiReportRequest: false;
    readyForCommittedSales: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiPrismaClientGenerationModelAvailabilityContract(): AmazonSpApiPrismaClientGenerationModelAvailabilityContract {
  const step124A = assertAmazonSpApiActualPrismaSchemaEditContract(
    buildAmazonSpApiActualPrismaSchemaEditContract(),
  );

  return {
    version: AMAZON_SP_API_PRISMA_CLIENT_GENERATION_MODEL_AVAILABILITY_VERSION,
    sourceStep124A: step124A,

    prismaGenerateNow: true,
    prismaClientAvailabilitySmokeNow: true,
    apiBuildNow: true,

    migrationFileAddedNow: false,
    prismaMigrateNow: false,
    databaseWriteNow: false,
    backendRouteAddedNow: false,
    frontendAddedNow: false,
    tokenPersistenceWriteNow: false,
    tokenExchangeHttpCallNow: false,
    realSpApiRequestNow: false,
    writesDatabase: false,

    expectedPrismaDelegates: {
      amazonSpApiConnection: true,
      amazonSpApiCredential: true,
      amazonSpApiAccessTokenCache: true,
      amazonSpApiConnectionAudit: true,
    },

    expectedGeneratedEnum: {
      AmazonSpApiConnectionStatus: true,
      AUTHORIZATION_PENDING: true,
      CONNECTED: true,
      REVOKED: true,
      EXPIRED: true,
      ERROR: true,
    },

    clientAvailabilityBoundary: {
      prismaClientGeneratedFromCurrentSchema: true,
      delegateAvailabilityChecked: true,
      enumAvailabilityChecked: true,
      noDatabaseConnectionRequired: true,
      noPrismaMigrateRequired: true,
      noMigrationFileRequired: true,
      noServiceImplementationNow: true,
      noRouteImplementationNow: true,
      noFrontendImplementationNow: true,
    },

    forbiddenNow: {
      prismaMigrationFile: true,
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
      readyForMigrationFileCreationPlan: true,
      readyForActualMigrationFileCreation: false,
      readyForTokenPersistenceServiceImplementation: false,
      readyForTokenExchangeHttpImplementation: false,
      readyForCallbackRouteImplementation: false,
      readyForRealSpApiReportRequest: false,
      readyForCommittedSales: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiPrismaClientGenerationModelAvailabilityContract(
  contract: AmazonSpApiPrismaClientGenerationModelAvailabilityContract,
): AmazonSpApiPrismaClientGenerationModelAvailabilityContract {
  if (contract.version !== AMAZON_SP_API_PRISMA_CLIENT_GENERATION_MODEL_AVAILABILITY_VERSION) {
    throw new Error('Step124-B Prisma client generation availability contract violation: version mismatch.');
  }

  assertAmazonSpApiActualPrismaSchemaEditContract(contract.sourceStep124A);

  if (
    contract.prismaGenerateNow !== true ||
    contract.prismaClientAvailabilitySmokeNow !== true ||
    contract.apiBuildNow !== true ||
    contract.migrationFileAddedNow !== false ||
    contract.prismaMigrateNow !== false ||
    contract.databaseWriteNow !== false ||
    contract.backendRouteAddedNow !== false ||
    contract.frontendAddedNow !== false ||
    contract.tokenPersistenceWriteNow !== false ||
    contract.tokenExchangeHttpCallNow !== false ||
    contract.realSpApiRequestNow !== false ||
    contract.writesDatabase !== false
  ) {
    throw new Error('Step124-B Prisma client generation availability contract violation: boundary mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    expectedPrismaDelegates: contract.expectedPrismaDelegates,
    expectedGeneratedEnum: contract.expectedGeneratedEnum,
    clientAvailabilityBoundary: contract.clientAvailabilityBoundary,
    forbiddenNow: contract.forbiddenNow,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (value !== true) {
        throw new Error(`Step124-B Prisma client generation availability contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.summary.readyForMigrationFileCreationPlan !== true ||
    contract.summary.readyForActualMigrationFileCreation !== false ||
    contract.summary.readyForTokenPersistenceServiceImplementation !== false ||
    contract.summary.readyForTokenExchangeHttpImplementation !== false ||
    contract.summary.readyForCallbackRouteImplementation !== false ||
    contract.summary.readyForRealSpApiReportRequest !== false ||
    contract.summary.readyForCommittedSales !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step124-B Prisma client generation availability contract violation: summary mismatch.');
  }

  return contract;
}
