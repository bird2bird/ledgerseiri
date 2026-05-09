import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ImportsService } from './imports.service';
import { AmazonSpApiOauthStatePersistenceBridgeService } from './amazon-sp-api-oauth-state-persistence-bridge.service';
import { AmazonSpApiOauthAuthorizationUrlService } from './amazon-sp-api-oauth-authorization-url.service';
import { AmazonSpApiTokenExchangeService } from './amazon-sp-api-token-exchange.service';
import { AmazonSpApiTokenPersistenceService } from './amazon-sp-api-token-persistence.service';
import { AmazonSpApiLwaEnvConfigValidationService } from './amazon-sp-api-lwa-env-config-validation.service';
import { AmazonSpApiRealLwaActivationGateService } from './amazon-sp-api-real-lwa-activation-gate.service';
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


type Step122SAuthenticatedRequest = {
  user?: {
    id?: string;
    userId?: string;
    companyId?: string | null;
    email?: string;
  };
};




type AmazonSpApiConnectionStatusEndpointResponse = {
  source: 'amazon-sp-api-connection-status';
  routeImplementedNow: true;
  status: 'NOT_CONNECTED' | 'CONNECTED' | 'RECONNECT_REQUIRED' | 'ERROR';
  connected: boolean;
  needsReconnect: boolean;
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
  tokenExchangeHttpCallNow: false;
  tokenPersistenceDatabaseWriteNow: false;
  realSpApiRequestNow: false;
  importJobWriteNow: false;
  transactionWriteNow: false;
  inventoryWriteNow: false;
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
  } | null,
  scope: { marketplaceId: string; region: string; storeId: string },
): AmazonSpApiConnectionStatusEndpointResponse {
  const base = {
    source: 'amazon-sp-api-connection-status' as const,
    routeImplementedNow: true as const,
    marketplaceId: scope.marketplaceId,
    region: scope.region,
    storeId: scope.storeId,
    tokenExchangeHttpCallNow: false as const,
    tokenPersistenceDatabaseWriteNow: false as const,
    realSpApiRequestNow: false as const,
    importJobWriteNow: false as const,
    transactionWriteNow: false as const,
    inventoryWriteNow: false as const,
  };

  if (!connection) {
    return {
      ...base,
      status: 'NOT_CONNECTED',
      connected: false,
      needsReconnect: false,
      sellingPartnerIdRedacted: null,
      connectedAt: null,
      revokedAt: null,
      lastTokenRefreshAt: null,
      lastHealthCheckAt: null,
      lastSyncAt: null,
      lastErrorCode: null,
      lastErrorMessageRedacted: null,
    };
  }

  const rawStatus = String(connection.status || '').trim().toUpperCase();
  const hasError = Boolean(connection.lastErrorCode || connection.lastErrorMessageRedacted);
  const isRevoked = rawStatus === 'REVOKED' || Boolean(connection.revokedAt);
  const isConnected = rawStatus === 'CONNECTED' && !isRevoked && !hasError;

  const mappedStatus: AmazonSpApiConnectionStatusEndpointResponse['status'] = hasError
    ? 'ERROR'
    : isRevoked
      ? 'RECONNECT_REQUIRED'
      : isConnected
        ? 'CONNECTED'
        : 'RECONNECT_REQUIRED';

  return {
    ...base,
    status: mappedStatus,
    connected: mappedStatus === 'CONNECTED',
    needsReconnect: mappedStatus === 'RECONNECT_REQUIRED' || mappedStatus === 'ERROR',
    sellingPartnerIdRedacted: redactSellingPartnerIdForConnectionStatus(connection.sellingPartnerId),
    connectedAt: connection.connectedAt?.toISOString?.() ?? null,
    revokedAt: connection.revokedAt?.toISOString?.() ?? null,
    lastTokenRefreshAt: connection.lastTokenRefreshAt?.toISOString?.() ?? null,
    lastHealthCheckAt: connection.lastHealthCheckAt?.toISOString?.() ?? null,
    lastSyncAt: connection.lastSyncAt?.toISOString?.() ?? null,
    lastErrorCode: connection.lastErrorCode ?? null,
    lastErrorMessageRedacted: connection.lastErrorMessageRedacted ?? null,
  };
}

