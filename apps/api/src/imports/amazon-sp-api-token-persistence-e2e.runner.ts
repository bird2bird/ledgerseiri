import { AmazonSpApiTokenPersistenceOrchestrator } from './amazon-sp-api-token-persistence.orchestrator';
import type { AmazonSpApiCredentialStatus } from './amazon-sp-api-credential.repository';

export type AmazonSpApiTokenPersistenceE2eRunnerInput = {
  activationGateAccepted: boolean;
  executableTransportAccepted: boolean;
  sanitizedParserAccepted: boolean;
  encryptedPersistenceInputAccepted: boolean;

  companyId: string;
  storeId: string;
  marketplaceId: string;
  region: string;
  sellingPartnerId: string;

  encryptedRefreshToken: string;
  encryptedAccessTokenCache?: string | null;
  accessTokenExpiresAt?: string | Date | null;
  refreshTokenFingerprint: string;
  accessTokenFingerprint?: string | null;
  encryptionKeyId: string;
  encryptionAlgorithm: string;
  tokenVersion: number;
  status: AmazonSpApiCredentialStatus;
  lastValidatedAt?: string | Date | null;
  revokedAt?: string | Date | null;

  plaintextAccessToken?: never;
  plaintextRefreshToken?: never;
  rawLwaResponse?: never;
  rawAuthorizationCode?: never;
  rawClientSecret?: never;
};

export type AmazonSpApiTokenPersistenceE2eRunnerResult = {
  accepted: boolean;
  source: 'amazon-sp-api-token-persistence-e2e-runner';
  runnerMode: 'test-double-no-controller-no-prisma-write-no-amazon-call';
  reason:
    | 'ready'
    | 'activation_gate_not_accepted'
    | 'executable_transport_not_accepted'
    | 'sanitized_parser_not_accepted'
    | 'encrypted_persistence_input_not_accepted'
    | 'orchestrator_rejected'
    | 'plaintext_token_field_rejected'
    | 'raw_lwa_response_rejected'
    | 'raw_authorization_code_rejected'
    | 'raw_client_secret_rejected';
  messageRedacted: string;

  activationGateAccepted: boolean;
  executableTransportAccepted: boolean;
  sanitizedParserAccepted: boolean;
  encryptedPersistenceInputAccepted: boolean;
  orchestratorAccepted: boolean;
  repositoryAccepted: boolean;

  companyIdPresent: boolean;
  storeIdPresent: boolean;
  marketplaceIdPresent: boolean;
  regionPresent: boolean;
  sellingPartnerIdPresent: boolean;

  orchestratorReason?: string;
  repositoryReason?: string;

  controllerWiringNow: false;
  oauthCallbackWiringNow: false;
  amazonNetworkCallNow: false;
  executableHttpClientUsedNow: false;
  realSpApiRequestNow: false;
  prismaClientWriteNow: false;
  databaseWriteNow: false;
  tokenPersistenceDatabaseWriteNow: false;
  plaintextTokenDatabaseWriteNow: false;
  rawTokenReturnedNow: false;
  rawLwaResponseReturnedNow: false;
};

