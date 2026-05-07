import {
  assertAmazonSpApiSandboxImportJobReadModelInternalJwtGuardImplementation,
  buildAmazonSpApiSandboxImportJobReadModelInternalJwtGuardImplementation,
  type AmazonSpApiSandboxImportJobReadModelInternalJwtGuardImplementation,
} from './amazon-sp-api-sandbox-importjob-read-model-internal-jwt-guard-implementation.dto';

export const AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_JWT_NEGATIVE_HARDENING_VERSION =
  'amazon-sp-api-sandbox-importjob-read-model-jwt-negative-hardening-v1' as const;

export type AmazonSpApiSandboxImportJobReadModelJwtNegativeHardening = {
  version: typeof AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_JWT_NEGATIVE_HARDENING_VERSION;
  sourceJwtGuardImplementation: AmazonSpApiSandboxImportJobReadModelInternalJwtGuardImplementation;

  smokeOnly: true;
  controllerChangedNow: false;
  serviceChangedNow: false;
  frontendExposedNow: false;
  writesDatabase: false;

  endpoint: {
    method: 'GET';
    path: '/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model';
    guard: 'JwtAuthGuard';
    companyIdSource: 'req.user.companyId';
    dryRunForced: true;
  };

  negativeHttpExpectations: {
    missingTokenReturns401: true;
    malformedTokenReturns401: true;
    wrongSignatureReturns401: true;
    expiredTokenReturns401: true;
    userNotFoundReturns401: true;
    suspendedTenantReturns403: true;
  };

  positiveHttpExpectations: {
    validCompanyUserReturns200: true;
    validCompanyUserInvalidQueryReturns400: true;
    projectionOnly: true;
  };

  forbiddenBehavior: {
    frontendExposure: true;
    schemaMigration: true;
    realSpApi: true;
    oauth: true;
    tokenPersistence: true;
    transactionWrite: true;
    inventoryMovementWrite: true;
    inventoryBalanceWrite: true;
    rawPayloadProjection: true;
    normalizedPayloadProjection: true;
    dedupeHashProjection: true;
    companyIdProjection: true;
    commitSalesAction: true;
    inventoryExecutionAction: true;
  };

  summary: {
    readyForJwtNegativeHardening: true;
    readyForFrontendExposure: false;
    readyForCommittedSales: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiSandboxImportJobReadModelJwtNegativeHardening(): AmazonSpApiSandboxImportJobReadModelJwtNegativeHardening {
  const implementation = assertAmazonSpApiSandboxImportJobReadModelInternalJwtGuardImplementation(
    buildAmazonSpApiSandboxImportJobReadModelInternalJwtGuardImplementation(),
  );

  return {
    version: AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_JWT_NEGATIVE_HARDENING_VERSION,
    sourceJwtGuardImplementation: implementation,

    smokeOnly: true,
    controllerChangedNow: false,
    serviceChangedNow: false,
    frontendExposedNow: false,
    writesDatabase: false,

    endpoint: {
      method: 'GET',
      path: '/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model',
      guard: 'JwtAuthGuard',
      companyIdSource: 'req.user.companyId',
      dryRunForced: true,
    },

    negativeHttpExpectations: {
      missingTokenReturns401: true,
      malformedTokenReturns401: true,
      wrongSignatureReturns401: true,
      expiredTokenReturns401: true,
      userNotFoundReturns401: true,
      suspendedTenantReturns403: true,
    },

    positiveHttpExpectations: {
      validCompanyUserReturns200: true,
      validCompanyUserInvalidQueryReturns400: true,
      projectionOnly: true,
    },

    forbiddenBehavior: {
      frontendExposure: true,
      schemaMigration: true,
      realSpApi: true,
      oauth: true,
      tokenPersistence: true,
      transactionWrite: true,
      inventoryMovementWrite: true,
      inventoryBalanceWrite: true,
      rawPayloadProjection: true,
      normalizedPayloadProjection: true,
      dedupeHashProjection: true,
      companyIdProjection: true,
      commitSalesAction: true,
      inventoryExecutionAction: true,
    },

    summary: {
      readyForJwtNegativeHardening: true,
      readyForFrontendExposure: false,
      readyForCommittedSales: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiSandboxImportJobReadModelJwtNegativeHardening(
  contract: AmazonSpApiSandboxImportJobReadModelJwtNegativeHardening,
): AmazonSpApiSandboxImportJobReadModelJwtNegativeHardening {
  if (contract.version !== AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_JWT_NEGATIVE_HARDENING_VERSION) {
    throw new Error('Step122-T JWT negative hardening violation: version mismatch.');
  }

  if (
    contract.smokeOnly !== true ||
    contract.controllerChangedNow !== false ||
    contract.serviceChangedNow !== false ||
    contract.frontendExposedNow !== false ||
    contract.writesDatabase !== false
  ) {
    throw new Error('Step122-T JWT negative hardening violation: smoke-only boundary mismatch.');
  }

  for (const [key, expected] of Object.entries(contract.negativeHttpExpectations)) {
    if (expected !== true) {
      throw new Error(`Step122-T JWT negative hardening violation: negativeHttpExpectations.${key} must remain true.`);
    }
  }

  for (const [key, expected] of Object.entries(contract.positiveHttpExpectations)) {
    if (expected !== true) {
      throw new Error(`Step122-T JWT negative hardening violation: positiveHttpExpectations.${key} must remain true.`);
    }
  }

  for (const [key, forbidden] of Object.entries(contract.forbiddenBehavior)) {
    if (forbidden !== true) {
      throw new Error(`Step122-T JWT negative hardening violation: forbiddenBehavior.${key} must remain true.`);
    }
  }

  return contract;
}
