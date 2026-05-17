import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ImportsService } from './imports.service';
import { AmazonSpApiOauthStatePersistenceBridgeService } from './amazon-sp-api-oauth-state-persistence-bridge.service';
import { AmazonSpApiOauthAuthorizationUrlService } from './amazon-sp-api-oauth-authorization-url.service';
import { AmazonSpApiTokenExchangeService } from './amazon-sp-api-token-exchange.service';
import { AmazonSpApiTokenPersistenceService } from './amazon-sp-api-token-persistence.service';
import { AmazonSpApiLwaEnvConfigValidationService } from './amazon-sp-api-lwa-env-config-validation.service';
import { AmazonSpApiRealLwaActivationGateService } from './amazon-sp-api-real-lwa-activation-gate.service';
import { AmazonSpApiOauthCallbackCommitGateService } from './amazon-sp-api-oauth-callback-commit-gate.service';
import { AmazonSpApiTokenPersistenceOrchestrator } from './amazon-sp-api-token-persistence.orchestrator';
import { buildAmazonSpApiOrdersPreviewService } from './amazon-sp-api-orders-preview.service';
import { AmazonSpApiOrdersRealPreviewHttpError, previewAmazonSpApiOrdersRealNoPersistence } from './amazon-sp-api-orders-real-preview.service';
import type { AmazonSpApiOrdersHttpTransport } from './amazon-sp-api-orders-http.client';
import { buildAmazonSpApiOrdersServerOnlyRawSignedTransport } from './amazon-sp-api-orders-server-only-raw-signed.transport';
import {
  resolveAmazonSpApiOrdersCredentialFromRepository,
  assertAmazonSpApiOrdersCredentialRepositoryResultSafeForResponse,
} from './amazon-sp-api-orders-credential.repository';
import { AmazonSpApiOrdersAccessTokenDecryptor } from './amazon-sp-api-orders-access-token.decryptor';
import { refreshAmazonSpApiOrdersAccessTokenCache } from './amazon-sp-api-orders-lwa-refresh.service';
import { verifyAmazonSpApiOrdersRealPreviewProductionReadiness } from './amazon-sp-api-orders-real-preview-production.verifier';
import { persistAmazonSpApiOrdersRealPreviewToImportJobAndStagingRows } from './amazon-sp-api-orders-real-importjob-persistence.service';
import { resolveAmazonSpApiOrdersDateRangeForRequest } from './amazon-sp-api-orders-date-range.contract';
import { evaluateAmazonSpApiOrdersStagingCommitReadiness } from './amazon-sp-api-orders-staging-commit-readiness.service';
import { buildAmazonSpApiOrdersHistoricalSyncDisabledControllerResponse, type AmazonSpApiOrdersHistoricalSyncDisabledControllerResponse } from './dto/amazon-sp-api-orders-historical-sync-disabled-controller-contract.dto';
import {
  assertAmazonSpApiOrdersHistoricalSyncDisabledPlanPreviewControllerContract,
  buildAmazonSpApiOrdersHistoricalSyncDisabledPlanPreviewControllerContract,
  type AmazonSpApiOrdersHistoricalSyncDisabledPlanPreviewRouteBody,
  type AmazonSpApiOrdersHistoricalSyncDisabledPlanPreviewRouteResponse,
} from './dto/amazon-sp-api-orders-historical-sync-disabled-plan-preview-controller-contract.dto';
import {
  assertAmazonImportedOrdersReadModelDisabledControllerContract,
  buildAmazonImportedOrderDetailReadModelDisabledRouteResponse,
  buildAmazonImportedOrdersReadModelDisabledListRouteResponse,
  type AmazonImportedOrderDetailReadModelControllerQuery,
  type AmazonImportedOrderDetailReadModelDisabledRouteResponse,
  type AmazonImportedOrdersReadModelControllerQuery,
  type AmazonImportedOrdersReadModelDisabledListRouteResponse,
} from './dto/amazon-imported-orders-read-model-disabled-controller-contract.dto';
import { createAmazonSpApiOrdersHistoricalSyncRepositoryTestDouble } from './amazon-sp-api-orders-historical-sync.repository.test-double';
import { createAmazonSpApiOrdersHistoricalSyncWorkerDisabled } from './amazon-sp-api-orders-historical-sync.worker.disabled';
import { DetectMonthConflictsDto } from './dto/detect-month-conflicts.dto';
import { PreviewImportDto } from './dto/preview-import.dto';
import { CommitImportDto } from './dto/commit-import.dto';
import type { CashIncomePreviewDto } from './dto/cash-income-preview.dto';
import type { CashIncomeCommitDto } from './dto/cash-income-commit.dto';
import type { IncomeImportPreviewDto } from './dto/income-import-preview.dto';
import type { IncomeImportCommitDto } from './dto/income-import-commit.dto';
import type { ExpenseImportPreviewDto } from './dto/expense-import-preview.dto';
import type { ExpenseImportCommitFromJobDto } from './dto/expense-import-commit.dto';
import type { AmazonSpApiSandboxImportJobReadModelDryRunResult } from './dto/amazon-sp-api-sandbox-importjob-read-model-dry-run-service-design.dto';
import {
  assertAmazonSpApiSandboxImportJobReadModelControllerContract,
  buildAmazonSpApiSandboxImportJobReadModelControllerContract,
  normalizeAmazonSpApiSandboxImportJobReadModelControllerQuery,
  type AmazonSpApiSandboxImportJobReadModelControllerQuery,
} from './dto/amazon-sp-api-sandbox-importjob-read-model-controller-contract.dto';
import {
  assertAmazonSpApiSandboxImportJobReadModelControllerBlockedRouteContract,
  buildAmazonSpApiSandboxImportJobReadModelControllerBlockedRouteContract,
} from './dto/amazon-sp-api-sandbox-importjob-read-model-controller-blocked-route-contract.dto';
import { assertAmazonSpApiSandboxEnvironmentGate } from './dto/amazon-sp-api-sandbox-internal-contract.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PrismaService } from '../prisma.service';


type Step122SAuthenticatedRequest = {
  user?: {
    id?: string;
    userId?: string;
    companyId?: string | null;
    email?: string;
  };
};





type AmazonSpApiOrdersDryRunPreviewRouteBody = {
  storeId?: string;
  marketplaceId?: string;
  region?: string;
  createdAfter?: string;
  createdBefore?: string;
  orderStatuses?: string[];
  dryRun?: boolean;
};

type AmazonSpApiOrdersDryRunPreviewRouteResponse = ReturnType<
  ReturnType<typeof buildAmazonSpApiOrdersPreviewService>['previewDryRun']
> & {
  routeImplementedNow: true;
  route: '/api/imports/amazon-sp-api/orders/preview';
  guardedBy: 'JwtAuthGuard';
  controllerMode: 'dry-run-preview-only';
  controllerWritesDatabase: false;
  controllerCallsAmazon: false;
  controllerUsesHttpClient: false;
  controllerUsesSigV4: false;
  importJobWriteNow: false;
  importStagingRowWriteNow: false;
  transactionWriteNow: false;
  inventoryWriteNow: false;
};


type AmazonSpApiOrdersRealPreviewRouteBody = {
  storeId?: string;
  marketplaceId?: string;
  region?: string;
  createdAfter?: string;
  createdBefore?: string;
  orderStatuses?: string[];
  maxResultsPerPage?: number;
  realPreview?: boolean;
};


type AmazonSpApiOrdersRealImportJobCommitRouteResponse = Awaited<
  ReturnType<typeof persistAmazonSpApiOrdersRealPreviewToImportJobAndStagingRows>
> & {
  routeImplementedNow: true;
  controllerRoute: 'POST /api/imports/amazon-sp-api/orders/real-importjob';
  controllerWritesImportJob: boolean;
  controllerWritesImportStagingRows: boolean;
  controllerWritesTransaction: false;
  controllerWritesInventory: false;
};

type AmazonSpApiOrdersStagingCommitReadinessRouteBody = {
  importJobId?: string;
  dryRun?: boolean;
};

type AmazonSpApiOrdersRealPreviewRouteResponse = Awaited<ReturnType<typeof previewAmazonSpApiOrdersRealNoPersistence>> & {
  routeImplementedNow: true;
  route: '/api/imports/amazon-sp-api/orders/real-preview';
  guardedBy: 'JwtAuthGuard';
  controllerMode: 'real-preview-guarded-mocked-transport-until-step140-w' | 'real-preview-guarded-server-only-transport';
  controllerWritesDatabase: false;
  controllerCallsAmazon: boolean;
  controllerUsesHttpClient: true;
  controllerUsesSigV4: true;
  controllerTransportMode: 'mocked-server-transport' | 'server-only-raw-signed-real-network' | 'repository-access-token-server-only-real-network';
  importJobWriteNow: false;
  importStagingRowWriteNow: false;
  transactionWriteNow: false;
  inventoryWriteNow: false;
  realNetworkTransportImplementedNow: boolean;
  step140WRequiredForLiveAmazonNetwork: boolean;
  credentialSource?: 'env' | 'repository';
  credentialRepository?: ReturnType<typeof assertAmazonSpApiOrdersCredentialRepositoryResultSafeForResponse>;
  accessTokenRefresh?: Awaited<ReturnType<typeof refreshAmazonSpApiOrdersAccessTokenCache>>;
  productionVerification?: ReturnType<typeof verifyAmazonSpApiOrdersRealPreviewProductionReadiness>;
};

function normalizeAmazonSpApiOrdersPreviewRegionForController(value: string | undefined): 'FE' | 'NA' | 'EU' {
  const normalized = String(value || 'FE').trim().toUpperCase();

  if (normalized === 'JP') {
    return 'FE';
  }

  if (normalized === 'FE' || normalized === 'NA' || normalized === 'EU') {
    return normalized;
  }

  throw new BadRequestException(
    'STEP140_K_ORDERS_PREVIEW_BAD_REQUEST: region must be FE, NA, EU, or JP.',
  );
}

