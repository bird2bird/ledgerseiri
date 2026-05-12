const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const lp = fs.readFileSync(path.join(root, "src/app/[lang]/page.tsx"), "utf8");
const footer = fs.readFileSync(path.join(root, "src/components/MarketingFooter.tsx"), "utf8");
const privacy = fs.readFileSync(path.join(root, "src/app/[lang]/privacy/page.tsx"), "utf8");
const security = fs.readFileSync(path.join(root, "src/app/[lang]/security/page.tsx"), "utf8");

const mustInclude = [
  [lp, "Amazon Selling Partner API", "LP explains SP-API"],
  [lp, "Amazon OAuth", "LP explains OAuth"],
  [lp, "Seller CentralのログインID・パスワードは取得しません", "LP says no Seller Central password"],
  [lp, "取得したAmazonデータを第三者に販売せず", "LP says no sale of Amazon data"],
  [lp, "¥1,980/月", "LP Starter price"],
  [lp, "¥4,980/月", "LP Standard price"],
  [lp, "¥9,980/月", "LP Business price"],
  [privacy, "Amazon Selling Partner API", "Privacy explains SP-API data"],
  [privacy, "第三者に販売せず", "Privacy says no sale"],
  [security, "HTTPS/TLS", "Security has HTTPS/TLS"],
  [security, "refresh token", "Security has refresh token handling"],
];

const mustNotInclude = [
  [lp, "Visual placeholder", "LP must not show Visual placeholder"],
  [lp, "Replace with real screenshots later", "LP must not show unfinished screenshot copy"],
  [lp, "Official", "LP must not imply official endorsement"],
  [lp, "免费开始使用", "JA LP must not show Simplified Chinese CTA"],
  [lp, "常见问题", "JA LP must not show Simplified Chinese FAQ title"],
  [lp, "从免费开始", "JA LP must not show old Chinese pricing title"],
  [footer, 'href="#"', "Footer must not have placeholder links"],
];

let failed = false;

for (const [text, needle, label] of mustInclude) {
  if (!text.includes(needle)) {
    console.error(`[NG] missing: ${label} (${needle})`);
    failed = true;
  } else {
    console.log(`[OK] ${label}`);
  }
}

for (const [text, needle, label] of mustNotInclude) {
  if (text.includes(needle)) {
    console.error(`[NG] forbidden: ${label} (${needle})`);
    failed = true;
  } else {
    console.log(`[OK] ${label}`);
  }
}

if (failed) process.exit(1);
console.log("[OK] Amazon Public Developer LP review readiness smoke passed");
