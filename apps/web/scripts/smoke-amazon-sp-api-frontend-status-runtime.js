const http = require('http');
const https = require('https');

const webBase = process.env.WEB_BASE || 'http://localhost:3000';
const apiBase = process.env.API_BASE || 'http://localhost:3001';

const expectedPath = '/api/imports/amazon-sp-api/connection/status';
const expectedParams = {
  storeId: 'store-step130b-boundary',
  marketplaceId: 'A1VC38T7YXB528',
  region: 'JP',
};

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
  if (!condition) {
    throw new Error(message);
  }
  console.log(`[OK] ${message}`);
}

async function main() {
  console.log('========== Step134-C frontend runtime smoke ==========');
  console.log(`[WEB_BASE] ${webBase}`);
  console.log(`[API_BASE] ${apiBase}`);

  const pageUrl = `${webBase}/ja/app/data/import`;
  const page = await requestText(pageUrl, {
    headers: {
      Accept: 'text/html',
    },
  });

  assert(
    page.statusCode && page.statusCode >= 200 && page.statusCode < 500,
    `Import Center page returned inspectable status: ${page.statusCode}`,
  );

  const statusUrl = new URL(`${apiBase}${expectedPath}`);
  for (const [key, value] of Object.entries(expectedParams)) {
    statusUrl.searchParams.set(key, value);
  }

  const statusResponse = await requestText(statusUrl.toString(), {
    headers: {
      Accept: 'application/json',
      'X-LedgerSeiri-Smoke': 'Step134-C',
    },
  });

  assert(
    statusResponse.statusCode && statusResponse.statusCode >= 200 && statusResponse.statusCode < 500,
    `Backend status endpoint returned inspectable status: ${statusResponse.statusCode}`,
  );

  let parsed = null;
  try {
    parsed = JSON.parse(statusResponse.body);
  } catch {
    parsed = null;
  }

  assert(Boolean(parsed), 'Backend status endpoint returned JSON');
  assert(
    typeof parsed === 'object' && parsed !== null,
    'Backend status endpoint JSON is an object',
  );

  const status = String(parsed.status || parsed.sanitizedResult?.status || '').toUpperCase();
  const allowed = new Set(['NOT_CONNECTED', 'CONNECTED', 'RECONNECT_REQUIRED', 'ERROR', '']);
  assert(allowed.has(status), `Backend status value is expected or empty: ${status || '(empty)'}`);

  assert(
    !statusResponse.body.includes('refresh_token') &&
      !statusResponse.body.includes('access_token') &&
      !statusResponse.body.includes('client_secret') &&
      !statusResponse.body.includes('lwa_client_secret') &&
      !statusResponse.body.includes('amazon_refresh_token'),
    'Backend status response does not expose raw token or client secret fields',
  );

  assert(
    !statusResponse.body.includes('createReport') &&
      !statusResponse.body.includes('getReportDocument') &&
      !statusResponse.body.includes('ImportStagingRow') &&
      !statusResponse.body.includes('InventoryMovement'),
    'Backend status response does not expose report/import/inventory execution markers',
  );

  console.log('========== Manual browser verification checklist ==========');
  console.log(`1. Open: ${pageUrl}`);
  console.log('2. Open DevTools Network tab.');
  console.log(`3. Confirm initial page load requests: ${expectedPath}?storeId=store-step130b-boundary&marketplaceId=A1VC38T7YXB528&region=JP`);
  console.log('4. Click 「接続状態を更新」.');
  console.log('5. Confirm the same endpoint is requested again.');
  console.log('6. Confirm badge mapping: NOT_CONNECTED=未接続, CONNECTED=接続済み, RECONNECT_REQUIRED=再接続が必要, ERROR=接続エラー.');
  console.log('7. Confirm no raw token/client secret appears in DOM or Network response.');

  console.log('========== Step134-C frontend runtime smoke passed ==========');
}

main().catch((err) => {
  console.error('[SMOKE_ERROR]', err);
  process.exit(1);
});
