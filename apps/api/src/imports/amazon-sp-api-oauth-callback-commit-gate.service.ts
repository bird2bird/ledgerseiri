import { Injectable } from '@nestjs/common';

export type AmazonSpApiOauthCallbackCommitGateReason =
  | 'ready_for_commit'
  | 'dry_run_default'
  | 'commit_not_requested'
  | 'trusted_state_rejected'
  | 'state_signature_invalid'
  | 'state_expired'
  | 'missing_company_id'
  | 'missing_store_id'
  | 'missing_marketplace_id'
  | 'missing_region'
  | 'missing_selling_partner_id'
  | 'missing_authorization_code'
  | 'operator_confirmation_required'
  | 'company_store_not_allowlisted'
  | 'environment_persistence_disabled'
  | 'real_lwa_activation_gate_rejected'
  | 'missing_idempotency_key'
  | 'sanitized_lwa_parser_not_accepted'
  | 'encrypted_persistence_input_not_accepted';

export type AmazonSpApiOauthCallbackCommitGateInput = {
  dryRun: boolean;
  requestedCommit: boolean;
  trustedStateAccepted: boolean;
  callbackStateSignatureValid: boolean;
  callbackStateExpired: boolean;
  companyId: string;
  storeId: string;
  marketplaceId: string;
  region: string;
  sellingPartnerIdPresent: boolean;
  authorizationCodePresent: boolean;
  operatorConfirmed: boolean;
  companyStoreAllowlisted: boolean;
  environmentAllowsPersistence: boolean;
  realLwaActivationGateAccepted: boolean;
  idempotencyKey: string;
  sanitizedLwaParserAccepted: boolean;
  encryptedPersistenceInputAccepted: boolean;
};

export type AmazonSpApiOauthCallbackCommitGateResult = {
  accepted: boolean;
  source: 'amazon-sp-api-oauth-callback-commit-gate';
  gateMode: 'server-side-pure-commit-gate-no-side-effects';
  reason: AmazonSpApiOauthCallbackCommitGateReason;
  messageRedacted: string;
  commitAllowedNow: boolean;
  dryRunForcedNow: boolean;
  controllerMayCallOrchestratorRealWriteNow: boolean;
  tokenExchangeHttpCallAllowedNow: boolean;
  amazonNetworkCallAllowedNow: boolean;
  tokenPersistenceDatabaseWriteAllowedNow: boolean;
  databaseWriteAllowedNow: boolean;
  prismaClientWriteAllowedNow: boolean;
  plaintextTokenDatabaseWriteAllowedNow: false;
  rawAuthorizationCodeReturnedNow: false;
  rawLwaResponseReturnedNow: false;
  rawAccessTokenReturnedNow: false;
  rawRefreshTokenReturnedNow: false;
};

