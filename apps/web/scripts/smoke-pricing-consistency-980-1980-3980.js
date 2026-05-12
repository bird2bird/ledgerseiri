const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

const files = {
  home: path.join(root, "src/app/[lang]/page.tsx"),
  pricing: path.join(root, "src/app/[lang]/pricing/page.tsx"),
  commerce: path.join(root, "src/app/[lang]/commerce/page.tsx"),
};

const all = Object.fromEntries(
  Object.entries(files).map(([k, p]) => [k, fs.readFileSync(p, "utf8")])
);

const required = {
  home: [
    'price: "¥980/月"',
    'price: "¥1,980/月"',
    'price: "¥3,980/月"',
  ],
  pricing: [
    'name: "Starter"',
    "monthly: 980",
    'name: "Standard"',
    "monthly: 1980",
    'name: "Business"',
    "monthly: 3980",
  ],
  commerce: [
    'Starter: <span className="font-semibold">¥980/月</span>',
    'Standard: <span className="font-semibold">¥1,980/月</span>',
    'Business: <span className="font-semibold">¥3,980/月</span>',
  ],
};

const forbidden = [
  "¥4,980/月",
  "¥9,980/月",
  "monthly: 4980",
  'name: "AI Pro"',
];

let failed = false;

for (const [key, needles] of Object.entries(required)) {
  for (const needle of needles) {
    if (!all[key].includes(needle)) {
      console.error(`[NG] ${key} missing ${needle}`);
      failed = true;
    } else {
      console.log(`[OK] ${key}: ${needle}`);
    }
  }
}

for (const needle of forbidden) {
  for (const [key, text] of Object.entries(all)) {
    if (text.includes(needle)) {
      console.error(`[NG] forbidden ${needle} found in ${key}`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log("[OK] pricing consistency smoke passed: 980 / 1980 / 3980");
