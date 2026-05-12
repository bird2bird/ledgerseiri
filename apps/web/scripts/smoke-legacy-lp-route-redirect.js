const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const file = path.join(root, "src/app/[lang]/lp/page.tsx");
const s = fs.readFileSync(file, "utf8");

const required = [
  'import { redirect } from "next/navigation";',
  'redirect(`/${lang}`);',
  "LegacyLpPage",
];

const forbidden = [
  "LP Detail Workspace",
  "LP 详情工作台",
  "流量 / CTA",
  "流入・CTA",
  "Traffic / CTA",
  "CTA_OPTIONS",
  "trackLpEvent",
  "useSearchParams",
  "register?cta=",
  "language_select",
];

let failed = false;

for (const needle of required) {
  if (!s.includes(needle)) {
    console.error(`[NG] missing required redirect marker: ${needle}`);
    failed = true;
  } else {
    console.log(`[OK] required: ${needle}`);
  }
}

for (const needle of forbidden) {
  if (s.includes(needle)) {
    console.error(`[NG] legacy/debug marker still present: ${needle}`);
    failed = true;
  } else {
    console.log(`[OK] forbidden marker absent: ${needle}`);
  }
}

if (failed) process.exit(1);
console.log("[OK] legacy /lp route redirects to public homepage");