type AmazonSpApiConnectionStatusEndpointResponse = {
  source: 'amazon-sp-api-connection-status';
  routeImplementedNow: true;
  readModelMode: 'real-db-connection-credential-cache';
  status: 'NOT_CONNECTED' | 'CONNECTED' | 'RECONNECT_REQUIRED' | 'ERROR';
  readModelStatus: 'disconnected' | 'connected' | 'needs_reauth' | 'error';
  connected: boolean;
  needsReconnect: boolean;
  credentialPresent: boolean;
  accessTokenCachePresent: boolean;
  accessTokenExpired: boolean;
  marketplaceId: string;
  region: string;
  storeId: string;
  sellingPartnerIdRedacted: string | null;
  connectedAt: string | null;
  revokedAt: string | null;
  lastTokenRefreshAt: string | null;
  lastHealthCheckAt: string | null;
  lastSyncAt: string | null;
  lastErrorCode: string | null;
  lastErrorMessageRedacted: string | null;
  accessTokenExpiresAt: string | null;
  credentialRotatedAt: string | null;
  credentialRevokedAt: string | null;
  tokenExchangeHttpCallNow: false;
  tokenPersistenceDatabaseWriteNow: false;
  realSpApiRequestNow: false;
  importJobWriteNow: false;
  transactionWriteNow: false;
  inventoryWriteNow: false;
  rawAuthorizationCodeReturnedNow: false;
  rawLwaResponseReturnedNow: false;
  rawAccessTokenReturnedNow: false;
  rawRefreshTokenReturnedNow: false;
  encryptedRefreshTokenReturnedNow: false;
  encryptedAccessTokenReturnedNow: false;
};

function redactSellingPartnerIdForConnectionStatus(value: string | null | undefined): string | null {
  const normalized = String(value || '').trim();

  if (!normalized) {
    return null;
  }

  if (normalized.length <= 6) {
    return `${normalized.slice(0, 1)}***${normalized.slice(-1)}`;
  }

  return `${normalized.slice(0, 3)}***${normalized.slice(-3)}`;
}

function mapAmazonSpApiConnectionStatusForEndpoint(
  connection: {
    sellingPartnerId?: string | null;
    status?: string | null;
    connectedAt?: Date | null;
    revokedAt?: Date | null;
    lastTokenRefreshAt?: Date | null;
    lastHealthCheckAt?: Date | null;
    lastSyncAt?: Date | null;
    lastErrorCode?: string | null;
    lastErrorMessageRedacted?: string | null;
    credential?: {
      rotatedAt?: Date | null;
      revokedAt?: Date | null;
    } | null;
    accessTokenCache?: {
      expiresAt?: Date | null;
    } | null;
  } | null,
  scope: { marketplaceId: string; region: string; storeId: string },
): AmazonSpApiConnectionStatusEndpointResponse {
  const base = {
    source: 'amazon-sp-api-connection-status' as const,
    routeImplementedNow: true as const,
    readModelMode: 'real-db-connection-credential-cache' as const,
    marketplaceId: scope.marketplaceId,
    region: scope.region,
    storeId: scope.storeId,
    tokenExchangeHttpCallNow: false as const,
    tokenPersistenceDatabaseWriteNow: false as const,
    realSpApiRequestNow: false as const,
    importJobWriteNow: false as const,
    transactionWriteNow: false as const,
    inventoryWriteNow: false as const,
    rawAuthorizationCodeReturnedNow: false as const,
    rawLwaResponseReturnedNow: false as const,
    rawAccessTokenReturnedNow: false as const,
    rawRefreshTokenReturnedNow: false as const,
    encryptedRefreshTokenReturnedNow: false as const,
    encryptedAccessTokenReturnedNow: false as const,
  };

  if (!connection) {
    return {
      ...base,
      status: 'NOT_CONNECTED',
      readModelStatus: 'disconnected',
      connected: false,
      needsReconnect: false,
      credentialPresent: false,
      accessTokenCachePresent: false,
      accessTokenExpired: false,
      sellingPartnerIdRedacted: null,
      connectedAt: null,
      revokedAt: null,
      lastTokenRefreshAt: null,
      lastHealthCheckAt: null,
      lastSyncAt: null,
      lastErrorCode: null,
      lastErrorMessageRedacted: null,
      accessTokenExpiresAt: null,
      credentialRotatedAt: null,
      credentialRevokedAt: null,
    };
  }

  const rawStatus = String(connection.status || '').trim().toUpperCase();
  const credentialPresent = Boolean(connection.credential);
  const credentialRevoked = Boolean(connection.credential?.revokedAt);
  const accessTokenExpiresAt = connection.accessTokenCache?.expiresAt ?? null;
  const accessTokenCachePresent = Boolean(connection.accessTokenCache);
  const accessTokenExpired = Boolean(
    accessTokenExpiresAt && accessTokenExpiresAt.getTime() <= Date.now(),
  );
  const hasError =
    rawStatus === 'ERROR' ||
    Boolean(connection.lastErrorCode || connection.lastErrorMessageRedacted);
  const isRevoked =
    rawStatus === 'REVOKED' ||
    rawStatus === 'EXPIRED' ||
    Boolean(connection.revokedAt) ||
    credentialRevoked;

  const readModelStatus: AmazonSpApiConnectionStatusEndpointResponse['readModelStatus'] =
    hasError
      ? 'error'
      : isRevoked || !credentialPresent
        ? 'needs_reauth'
        : rawStatus === 'CONNECTED'
          ? 'connected'
          : 'needs_reauth';

  const mappedStatus: AmazonSpApiConnectionStatusEndpointResponse['status'] =
    readModelStatus === 'error'
      ? 'ERROR'
      : readModelStatus === 'connected'
        ? 'CONNECTED'
        : 'RECONNECT_REQUIRED';

  return {
    ...base,
    status: mappedStatus,
    readModelStatus,
    connected: readModelStatus === 'connected',
    needsReconnect: readModelStatus === 'needs_reauth' || readModelStatus === 'error',
    credentialPresent,
    accessTokenCachePresent,
    accessTokenExpired,
    sellingPartnerIdRedacted: redactSellingPartnerIdForConnectionStatus(connection.sellingPartnerId),
    connectedAt: connection.connectedAt?.toISOString?.() ?? null,
    revokedAt: connection.revokedAt?.toISOString?.() ?? null,
    lastTokenRefreshAt: connection.lastTokenRefreshAt?.toISOString?.() ?? null,
    lastHealthCheckAt: connection.lastHealthCheckAt?.toISOString?.() ?? null,
    lastSyncAt: connection.lastSyncAt?.toISOString?.() ?? null,
    lastErrorCode: connection.lastErrorCode ?? null,
    lastErrorMessageRedacted: connection.lastErrorMessageRedacted ?? null,
    accessTokenExpiresAt: accessTokenExpiresAt?.toISOString?.() ?? null,
    credentialRotatedAt: connection.credential?.rotatedAt?.toISOString?.() ?? null,
    credentialRevokedAt: connection.credential?.revokedAt?.toISOString?.() ?? null,
  };
}


function assertAmazonSpApiOrdersRealPreviewRouteEnabled(): void {
  const enabled = String(process.env.AMAZON_SP_API_ORDERS_REAL_PREVIEW_ROUTE_ENABLED || '').trim().toLowerCase();

  if (enabled !== 'true') {
    throw new ForbiddenException(
      'STEP140_V_ORDERS_REAL_PREVIEW_ROUTE_DISABLED: set AMAZON_SP_API_ORDERS_REAL_PREVIEW_ROUTE_ENABLED=true to enable guarded real preview route.',
    );
  }
}

function buildStep140VMockedOrdersTransport(): AmazonSpApiOrdersHttpTransport {
  return async (request) => {
    if (request.operation === 'ListOrders') {
      return {
        status: 200,
        headers: {
          'x-amzn-requestid': 'STEP140-V-LIST-MOCKED',
        },
        bodyText: JSON.stringify({
          payload: {
            Orders: [
              {
                AmazonOrderId: 'ORDER-STEP140-V-001',
                PurchaseDate: '2026-05-01T10:00:00Z',
                LastUpdateDate: '2026-05-01T11:00:00Z',
                OrderStatus: 'Shipped',
                FulfillmentChannel: 'AFN',
                SalesChannel: 'Amazon.co.jp',
                MarketplaceId: 'A1VC38T7YXB528',
                OrderTotal: { CurrencyCode: 'JPY', Amount: '4980' },
              },
            ],
          },
        }),
      };
    }

    return {
      status: 200,
      headers: {
        'x-amzn-requestid': 'STEP140-V-ITEMS-MOCKED',
      },
      bodyText: JSON.stringify({
        payload: {
          OrderItems: [
            {
              OrderItemId: 'ITEM-STEP140-V-001-A',
              ASIN: 'B0STEP140V1',
              SellerSKU: 'SKU-STEP140-V-REAL-PREVIEW',
              Title: 'Step140-V guarded real preview mocked transport item',
              QuantityOrdered: 1,
              QuantityShipped: 1,
              ItemPrice: { CurrencyCode: 'JPY', Amount: '4980' },
              ItemTax: { CurrencyCode: 'JPY', Amount: '452' },
            },
          ],
        },
      }),
    };
  };
}

@Controller('api/imports')
export class ImportsController {
  private readonly amazonSpApiOrdersPreviewService = buildAmazonSpApiOrdersPreviewService();
  private readonly amazonSpApiOrdersAccessTokenDecryptor = new AmazonSpApiOrdersAccessTokenDecryptor();

