const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const langMenu = fs.readFileSync(path.join(root, "src/components/LanguageMenuLP.tsx"), "utf8");
const home = fs.readFileSync(path.join(root, "src/app/[lang]/page.tsx"), "utf8");

const required = [
  [langMenu, '{ code: "ja", label: "日本語", ccy: "JPY" }', "Japanese language option remains"],
  [langMenu, "ITEMS.length <= 1", "Single-language guard"],
  [home, "CSV注文データ取込", "CSV order import badge/item"],
  [home, "CSV注文ファイル", "CSV order file copy"],
  [home, "Amazon SP-API連携", "SP-API copy remains"],
  [home, "Seller CentralのログインID・パスワードは取得しません", "No Seller Central password copy remains"],
];

const forbidden = [
  [langMenu, '{ code: "en"', "English language option must be hidden"],
  [langMenu, '{ code: "zh-CN"', "Simplified Chinese language option must be hidden"],
  [langMenu, '{ code: "zh-TW"', "Traditional Chinese language option must be hidden"],
  [langMenu, "English\", ccy", "English label must be hidden"],
  [langMenu, "简体中文", "Simplified Chinese label must be hidden"],
  [langMenu, "繁體中文", "Traditional Chinese label must be hidden"],
];

let failed = false;

for (const [text, needle, label] of required) {
  if (!text.includes(needle)) {
    console.error(`[NG] missing: ${label} (${needle})`);
    failed = true;
  } else {
    console.log(`[OK] ${label}`);
  }
}

for (const [text, needle, label] of forbidden) {
  if (text.includes(needle)) {
    console.error(`[NG] forbidden: ${label} (${needle})`);
    failed = true;
  } else {
    console.log(`[OK] ${label}`);
  }
}

if (failed) process.exit(1);
console.log("[OK] public review JA-only language menu and CSV order import smoke passed");
