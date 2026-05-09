import { Injectable } from '@nestjs/common';

export type AmazonSpApiRealLwaActivationGateInput = {
  configValidatorStatus: 'ready' | 'missing_required_env' | 'invalid_env';
  clientIdPresent: boolean;
  clientSecretPresent: boolean;
  redirectUriPresent: boolean;
  marketplaceIdPresent: boolean;
  regionPresent: boolean;
  tokenEndpointHttps: boolean;
  callbackStateTrusted: boolean;
  companyIdResolvedFromTrustedState: boolean;
  storeIdResolvedFromTrustedState: boolean;
  sellingPartnerIdPresent: boolean;
  authorizationCodePresent: boolean;
  redirectUriMatchesAuthorizationRequest: boolean;
  serverSideRuntimeGateEnabled: boolean;
  environmentAllowsRealLwaHttp: boolean;
  companyStoreAllowlisted: boolean;
  explicitOperatorConfirmed: boolean;
};

export type AmazonSpApiRealLwaActivationGateResult = {
  accepted: false;
  source: 'amazon-sp-api-real-lwa-activation-gate-service-skeleton';
  gateDecision: 'blocked';
  reason:
    | 'activation_gate_skeleton'
    | 'config_not_ready'
    | 'client_id_missing'
    | 'client_secret_missing'
    | 'redirect_uri_missing'
    | 'marketplace_id_missing'
    | 'region_missing'
    | 'token_endpoint_not_https'
    | 'callback_state_not_trusted'
    | 'company_id_not_resolved'
    | 'store_id_not_resolved'
    | 'selling_partner_id_missing'
    | 'authorization_code_missing'
    | 'redirect_uri_mismatch'
    | 'server_side_runtime_gate_disabled'
    | 'environment_not_allowed'
    | 'company_store_not_allowlisted'
    | 'operator_confirmation_missing';
  messageRedacted: string;
  activationGatePreparedNow: true;
  activationGateImplementedNow: true;
  realHttpAllowedNow: false;
  realHttpEnabledNow: false;
  tokenExchangeHttpCallNow: false;
  lwaHttpCallNow: false;
  realSpApiRequestNow: false;
  tokenPersistenceDatabaseWriteNow: false;
  callbackRuntimeChangedNow: false;
  controllerRouteChangedNow: false;
  reportsApiCallNow: false;
  importJobWriteNow: false;
  importStagingRowWriteNow: false;
  transactionWriteNow: false;
  inventoryWriteNow: false;
  rawAuthorizationCodeReturnedNow: false;
  rawClientIdReturnedNow: false;
  rawClientSecretReturnedNow: false;
  rawRequestBodyReturnedNow: false;
  rawLwaResponseReturnedNow: false;
  rawAccessTokenReturnedNow: false;
  rawRefreshTokenReturnedNow: false;
  sanitizedDecision: {
    configReady: boolean;
    clientIdPresent: boolean;
    clientSecretPresent: boolean;
    redirectUriPresent: boolean;
    marketplaceIdPresent: boolean;
    regionPresent: boolean;
    tokenEndpointHttps: boolean;
    callbackStateTrusted: boolean;
    companyIdResolvedFromTrustedState: boolean;
    storeIdResolvedFromTrustedState: boolean;
    sellingPartnerIdPresent: boolean;
    authorizationCodePresent: boolean;
    redirectUriMatchesAuthorizationRequest: boolean;
    serverSideRuntimeGateEnabled: boolean;
    environmentAllowsRealLwaHttp: boolean;
    companyStoreAllowlisted: boolean;
    explicitOperatorConfirmed: boolean;
    envFlagAloneAccepted: false;
    frontendCanEnableRealHttp: false;
    queryParamCanEnableRealHttp: false;
    callbackParamCanEnableRealHttp: false;
    nextImplementationStep: 'Step137-C';
  };
};

