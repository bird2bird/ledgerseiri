const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const files = {
  lp: path.join(root, "src/app/[lang]/page.tsx"),
  privacy: path.join(root, "src/app/[lang]/privacy/page.tsx"),
  security: path.join(root, "src/app/[lang]/security/page.tsx"),
  footer: path.join(root, "src/components/MarketingFooter.tsx"),
  footerI18n: path.join(root, "src/lib/i18n/footer.ts"),
};

const required = {
  lp: [
    "Amazon Selling Partner API",
    "SP-API",
    "Amazon OAuth",
    "Seller Central",
    "ログインID・パスワードは取得しません",
    "取得するAmazonデータ",
    "SKU別販売分析",
    "銀行明細との照合",
    "連携の解除",
    "access token、refresh token、client secretをブラウザへ返却しません",
    "id=\"amazon-sp-api\"",
  ],
  privacy: [
    "Amazon Selling Partner API",
    "Amazon OAuth",
    "第三者に販売せず",
    "広告目的",
    "refresh token",
    "削除または匿名化",
    "Kimoca Co., Ltd.",
  ],
  security: [
    "HTTPS/TLS",
    "refresh token",
    "client secret",
    "ブラウザへ返却しません",
    "Seller Central",
  ],
  footer: [
    "security",
    "/security",
  ],
  footerI18n: [
    "Kimoca Co., Ltd.",
    "株式会社キモカ",
    "security",
    "セキュリティ",
    "Security",
  ],
};

let failed = false;

for (const [key, file] of Object.entries(files)) {
  if (!fs.existsSync(file)) {
    console.error(`[NG] missing ${key}: ${file}`);
    failed = true;
    continue;
  }

  const s = fs.readFileSync(file, "utf8");
  for (const needle of required[key]) {
    if (!s.includes(needle)) {
      console.error(`[NG] ${key} missing: ${needle}`);
      failed = true;
    } else {
      console.log(`[OK] ${key}: ${needle}`);
    }
  }
}

if (failed) process.exit(1);
console.log("[OK] Amazon Public Developer minimal LP compliance smoke passed");
