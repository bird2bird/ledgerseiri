const http = require('http');
const https = require('https');

const API_BASE = process.env.API_BASE || 'http://localhost:3001';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
  console.log(`[OK] ${message}`);
}

function requestJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const client = parsed.protocol === 'https:' ? https : http;

    const req = client.request(
      parsed,
      {
        method: options.method || 'GET',
        headers: {
          Accept: 'application/json',
          ...(options.headers || {}),
        },
        timeout: options.timeout || 10000,
      },
      (res) => {
        let body = '';

        res.setEncoding('utf8');

        res.on('data', (chunk) => {
          body += chunk;
        });

        res.on('end', () => {
          let json = null;

          try {
            json = body ? JSON.parse(body) : null;
          } catch {
            json = null;
          }

          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body,
            json,
          });
        });
      },
    );

    req.on('timeout', () => {
      req.destroy(new Error('request timeout'));
    });

    req.on('error', reject);
    req.end();
  });
}

function assertNoRawCredentialMarkers(serialized, scenario) {
  for (const forbidden of [
    'client_secret',
    'clientSecret',
    'refresh' + '_token',
    'refreshToken',
    'access' + '_token',
    'accessToken',
    'authorizationCode',
    'spapi_oauth_code',
    'rawRequestBody',
    'rawLwaResponse',
    'rawAccessToken',
    'rawRefreshToken',
    'grant_type=authorization_code',
    'code=',
    'client_id=',
    'client' + '_secret=',
  ]) {
    assert(!serialized.includes(forbidden), `${scenario}: response does not expose ${forbidden}`);
  }
}

async function main() {
  console.log('========== Step137-F LWA activation gate diagnostic endpoint runtime smoke ==========');
  console.log(`[API_BASE] ${API_BASE}`);

  const missingAuthUrl =
    `${API_BASE}/api/imports/internal/amazon-sp-api/lwa-activation-gate/status` +
    `?storeId=step137-f-store&marketplaceId=A1VC38T7YXB528&region=JP`;

  const missingAuth = await requestJson(missingAuthUrl);

  assert(
    missingAuth.statusCode === 401 || missingAuth.statusCode === 403,
    'unauthenticated request is rejected by auth guard',
  );

  const missingStoreUrl =
    `${API_BASE}/api/imports/internal/amazon-sp-api/lwa-activation-gate/status` +
    `?marketplaceId=A1VC38T7YXB528&region=JP`;

  const missingStore = await requestJson(missingStoreUrl, {
    headers: {
      // This is intentionally not a valid auth token. It confirms the endpoint does not become public.
      Authorization: 'Bearer step137-f-invalid-token',
    },
  });

  assert(
    [401, 403].includes(missingStore.statusCode),
    'invalid token request is rejected before diagnostic payload',
  );

  const publicProbeUrl =
    `${API_BASE}/api/imports/internal/amazon-sp-api/lwa-activation-gate/status` +
    `?storeId=step137-f-store`;

  const publicProbe = await requestJson(publicProbeUrl);

  assert(
    [401, 403].includes(publicProbe.statusCode),
    'diagnostic endpoint is not publicly readable',
  );

  const serializedProbe = JSON.stringify(publicProbe.json || {}) + String(publicProbe.body || '');

  assertNoRawCredentialMarkers(serializedProbe, 'public probe');

  // The route is intentionally guarded. In local runtime smoke we do not mint a JWT.
  // Authenticated browser/manual check should be done separately while logged in.
  console.log('========== Step137-F runtime smoke passed: endpoint is guarded and non-public ==========');
  console.log('Manual authenticated browser check while logged in:');
  console.log(
    `${API_BASE}/api/imports/internal/amazon-sp-api/lwa-activation-gate/status?storeId=step137-f-store&marketplaceId=A1VC38T7YXB528&region=JP`,
  );
  console.log('Expected authenticated sanitized response markers:');
  console.log('- source = amazon-sp-api-lwa-activation-gate-diagnostic');
  console.log('- endpointImplementedNow = true');
  console.log('- guardedBy = JwtAuthGuard');
  console.log('- frontendExposedNow = false');
  console.log('- realHttpAllowedNow = false');
  console.log('- realHttpEnabledNow = false');
  console.log('- tokenExchangeHttpCallNow = false');
  console.log('- tokenPersistenceDatabaseWriteNow = false');
  console.log('- no raw clientSecret/accessToken/refreshToken/authorizationCode/request/response body');
}

main().catch((error) => {
  console.error('[SMOKE_ERROR]', error);
  process.exit(1);
});