@Injectable()
export class AmazonSpApiRealLwaActivationGateService {
  evaluateRealLwaActivationLater(
    input: AmazonSpApiRealLwaActivationGateInput,
  ): AmazonSpApiRealLwaActivationGateResult {
    const sanitizedDecision: AmazonSpApiRealLwaActivationGateResult['sanitizedDecision'] = {
      configReady: input.configValidatorStatus === 'ready',
      clientIdPresent: input.clientIdPresent === true,
      clientSecretPresent: input.clientSecretPresent === true,
      redirectUriPresent: input.redirectUriPresent === true,
      marketplaceIdPresent: input.marketplaceIdPresent === true,
      regionPresent: input.regionPresent === true,
      tokenEndpointHttps: input.tokenEndpointHttps === true,
      callbackStateTrusted: input.callbackStateTrusted === true,
      companyIdResolvedFromTrustedState: input.companyIdResolvedFromTrustedState === true,
      storeIdResolvedFromTrustedState: input.storeIdResolvedFromTrustedState === true,
      sellingPartnerIdPresent: input.sellingPartnerIdPresent === true,
      authorizationCodePresent: input.authorizationCodePresent === true,
      redirectUriMatchesAuthorizationRequest:
        input.redirectUriMatchesAuthorizationRequest === true,
      serverSideRuntimeGateEnabled: input.serverSideRuntimeGateEnabled === true,
      environmentAllowsRealLwaHttp: input.environmentAllowsRealLwaHttp === true,
      companyStoreAllowlisted: input.companyStoreAllowlisted === true,
      explicitOperatorConfirmed: input.explicitOperatorConfirmed === true,
      envFlagAloneAccepted: false,
      frontendCanEnableRealHttp: false,
      queryParamCanEnableRealHttp: false,
      callbackParamCanEnableRealHttp: false,
      nextImplementationStep: 'Step137-C',
    };

    const blocked = (
      reason: AmazonSpApiRealLwaActivationGateResult['reason'],
      messageRedacted: string,
    ): AmazonSpApiRealLwaActivationGateResult => ({
      accepted: false,
      source: 'amazon-sp-api-real-lwa-activation-gate-service-skeleton',
      gateDecision: 'blocked',
      reason,
      messageRedacted,
      activationGatePreparedNow: true,
      activationGateImplementedNow: true,
      realHttpAllowedNow: false,
      realHttpEnabledNow: false,
      tokenExchangeHttpCallNow: false,
      lwaHttpCallNow: false,
      realSpApiRequestNow: false,
      tokenPersistenceDatabaseWriteNow: false,
      callbackRuntimeChangedNow: false,
      controllerRouteChangedNow: false,
      reportsApiCallNow: false,
      importJobWriteNow: false,
      importStagingRowWriteNow: false,
      transactionWriteNow: false,
      inventoryWriteNow: false,
      rawAuthorizationCodeReturnedNow: false,
      rawClientIdReturnedNow: false,
      rawClientSecretReturnedNow: false,
      rawRequestBodyReturnedNow: false,
      rawLwaResponseReturnedNow: false,
      rawAccessTokenReturnedNow: false,
      rawRefreshTokenReturnedNow: false,
      sanitizedDecision,
    });

    if (input.configValidatorStatus !== 'ready') {
      return blocked(
        'config_not_ready',
        'LWA config validator must report ready before real HTTP can be considered.',
      );
    }

    if (input.clientIdPresent !== true) {
      return blocked('client_id_missing', 'Client id must be present before real HTTP can be considered.');
    }

    if (input.clientSecretPresent !== true) {
      return blocked(
        'client_secret_missing',
        'Client secret must be present before real HTTP can be considered.',
      );
    }

    if (input.redirectUriPresent !== true) {
      return blocked(
        'redirect_uri_missing',
        'Redirect URI must be present before real HTTP can be considered.',
      );
    }

    if (input.marketplaceIdPresent !== true) {
      return blocked(
        'marketplace_id_missing',
        'Marketplace id must be present before real HTTP can be considered.',
      );
    }

    if (input.regionPresent !== true) {
      return blocked('region_missing', 'Region must be present before real HTTP can be considered.');
    }

    if (input.tokenEndpointHttps !== true) {
      return blocked(
        'token_endpoint_not_https',
        'LWA token endpoint must be HTTPS before real HTTP can be considered.',
      );
    }

    if (input.callbackStateTrusted !== true) {
      return blocked(
        'callback_state_not_trusted',
        'OAuth callback state must be trusted before real HTTP can be considered.',
      );
    }

    if (input.companyIdResolvedFromTrustedState !== true) {
      return blocked(
        'company_id_not_resolved',
        'Company id must be resolved from trusted state before real HTTP can be considered.',
      );
    }

    if (input.storeIdResolvedFromTrustedState !== true) {
      return blocked(
        'store_id_not_resolved',
        'Store id must be resolved from trusted state before real HTTP can be considered.',
      );
    }

    if (input.sellingPartnerIdPresent !== true) {
      return blocked(
        'selling_partner_id_missing',
        'Selling partner id must be present before real HTTP can be considered.',
      );
    }

    if (input.authorizationCodePresent !== true) {
      return blocked(
        'authorization_code_missing',
        'Authorization code must be present before real HTTP can be considered.',
      );
    }

    if (input.redirectUriMatchesAuthorizationRequest !== true) {
      return blocked(
        'redirect_uri_mismatch',
        'Redirect URI must match the authorization request before real HTTP can be considered.',
      );
    }

    if (input.serverSideRuntimeGateEnabled !== true) {
      return blocked(
        'server_side_runtime_gate_disabled',
        'Dedicated server-side runtime gate is disabled.',
      );
    }

    if (input.environmentAllowsRealLwaHttp !== true) {
      return blocked(
        'environment_not_allowed',
        'Current environment is not allowed to enable real LWA HTTP.',
      );
    }

    if (input.companyStoreAllowlisted !== true) {
      return blocked(
        'company_store_not_allowlisted',
        'Company/store pair is not allowlisted for real LWA HTTP.',
      );
    }

    if (input.explicitOperatorConfirmed !== true) {
      return blocked(
        'operator_confirmation_missing',
        'Explicit operator confirmation is required before real LWA HTTP.',
      );
    }

    return blocked(
      'activation_gate_skeleton',
      'Real LWA activation gate skeleton remains blocking in Step137-B.',
    );
  }
}