  constructor(
    private readonly service: ImportsService,
    private readonly amazonSpApiOauthStatePersistenceBridgeService: AmazonSpApiOauthStatePersistenceBridgeService,
    private readonly amazonSpApiOauthAuthorizationUrlService: AmazonSpApiOauthAuthorizationUrlService,
    private readonly amazonSpApiTokenExchangeService: AmazonSpApiTokenExchangeService,
    private readonly amazonSpApiTokenPersistenceService: AmazonSpApiTokenPersistenceService,
    private readonly amazonSpApiLwaEnvConfigValidationService: AmazonSpApiLwaEnvConfigValidationService,
    private readonly amazonSpApiRealLwaActivationGateService: AmazonSpApiRealLwaActivationGateService,
    private readonly amazonSpApiOauthCallbackCommitGateService: AmazonSpApiOauthCallbackCommitGateService,
    private readonly amazonSpApiTokenPersistenceOrchestrator: AmazonSpApiTokenPersistenceOrchestrator,
    private readonly prismaService: PrismaService,
  ) {}

  // Step122-I: Amazon SP-API sandbox ImportJob read-model controller-disabled implementation shell.
  // This shell intentionally has no Nest route decorator and must not call the read-model service.
  async ['amazonSpApiSandboxImportJobReadModelControllerDisabledShell'](
    query: AmazonSpApiSandboxImportJobReadModelControllerQuery,
  ): Promise<never> {
    const contract = assertAmazonSpApiSandboxImportJobReadModelControllerContract(
      buildAmazonSpApiSandboxImportJobReadModelControllerContract(),
    );

    if (
      contract.controllerImplementedNow !== false ||
      contract.controllerRouteExposedNow !== false ||
      contract.frontendExposedNow !== false ||
      contract.writesDatabase !== false
    ) {
      throw new BadRequestException(
        'STEP122_I_CONTROLLER_DISABLED_SHELL_CONTRACT_DRIFT: read-model controller contract must remain disabled.',
      );
    }

    normalizeAmazonSpApiSandboxImportJobReadModelControllerQuery(query);

    throw new BadRequestException(
      'STEP122_I_CONTROLLER_DISABLED_SHELL_BLOCKED: Amazon SP-API sandbox ImportJob read-model controller route is intentionally disabled.',
    );
  }



  // Step149-M: Amazon Orders historical sync disabled planning preview endpoint.
  // Guarded backend preview only: calls disabled worker planHistoricalSync(), never executes sync,
  // never calls Amazon, never creates sync jobs/segments, and never writes ledger/inventory records.
  @UseGuards(JwtAuthGuard)
  @Post('amazon-sp-api/orders/historical-sync/plan-preview')
  async amazonSpApiOrdersHistoricalSyncDisabledPlanPreviewControllerRoute(
    @Req() req: Step122SAuthenticatedRequest,
    @Body() body: AmazonSpApiOrdersHistoricalSyncDisabledPlanPreviewRouteBody,
  ): Promise<AmazonSpApiOrdersHistoricalSyncDisabledPlanPreviewRouteResponse> {
    const companyId = String(req.user?.companyId || '').trim();
    const normalizedStoreId = String(body?.storeId || '').trim();
    const normalizedMarketplaceId = String(body?.marketplaceId || 'A1VC38T7YXB528').trim();
    const normalizedRegion = String(body?.region || 'JP').trim().toUpperCase();
    const syncStartDate = String(body?.syncStartDate || '').trim();
    const syncEndDate = String(body?.syncEndDate || '').trim();
    const segmentDays =
      typeof body?.segmentDays === 'number' && Number.isFinite(body.segmentDays)
        ? body.segmentDays
        : undefined;

    if (!companyId) {
      throw new ForbiddenException(
        'STEP149_M_HISTORICAL_SYNC_PLAN_PREVIEW_COMPANY_REQUIRED: authenticated user must belong to a company.',
      );
    }

    if (!normalizedStoreId) {
      throw new BadRequestException(
        'STEP149_M_HISTORICAL_SYNC_PLAN_PREVIEW_BAD_REQUEST: storeId is required.',
      );
    }

    if (!normalizedMarketplaceId) {
      throw new BadRequestException(
        'STEP149_M_HISTORICAL_SYNC_PLAN_PREVIEW_BAD_REQUEST: marketplaceId is required.',
      );
    }

    if (!syncStartDate) {
      throw new BadRequestException(
        'STEP149_M_HISTORICAL_SYNC_PLAN_PREVIEW_BAD_REQUEST: syncStartDate is required.',
      );
    }

    if (!syncEndDate) {
      throw new BadRequestException(
        'STEP149_M_HISTORICAL_SYNC_PLAN_PREVIEW_BAD_REQUEST: syncEndDate is required.',
      );
    }

    const contract = assertAmazonSpApiOrdersHistoricalSyncDisabledPlanPreviewControllerContract(
      buildAmazonSpApiOrdersHistoricalSyncDisabledPlanPreviewControllerContract(),
    );

    const repository = createAmazonSpApiOrdersHistoricalSyncRepositoryTestDouble();
    const worker = createAmazonSpApiOrdersHistoricalSyncWorkerDisabled(repository);

    let plan: ReturnType<typeof worker.planHistoricalSync>;

    try {
      plan = worker.planHistoricalSync({
        companyId,
        storeId: normalizedStoreId,
        marketplaceId: normalizedMarketplaceId,
        region: normalizedRegion,
        syncStartDate,
        syncEndDate,
        requestedByUserId: req.user?.id || req.user?.userId || null,
        segmentDays,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `STEP149_M_HISTORICAL_SYNC_PLAN_PREVIEW_BAD_REQUEST: ${message}`,
      );
    }

    return {
      source: 'amazon-sp-api-orders-historical-sync-disabled-plan-preview',
      routeImplementedNow: true,
      controllerRoute: contract.route,
      guardedBy: contract.guardedBy,
      companyScoped: true,
      companyIdPresent: true,
      storeId: normalizedStoreId,
      marketplaceId: normalizedMarketplaceId,
      region: normalizedRegion,
      syncStartDate,
      syncEndDate,
      segmentDays: segmentDays ?? null,
      accepted: false,
      disabled: true,
      plan,
      boundaries: {
        callsDisabledWorkerPlan: contract.callsDisabledWorkerPlan,
        callsRunHistoricalSync: contract.callsRunHistoricalSync,
        callsRunSegment: contract.callsRunSegment,
        callsAmazon: contract.callsAmazon,
        writesDatabase: contract.writesDatabase,
        writesSyncJob: contract.writesSyncJob,
        writesSyncSegment: contract.writesSyncSegment,
        writesImportJob: contract.writesImportJob,
        writesImportStagingRow: contract.writesImportStagingRow,
        writesTransaction: contract.writesTransaction,
        writesInventoryMovement: contract.writesInventoryMovement,
        startsScheduler: contract.startsScheduler,
        startsQueue: contract.startsQueue,
        frontendWiredNow: contract.frontendWiredNow,
      },
    };
  }


  // Step150-H: Amazon imported orders read-model disabled controller contract.
  // These routes are guarded and company-scoped, but intentionally disabled by default.
  // They do not query Prisma, do not call Amazon, do not create ImportJob/SyncJob, and do not write DB.
  @UseGuards(JwtAuthGuard)
  @Get('amazon-sp-api/orders/imported/read-model')
  amazonImportedOrdersReadModelDisabledListControllerRoute(
    @Req() req: Step122SAuthenticatedRequest,
    @Query() query: AmazonImportedOrdersReadModelControllerQuery,
  ): AmazonImportedOrdersReadModelDisabledListRouteResponse {
    const companyId = String(req.user?.companyId || '').trim();

    if (!companyId) {
      throw new ForbiddenException(
        'STEP150_H_IMPORTED_ORDERS_READ_MODEL_COMPANY_REQUIRED: authenticated user must belong to a company to read imported Amazon orders.',
      );
    }

    const list = buildAmazonImportedOrdersReadModelDisabledListRouteResponse({
      companyId,
      query,
    });
    const detail = buildAmazonImportedOrderDetailReadModelDisabledRouteResponse({
      companyId,
      query: { orderId: query.orderId },
    });

    assertAmazonImportedOrdersReadModelDisabledControllerContract({ list, detail });

    return list;
  }

  // Step150-H: Amazon imported order detail read-model disabled controller contract.
  // This route is contract-only and returns no order detail until a later explicit read-model implementation step.
  @UseGuards(JwtAuthGuard)
  @Get('amazon-sp-api/orders/imported/read-model/detail')
  amazonImportedOrderDetailReadModelDisabledControllerRoute(
    @Req() req: Step122SAuthenticatedRequest,
    @Query() query: AmazonImportedOrderDetailReadModelControllerQuery,
  ): AmazonImportedOrderDetailReadModelDisabledRouteResponse {
    const companyId = String(req.user?.companyId || '').trim();

    if (!companyId) {
      throw new ForbiddenException(
        'STEP150_H_IMPORTED_ORDER_DETAIL_READ_MODEL_COMPANY_REQUIRED: authenticated user must belong to a company to read imported Amazon order detail.',
      );
    }

    const list = buildAmazonImportedOrdersReadModelDisabledListRouteResponse({
      companyId,
      query: { orderId: query.orderId },
    });
    const detail = buildAmazonImportedOrderDetailReadModelDisabledRouteResponse({
      companyId,
      query,
    });

    assertAmazonImportedOrdersReadModelDisabledControllerContract({ list, detail });

    return detail;
  }


  // Step122-O: Amazon SP-API sandbox ImportJob read-model readonly controller service-call implementation.
  // Step122-S: JWT guard is now enforced for this internal readonly endpoint.
  // Frontend remains unwired; writes, real SP-API, OAuth and token persistence remain disabled.
  @UseGuards(JwtAuthGuard)
  @Get('internal/amazon-sp-api-sandbox/import-jobs/read-model')
  async amazonSpApiSandboxImportJobReadModelEnvGatedBlockedRoute(
    @Req() req: Step122SAuthenticatedRequest,
    @Query() query: AmazonSpApiSandboxImportJobReadModelControllerQuery,
  ): Promise<AmazonSpApiSandboxImportJobReadModelDryRunResult> {
    assertAmazonSpApiSandboxEnvironmentGate({ requireInternalSandbox: true });

    const companyId = String(req.user?.companyId || '').trim();

    if (!companyId) {
      throw new ForbiddenException(
        'STEP122_S_AUTH_COMPANY_REQUIRED: authenticated user must belong to a company to access Amazon SP-API sandbox ImportJob read-model.',
      );
    }

    let normalized: ReturnType<typeof normalizeAmazonSpApiSandboxImportJobReadModelControllerQuery>;

    try {
      normalized = normalizeAmazonSpApiSandboxImportJobReadModelControllerQuery(query);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `STEP122_P_HTTP_QUERY_VALIDATION_BAD_REQUEST: ${message}`,
      );
    }

    return this.service['listAmazonSpApiSandboxImportJobsReadModelDryRun']({
      ...normalized,
      companyId,
      dryRun: true,
    });
  }



