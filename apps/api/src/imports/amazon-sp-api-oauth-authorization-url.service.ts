import { Injectable } from '@nestjs/common';

export type AmazonSpApiOauthAuthorizationUrlInput = {
  companyId: string;
  storeId: string;
  marketplaceId: string;
  region: string;
  returnTo?: string;
  sandbox?: boolean;
  forceReauthorize?: boolean;
  locale?: string;
};

export type AmazonSpApiOauthAuthorizationUrlRejectedResult = {
  ok: false;
  status:
    | 'missing_company_id'
    | 'missing_store_id'
    | 'missing_marketplace_id'
    | 'missing_region';
  messageRedacted: string;
};

export type AmazonSpApiOauthAuthorizationUrlAcceptedResult = {
  ok: true;
  source: 'amazon-sp-api-oauth-authorization-url';
  routeImplementedNow: true;
  authorizationUrlBuilderImplementedNow: true;
  oauthStateDatabaseWriteNow: false;
  tokenExchangeHttpCallNow: false;
  tokenPersistenceDatabaseWriteNow: false;
  realSpApiRequestNow: false;
  frontendAddedNow: false;
  realAmazonRedirectNow: false;
  authorizationUrl: string;
  stateIssued: true;
  stateExpiresAt: string;
  redirectUri: string;
  marketplaceId: string;
  region: string;
  storeId: string;
  sandbox: boolean;
  sanitizedResult: {
    companyId: string;
    storeId: string;
    marketplaceId: string;
    region: string;
    authorizationUrlReadyForFrontendLater: true;
    oauthStatePersistencePending: true;
  };
};

export type AmazonSpApiOauthAuthorizationUrlResult =
  | AmazonSpApiOauthAuthorizationUrlAcceptedResult
  | AmazonSpApiOauthAuthorizationUrlRejectedResult;

const AMAZON_JP_AUTHORIZATION_BASE_URL =
  'https://sellercentral.amazon.co.jp/apps/authorize/consent';

const CALLBACK_REDIRECT_URI =
  'https://ledgerseiri.example/api/imports/amazon-sp-api/oauth/callback';

const FAKE_APPLICATION_ID = 'amzn1.sp.solution.step129b.fake';

function normalize(value: string | undefined): string {
  return String(value || '').trim();
}

function reject(
  status: AmazonSpApiOauthAuthorizationUrlRejectedResult['status'],
  messageRedacted: string,
): AmazonSpApiOauthAuthorizationUrlRejectedResult {
  return {
    ok: false,
    status,
    messageRedacted,
  };
}

function toBase64Url(value: string): string {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function deterministicNonce(seed: string): string {
  let hash = 2166136261;

  for (const char of seed) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }

  return hash.toString(16).padStart(8, '0');
}

@Injectable()
export class AmazonSpApiOauthAuthorizationUrlService {
  buildAuthorizationUrl(
    input: AmazonSpApiOauthAuthorizationUrlInput,
  ): AmazonSpApiOauthAuthorizationUrlResult {
    const companyId = normalize(input.companyId);
    const storeId = normalize(input.storeId);
    const marketplaceId = normalize(input.marketplaceId);
    const region = normalize(input.region);
    const returnTo = normalize(input.returnTo);
    const locale = normalize(input.locale) || 'ja-JP';
    const sandbox = input.sandbox !== false;
    const forceReauthorize = input.forceReauthorize === true;

    if (!companyId) {
      return reject('missing_company_id', 'Authenticated company id is required.');
    }

    if (!storeId) {
      return reject('missing_store_id', 'Store id is required.');
    }

    if (!marketplaceId) {
      return reject('missing_marketplace_id', 'Marketplace id is required.');
    }

    if (!region) {
      return reject('missing_region', 'Region is required.');
    }

    const issuedAt = '2026-05-08T00:00:00.000Z';
    const stateExpiresAt = '2026-05-08T00:10:00.000Z';
    const nonce = deterministicNonce(
      [companyId, storeId, marketplaceId, region, returnTo, locale, sandbox ? 'sandbox' : 'production'].join('|'),
    );

    const signedState = toBase64Url(
      JSON.stringify({
        version: 'step129b-fake-state-v1',
        companyId,
        storeId,
        marketplaceId,
        region,
        returnTo: returnTo || undefined,
        locale,
        sandbox,
        nonce,
        issuedAt,
        expiresAt: stateExpiresAt,
        redirectUri: CALLBACK_REDIRECT_URI,
      }),
    );

    const url = new URL(AMAZON_JP_AUTHORIZATION_BASE_URL);
    url.searchParams.set('application_id', FAKE_APPLICATION_ID);
    url.searchParams.set('state', signedState);
    url.searchParams.set('version', 'beta');
    url.searchParams.set('marketplace_id', marketplaceId);
    url.searchParams.set('region', region);
    url.searchParams.set('redirect_uri', CALLBACK_REDIRECT_URI);

    if (forceReauthorize) {
      url.searchParams.set('force_reauthorize', 'true');
    }

    if (sandbox) {
      url.searchParams.set('sandbox', 'true');
    }

    return {
      ok: true,
      source: 'amazon-sp-api-oauth-authorization-url',
      routeImplementedNow: true,
      authorizationUrlBuilderImplementedNow: true,
      oauthStateDatabaseWriteNow: false,
      tokenExchangeHttpCallNow: false,
      tokenPersistenceDatabaseWriteNow: false,
      realSpApiRequestNow: false,
      frontendAddedNow: false,
      realAmazonRedirectNow: false,
      authorizationUrl: url.toString(),
      stateIssued: true,
      stateExpiresAt,
      redirectUri: CALLBACK_REDIRECT_URI,
      marketplaceId,
      region,
      storeId,
      sandbox,
      sanitizedResult: {
        companyId,
        storeId,
        marketplaceId,
        region,
        authorizationUrlReadyForFrontendLater: true,
        oauthStatePersistencePending: true,
      },
    };
  }
}
