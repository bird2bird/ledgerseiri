import {
  assertAmazonSpApiSandboxImportJobReadModelHttpAuthBoundaryPreflight,
  buildAmazonSpApiSandboxImportJobReadModelHttpAuthBoundaryPreflight,
  type AmazonSpApiSandboxImportJobReadModelHttpAuthBoundaryPreflight,
} from './amazon-sp-api-sandbox-importjob-read-model-http-auth-boundary-preflight.dto';

export const AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_INTERNAL_AUTH_GUARD_DESIGN_VERSION =
  'amazon-sp-api-sandbox-importjob-read-model-internal-auth-guard-design-v1' as const;

export type AmazonSpApiSandboxImportJobReadModelInternalAuthGuardDesign = {
  version: typeof AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_INTERNAL_AUTH_GUARD_DESIGN_VERSION;
  sourceHttpAuthBoundaryPreflight: AmazonSpApiSandboxImportJobReadModelHttpAuthBoundaryPreflight;

  designOnly: true;
  authGuardImplementedNow: false;
  endpointStillRuntimeCallableNow: true;
  frontendExposedNow: false;
  writesDatabase: false;

  targetEndpoint: {
    method: 'GET';
    path: '/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model';
    controller: 'ImportsController';
    controllerMethod: 'amazonSpApiSandboxImportJobReadModelEnvGatedBlockedRoute';
  };

  existingAuthFoundation: {
    guardClass: 'JwtAuthGuard';
    strategy: 'jwt';
    strategyClass: 'JwtStrategy';
    tokenSources: readonly ['Authorization: Bearer', 'access_token cookie'];
    requestUserShape: {
      id: 'string';
      userId: 'string';
      companyId: 'string|null';
      email: 'string';
    };
  };

  futureGuardPolicy: {
    useJwtAuthGuard: true;
    requireUser: true;
    requireCompanyId: true;
    rejectMissingCompanyId: true;
    deriveCompanyIdFromReqUser: true;
    neverTrustQueryCompanyId: true;
    keepInternalSandboxEnvGate: true;
    validateQueryBeforeServiceCall: true;
    keepDryRunTrue: true;
    returnProjectionOnly: true;
  };

  futureImplementationShape: {
    imports: readonly [
      "UseGuards from '@nestjs/common'",
      "Req from '@nestjs/common'",
      "JwtAuthGuard from '../auth/jwt.guard'",
      "Request type from express or local request-user type"
    ];
    controllerDecoratorOrder: readonly [
      "@UseGuards(JwtAuthGuard)",
      "@Get('internal/amazon-sp-api-sandbox/import-jobs/read-model')"
    ];
    companyIdSource: 'req.user.companyId';
    serviceArgs: {
      companyId: 'req.user.companyId';
      filter: 'normalized.filter';
      sort: 'normalized.sort';
      page: 'normalized.page';
      pageSize: 'normalized.pageSize';
      dryRun: true;
    };
  };

  forbiddenNow: {
    modifyingControllerGuard: true;
    frontendExposure: true;
    schemaMigration: true;
    realSpApi: true;
    oauth: true;
    tokenPersistence: true;
    transactionWrite: true;
    inventoryMovementWrite: true;
    inventoryBalanceWrite: true;
    commitSalesAction: true;
    inventoryExecutionAction: true;
  };

  implementationReadiness: {
    authFoundationExists: true;
    targetEndpointExists: true;
    httpRuntimeSmokeExists: true;
    authBoundaryPreflightExists: true;
    readyForGuardImplementation: false;
  };

  summary: {
    readyForAuthGuardDesign: true;
    readyForAuthGuardImplementation: false;
    readyForFrontendExposure: false;
    readyForCommittedSales: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiSandboxImportJobReadModelInternalAuthGuardDesign(): AmazonSpApiSandboxImportJobReadModelInternalAuthGuardDesign {
  const boundary = assertAmazonSpApiSandboxImportJobReadModelHttpAuthBoundaryPreflight(
    buildAmazonSpApiSandboxImportJobReadModelHttpAuthBoundaryPreflight(),
  );

  return {
    version: AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_INTERNAL_AUTH_GUARD_DESIGN_VERSION,
    sourceHttpAuthBoundaryPreflight: boundary,

    designOnly: true,
    authGuardImplementedNow: false,
    endpointStillRuntimeCallableNow: true,
    frontendExposedNow: false,
    writesDatabase: false,

    targetEndpoint: {
      method: 'GET',
      path: '/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model',
      controller: 'ImportsController',
      controllerMethod: 'amazonSpApiSandboxImportJobReadModelEnvGatedBlockedRoute',
    },

    existingAuthFoundation: {
      guardClass: 'JwtAuthGuard',
      strategy: 'jwt',
      strategyClass: 'JwtStrategy',
      tokenSources: ['Authorization: Bearer', 'access_token cookie'],
      requestUserShape: {
        id: 'string',
        userId: 'string',
        companyId: 'string|null',
        email: 'string',
      },
    },

    futureGuardPolicy: {
      useJwtAuthGuard: true,
      requireUser: true,
      requireCompanyId: true,
      rejectMissingCompanyId: true,
      deriveCompanyIdFromReqUser: true,
      neverTrustQueryCompanyId: true,
      keepInternalSandboxEnvGate: true,
      validateQueryBeforeServiceCall: true,
      keepDryRunTrue: true,
      returnProjectionOnly: true,
    },

    futureImplementationShape: {
      imports: [
        "UseGuards from '@nestjs/common'",
        "Req from '@nestjs/common'",
        "JwtAuthGuard from '../auth/jwt.guard'",
        "Request type from express or local request-user type",
      ],
      controllerDecoratorOrder: [
        "@UseGuards(JwtAuthGuard)",
        "@Get('internal/amazon-sp-api-sandbox/import-jobs/read-model')",
      ],
      companyIdSource: 'req.user.companyId',
      serviceArgs: {
        companyId: 'req.user.companyId',
        filter: 'normalized.filter',
        sort: 'normalized.sort',
        page: 'normalized.page',
        pageSize: 'normalized.pageSize',
        dryRun: true,
      },
    },

    forbiddenNow: {
      modifyingControllerGuard: true,
      frontendExposure: true,
      schemaMigration: true,
      realSpApi: true,
      oauth: true,
      tokenPersistence: true,
      transactionWrite: true,
      inventoryMovementWrite: true,
      inventoryBalanceWrite: true,
      commitSalesAction: true,
      inventoryExecutionAction: true,
    },

    implementationReadiness: {
      authFoundationExists: true,
      targetEndpointExists: true,
      httpRuntimeSmokeExists: true,
      authBoundaryPreflightExists: true,
      readyForGuardImplementation: false,
    },

    summary: {
      readyForAuthGuardDesign: true,
      readyForAuthGuardImplementation: false,
      readyForFrontendExposure: false,
      readyForCommittedSales: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiSandboxImportJobReadModelInternalAuthGuardDesign(
  contract: AmazonSpApiSandboxImportJobReadModelInternalAuthGuardDesign,
): AmazonSpApiSandboxImportJobReadModelInternalAuthGuardDesign {
  if (contract.version !== AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_INTERNAL_AUTH_GUARD_DESIGN_VERSION) {
    throw new Error('Step122-R auth guard design violation: version mismatch.');
  }

  if (
    contract.designOnly !== true ||
    contract.authGuardImplementedNow !== false ||
    contract.endpointStillRuntimeCallableNow !== true ||
    contract.frontendExposedNow !== false ||
    contract.writesDatabase !== false
  ) {
    throw new Error('Step122-R auth guard design violation: design-only boundary mismatch.');
  }

  if (
    contract.existingAuthFoundation.guardClass !== 'JwtAuthGuard' ||
    contract.existingAuthFoundation.strategy !== 'jwt' ||
    contract.existingAuthFoundation.strategyClass !== 'JwtStrategy'
  ) {
    throw new Error('Step122-R auth guard design violation: existing auth foundation mismatch.');
  }

  for (const [key, required] of Object.entries(contract.futureGuardPolicy)) {
    if (required !== true) {
      throw new Error(`Step122-R auth guard design violation: futureGuardPolicy.${key} must remain true.`);
    }
  }

  for (const [key, forbidden] of Object.entries(contract.forbiddenNow)) {
    if (forbidden !== true) {
      throw new Error(`Step122-R auth guard design violation: forbiddenNow.${key} must remain true.`);
    }
  }

  return contract;
}
