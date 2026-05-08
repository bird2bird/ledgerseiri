const http = require('http');
const https = require('https');

const apiBase = process.env.API_BASE || 'http://localhost:3001';
const webBase = process.env.WEB_BASE || 'http://localhost:3000';
const routePath = '/api/imports/internal/amazon-sp-api/lwa-config/status';

function requestText(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const client = u.protocol === 'https:' ? https : http;

    const req = client.request(
      u,
      {
        method: options.method || 'GET',
        headers: options.headers || {},
      },
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body,
          });
        });
      },
    );

    req.on('error', reject);
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`[OK] ${message}`);
}

function assertNoSecretLeak(body, label) {
  const lowered = String(body || '').toLowerCase();

  for (const forbidden of [
    'client_secret',
    'lwa_client_secret',
    'amazon_refresh_token',
    'refresh_token',
    'access_token',
    'authorizationcode',
    'authorization_code',
    'super-secret-step135',
  ]) {
    assert(!lowered.includes(forbidden), `${label}: does not expose ${forbidden}`);
  }
}

async function main() {
  console.log('========== Step135-H LWA config diagnostic endpoint runtime smoke ==========');
  console.log(`[API_BASE] ${apiBase}`);
  console.log(`[WEB_BASE] ${webBase}`);
  console.log(`[ROUTE] ${routePath}`);

  const apiUrl = `${apiBase}${routePath}`;
  const apiRes = await requestText(apiUrl, {
    headers: {
      Accept: 'application/json',
      'X-LedgerSeiri-Smoke': 'Step135-H-direct-api',
    },
  });

  assert(apiRes.statusCode === 401, `direct API unauthenticated request returns 401, got ${apiRes.statusCode}`);
  assertNoSecretLeak(apiRes.body, 'direct API 401 body');

  const webUrl = `${webBase}${routePath}`;
  const webRes = await requestText(webUrl, {
    headers: {
      Accept: 'application/json',
      'X-LedgerSeiri-Smoke': 'Step135-H-web-origin',
    },
  });

  assert(webRes.statusCode === 401, `web-origin unauthenticated request returns 401, got ${webRes.statusCode}`);
  assertNoSecretLeak(webRes.body, 'web-origin 401 body');

  console.log('========== Manual authenticated browser verification ==========');
  console.log(`1. Open logged-in browser: ${webUrl}`);
  console.log('2. Expected HTTP 200 only when authenticated.');
  console.log('3. Expected sanitized fields only: status, presence flags, endpointImplementedNow, guardedBy, companyScoped.');
  console.log('4. Must not contain raw clientId/clientSecret/accessToken/refreshToken/authorizationCode.');
  console.log('========== Step135-H LWA config diagnostic endpoint runtime smoke passed ==========');
}

main().catch((err) => {
  console.error('[SMOKE_ERROR]', err);
  process.exit(1);
});