function normalize(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function hasOwn(value: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

export class AmazonSpApiTokenPersistenceE2eRunner {
  constructor(
    private readonly orchestrator = new AmazonSpApiTokenPersistenceOrchestrator(),
  ) {}

  runTokenPersistenceE2eTestDouble(
    input: AmazonSpApiTokenPersistenceE2eRunnerInput,
  ): AmazonSpApiTokenPersistenceE2eRunnerResult {
    const unsafeInput = input as Record<string, unknown>;

    const companyId = normalize(input.companyId);
    const storeId = normalize(input.storeId);
    const marketplaceId = normalize(input.marketplaceId);
    const region = normalize(input.region);
    const sellingPartnerId = normalize(input.sellingPartnerId);

    const result = (
      accepted: boolean,
      reason: AmazonSpApiTokenPersistenceE2eRunnerResult['reason'],
      messageRedacted: string,
      orchestratorAccepted = false,
      repositoryAccepted = false,
      orchestratorReason?: string,
      repositoryReason?: string,
    ): AmazonSpApiTokenPersistenceE2eRunnerResult => ({
      accepted,
      source: 'amazon-sp-api-token-persistence-e2e-runner',
      runnerMode: 'test-double-no-controller-no-prisma-write-no-amazon-call',
      reason,
      messageRedacted,
      activationGateAccepted: input.activationGateAccepted === true,
      executableTransportAccepted: input.executableTransportAccepted === true,
      sanitizedParserAccepted: input.sanitizedParserAccepted === true,
      encryptedPersistenceInputAccepted: input.encryptedPersistenceInputAccepted === true,
      orchestratorAccepted,
      repositoryAccepted,
      companyIdPresent: companyId.length > 0,
      storeIdPresent: storeId.length > 0,
      marketplaceIdPresent: marketplaceId.length > 0,
      regionPresent: region.length > 0,
      sellingPartnerIdPresent: sellingPartnerId.length > 0,
      orchestratorReason,
      repositoryReason,
      controllerWiringNow: false,
      oauthCallbackWiringNow: false,
      amazonNetworkCallNow: false,
      executableHttpClientUsedNow: false,
      realSpApiRequestNow: false,
      prismaClientWriteNow: false,
      databaseWriteNow: false,
      tokenPersistenceDatabaseWriteNow: false,
      plaintextTokenDatabaseWriteNow: false,
      rawTokenReturnedNow: false,
      rawLwaResponseReturnedNow: false,
    });

    if (hasOwn(unsafeInput, 'plaintextAccessToken')) {
      return result(false, 'plaintext_token_field_rejected', 'Plaintext access token field is rejected.');
    }

    if (hasOwn(unsafeInput, 'plaintextRefreshToken')) {
      return result(false, 'plaintext_token_field_rejected', 'Plaintext refresh token field is rejected.');
    }

    if (hasOwn(unsafeInput, 'rawLwaResponse')) {
      return result(false, 'raw_lwa_response_rejected', 'Raw LWA response field is rejected.');
    }

    if (hasOwn(unsafeInput, 'rawAuthorizationCode')) {
      return result(false, 'raw_authorization_code_rejected', 'Raw authorization code field is rejected.');
    }

    if (hasOwn(unsafeInput, 'rawClientSecret')) {
      return result(false, 'raw_client_secret_rejected', 'Raw client secret field is rejected.');
    }

    if (input.activationGateAccepted !== true) {
      return result(false, 'activation_gate_not_accepted', 'Activation gate must be accepted before token persistence E2E.');
    }

    if (input.executableTransportAccepted !== true) {
      return result(false, 'executable_transport_not_accepted', 'Executable transport must be accepted before token persistence E2E.');
    }

    if (input.sanitizedParserAccepted !== true) {
      return result(false, 'sanitized_parser_not_accepted', 'Sanitized parser must be accepted before token persistence E2E.');
    }

    if (input.encryptedPersistenceInputAccepted !== true) {
      return result(false, 'encrypted_persistence_input_not_accepted', 'Encrypted persistence input must be accepted before repository persistence E2E.');
    }

    const orchestratorResult =
      this.orchestrator.persistTokenExchangeResultTestDouble({
        companyId,
        storeId,
        marketplaceId,
        region,
        sellingPartnerId,
        transportAccepted: input.executableTransportAccepted,
        parserAccepted: input.sanitizedParserAccepted,
        persistenceInputAccepted: input.encryptedPersistenceInputAccepted,
        encryptedRefreshToken: input.encryptedRefreshToken,
        encryptedAccessTokenCache: input.encryptedAccessTokenCache ?? null,
        accessTokenExpiresAt: input.accessTokenExpiresAt ?? null,
        refreshTokenFingerprint: input.refreshTokenFingerprint,
        accessTokenFingerprint: input.accessTokenFingerprint ?? null,
        encryptionKeyId: input.encryptionKeyId,
        encryptionAlgorithm: input.encryptionAlgorithm,
        tokenVersion: input.tokenVersion,
        status: input.status,
        lastValidatedAt: input.lastValidatedAt ?? null,
        revokedAt: input.revokedAt ?? null,
      });

    if (!orchestratorResult.accepted) {
      return result(
        false,
        'orchestrator_rejected',
        'Token persistence orchestrator test-double rejected the E2E payload.',
        false,
        orchestratorResult.repositoryAccepted,
        orchestratorResult.reason,
        orchestratorResult.repositoryReason,
      );
    }

    return result(
      true,
      'ready',
      'Token persistence E2E test-double accepted; no controller wiring, no Amazon call, and no Prisma write executed.',
      true,
      orchestratorResult.repositoryAccepted,
      orchestratorResult.reason,
      orchestratorResult.repositoryReason,
    );
  }
}