  // Step129-B: Amazon SP-API OAuth authorization URL route implementation.
  // This route returns a sanitized fake/sandbox authorization URL for the future frontend connect action.
  // It does not persist OAuth state, does not call token exchange, does not write token DB, and does not redirect.
  @UseGuards(JwtAuthGuard)
  @Get('amazon-sp-api/oauth/authorization-url')
  amazonSpApiOAuthAuthorizationUrlRoute(
    @Req() req: Step122SAuthenticatedRequest,
    @Query('storeId') storeId?: string,
    @Query('marketplaceId') marketplaceId?: string,
    @Query('region') region?: string,
    @Query('returnTo') returnTo?: string,
    @Query('sandbox') sandbox?: string,
    @Query('forceReauthorize') forceReauthorize?: string,
    @Query('locale') locale?: string,
  ) {
    const companyId = String(req.user?.companyId || '').trim();

    const result = this.amazonSpApiOauthAuthorizationUrlService.buildAuthorizationUrl({
      companyId,
      storeId: String(storeId || '').trim(),
      marketplaceId: String(marketplaceId || '').trim(),
      region: String(region || '').trim(),
      returnTo: String(returnTo || '').trim(),
      sandbox: String(sandbox || 'true').trim().toLowerCase() !== 'false',
      forceReauthorize: String(forceReauthorize || '').trim().toLowerCase() === 'true',
      locale: String(locale || 'ja-JP').trim(),
    });

    if (!result.ok) {
      throw new BadRequestException(
        `STEP129_B_AUTHORIZATION_URL_BAD_REQUEST: ${result.messageRedacted}`,
      );
    }

    return result;
  }


  // Step135-G: Amazon SP-API LWA config diagnostic endpoint implementation.
  // Internal read-only diagnostic endpoint for server-side LWA configuration.
  // It returns only sanitized presence/status metadata and never returns raw client id, client secret, tokens, or authorization codes.
  @UseGuards(JwtAuthGuard)
  @Get('internal/amazon-sp-api/lwa-config/status')
  amazonSpApiLwaConfigDiagnosticEndpoint(@Req() req: Step122SAuthenticatedRequest) {
    const companyId = String(req.user?.companyId || '').trim();

    if (!companyId) {
      throw new ForbiddenException(
        'STEP135_G_LWA_CONFIG_DIAGNOSTIC_COMPANY_REQUIRED: authenticated user must belong to a company to read Amazon SP-API LWA config diagnostic status.',
      );
    }

    const result = this.amazonSpApiLwaEnvConfigValidationService.validateFromProcessEnv();

    return {
      ...result,
      endpointImplementedNow: true as const,
      controllerRoute: '/api/imports/internal/amazon-sp-api/lwa-config/status',
      guardedBy: 'JwtAuthGuard' as const,
      companyScoped: true as const,
      companyIdPresent: true as const,
      frontendExposedNow: false as const,
      rawSecretReturnedNow: false as const,
      importJobWriteNow: false as const,
      transactionWriteNow: false as const,
      inventoryWriteNow: false as const,
    };
  }

  // Step137-E: Amazon SP-API real LWA activation gate diagnostic endpoint implementation.
  // Internal read-only endpoint. It evaluates sanitized activation-gate readiness only.
  // It does not wire OAuth callback, does not enable real HTTP, does not persist tokens,
  // and does not call Amazon Reports API or create import/ledger/inventory records.
  @UseGuards(JwtAuthGuard)
  @Get('internal/amazon-sp-api/lwa-activation-gate/status')
  amazonSpApiLwaActivationGateDiagnosticEndpoint(
    @Req() req: Step122SAuthenticatedRequest,
    @Query('storeId') storeId?: string,
    @Query('marketplaceId') marketplaceId?: string,
    @Query('region') region?: string,
  ) {
    const companyId = String(req.user?.companyId || '').trim();
    const normalizedStoreId = String(storeId || '').trim();
    const normalizedMarketplaceId = String(marketplaceId || 'A1VC38T7YXB528').trim();
    const normalizedRegion = String(region || 'JP').trim().toUpperCase();

    if (!companyId) {
      throw new ForbiddenException(
        'STEP137_E_LWA_ACTIVATION_GATE_COMPANY_REQUIRED: authenticated user must belong to a company to read Amazon SP-API LWA activation gate status.',
      );
    }

    if (!normalizedStoreId) {
      throw new BadRequestException(
        'STEP137_E_LWA_ACTIVATION_GATE_BAD_REQUEST: storeId is required.',
      );
    }

    if (!normalizedMarketplaceId) {
      throw new BadRequestException(
        'STEP137_E_LWA_ACTIVATION_GATE_BAD_REQUEST: marketplaceId is required.',
      );
    }

    if (!normalizedRegion) {
      throw new BadRequestException(
        'STEP137_E_LWA_ACTIVATION_GATE_BAD_REQUEST: region is required.',
      );
    }

    const configStatus = this.amazonSpApiLwaEnvConfigValidationService.validateFromProcessEnv();

    const gateResult = this.amazonSpApiRealLwaActivationGateService.evaluateRealLwaActivationLater({
      configValidatorStatus: configStatus.status,
      clientIdPresent: configStatus.clientIdPresent,
      clientSecretPresent: configStatus.clientSecretPresent,
      redirectUriPresent: configStatus.redirectUriPresent,
      marketplaceIdPresent: normalizedMarketplaceId.length > 0,
      regionPresent: normalizedRegion.length > 0,
      tokenEndpointHttps: configStatus.tokenEndpointHost !== null,
      callbackStateTrusted: false,
      companyIdResolvedFromTrustedState: true,
      storeIdResolvedFromTrustedState: normalizedStoreId.length > 0,
      sellingPartnerIdPresent: false,
      authorizationCodePresent: false,
      redirectUriMatchesAuthorizationRequest: false,
      serverSideRuntimeGateEnabled: false,
      environmentAllowsRealLwaHttp: false,
      companyStoreAllowlisted: false,
      explicitOperatorConfirmed: false,
    });

    return {
      source: 'amazon-sp-api-lwa-activation-gate-diagnostic' as const,
      endpointImplementedNow: true as const,
      controllerRoute: '/api/imports/internal/amazon-sp-api/lwa-activation-gate/status',
      guardedBy: 'JwtAuthGuard' as const,
      companyScoped: true as const,
      companyIdPresent: true as const,
      storeId: normalizedStoreId,
      marketplaceId: normalizedMarketplaceId,
      region: normalizedRegion,
      frontendExposedNow: false as const,
      callbackRuntimeChangedNow: false as const,
      oauthCallbackRouteChangedNow: false as const,
      rawSecretReturnedNow: false as const,
      rawAuthorizationCodeReturnedNow: false as const,
      rawClientIdReturnedNow: false as const,
      rawClientSecretReturnedNow: false as const,
      rawRequestBodyReturnedNow: false as const,
      rawLwaResponseReturnedNow: false as const,
      rawAccessTokenReturnedNow: false as const,
      rawRefreshTokenReturnedNow: false as const,
      realHttpAllowedNow: false as const,
      realHttpEnabledNow: false as const,
      tokenExchangeHttpCallNow: false as const,
      lwaHttpCallNow: false as const,
      realSpApiRequestNow: false as const,
      tokenPersistenceDatabaseWriteNow: false as const,
      reportsApiCallNow: false as const,
      importJobWriteNow: false as const,
      importStagingRowWriteNow: false as const,
      transactionWriteNow: false as const,
      inventoryWriteNow: false as const,
      configStatus: {
        source: configStatus.source,
        status: configStatus.status,
        readyForRealLwaHttpTransport: configStatus.readyForRealLwaHttpTransport,
        clientIdPresent: configStatus.clientIdPresent,
        clientSecretPresent: configStatus.clientSecretPresent,
        redirectUriPresent: configStatus.redirectUriPresent,
        marketplaceId: configStatus.marketplaceId,
        region: configStatus.region,
        tokenEndpointHost: configStatus.tokenEndpointHost,
        environment: configStatus.environment,
        realHttpEnabled: configStatus.realHttpEnabled,
        missingRequiredEnv: configStatus.missingRequiredEnv,
        invalidEnv: configStatus.invalidEnv,
        rawClientSecretReturnedNow: configStatus.rawClientSecretReturnedNow,
        rawClientIdReturnedNow: configStatus.rawClientIdReturnedNow,
        rawRefreshTokenReturnedNow: configStatus.rawRefreshTokenReturnedNow,
        rawAccessTokenReturnedNow: configStatus.rawAccessTokenReturnedNow,
      },
      gateStatus: {
        source: gateResult.source,
        gateDecision: gateResult.gateDecision,
        reason: gateResult.reason,
        messageRedacted: gateResult.messageRedacted,
        activationGatePreparedNow: gateResult.activationGatePreparedNow,
        activationGateImplementedNow: gateResult.activationGateImplementedNow,
        realHttpAllowedNow: gateResult.realHttpAllowedNow,
        realHttpEnabledNow: gateResult.realHttpEnabledNow,
        sanitizedDecision: gateResult.sanitizedDecision,
      },
    };
  }

