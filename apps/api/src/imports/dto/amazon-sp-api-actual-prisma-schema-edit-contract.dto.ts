import {
  assertAmazonSpApiPrismaSchemaDryRunDiffSmokeContract,
  buildAmazonSpApiPrismaSchemaDryRunDiffSmokeContract,
  type AmazonSpApiPrismaSchemaDryRunDiffSmokeContract,
} from './amazon-sp-api-prisma-schema-dry-run-diff-smoke.dto';

export const AMAZON_SP_API_ACTUAL_PRISMA_SCHEMA_EDIT_CONTRACT_VERSION =
  'amazon-sp-api-actual-prisma-schema-edit-contract-v1' as const;

export type AmazonSpApiActualPrismaSchemaEditContract = {
  version: typeof AMAZON_SP_API_ACTUAL_PRISMA_SCHEMA_EDIT_CONTRACT_VERSION;
  sourceStep123O: AmazonSpApiPrismaSchemaDryRunDiffSmokeContract;

  schemaPrismaEditedNow: true;
  enumAddedNow: true;
  modelsAddedNow: true;
  companyBackRelationsAddedNow: true;
  storeBackRelationsAddedNow: true;

  migrationFileAddedNow: false;
  prismaGenerateNow: false;
  prismaMigrateNow: false;
  databaseWriteNow: false;
  backendRouteAddedNow: false;
  frontendAddedNow: false;
  tokenPersistenceWriteNow: false;
  tokenExchangeHttpCallNow: false;
  realSpApiRequestNow: false;
  writesDatabase: false;

  addedEnum: 'AmazonSpApiConnectionStatus';

  addedModels: {
    AmazonSpApiConnection: true;
    AmazonSpApiCredential: true;
    AmazonSpApiAccessTokenCache: true;
    AmazonSpApiConnectionAudit: true;
  };

  requiredCompanyBackRelations: readonly [
    'amazonSpApiConnections',
    'amazonSpApiConnectionAudits'
  ];

  requiredStoreBackRelations: readonly [
    'amazonSpApiConnections',
    'amazonSpApiConnectionAudits'
  ];

  schemaSafety: {
    noPlaintextRefreshTokenField: true;
    noPlaintextAccessTokenField: true;
    noClientSecretField: true;
    noAuthorizationCodeField: true;
    encryptedRefreshTokenOnly: true;
    encryptedAccessTokenOnly: true;
    onDeleteRestrictRequired: true;
    noCascadeDeleteForAmazonConnections: true;
    existingAccountingModelsUntouched: true;
  };

  validationPlan: {
    prismaValidateRequired: true;
    apiBuildRequired: true;
    schemaSmokeRequired: true;
    noMigrationFileRequired: true;
    noPrismaGenerateRequired: true;
    noMigrateRequired: true;
  };

  forbiddenNow: {
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
    readyForPrismaValidate: true;
    readyForPrismaGenerateStep: true;
    readyForActualMigrationFileCreation: false;
    readyForTokenPersistenceDatabaseImplementation: false;
    readyForTokenExchangeHttpImplementation: false;
    readyForCallbackRouteImplementation: false;
    readyForRealSpApiReportRequest: false;
    readyForCommittedSales: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiActualPrismaSchemaEditContract(): AmazonSpApiActualPrismaSchemaEditContract {
  const step123O = assertAmazonSpApiPrismaSchemaDryRunDiffSmokeContract(
    buildAmazonSpApiPrismaSchemaDryRunDiffSmokeContract(),
  );

  return {
    version: AMAZON_SP_API_ACTUAL_PRISMA_SCHEMA_EDIT_CONTRACT_VERSION,
    sourceStep123O: step123O,

    schemaPrismaEditedNow: true,
    enumAddedNow: true,
    modelsAddedNow: true,
    companyBackRelationsAddedNow: true,
    storeBackRelationsAddedNow: true,

    migrationFileAddedNow: false,
    prismaGenerateNow: false,
    prismaMigrateNow: false,
    databaseWriteNow: false,
    backendRouteAddedNow: false,
    frontendAddedNow: false,
    tokenPersistenceWriteNow: false,
    tokenExchangeHttpCallNow: false,
    realSpApiRequestNow: false,
    writesDatabase: false,

    addedEnum: 'AmazonSpApiConnectionStatus',

    addedModels: {
      AmazonSpApiConnection: true,
      AmazonSpApiCredential: true,
      AmazonSpApiAccessTokenCache: true,
      AmazonSpApiConnectionAudit: true,
    },

    requiredCompanyBackRelations: ['amazonSpApiConnections', 'amazonSpApiConnectionAudits'],
    requiredStoreBackRelations: ['amazonSpApiConnections', 'amazonSpApiConnectionAudits'],

    schemaSafety: {
      noPlaintextRefreshTokenField: true,
      noPlaintextAccessTokenField: true,
      noClientSecretField: true,
      noAuthorizationCodeField: true,
      encryptedRefreshTokenOnly: true,
      encryptedAccessTokenOnly: true,
      onDeleteRestrictRequired: true,
      noCascadeDeleteForAmazonConnections: true,
      existingAccountingModelsUntouched: true,
    },

    validationPlan: {
      prismaValidateRequired: true,
      apiBuildRequired: true,
      schemaSmokeRequired: true,
      noMigrationFileRequired: true,
      noPrismaGenerateRequired: true,
      noMigrateRequired: true,
    },

    forbiddenNow: {
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
      readyForPrismaValidate: true,
      readyForPrismaGenerateStep: true,
      readyForActualMigrationFileCreation: false,
      readyForTokenPersistenceDatabaseImplementation: false,
      readyForTokenExchangeHttpImplementation: false,
      readyForCallbackRouteImplementation: false,
      readyForRealSpApiReportRequest: false,
      readyForCommittedSales: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiActualPrismaSchemaEditContract(
  contract: AmazonSpApiActualPrismaSchemaEditContract,
): AmazonSpApiActualPrismaSchemaEditContract {
  if (contract.version !== AMAZON_SP_API_ACTUAL_PRISMA_SCHEMA_EDIT_CONTRACT_VERSION) {
    throw new Error('Step124-A actual Prisma schema edit contract violation: version mismatch.');
  }

  assertAmazonSpApiPrismaSchemaDryRunDiffSmokeContract(contract.sourceStep123O);

  if (
    contract.schemaPrismaEditedNow !== true ||
    contract.enumAddedNow !== true ||
    contract.modelsAddedNow !== true ||
    contract.companyBackRelationsAddedNow !== true ||
    contract.storeBackRelationsAddedNow !== true ||
    contract.migrationFileAddedNow !== false ||
    contract.prismaGenerateNow !== false ||
    contract.prismaMigrateNow !== false ||
    contract.databaseWriteNow !== false ||
    contract.backendRouteAddedNow !== false ||
    contract.frontendAddedNow !== false ||
    contract.tokenPersistenceWriteNow !== false ||
    contract.tokenExchangeHttpCallNow !== false ||
    contract.realSpApiRequestNow !== false ||
    contract.writesDatabase !== false
  ) {
    throw new Error('Step124-A actual Prisma schema edit contract violation: boundary mismatch.');
  }

  for (const [key, value] of Object.entries(contract.addedModels)) {
    if (value !== true) {
      throw new Error(`Step124-A actual Prisma schema edit contract violation: added model missing: ${key}`);
    }
  }

  for (const [sectionName, section] of Object.entries({
    schemaSafety: contract.schemaSafety,
    validationPlan: contract.validationPlan,
    forbiddenNow: contract.forbiddenNow,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (value !== true) {
        throw new Error(`Step124-A actual Prisma schema edit contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.summary.readyForPrismaValidate !== true ||
    contract.summary.readyForPrismaGenerateStep !== true ||
    contract.summary.readyForActualMigrationFileCreation !== false ||
    contract.summary.readyForTokenPersistenceDatabaseImplementation !== false ||
    contract.summary.readyForTokenExchangeHttpImplementation !== false ||
    contract.summary.readyForCallbackRouteImplementation !== false ||
    contract.summary.readyForRealSpApiReportRequest !== false ||
    contract.summary.readyForCommittedSales !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step124-A actual Prisma schema edit contract violation: summary mismatch.');
  }

  return contract;
}
