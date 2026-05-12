const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const checkFiles = [
  "src/app/[lang]/page.tsx",
  "src/app/[lang]/privacy/page.tsx",
  "src/app/[lang]/security/page.tsx",
  "src/app/[lang]/commerce/page.tsx",
  "src/app/[lang]/terms/page.tsx",
  "src/app/[lang]/support/page.tsx",
  "src/app/[lang]/features/page.tsx",
  "src/app/[lang]/resources/page.tsx",
  "src/app/[lang]/usecases/page.tsx",
  "src/app/[lang]/cases/page.tsx",
  "src/components/MarketingFooter.tsx",
  "src/lib/i18n/footer.ts",
];

const forbidden = [
  "ここに内容を追加",
  "Section 1",
  "Section 2",
  "Section 3",
  "Visual placeholder",
  "Replace with real screenshots",
  'href="#"',
  "Official",
];

const requiredAcrossSite = [
  "Amazon Selling Partner API",
  "SP-API",
  "Amazon OAuth",
  "Seller Central",
  "ログインID・パスワードは取得しません",
  "support@kimoca.com",
  "Kimoca Co., Ltd.",
  "株式会社キモカ",
  "¥1,980/月",
  "¥4,980/月",
  "¥9,980/月",
  "HTTPS/TLS",
  "refresh token",
  "第三者に販売せず",
  "広告目的",
  "削除または匿名化",
];

let failed = false;
let all = "";

for (const rel of checkFiles) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) {
    console.error(`[NG] missing file: ${rel}`);
    failed = true;
    continue;
  }
  const s = fs.readFileSync(file, "utf8");
  all += "\n" + s;
  for (const needle of forbidden) {
    if (s.includes(needle)) {
      console.error(`[NG] forbidden "${needle}" in ${rel}`);
      failed = true;
    }
  }
}

for (const needle of requiredAcrossSite) {
  if (!all.includes(needle)) {
    console.error(`[NG] required site content missing: ${needle}`);
    failed = true;
  } else {
    console.log(`[OK] required: ${needle}`);
  }
}

if (failed) process.exit(1);
console.log("[OK] Amazon Public Developer site readiness smoke passed");