  // Step133-B: Amazon SP-API connection status backend endpoint implementation.
  // Read-only route for the frontend connection status panel.
  // It does not call Amazon LWA, does not call real SP-API, and does not create ImportJob/ledger/inventory records.
  @UseGuards(JwtAuthGuard)
  @Get('amazon-sp-api/connection/status')
  async amazonSpApiConnectionStatusBackendEndpoint(
    @Req() req: Step122SAuthenticatedRequest,
    @Query('storeId') storeId?: string,
    @Query('marketplaceId') marketplaceId?: string,
    @Query('region') region?: string,
  ): Promise<AmazonSpApiConnectionStatusEndpointResponse> {
    const companyId = String(req.user?.companyId || '').trim();
    const normalizedStoreId = String(storeId || '').trim();
    const normalizedMarketplaceId = String(marketplaceId || 'A1VC38T7YXB528').trim();
    const normalizedRegion = String(region || 'JP').trim().toUpperCase();

    if (!companyId) {
      throw new ForbiddenException(
        'STEP133_B_CONNECTION_STATUS_COMPANY_REQUIRED: authenticated user must belong to a company to read Amazon SP-API connection status.',
      );
    }

    if (!normalizedStoreId) {
      throw new BadRequestException(
        'STEP133_B_CONNECTION_STATUS_BAD_REQUEST: storeId is required.',
      );
    }

    if (!normalizedMarketplaceId) {
      throw new BadRequestException(
        'STEP133_B_CONNECTION_STATUS_BAD_REQUEST: marketplaceId is required.',
      );
    }

    if (!normalizedRegion) {
      throw new BadRequestException(
        'STEP133_B_CONNECTION_STATUS_BAD_REQUEST: region is required.',
      );
    }

    const connection = await this.amazonSpApiTokenPersistenceService.readConnectionStatus({
      companyId,
      storeId: normalizedStoreId,
      marketplaceId: normalizedMarketplaceId,
      region: normalizedRegion,
    });

    return mapAmazonSpApiConnectionStatusForEndpoint(connection, {
      storeId: normalizedStoreId,
      marketplaceId: normalizedMarketplaceId,
      region: normalizedRegion,
    });
  }


  // Step149-C: Amazon Orders historical/background sync controller-disabled route shell.
  // This route is intentionally disabled. It does not call Amazon, create ImportJob,
  // create ImportStagingRow, start a worker, create Transaction, or update Inventory.
  @UseGuards(JwtAuthGuard)
  @Post('amazon-sp-api/orders/historical-sync')
  async amazonSpApiOrdersHistoricalSyncDisabledControllerRoute(
    @Req() req: { user?: { id?: string; companyId?: string } },
    @Body() body: Record<string, unknown>,
  ): Promise<AmazonSpApiOrdersHistoricalSyncDisabledControllerResponse> {
    const companyId = req.user?.companyId || null;
    const requestedBy = req.user?.id || null;

    return buildAmazonSpApiOrdersHistoricalSyncDisabledControllerResponse({
      companyId,
      requestedBy,
      body,
    });
  }

  // Step141-G1: Amazon SP-API Orders staging commit readiness / dry-run contract.
  // Read-only readiness endpoint for future explicit commit into Transaction / InventoryMovement.
  // This endpoint must not create Transaction, InventoryMovement, InventoryBalance, or mutate ImportStagingRow.
  @UseGuards(JwtAuthGuard)
  @Post('amazon-sp-api/orders/staging-commit-readiness')
  async amazonSpApiOrdersStagingCommitReadinessControllerRoute(
    @Req() req: Step122SAuthenticatedRequest,
    @Body() body: AmazonSpApiOrdersStagingCommitReadinessRouteBody,
  ) {
    const companyId = String(req.user?.companyId || '').trim();

    if (!companyId) {
      throw new ForbiddenException(
        'STEP141_G1_COMPANY_REQUIRED: authenticated user must belong to a company.',
      );
    }

    if (body?.dryRun === false) {
      throw new ForbiddenException(
        'STEP141_G1_DRY_RUN_ONLY: staging commit readiness is dry-run only in Step141-G1.',
      );
    }

    return evaluateAmazonSpApiOrdersStagingCommitReadiness({
      prisma: this.prismaService,
      companyId,
      importJobId: String(body?.importJobId || '').trim(),
    });
  }


  // Step140-K: Amazon SP-API Orders dry-run preview controller route implementation.
  // This route is real, guarded and service-backed, but dry-run only.
  // It does not call Amazon, does not execute HTTP/SigV4, and does not write ImportJob/StagingRow/Transaction/Inventory.
  @UseGuards(JwtAuthGuard)
  @Post('amazon-sp-api/orders/preview')
  amazonSpApiOrdersDryRunPreviewControllerRoute(
    @Req() req: Step122SAuthenticatedRequest,
    @Body() body: AmazonSpApiOrdersDryRunPreviewRouteBody,
  ): AmazonSpApiOrdersDryRunPreviewRouteResponse {
    const companyId = String(req.user?.companyId || '').trim();

    if (!companyId) {
      throw new ForbiddenException(
        'STEP140_K_ORDERS_PREVIEW_COMPANY_REQUIRED: authenticated user must belong to a company to preview Amazon SP-API orders.',
      );
    }

    const normalizedStoreId = String(body?.storeId || '').trim();
    const normalizedMarketplaceId = String(body?.marketplaceId || 'A1VC38T7YXB528').trim();
    const normalizedRegion = normalizeAmazonSpApiOrdersPreviewRegionForController(body?.region);
    const normalizedCreatedAfter = String(body?.createdAfter || '').trim();
    const normalizedCreatedBefore = String(body?.createdBefore || '').trim();

    if (body?.dryRun !== true) {
      throw new BadRequestException(
        'STEP140_K_ORDERS_PREVIEW_BAD_REQUEST: dryRun must be true for Amazon SP-API Orders preview route.',
      );
    }

    if (!normalizedStoreId) {
      throw new BadRequestException(
        'STEP140_K_ORDERS_PREVIEW_BAD_REQUEST: storeId is required.',
      );
    }

    if (!normalizedMarketplaceId) {
      throw new BadRequestException(
        'STEP140_K_ORDERS_PREVIEW_BAD_REQUEST: marketplaceId is required.',
      );
    }

    if (!normalizedCreatedAfter) {
      throw new BadRequestException(
        'STEP140_K_ORDERS_PREVIEW_BAD_REQUEST: createdAfter is required.',
      );
    }

    if (!normalizedCreatedBefore) {
      throw new BadRequestException(
        'STEP140_K_ORDERS_PREVIEW_BAD_REQUEST: createdBefore is required.',
      );
    }

    const result = this.amazonSpApiOrdersPreviewService.previewDryRun({
      companyId,
      storeId: normalizedStoreId,
      marketplaceId: normalizedMarketplaceId,
      region: normalizedRegion,
      createdAfter: normalizedCreatedAfter,
      createdBefore: normalizedCreatedBefore,
      dryRun: true,
    });

    return {
      ...result,
      routeImplementedNow: true as const,
      route: '/api/imports/amazon-sp-api/orders/preview' as const,
      guardedBy: 'JwtAuthGuard' as const,
      controllerMode: 'dry-run-preview-only' as const,
      controllerWritesDatabase: false as const,
      controllerCallsAmazon: false as const,
      controllerUsesHttpClient: false as const,
      controllerUsesSigV4: false as const,
      importJobWriteNow: false as const,
      importStagingRowWriteNow: false as const,
      transactionWriteNow: false as const,
      inventoryWriteNow: false as const,
    };
  }

  // Step140-V: Amazon SP-API Orders real preview controller route + frontend real preview button.
  // This route is guarded and runs the Step140-P real-preview service through Step140-O's HTTP client boundary.
  // In Step140-V it uses a mocked server transport unless Step140-W adds server-only raw signed real network transport.
  // It never writes ImportJob/StagingRow/Transaction/Inventory and never returns raw tokens/secrets.
  @UseGuards(JwtAuthGuard)
  @Post('amazon-sp-api/orders/real-importjob')
  async amazonSpApiOrdersRealImportJobCommitControllerRoute(
    @Req() req: { user?: { id?: string; companyId?: string } },
    @Body() body: Record<string, unknown>,
  ): Promise<AmazonSpApiOrdersRealImportJobCommitRouteResponse> {
    const companyId = req.user?.companyId;

    if (!companyId) {
      throw new BadRequestException('Company id is required for Amazon SP-API Orders real ImportJob persistence.');
    }

    const normalizedStoreId = String(body?.storeId || '').trim();
    const normalizedMarketplaceId = String(body?.marketplaceId || 'A1VC38T7YXB528').trim();
    const normalizedRegion = String(body?.region || 'JP').trim().toUpperCase();
    const requestedBy = req.user?.id || null;

    if (!normalizedStoreId) {
      throw new BadRequestException('storeId is required for Amazon SP-API Orders real ImportJob persistence.');
    }

    
    const dateRangeRequestBody = body as Record<string, unknown>;
    const resolvedDateRange = resolveAmazonSpApiOrdersDateRangeForRequest({
      days: dateRangeRequestBody.days,
      startDate: dateRangeRequestBody.startDate,
      endDate: dateRangeRequestBody.endDate,
      createdAfter: dateRangeRequestBody.createdAfter,
      createdBefore: dateRangeRequestBody.createdBefore,
      now: new Date(),
      maxDays: 31,
      defaultDays: 14,
    });

    if (!resolvedDateRange.ok) {
      throw new BadRequestException(resolvedDateRange.message);
    }

const realPreview = await this.amazonSpApiOrdersRealPreviewControllerRoute(req, {
      ...body,
      createdAfter: resolvedDateRange.createdAfter,
      createdBefore: resolvedDateRange.createdBefore,
      storeId: normalizedStoreId,
      marketplaceId: normalizedMarketplaceId,
      region: normalizedRegion,
      realPreview: true,
    });

    const persisted = await persistAmazonSpApiOrdersRealPreviewToImportJobAndStagingRows({
      prisma: this.prismaService,
      companyId,
      storeId: normalizedStoreId,
      marketplaceId: normalizedMarketplaceId,
      region: normalizedRegion,
      previewResult: realPreview,
      productionVerification: realPreview.productionVerification || {
        accepted: false,
        reason: 'missing_production_verification',
        productionReadiness: {
          canProceedToStep141BImportJobPersistence: false,
        },
      },
      requestedBy,
      now: new Date(),
    });

    if (!persisted.accepted) {
      throw new BadRequestException(`STEP141_B_REAL_IMPORTJOB_PERSISTENCE_REJECTED: ${persisted.reason}`);
    }

    return {
      ...persisted,
      routeImplementedNow: true as const,
      controllerRoute: 'POST /api/imports/amazon-sp-api/orders/real-importjob' as const,
      controllerWritesImportJob: persisted.boundaries.writesImportJob,
      controllerWritesImportStagingRows: persisted.boundaries.writesImportStagingRow,
      controllerWritesTransaction: false as const,
      controllerWritesInventory: false as const,
    };
  }


