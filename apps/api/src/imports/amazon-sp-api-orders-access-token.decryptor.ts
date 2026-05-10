import type { AmazonSpApiOrdersCredentialDecryptor } from './amazon-sp-api-orders-credential.repository';

export type AmazonSpApiOrdersAccessTokenDecryptorEnv = {
  AMAZON_SP_API_ORDERS_ACCESS_TOKEN_DECRYPTOR_MODE?: string;
  AMAZON_SP_API_ORDERS_ACCESS_TOKEN_DECRYPTOR_ALLOW_PLAIN_PREFIX?: string;
  AMAZON_SP_API_ORDERS_ACCESS_TOKEN_DECRYPTOR_TEST_MAPPING_JSON?: string;
};

export type AmazonSpApiOrdersAccessTokenDecryptorResult = {
  step: 'Step140-Y';
  source: 'amazon-sp-api-orders-access-token-decryptor';
  mode: 'disabled' | 'plain-prefix-dev-only' | 'test-mapping';
  ok: boolean;
  reason:
    | 'ready'
    | 'disabled'
    | 'plain_prefix_not_allowed'
    | 'encrypted_access_token_missing'
    | 'unsupported_encryption_algorithm'
    | 'test_mapping_missing'
    | 'test_mapping_invalid_json'
    | 'test_mapping_no_match';
  plaintextAccessTokenForControllerOnly: string | null;
  boundaries: {
    decryptsAccessTokenCache: boolean;
    decryptsRefreshToken: false;
    refreshesLwaTokenNow: false;
    writesDatabase: false;
    callsAmazon: false;
    returnsRawAccessTokenToFrontend: false;
    returnsEncryptedToken: false;
  };
};

export class AmazonSpApiOrdersAccessTokenDecryptor implements AmazonSpApiOrdersCredentialDecryptor {
  constructor(
    private readonly env: AmazonSpApiOrdersAccessTokenDecryptorEnv = process.env as AmazonSpApiOrdersAccessTokenDecryptorEnv,
  ) {}

  async decryptAccessToken(input: {
    encryptedAccessToken: string;
    encryptionKeyId?: string | null;
    encryptionAlgorithm?: string | null;
    context: {
      companyId: string;
      storeId: string;
      connectionId: string;
    };
  }): Promise<string> {
    const result = this.decryptAccessTokenCacheForControllerOnly(input);

    if (!result.ok || !result.plaintextAccessTokenForControllerOnly) {
      throw new Error(`STEP140_Y_ACCESS_TOKEN_DECRYPT_FAILED: ${result.reason}`);
    }

    return result.plaintextAccessTokenForControllerOnly;
  }

  decryptAccessTokenCacheForControllerOnly(input: {
    encryptedAccessToken: string;
    encryptionKeyId?: string | null;
    encryptionAlgorithm?: string | null;
    context: {
      companyId: string;
      storeId: string;
      connectionId: string;
    };
  }): AmazonSpApiOrdersAccessTokenDecryptorResult {
    const encryptedAccessToken = String(input.encryptedAccessToken || '').trim();
    const algorithm = String(input.encryptionAlgorithm || '').trim();
    const mode = String(this.env.AMAZON_SP_API_ORDERS_ACCESS_TOKEN_DECRYPTOR_MODE || 'disabled')
      .trim()
      .toLowerCase();

    if (!encryptedAccessToken) {
      return blocked('disabled', 'encrypted_access_token_missing', false);
    }

    if (mode === 'plain-prefix-dev-only') {
      const allowPlain = String(this.env.AMAZON_SP_API_ORDERS_ACCESS_TOKEN_DECRYPTOR_ALLOW_PLAIN_PREFIX || '')
        .trim()
        .toLowerCase() === 'true';

      if (!allowPlain) {
        return blocked('plain-prefix-dev-only', 'plain_prefix_not_allowed', false);
      }

      if (algorithm && algorithm !== 'plain-prefix-dev-only') {
        return blocked('plain-prefix-dev-only', 'unsupported_encryption_algorithm', false);
      }

      if (!encryptedAccessToken.startsWith('plain:')) {
        return blocked('plain-prefix-dev-only', 'unsupported_encryption_algorithm', false);
      }

      const token = encryptedAccessToken.slice('plain:'.length).trim();

      if (!token) {
        return blocked('plain-prefix-dev-only', 'encrypted_access_token_missing', false);
      }

      return ready('plain-prefix-dev-only', token);
    }

    if (mode === 'test-mapping') {
      const rawJson = String(this.env.AMAZON_SP_API_ORDERS_ACCESS_TOKEN_DECRYPTOR_TEST_MAPPING_JSON || '').trim();

      if (!rawJson) {
        return blocked('test-mapping', 'test_mapping_missing', false);
      }

      let mapping: Record<string, string>;

      try {
        mapping = JSON.parse(rawJson) as Record<string, string>;
      } catch {
        return blocked('test-mapping', 'test_mapping_invalid_json', false);
      }

      const direct = mapping[encryptedAccessToken];
      const byConnection = mapping[`connection:${input.context.connectionId}`];
      const byCompanyStore = mapping[`company-store:${input.context.companyId}:${input.context.storeId}`];

      const token = String(direct || byConnection || byCompanyStore || '').trim();

      if (!token) {
        return blocked('test-mapping', 'test_mapping_no_match', false);
      }

      return ready('test-mapping', token);
    }

    return blocked('disabled', 'disabled', false);
  }
}

function ready(
  mode: AmazonSpApiOrdersAccessTokenDecryptorResult['mode'],
  token: string,
): AmazonSpApiOrdersAccessTokenDecryptorResult {
  return {
    step: 'Step140-Y',
    source: 'amazon-sp-api-orders-access-token-decryptor',
    mode,
    ok: true,
    reason: 'ready',
    plaintextAccessTokenForControllerOnly: token,
    boundaries: {
      decryptsAccessTokenCache: true,
      decryptsRefreshToken: false,
      refreshesLwaTokenNow: false,
      writesDatabase: false,
      callsAmazon: false,
      returnsRawAccessTokenToFrontend: false,
      returnsEncryptedToken: false,
    },
  };
}

function blocked(
  mode: AmazonSpApiOrdersAccessTokenDecryptorResult['mode'],
  reason: Exclude<AmazonSpApiOrdersAccessTokenDecryptorResult['reason'], 'ready'>,
  decryptsAccessTokenCache: boolean,
): AmazonSpApiOrdersAccessTokenDecryptorResult {
  return {
    step: 'Step140-Y',
    source: 'amazon-sp-api-orders-access-token-decryptor',
    mode,
    ok: false,
    reason,
    plaintextAccessTokenForControllerOnly: null,
    boundaries: {
      decryptsAccessTokenCache,
      decryptsRefreshToken: false,
      refreshesLwaTokenNow: false,
      writesDatabase: false,
      callsAmazon: false,
      returnsRawAccessTokenToFrontend: false,
      returnsEncryptedToken: false,
    },
  };
}