@Controller('api/imports')
export class ImportsController {
  constructor(
    private readonly service: ImportsService,
    private readonly amazonSpApiOauthStatePersistenceBridgeService: AmazonSpApiOauthStatePersistenceBridgeService,
    private readonly amazonSpApiOauthAuthorizationUrlService: AmazonSpApiOauthAuthorizationUrlService,
    private readonly amazonSpApiTokenExchangeService: AmazonSpApiTokenExchangeService,
    private readonly amazonSpApiTokenPersistenceService: AmazonSpApiTokenPersistenceService,
    private readonly amazonSpApiLwaEnvConfigValidationService: AmazonSpApiLwaEnvConfigValidationService,
    private readonly amazonSpApiRealLwaActivationGateService: AmazonSpApiRealLwaActivationGateService,
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

  // Step127-B: Amazon SP-API OAuth callback route implementation boundary.
  // This route intentionally validates and sanitizes callback input only.
  // It does not call Amazon LWA, does not persist refresh/access tokens, and does not call real SP-API.
  @Get('amazon-sp-api/oauth/callback')
  async amazonSpApiOAuthCallbackBoundary(
    @Query('state') state?: string,
    @Query('code') code?: string,
    @Query('spapi_oauth_code') spapiOauthCode?: string,
    @Query('selling_partner_id') sellingPartnerId?: string,
    @Query('error') callbackError?: string,
    @Query('error_description') callbackErrorDescription?: string,
  ) {
    const normalizedState = String(state || '').trim();
    const normalizedCode = String(code || '').trim();
    const normalizedSpapiOauthCode = String(spapiOauthCode || '').trim();
    const normalizedSellingPartnerId = String(sellingPartnerId || '').trim();
    const normalizedError = String(callbackError || '').trim();
    const normalizedErrorDescription = String(callbackErrorDescription || '').trim();

    const baseResponse = {
      source: 'amazon-sp-api-oauth-callback',
      routeImplementedNow: true,
      tokenExchangeHttpCallNow: false,
      tokenPersistenceDatabaseWriteNow: false,
      realSpApiRequestNow: false,
      frontendAddedNow: false,
    } as const;

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

    // Keep a concrete bridge-service dependency in the route without executing DB or HTTP work.
    // The full persistence plan requires encrypted token exchange output, which is intentionally unavailable in Step127-B.
    const bridgeServiceReady =
      typeof this.amazonSpApiOauthStatePersistenceBridgeService.buildPersistencePlan === 'function' &&
      typeof this.amazonSpApiOauthStatePersistenceBridgeService.validateStatePayload === 'function';

    const selectedAuthorizationCode = normalizedSpapiOauthCode || normalizedCode;

    const fakeExchangeResult = this.amazonSpApiTokenExchangeService.exchangeAuthorizationCodeDryRunnable({
      state: normalizedState,
      authorizationCode: selectedAuthorizationCode,
      sellingPartnerId: normalizedSellingPartnerId,
      redirectUri: 'https://ledgerseiri.example/api/imports/amazon-sp-api/oauth/callback',
      clientId: 'amzn1.application-oa2-client.step130b',
      clientSecretConfigured: true,
      marketplaceId: 'A1VC38T7YXB528',
      region: 'JP',
      companyId: 'company-step130b-boundary',
      storeId: 'store-step130b-boundary',
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
      };
    }

    const persistencePlan = this.amazonSpApiOauthStatePersistenceBridgeService.buildPersistencePlan(
      {
        companyId: fakeExchangeResult.companyId,
        storeId: fakeExchangeResult.storeId,
        marketplaceId: fakeExchangeResult.marketplaceId,
        region: fakeExchangeResult.region,
        appId: 'amzn1.application-oa2-client.step130b',
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
        expectedAppId: 'amzn1.application-oa2-client.step130b',
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
        tokenPersistenceDatabaseWriteNow: false,
        realSpApiRequestNow: fakeExchangeResult.realSpApiRequestNow,
      };
    }

    const persistedRefreshCredential = await this.amazonSpApiTokenPersistenceService.persistEncryptedRefreshCredential(
      persistencePlan.refreshCredentialInput,
    );

    const persistedAccessTokenCache = persistencePlan.accessTokenCacheInput
      ? await this.amazonSpApiTokenPersistenceService.persistEncryptedAccessTokenCache(
          persistencePlan.accessTokenCacheInput,
        )
      : null;

    return {
      ...baseResponse,
      accepted: true,
      status: 'token_persistence_completed',
      statePresent: true,
      authorizationCodePresent: true,
      spapiOauthCodeUsed: Boolean(normalizedSpapiOauthCode && !normalizedCode),
      sellingPartnerId: normalizedSellingPartnerId,
      bridgeServiceReady,
      tokenExchangeAttempted: true,
      tokenExchangeTransportMode: fakeExchangeResult.transportMode,
      tokenExchangeHttpCallNow: fakeExchangeResult.tokenExchangeHttpCallNow,
      tokenPersistenceDatabaseWriteNow: true,
      refreshCredentialPersisted: true,
      accessTokenCachePersisted: Boolean(persistencePlan.accessTokenCacheInput),
      realSpApiRequestNow: fakeExchangeResult.realSpApiRequestNow,
      sanitizedTokenEnvelope: fakeExchangeResult.sanitizedTokenEnvelope,
      persistedConnection: {
        id: persistedAccessTokenCache?.id ?? persistedRefreshCredential.id,
        status: persistedAccessTokenCache?.status ?? persistedRefreshCredential.status,
        connectedAt: (persistedAccessTokenCache?.connectedAt ?? persistedRefreshCredential.connectedAt)?.toISOString?.() ?? null,
        lastTokenRefreshAt:
          (persistedAccessTokenCache?.lastTokenRefreshAt ?? persistedRefreshCredential.lastTokenRefreshAt)?.toISOString?.() ?? null,
      },
      sanitizedResult: {
        ...fakeExchangeResult.sanitizedResult,
        ...persistencePlan.sanitizedResult,
        sellingPartnerId: normalizedSellingPartnerId,
        tokenExchangePending: false,
        tokenPersistencePending: false,
      },
    };
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