  @UseGuards(JwtAuthGuard)
  @Post('amazon-sp-api/orders/real-preview')
  async amazonSpApiOrdersRealPreviewControllerRoute(
    @Req() req: Step122SAuthenticatedRequest,
    @Body() body: AmazonSpApiOrdersRealPreviewRouteBody,
  ): Promise<AmazonSpApiOrdersRealPreviewRouteResponse> {
    assertAmazonSpApiOrdersRealPreviewRouteEnabled();

    const companyId = String(req.user?.companyId || '').trim();

    if (!companyId) {
      throw new ForbiddenException(
        'STEP140_V_ORDERS_REAL_PREVIEW_COMPANY_REQUIRED: authenticated user must belong to a company to preview real Amazon SP-API orders.',
      );
    }

    if (body?.realPreview !== true) {
      throw new BadRequestException(
        'STEP140_V_ORDERS_REAL_PREVIEW_BAD_REQUEST: realPreview must be true.',
      );
    }

    const normalizedStoreId = String(body?.storeId || '').trim();
    const normalizedMarketplaceId = String(body?.marketplaceId || 'A1VC38T7YXB528').trim();
    const normalizedRegion = normalizeAmazonSpApiOrdersPreviewRegionForController(body?.region);
    const normalizedCreatedAfter = String(body?.createdAfter || '').trim();
    const normalizedCreatedBefore = String(body?.createdBefore || '').trim();

    if (!normalizedStoreId) {
      throw new BadRequestException(
        'STEP140_V_ORDERS_REAL_PREVIEW_BAD_REQUEST: storeId is required.',
      );
    }

    if (!normalizedMarketplaceId) {
      throw new BadRequestException(
        'STEP140_V_ORDERS_REAL_PREVIEW_BAD_REQUEST: marketplaceId is required.',
      );
    }

    if (!normalizedCreatedAfter) {
      throw new BadRequestException(
        'STEP140_V_ORDERS_REAL_PREVIEW_BAD_REQUEST: createdAfter is required.',
      );
    }

    const transportMode = String(process.env.AMAZON_SP_API_ORDERS_REAL_PREVIEW_TRANSPORT || 'mocked').trim().toLowerCase();
    const useRealNetworkTransport = transportMode === 'real' || transportMode === 'repository';
    const useRepositoryCredentials = transportMode === 'repository';

    if (transportMode !== 'mocked' && transportMode !== 'real' && transportMode !== 'repository') {
      throw new ForbiddenException(
        'STEP140_X_ORDERS_REAL_PREVIEW_TRANSPORT_INVALID: AMAZON_SP_API_ORDERS_REAL_PREVIEW_TRANSPORT must be mocked, real, or repository.',
      );
    }

    let accessTokenRefreshResult: Awaited<ReturnType<typeof refreshAmazonSpApiOrdersAccessTokenCache>> | null = null;

    let repositoryCredential = useRepositoryCredentials
      ? await resolveAmazonSpApiOrdersCredentialFromRepository({
          prisma: this.prismaService,
          companyId,
          storeId: normalizedStoreId,
          marketplaceId: normalizedMarketplaceId,
          region: body?.region || normalizedRegion,
          decryptor: this.amazonSpApiOrdersAccessTokenDecryptor,
        })
      : null;

    if (
      repositoryCredential &&
      !repositoryCredential.repositoryCredentialUsable &&
      (repositoryCredential.blockedReason === 'ACCESS_TOKEN_CACHE_EXPIRED' ||
        repositoryCredential.blockedReason === 'ACCESS_TOKEN_CACHE_MISSING')
    ) {
      accessTokenRefreshResult = await refreshAmazonSpApiOrdersAccessTokenCache({
        prisma: this.prismaService,
        companyId,
        storeId: normalizedStoreId,
        marketplaceId: normalizedMarketplaceId,
        region: body?.region || normalizedRegion,
      });

      if (accessTokenRefreshResult.accepted) {
        repositoryCredential = await resolveAmazonSpApiOrdersCredentialFromRepository({
          prisma: this.prismaService,
          companyId,
          storeId: normalizedStoreId,
          marketplaceId: normalizedMarketplaceId,
          region: body?.region || normalizedRegion,
          decryptor: this.amazonSpApiOrdersAccessTokenDecryptor,
        });
      }
    }

    if (repositoryCredential && !repositoryCredential.repositoryCredentialUsable) {
      throw new ForbiddenException(
        `STEP140_Z_ORDERS_CREDENTIAL_REPOSITORY_BLOCKED: ${repositoryCredential.blockedReason}; refresh=${accessTokenRefreshResult?.reason || 'not_attempted'}`,
      );
    }

    const accessTokenForOrders = useRepositoryCredentials
      ? String(repositoryCredential?.decryptedAccessToken || '')
      : useRealNetworkTransport
        ? String(process.env.AMAZON_SP_API_ORDERS_REAL_ACCESS_TOKEN || '')
        : 'AT_SECRET_STEP140_V_SERVER_ONLY_MOCKED_TRANSPORT';

    const serverOnlyTransport = useRealNetworkTransport
      ? buildAmazonSpApiOrdersServerOnlyRawSignedTransport({ accessToken: accessTokenForOrders })
      : buildStep140VMockedOrdersTransport();

    let result: Awaited<ReturnType<typeof previewAmazonSpApiOrdersRealNoPersistence>>;
    try {
      result = await previewAmazonSpApiOrdersRealNoPersistence({
      companyId,
      storeId: normalizedStoreId,
      marketplaceId: normalizedMarketplaceId,
      region: normalizedRegion,
      accessToken: accessTokenForOrders,
      credentials: {
        accessKeyId: useRealNetworkTransport
          ? String(process.env.AMAZON_SP_API_ORDERS_AWS_ACCESS_KEY_ID || '')
          : 'AKIASTEP140VSERVERONLY',
        secretAccessKey: useRealNetworkTransport
          ? String(process.env.AMAZON_SP_API_ORDERS_AWS_SECRET_ACCESS_KEY || '')
          : 'AWS_SECRET_STEP140_V_SERVER_ONLY_MOCKED_TRANSPORT',
        sessionToken: useRealNetworkTransport
          ? String(process.env.AMAZON_SP_API_ORDERS_AWS_SESSION_TOKEN || '')
          : 'SESSION_SECRET_STEP140_V_SERVER_ONLY_MOCKED_TRANSPORT',
      },
      createdAfter: normalizedCreatedAfter,
      createdBefore: normalizedCreatedBefore || undefined,
      maxResultsPerPage: body?.maxResultsPerPage,
      now: new Date(),
      env: {
        AMAZON_SP_API_ORDERS_REAL_HTTP_ENABLED: 'true',
      },
      transport: serverOnlyTransport,
    });
    } catch (error) {
      if (error instanceof AmazonSpApiOrdersRealPreviewHttpError) {
        throw new BadRequestException(error.toResponseBody());
      }
      throw error;
    }

    const productionVerification = verifyAmazonSpApiOrdersRealPreviewProductionReadiness({
      previewResult: result,
      transportMode,
      credentialSource: useRepositoryCredentials ? 'repository' : 'env',
      accessTokenRefreshResult: accessTokenRefreshResult || undefined,
      now: new Date(),
    });

    return {
      ...result,
      routeImplementedNow: true as const,
      route: '/api/imports/amazon-sp-api/orders/real-preview' as const,
      guardedBy: 'JwtAuthGuard' as const,
      controllerMode: 'real-preview-guarded-server-only-transport' as const,
      controllerWritesDatabase: false as const,
      controllerCallsAmazon: true as const,
      controllerUsesHttpClient: true as const,
      controllerUsesSigV4: true as const,
      controllerTransportMode: useRepositoryCredentials ? 'repository-access-token-server-only-real-network' : useRealNetworkTransport ? 'server-only-raw-signed-real-network' : 'mocked-server-transport',
      importJobWriteNow: false as const,
      importStagingRowWriteNow: false as const,
      transactionWriteNow: false as const,
      inventoryWriteNow: false as const,
      realNetworkTransportImplementedNow: useRealNetworkTransport,
      step140WRequiredForLiveAmazonNetwork: false as const,
      credentialSource: useRepositoryCredentials ? 'repository' as const : 'env' as const,
      credentialRepository: repositoryCredential
        ? assertAmazonSpApiOrdersCredentialRepositoryResultSafeForResponse(repositoryCredential)
        : undefined,
      accessTokenRefresh: accessTokenRefreshResult || undefined,
      productionVerification,
    };
  }

