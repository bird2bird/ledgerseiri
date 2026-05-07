import {
  assertAmazonSpApiSandboxImportJobReadModelInternalAuthGuardDesign,
  buildAmazonSpApiSandboxImportJobReadModelInternalAuthGuardDesign,
  type AmazonSpApiSandboxImportJobReadModelInternalAuthGuardDesign,
} from './amazon-sp-api-sandbox-importjob-read-model-internal-auth-guard-design.dto';

export const AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_INTERNAL_JWT_GUARD_IMPLEMENTATION_VERSION =
  'amazon-sp-api-sandbox-importjob-read-model-internal-jwt-guard-implementation-v1' as const;

export type AmazonSpApiSandboxImportJobReadModelInternalJwtGuardImplementation = {
  version: typeof AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_INTERNAL_JWT_GUARD_IMPLEMENTATION_VERSION;
  sourceAuthGuardDesign: AmazonSpApiSandboxImportJobReadModelInternalAuthGuardDesign;

  implementedNow: true;
  authGuardImplementedNow: true;
  endpointRequiresJwtNow: true;
  endpointRequiresCompanyIdNow: true;
  frontendExposedNow: false;
  writesDatabase: false;

  endpoint: {
    method: 'GET';
    path: '/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model';
    guard: 'JwtAuthGuard';
    companyIdSource: 'req.user.companyId';
    queryCompanyIdTrusted: false;
    dryRunForced: true;
    projectionOnly: true;
  };

  runtimeExpectations: {
    unauthenticatedRequestReturns401: true;
    authenticatedReadonlyRequestReturns200: true;
    authenticatedInvalidQueryReturns400: true;
    authenticatedMissingCompanyIdReturns403: true;
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
    readyForInternalJwtGuardedReadonlyUsage: true;
    readyForFrontendExposure: false;
    readyForCommittedSales: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiSandboxImportJobReadModelInternalJwtGuardImplementation(): AmazonSpApiSandboxImportJobReadModelInternalJwtGuardImplementation {
  const design = assertAmazonSpApiSandboxImportJobReadModelInternalAuthGuardDesign(
    buildAmazonSpApiSandboxImportJobReadModelInternalAuthGuardDesign(),
  );

  return {
    version: AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_INTERNAL_JWT_GUARD_IMPLEMENTATION_VERSION,
    sourceAuthGuardDesign: design,

    implementedNow: true,
    authGuardImplementedNow: true,
    endpointRequiresJwtNow: true,
    endpointRequiresCompanyIdNow: true,
    frontendExposedNow: false,
    writesDatabase: false,

    endpoint: {
      method: 'GET',
      path: '/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model',
      guard: 'JwtAuthGuard',
      companyIdSource: 'req.user.companyId',
      queryCompanyIdTrusted: false,
      dryRunForced: true,
      projectionOnly: true,
    },

    runtimeExpectations: {
      unauthenticatedRequestReturns401: true,
      authenticatedReadonlyRequestReturns200: true,
      authenticatedInvalidQueryReturns400: true,
      authenticatedMissingCompanyIdReturns403: true,
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
      readyForInternalJwtGuardedReadonlyUsage: true,
      readyForFrontendExposure: false,
      readyForCommittedSales: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiSandboxImportJobReadModelInternalJwtGuardImplementation(
  contract: AmazonSpApiSandboxImportJobReadModelInternalJwtGuardImplementation,
): AmazonSpApiSandboxImportJobReadModelInternalJwtGuardImplementation {
  if (contract.version !== AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_INTERNAL_JWT_GUARD_IMPLEMENTATION_VERSION) {
    throw new Error('Step122-S JWT guard implementation violation: version mismatch.');
  }

  if (
    contract.implementedNow !== true ||
    contract.authGuardImplementedNow !== true ||
    contract.endpointRequiresJwtNow !== true ||
    contract.endpointRequiresCompanyIdNow !== true ||
    contract.frontendExposedNow !== false ||
    contract.writesDatabase !== false
  ) {
    throw new Error('Step122-S JWT guard implementation violation: implementation boundary mismatch.');
  }

  if (
    contract.endpoint.guard !== 'JwtAuthGuard' ||
    contract.endpoint.companyIdSource !== 'req.user.companyId' ||
    contract.endpoint.queryCompanyIdTrusted !== false ||
    contract.endpoint.dryRunForced !== true ||
    contract.endpoint.projectionOnly !== true
  ) {
    throw new Error('Step122-S JWT guard implementation violation: endpoint policy mismatch.');
  }

  for (const [key, forbidden] of Object.entries(contract.forbiddenBehavior)) {
    if (forbidden !== true) {
      throw new Error(`Step122-S JWT guard implementation violation: forbiddenBehavior.${key} must remain true.`);
    }
  }

  return contract;
}
