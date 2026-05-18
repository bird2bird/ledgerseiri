#!/usr/bin/env node
const fs=require("fs"),path=require("path");
const root=path.resolve(__dirname,"../../..");
const page=fs.readFileSync(path.join(root,"apps/web/src/app/[lang]/app/data/import/page.tsx"),"utf8");
function ok(c,l){if(!c)throw new Error("[FAIL] "+l);console.log("[OK] "+l)}
ok(page.includes("Step151-I-IMPORT-CONFIRMATION-SHELL-NO-EXECUTION"),"Step151-I marker exists");
ok(page.includes("data-import-connected-service-amazon-orders-import-confirmation-shell"),"confirmation shell exists");
ok(page.includes("data-import-connected-service-amazon-orders-import-confirmation-orders"),"orders count shown");
ok(page.includes("data-import-connected-service-amazon-orders-import-confirmation-items"),"items count shown");
ok(page.includes("data-import-connected-service-amazon-orders-import-confirmation-unresolved-sku"),"unresolved SKU shown");
ok(page.includes("data-import-connected-service-amazon-orders-import-confirmation-amount"),"amount shown");
ok(page.includes("Step151-J explicit execution"),"confirmation shell evolved for Step151-J");
console.log("[OK] Step151-I passed.");
