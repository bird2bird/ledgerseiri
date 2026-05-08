const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');
const file = path.join(root, 'apps/web/next.config.ts');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
  console.log(`[OK] ${message}`);
}

const text = fs.readFileSync(file, 'utf8');

console.log('========== Next API rewrite config smoke ==========');

assert(text.includes('const apiProxyTarget = process.env.INTERNAL_API_BASE_URL || "http://api:3001";'), 'INTERNAL_API_BASE_URL fallback points to Docker api service');
assert(text.includes('async rewrites()'), 'Next rewrites() is configured');
assert(text.includes('source: "/api/:path*"'), 'rewrite source covers /api/:path*');
assert(text.includes('destination: `${apiProxyTarget}/api/:path*`'), 'rewrite destination preserves /api path');
assert(text.includes('reactCompiler: true'), 'existing reactCompiler setting preserved');

assert(!text.includes('localhost:3001'), 'next.config does not hardcode localhost API target');
assert(!text.includes('ledgerseiri.com'), 'next.config does not hardcode production domain');

console.log('========== Next API rewrite config smoke passed ==========');