  // Step139-E: Amazon SP-API OAuth callback dry-run-only controller wiring implementation.
  // This route validates callback input and runs only a redacted dry-run diagnostic chain.
  // It does not persist refresh/access tokens, does not write DB, does not call real Amazon HTTP,
  // and never returns raw authorization code, raw LWA response, raw access token, or raw refresh token.
  @Get('amazon-sp-api/oauth/callback')
  async amazonSpApiOAuthCallbackBoundary(
    @Query('state') state?: string,
    @Query('code') code?: string,
    @Query('spapi_oauth_code') spapiOauthCode?: string,
    @Query('selling_partner_id') sellingPartnerId?: string,
    @Query('error') callbackError?: string,
    @Query('error_description') callbackErrorDescription?: string,
    @Query('dryRun') dryRun?: string,
    @Query('commit') requestedCommit?: string,
    @Query('idempotencyKey') idempotencyKey?: string,
  ) {
    const normalizedState = String(state || '').trim();
    const normalizedCode = String(code || '').trim();
    const normalizedSpapiOauthCode = String(spapiOauthCode || '').trim();
    const normalizedSellingPartnerId = String(sellingPartnerId || '').trim();
    const normalizedError = String(callbackError || '').trim();
    const normalizedErrorDescription = String(callbackErrorDescription || '').trim();

    const baseResponse = {
      source: 'amazon-sp-api-oauth-callback-dry-run-controller-wiring' as const,
      routeImplementedNow: true as const,
      step139EDryRunControllerWiringImplementedNow: true as const,
      wiringMode: 'controller-dry-run-only-no-persistence' as const,
      controllerWiringNow: true as const,
      oauthCallbackDryRunWiringNow: true as const,
      oauthCallbackPersistenceWiringNow: false as const,
      controllerCallsServicePersistenceDryRunNow: false as const,
      controllerCallsServicePersistenceCommitNow: false as const,
      tokenExchangeHttpCallNow: false as const,
      tokenPersistenceDatabaseWriteNow: false as const,
      plaintextTokenDatabaseWriteNow: false as const,
      databaseWriteNow: false as const,
      prismaClientWriteNow: false as const,
      amazonNetworkCallNow: false as const,
      realSpApiRequestNow: false as const,
      rawAuthorizationCodeReturnedNow: false as const,
      rawLwaResponseReturnedNow: false as const,
      rawAccessTokenReturnedNow: false as const,
      rawRefreshTokenReturnedNow: false as const,
      frontendAddedNow: false as const,
    };

    if (normalizedError) {
      return {
        ...baseResponse,
        accepted: false,
        status: 'callback_error',
        messageRedacted: 'Amazon OAuth callback returned an error.',
        error: normalizedError,
        errorDescriptionPresent: normalizedErrorDescription.length > 0,
      };
    }

    if (!normalizedState) {
      return {
        ...baseResponse,
        accepted: false,
        status: 'missing_state',
        messageRedacted: 'Amazon OAuth callback is missing required state.',
      };
    }

    if (!normalizedCode && !normalizedSpapiOauthCode) {
      return {
        ...baseResponse,
        accepted: false,
        status: 'missing_authorization_code',
        messageRedacted: 'Amazon OAuth callback is missing authorization code.',
        statePresent: true,
      };
    }

    if (!normalizedSellingPartnerId) {
      return {
        ...baseResponse,
        accepted: false,
        status: 'missing_selling_partner_id',
        messageRedacted: 'Amazon OAuth callback is missing selling partner id.',
        statePresent: true,
        authorizationCodePresent: true,
      };
    }

    const bridgeServiceReady =
      typeof this.amazonSpApiOauthStatePersistenceBridgeService.buildPersistencePlan === 'function' &&
      typeof this.amazonSpApiOauthStatePersistenceBridgeService.validateStatePayload === 'function';

    const selectedAuthorizationCode = normalizedSpapiOauthCode || normalizedCode;

    const fakeExchangeResult = this.amazonSpApiTokenExchangeService.exchangeAuthorizationCodeDryRunnable({
      state: normalizedState,
      authorizationCode: selectedAuthorizationCode,
      sellingPartnerId: normalizedSellingPartnerId,
      redirectUri: 'https://ledgerseiri.example/api/imports/amazon-sp-api/oauth/callback',
      clientId: 'amzn1.application-oa2-client.step139e',
      clientSecretConfigured: true,
      marketplaceId: 'A1VC38T7YXB528',
      region: 'JP',
      companyId: 'company-step139e-dry-run',
      storeId: 'store-step139e-dry-run',
      dryRun: true,
    });

    if (!fakeExchangeResult.accepted) {
      return {
        ...baseResponse,
        accepted: false,
        status: fakeExchangeResult.reason,
        messageRedacted: fakeExchangeResult.messageRedacted,
        statePresent: true,
        authorizationCodePresent: true,
        sellingPartnerId: normalizedSellingPartnerId,
        bridgeServiceReady,
        tokenExchangeAttempted: true,
        tokenExchangeTransportMode: 'fake',
        tokenExchangeHttpCallNow: false as const,
        realSpApiRequestNow: false as const,
      };
    }

    const persistencePlan = this.amazonSpApiOauthStatePersistenceBridgeService.buildPersistencePlan(
      {
        companyId: fakeExchangeResult.companyId,
        storeId: fakeExchangeResult.storeId,
        marketplaceId: fakeExchangeResult.marketplaceId,
        region: fakeExchangeResult.region,
        appId: 'amzn1.application-oa2-client.step139e',
        nonce: normalizedState,
        issuedAt: new Date(Date.now() - 60_000).toISOString(),
        expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
        returnTo: '/ja/app/data/import',
        stateVersion: 'v1',
      },
      {
        state: normalizedState,
        code: normalizedCode || undefined,
        spapi_oauth_code: normalizedSpapiOauthCode || undefined,
        selling_partner_id: normalizedSellingPartnerId,
      },
      fakeExchangeResult.sanitizedTokenEnvelope,
      {
        expectedCompanyId: fakeExchangeResult.companyId,
        expectedStoreId: fakeExchangeResult.storeId,
        expectedMarketplaceId: fakeExchangeResult.marketplaceId,
        expectedRegion: fakeExchangeResult.region,
        expectedAppId: 'amzn1.application-oa2-client.step139e',
      },
    );

    if (!persistencePlan.accepted) {
      return {
        ...baseResponse,
        accepted: false,
        status: persistencePlan.reason,
        messageRedacted: persistencePlan.messageRedacted,
        statePresent: true,
        authorizationCodePresent: true,
        sellingPartnerId: normalizedSellingPartnerId,
        bridgeServiceReady,
        tokenExchangeAttempted: true,
        tokenExchangeTransportMode: fakeExchangeResult.transportMode,
        tokenExchangeHttpCallNow: fakeExchangeResult.tokenExchangeHttpCallNow,
        realSpApiRequestNow: fakeExchangeResult.realSpApiRequestNow,
      };
    }

    const serviceDryRunResult =
      this.amazonSpApiTokenExchangeService.runTokenPersistenceE2eServiceOnlyTestDouble({
        activationGateAccepted: true,
        executableTransportAccepted: true,
        sanitizedParserAccepted: true,
        encryptedPersistenceInputAccepted: true,
        companyId: fakeExchangeResult.companyId,
        storeId: fakeExchangeResult.storeId,
        marketplaceId: fakeExchangeResult.marketplaceId,
        region: fakeExchangeResult.region,
        sellingPartnerId: normalizedSellingPartnerId,
        encryptedRefreshToken: persistencePlan.refreshCredentialInput.encryptedRefreshToken,
        encryptedAccessTokenCache: persistencePlan.accessTokenCacheInput?.encryptedAccessToken ?? null,
        accessTokenExpiresAt: persistencePlan.accessTokenCacheInput?.expiresAt ?? null,
        refreshTokenFingerprint: 'step139e-refresh-token-fingerprint-dry-run',
        accessTokenFingerprint: persistencePlan.accessTokenCacheInput
          ? 'step139e-access-token-fingerprint-dry-run'
          : null,
        encryptionKeyId: persistencePlan.refreshCredentialInput.encryptionKeyId,
        encryptionAlgorithm: persistencePlan.refreshCredentialInput.encryptionAlgorithm,
        tokenVersion: persistencePlan.refreshCredentialInput.tokenVersion,
        status: 'active',
        lastValidatedAt: new Date().toISOString(),
        revokedAt: null,
      });

    // Step139-T: guarded OAuth callback controller real-write branch implementation.
    // Default remains dry-run. Commit requires server-side gates and never calls repository directly.
    const dryRunRequested =
      String(dryRun ?? 'true').trim().toLowerCase() !== 'false';
    const requestedCommitByQuery =
      String(requestedCommit || '').trim().toLowerCase() === 'true';
    const serverCommitEnabled =
      process.env.AMAZON_SP_API_OAUTH_CALLBACK_COMMIT_ENABLED === 'true';
    const operatorConfirmed =
      process.env.AMAZON_SP_API_OAUTH_CALLBACK_OPERATOR_CONFIRMED === 'true';
    const companyStoreAllowlisted =
      process.env.AMAZON_SP_API_OAUTH_CALLBACK_COMPANY_STORE_ALLOWLISTED ===
      'true';
    const environmentAllowsPersistence =
      process.env.AMAZON_SP_API_OAUTH_CALLBACK_PERSISTENCE_ENABLED === 'true';
    const trustedStateSignatureValid =
      process.env.AMAZON_SP_API_OAUTH_CALLBACK_TRUSTED_STATE_SIGNATURE_VALID ===
      'true';
    const trustedStateExpired =
      process.env.AMAZON_SP_API_OAUTH_CALLBACK_TRUSTED_STATE_EXPIRED === 'true';
    const realLwaActivationGateAccepted =
      process.env.AMAZON_SP_API_OAUTH_CALLBACK_REAL_LWA_GATE_ACCEPTED ===
      'true';

    const commitGateResult =
      this.amazonSpApiOauthCallbackCommitGateService.evaluateCommitGate({
        dryRun: dryRunRequested,
        requestedCommit: requestedCommitByQuery && serverCommitEnabled,
        trustedStateAccepted: persistencePlan.accepted === true,
        callbackStateSignatureValid: trustedStateSignatureValid,
        callbackStateExpired: trustedStateExpired,
        companyId: fakeExchangeResult.companyId,
        storeId: fakeExchangeResult.storeId,
        marketplaceId: fakeExchangeResult.marketplaceId,
        region: fakeExchangeResult.region,
        sellingPartnerIdPresent: normalizedSellingPartnerId.length > 0,
        authorizationCodePresent: selectedAuthorizationCode.length > 0,
        operatorConfirmed,
        companyStoreAllowlisted,
        environmentAllowsPersistence,
        realLwaActivationGateAccepted,
        idempotencyKey:
          String(process.env.AMAZON_SP_API_OAUTH_CALLBACK_IDEMPOTENCY_KEY || '').trim() ||
          String(idempotencyKey || '').trim(),
        sanitizedLwaParserAccepted: fakeExchangeResult.accepted === true,
        encryptedPersistenceInputAccepted: serviceDryRunResult.accepted === true,
      });

    if (commitGateResult.accepted) {
      const realWriteResult =
        await this.amazonSpApiTokenPersistenceOrchestrator.persistEncryptedTokensSchemaAwareRealWrite(
          {
            companyId: fakeExchangeResult.companyId,
            storeId: fakeExchangeResult.storeId,
            marketplaceId: fakeExchangeResult.marketplaceId,
            region: fakeExchangeResult.region,
            sellingPartnerId: normalizedSellingPartnerId,
            transportAccepted: fakeExchangeResult.accepted === true,
            parserAccepted: fakeExchangeResult.accepted === true,
            persistenceInputAccepted: persistencePlan.accepted === true,
            encryptedRefreshToken:
              persistencePlan.refreshCredentialInput.encryptedRefreshToken,
            encryptedAccessTokenCache:
              persistencePlan.accessTokenCacheInput?.encryptedAccessToken ?? null,
            accessTokenExpiresAt:
              persistencePlan.accessTokenCacheInput?.expiresAt ?? null,
            refreshTokenFingerprint:
              'step139-t-controller-refresh-token-fingerprint',
            accessTokenFingerprint: persistencePlan.accessTokenCacheInput
              ? 'step139-t-controller-access-token-fingerprint'
              : null,
            encryptionKeyId: persistencePlan.refreshCredentialInput.encryptionKeyId,
            encryptionAlgorithm:
              persistencePlan.refreshCredentialInput.encryptionAlgorithm,
            tokenVersion: persistencePlan.refreshCredentialInput.tokenVersion,
            status: 'active',
            lastValidatedAt: new Date().toISOString(),
            revokedAt: null,
          },
          this.prismaService as any,
        );

      return {
        ...baseResponse,
        source: 'amazon-sp-api-oauth-callback-controller-schema-aware-real-write' as const,
        wiringMode: 'controller-commit-gate-to-schema-aware-orchestrator-real-write' as const,
        accepted: realWriteResult.accepted,
        status: realWriteResult.accepted
          ? 'token_persistence_committed'
          : realWriteResult.reason,
        messageRedacted: realWriteResult.messageRedacted,
        controllerWiringNow: true as const,
        oauthCallbackDryRunWiringNow: false as const,
        oauthCallbackPersistenceWiringNow: true as const,
        controllerCallsServicePersistenceDryRunNow: false as const,
        controllerCallsServicePersistenceCommitNow: true as const,
        controllerCallsSchemaAwareOrchestratorNow: true as const,
        controllerCallsLegacyOrchestratorNow: false as const,
        commitGateEvaluatedNow: true as const,
        commitGateAccepted: commitGateResult.accepted,
        commitGateReason: commitGateResult.reason,
        controllerCallsRepositoryDirectlyNow: false as const,
        tokenPersistenceDatabaseWriteNow:
          realWriteResult.tokenPersistenceDatabaseWriteNow,
        plaintextTokenDatabaseWriteNow: false as const,
        databaseWriteNow: realWriteResult.databaseWriteNow,
        prismaClientWriteNow: realWriteResult.prismaClientWriteNow,
        connectionWriteNow: realWriteResult.connectionWriteNow,
        credentialWriteNow: realWriteResult.credentialWriteNow,
        accessTokenCacheWriteNow: realWriteResult.accessTokenCacheWriteNow,
        persistedConnectionShape: realWriteResult.persistedConnectionShape,
        persistedCredentialShape: realWriteResult.persistedCredentialShape,
        persistedAccessTokenCacheShape: realWriteResult.persistedAccessTokenCacheShape,
        amazonNetworkCallNow: false as const,
        tokenExchangeHttpCallNow: false as const,
        realSpApiRequestNow: false as const,
        rawAuthorizationCodeReturnedNow: false as const,
        rawLwaResponseReturnedNow: false as const,
        rawAccessTokenReturnedNow: false as const,
        rawRefreshTokenReturnedNow: false as const,
        persistedConnection: realWriteResult.persistedCredentialShape,
        sanitizedResult: {
          sellingPartnerId: normalizedSellingPartnerId,
          tokenExchangePending: false,
          tokenPersistencePending: !realWriteResult.accepted,
          tokenPersistenceCommitted: realWriteResult.accepted,
        },
      };
    }

    return {
      ...baseResponse,
      accepted: serviceDryRunResult.accepted,
      status: serviceDryRunResult.accepted
        ? 'dry_run_token_persistence_ready'
        : serviceDryRunResult.reason,
      messageRedacted: serviceDryRunResult.accepted
        ? 'OAuth callback dry-run completed. Token persistence remains disabled.'
        : serviceDryRunResult.messageRedacted,
      statePresent: true,
      authorizationCodePresent: true,
      spapiOauthCodeUsed: Boolean(normalizedSpapiOauthCode && !normalizedCode),
      sellingPartnerId: normalizedSellingPartnerId,
      bridgeServiceReady,
      tokenExchangeAttempted: true,
      tokenExchangeTransportMode: fakeExchangeResult.transportMode,
      tokenExchangeHttpCallNow: fakeExchangeResult.tokenExchangeHttpCallNow,
      realSpApiRequestNow: fakeExchangeResult.realSpApiRequestNow,
      controllerCallsServicePersistenceDryRunNow: true as const,
      servicePersistenceDryRunAccepted: serviceDryRunResult.accepted,
      servicePersistenceReason: serviceDryRunResult.reason,
      serviceWiringMode: serviceDryRunResult.serviceWiringMode,
      tokenPersistenceDatabaseWriteNow: false as const,
      plaintextTokenDatabaseWriteNow: false as const,
      databaseWriteNow: false as const,
      prismaClientWriteNow: false as const,
      persistedConnection: null,
      sanitizedResult: {
        ...fakeExchangeResult.sanitizedResult,
        ...persistencePlan.sanitizedResult,
        sellingPartnerId: normalizedSellingPartnerId,
        tokenExchangePending: false,
        tokenPersistencePending: true,
        tokenPersistenceDryRunOnly: true,
      },
    };
  }


