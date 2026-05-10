export type AmazonSpApiConnectionStatusFrontendContractStep = 'Step139-Z1';

export type AmazonSpApiConnectionStatusFrontendReadModelStatus =
  | 'disconnected'
  | 'connected'
  | 'needs_reauth'
  | 'error';

export type AmazonSpApiConnectionStatusFrontendBackendStatus =
  | 'NOT_CONNECTED'
  | 'CONNECTED'
  | 'RECONNECT_REQUIRED'
  | 'ERROR';

export type AmazonSpApiConnectionStatusFrontendResponse = {
  source: 'amazon-sp-api-connection-status';
  routeImplementedNow: true;
  readModelMode: 'real-db-connection-credential-cache';
  status: AmazonSpApiConnectionStatusFrontendBackendStatus;
  readModelStatus: AmazonSpApiConnectionStatusFrontendReadModelStatus;
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

export type AmazonSpApiConnectionStatusFrontendUiBadge =
  | 'not-connected'
  | 'connected'
  | 'needs-reconnect'
  | 'error';

export type AmazonSpApiConnectionStatusFrontendUiCopy = {
  badge: AmazonSpApiConnectionStatusFrontendUiBadge;
  labelJa: string;
  descriptionJa: string;
  actionLabelJa: string | null;
};

export const amazonSpApiConnectionStatusFrontendContract = {
  source: 'amazon-sp-api-connection-status-frontend-contract',
  step: 'Step139-Z1',
  phase: 'frontend-contract-only',
  dependsOnBackendStep: 'Step139-Y3',
  backendEndpoint: '/api/imports/amazon-sp-api/connection/status',
  queryParams: {
    storeId: 'required',
    marketplaceId: 'default:A1VC38T7YXB528',
    region: 'default:JP',
  },
  frontendRuntimeChangedNow: false,
  backendRuntimeChangedNow: false,
  oauthCallbackChangedNow: false,
  ordersApiChangedNow: false,
  importJobChangedNow: false,
  inventoryChangedNow: false,
  targetFrontendArea: {
    route: '/[lang]/app/data/import',
    likelyDirectory: 'apps/web/src/components/app/imports',
    panelPurpose: 'Import Center Amazon SP-API connection status panel',
  },
  requiredBackendFields: [
    'source',
    'routeImplementedNow',
    'readModelMode',
    'status',
    'readModelStatus',
    'connected',
    'needsReconnect',
    'credentialPresent',
    'accessTokenCachePresent',
    'accessTokenExpired',
    'marketplaceId',
    'region',
    'storeId',
    'sellingPartnerIdRedacted',
    'connectedAt',
    'revokedAt',
    'lastTokenRefreshAt',
    'lastHealthCheckAt',
    'lastSyncAt',
    'lastErrorCode',
    'lastErrorMessageRedacted',
    'accessTokenExpiresAt',
    'credentialRotatedAt',
    'credentialRevokedAt',
    'tokenExchangeHttpCallNow',
    'tokenPersistenceDatabaseWriteNow',
    'realSpApiRequestNow',
    'importJobWriteNow',
    'transactionWriteNow',
    'inventoryWriteNow',
    'rawAuthorizationCodeReturnedNow',
    'rawLwaResponseReturnedNow',
    'rawAccessTokenReturnedNow',
    'rawRefreshTokenReturnedNow',
    'encryptedRefreshTokenReturnedNow',
    'encryptedAccessTokenReturnedNow',
  ] as const,
  requiredSafetyFlags: {
    rawAuthorizationCodeReturnedNow: false,
    rawLwaResponseReturnedNow: false,
    rawAccessTokenReturnedNow: false,
    rawRefreshTokenReturnedNow: false,
    encryptedRefreshTokenReturnedNow: false,
    encryptedAccessTokenReturnedNow: false,
    tokenExchangeHttpCallNow: false,
    tokenPersistenceDatabaseWriteNow: false,
    realSpApiRequestNow: false,
    importJobWriteNow: false,
    transactionWriteNow: false,
    inventoryWriteNow: false,
  },
  statusToUi: {
    NOT_CONNECTED: {
      badge: 'not-connected',
      labelJa: '未接続',
      descriptionJa: 'Amazon SP-API はまだ接続されていません。',
      actionLabelJa: '接続を開始',
    },
    CONNECTED: {
      badge: 'connected',
      labelJa: '接続済み',
      descriptionJa: 'Amazon SP-API の接続は有効です。',
      actionLabelJa: null,
    },
    RECONNECT_REQUIRED: {
      badge: 'needs-reconnect',
      labelJa: '再接続が必要',
      descriptionJa: '認証情報が無効または不足しています。再接続してください。',
      actionLabelJa: '再接続',
    },
    ERROR: {
      badge: 'error',
      labelJa: 'エラー',
      descriptionJa: 'Amazon SP-API 接続状態の確認でエラーが発生しました。',
      actionLabelJa: '詳細を確認',
    },
  } satisfies Record<
    AmazonSpApiConnectionStatusFrontendBackendStatus,
    AmazonSpApiConnectionStatusFrontendUiCopy
  >,
  displayRules: {
    showCredentialPresent: true,
    showAccessTokenCachePresent: true,
    showAccessTokenExpired: true,
    showAccessTokenExpiresAt: true,
    showCredentialRotatedAt: true,
    showCredentialRevokedAt: true,
    showLastSyncAt: true,
    showLastErrorCode: true,
    showLastErrorMessageRedacted: true,
    neverDisplayEncryptedRefreshToken: true,
    neverDisplayEncryptedAccessToken: true,
    neverDisplayRawAuthorizationCode: true,
    neverDisplayRawAccessToken: true,
    neverDisplayRawRefreshToken: true,
  },
  nextSuggestedStep: 'Step139-Z2',
  nextSuggestedStepGoal:
    'Implement frontend API helper to read Amazon SP-API real connection status endpoint',
} as const;

export function mapAmazonSpApiConnectionStatusToUiCopy(
  status: AmazonSpApiConnectionStatusFrontendBackendStatus,
): AmazonSpApiConnectionStatusFrontendUiCopy {
  return amazonSpApiConnectionStatusFrontendContract.statusToUi[status];
}