function normalize(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

@Injectable()
export class AmazonSpApiOauthCallbackCommitGateService {
  evaluateCommitGate(
    input: AmazonSpApiOauthCallbackCommitGateInput,
  ): AmazonSpApiOauthCallbackCommitGateResult {
    const reject = (
      reason: Exclude<AmazonSpApiOauthCallbackCommitGateReason, 'ready_for_commit'>,
      messageRedacted: string,
    ): AmazonSpApiOauthCallbackCommitGateResult => ({
      accepted: false,
      source: 'amazon-sp-api-oauth-callback-commit-gate',
      gateMode: 'server-side-pure-commit-gate-no-side-effects',
      reason,
      messageRedacted,
      commitAllowedNow: false,
      dryRunForcedNow: true,
      controllerMayCallOrchestratorRealWriteNow: false,
      tokenExchangeHttpCallAllowedNow: false,
      amazonNetworkCallAllowedNow: false,
      tokenPersistenceDatabaseWriteAllowedNow: false,
      databaseWriteAllowedNow: false,
      prismaClientWriteAllowedNow: false,
      plaintextTokenDatabaseWriteAllowedNow: false,
      rawAuthorizationCodeReturnedNow: false,
      rawLwaResponseReturnedNow: false,
      rawAccessTokenReturnedNow: false,
      rawRefreshTokenReturnedNow: false,
    });

    if (input.dryRun !== false) {
      return reject(
        'dry_run_default',
        'OAuth callback commit gate remains in dry-run mode.',
      );
    }

    if (input.requestedCommit !== true) {
      return reject(
        'commit_not_requested',
        'OAuth callback commit was not explicitly requested.',
      );
    }

    if (input.trustedStateAccepted !== true) {
      return reject(
        'trusted_state_rejected',
        'OAuth callback trusted state was not accepted.',
      );
    }

    if (input.callbackStateSignatureValid !== true) {
      return reject(
        'state_signature_invalid',
        'OAuth callback state signature is invalid.',
      );
    }

    if (input.callbackStateExpired === true) {
      return reject(
        'state_expired',
        'OAuth callback state is expired.',
      );
    }

    if (!normalize(input.companyId)) {
      return reject('missing_company_id', 'Company id is required.');
    }

    if (!normalize(input.storeId)) {
      return reject('missing_store_id', 'Store id is required.');
    }

    if (!normalize(input.marketplaceId)) {
      return reject('missing_marketplace_id', 'Marketplace id is required.');
    }

    if (!normalize(input.region)) {
      return reject('missing_region', 'Region is required.');
    }

    if (input.sellingPartnerIdPresent !== true) {
      return reject(
        'missing_selling_partner_id',
        'Selling partner id is required.',
      );
    }

    if (input.authorizationCodePresent !== true) {
      return reject(
        'missing_authorization_code',
        'Authorization code is required.',
      );
    }

    if (input.operatorConfirmed !== true) {
      return reject(
        'operator_confirmation_required',
        'Operator confirmation is required before OAuth callback commit.',
      );
    }

    if (input.companyStoreAllowlisted !== true) {
      return reject(
        'company_store_not_allowlisted',
        'Company/store is not allowlisted for OAuth callback commit.',
      );
    }

    if (input.environmentAllowsPersistence !== true) {
      return reject(
        'environment_persistence_disabled',
        'Environment does not allow OAuth callback token persistence.',
      );
    }

    if (input.realLwaActivationGateAccepted !== true) {
      return reject(
        'real_lwa_activation_gate_rejected',
        'Real LWA activation gate rejected OAuth callback commit.',
      );
    }

    if (!normalize(input.idempotencyKey)) {
      return reject(
        'missing_idempotency_key',
        'Idempotency key is required before OAuth callback commit.',
      );
    }

    if (input.sanitizedLwaParserAccepted !== true) {
      return reject(
        'sanitized_lwa_parser_not_accepted',
        'Sanitized LWA parser result must be accepted before commit.',
      );
    }

    if (input.encryptedPersistenceInputAccepted !== true) {
      return reject(
        'encrypted_persistence_input_not_accepted',
        'Encrypted persistence input must be accepted before commit.',
      );
    }

    return {
      accepted: true,
      source: 'amazon-sp-api-oauth-callback-commit-gate',
      gateMode: 'server-side-pure-commit-gate-no-side-effects',
      reason: 'ready_for_commit',
      messageRedacted:
        'OAuth callback commit gate accepted. Controller may call orchestrator real-write branch.',
      commitAllowedNow: true,
      dryRunForcedNow: false,
      controllerMayCallOrchestratorRealWriteNow: true,
      tokenExchangeHttpCallAllowedNow: true,
      amazonNetworkCallAllowedNow: true,
      tokenPersistenceDatabaseWriteAllowedNow: true,
      databaseWriteAllowedNow: true,
      prismaClientWriteAllowedNow: true,
      plaintextTokenDatabaseWriteAllowedNow: false,
      rawAuthorizationCodeReturnedNow: false,
      rawLwaResponseReturnedNow: false,
      rawAccessTokenReturnedNow: false,
      rawRefreshTokenReturnedNow: false,
    };
  }
}