  // Step142-B2: dry-run-only income Transaction projection for Amazon SP-API Orders ImportJob.
  // GET route is read-only: no Transaction / InventoryMovement / ImportJob / ImportStagingRow writes.
  @Get('amazon-sp-api/orders/income-transaction-dry-run')
  previewAmazonSpApiOrdersIncomeTransactionDryRun(
    @Query('importJobId') importJobId?: string,
    @Query('companyId') companyId?: string,
  ) {
    return this.service.previewAmazonSpApiOrdersIncomeTransactionDryRun({
      importJobId,
      companyId,
    });
  }

  @Post('detect-month-conflicts')
  detectMonthConflicts(@Body() body: DetectMonthConflictsDto) {
    return this.service.detectMonthConflicts(body);
  }

  @Post('preview')
  preview(@Body() body: PreviewImportDto) {
    return this.service.previewImport(body);
  }

  @Post('cash-income/preview')
  previewCashIncome(@Body() body: CashIncomePreviewDto) {
    return this.service.previewCashIncomeImport(body);
  }

  @Post('cash-income/commit')
  commitCashIncome(@Body() body: CashIncomeCommitDto) {
    return this.service.commitCashIncomeContract(body);
  }

  // Step109-Z1-H9-1-EXPENSE-PREVIEW-COMMIT-CONTROLLER:
  // Two-step expense import API. Keep legacy expense/commit below for compatibility.
  @Post('expense/preview')
  previewExpenseImport(@Body() body: ExpenseImportPreviewDto) {
    return this.service.previewExpenseImportContract(body);
  }

  @Post('expense/:importJobId/commit')
  commitExpenseImportJob(
    @Param('importJobId') importJobId: string,
    @Body() body: ExpenseImportCommitFromJobDto,
  ) {
    return this.service.commitExpenseImportContract(importJobId, body);
  }

  // Step109-Z1-H5D-EXPENSE-COMMIT-CONTROLLER:
  // Commit ledger_scope validated expense CSV preview rows into Transaction.
  @Post('expense/commit')
  commitExpenseImport(@Body() body: any) {
    return this.service.commitExpenseImport(body);
  }

  // Step109-Z1-H8-1-INCOME-BACKEND-CONTROLLER:
  // Unified backend import contract for cash-income and other-income.
  // Frontend is not switched in H8-1; this endpoint is validated by curl/API tests first.
  @Post('income/preview')
  previewIncomeImport(@Body() body: IncomeImportPreviewDto) {
    return this.service.previewIncomeImportContract(body);
  }

  @Post('income/:importJobId/commit')
  commitIncomeImport(
    @Param('importJobId') importJobId: string,
    @Body() body: IncomeImportCommitDto
  ) {
    return this.service.commitIncomeImportContract(importJobId, body);
  }

  @Post(':importJobId/commit')
  commit(
    @Param('importJobId') importJobId: string,
    @Body() body: CommitImportDto
  ) {
    return this.service.commitImport(importJobId, body);
  }

  @Get('history')
  history(
    @Query('module') module?: string,
    @Query('companyId') companyId?: string
  ) {
    return this.service.listHistory({ module, companyId });
  }

  @Get(':importJobId/summary')
  summary(
    @Param('importJobId') importJobId: string,
    @Query('companyId') companyId?: string
  ) {
    return this.service.getImportSummary(importJobId, companyId);
  }
}
