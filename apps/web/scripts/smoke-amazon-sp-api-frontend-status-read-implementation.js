const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');

const files = {
  api: path.join(root, 'apps/web/src/core/imports/api.ts'),
  panel: path.join(
    root,
    'apps/web/src/components/app/imports/AmazonSpApiConnectionStatusPanel.tsx',
  ),
};

function read(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing file: ${path.relative(root, file)}`);
  }
  return fs.readFileSync(file, 'utf8');
}

function assertIncludes(name, text, needle) {
  if (!text.includes(needle)) {
    throw new Error(`[${name}] Missing required marker: ${needle}`);
  }
  console.log(`[OK] ${name}: ${needle}`);
}

function assertNotIncludes(name, text, needle) {
  if (text.includes(needle)) {
    throw new Error(`[${name}] Forbidden marker found: ${needle}`);
  }
  console.log(`[OK] ${name}: forbidden marker absent: ${needle}`);
}

const api = read(files.api);
const panel = read(files.panel);

console.log('========== Step134-B frontend status read smoke ==========');

assertIncludes('api', api, 'Step134-B-FRONTEND-AMAZON-SP-API-STATUS-READ');
assertIncludes('api', api, 'export type AmazonSpApiConnectionBackendStatus');
assertIncludes('api', api, 'export type AmazonSpApiConnectionStatusRequest');
assertIncludes('api', api, 'export type AmazonSpApiConnectionStatusResponse');
assertIncludes('api', api, 'export async function readAmazonSpApiConnectionStatus');
assertIncludes('api', api, '/api/imports/amazon-sp-api/connection/status?${params.toString()}');
assertIncludes('api', api, 'credentials: "include"');
assertIncludes('api', api, 'cache: "no-store"');
assertIncludes('api', api, 'params.set("storeId", args.storeId || "store-step130b-boundary")');
assertIncludes('api', api, 'params.set("marketplaceId", args.marketplaceId || "A1VC38T7YXB528")');
assertIncludes('api', api, 'params.set("region", args.region || "JP")');

assertIncludes('panel', panel, 'readAmazonSpApiConnectionStatus');
assertIncludes('panel', panel, 'type AmazonSpApiConnectionStatusResponse');
assertIncludes('panel', panel, '| "checking"');
assertIncludes('panel', panel, '| "connected"');
assertIncludes('panel', panel, '| "reconnect_required"');
assertIncludes('panel', panel, 'function normalizeBackendStatus');
assertIncludes('panel', panel, 'function buildBackendStatusMessage');
assertIncludes('panel', panel, 'void initialReadConnectionStatus();');
assertIncludes('panel', panel, 'async function refreshBackendStatus()');
assertIncludes('panel', panel, 'onClick={() => void refreshBackendStatus()}');
assertIncludes('panel', panel, 'if (status === "connected") return "接続済み";');
assertIncludes('panel', panel, 'if (status === "reconnect_required") return "再接続が必要";');
assertIncludes('panel', panel, 'if (status === "error") return "接続エラー";');

assertNotIncludes('panel', panel, 'refreshLocalStatus');
assertNotIncludes('panel', panel, '正式な接続状態APIの読取は次の実装ステップ');
assertNotIncludes('api', api, 'localStorage.setItem');
assertNotIncludes('api', api, 'sessionStorage.setItem');
assertNotIncludes('panel', panel, 'localStorage.setItem');
assertNotIncludes('panel', panel, 'sessionStorage.setItem');

assertNotIncludes('api', api, 'createReport(');
assertNotIncludes('api', api, 'getReport(');
assertNotIncludes('api', api, 'getReportDocument(');
assertNotIncludes('panel', panel, 'createReport(');
assertNotIncludes('panel', panel, 'getReport(');
assertNotIncludes('panel', panel, 'getReportDocument(');

console.log('========== Step134-B frontend status read smoke passed ==========');
