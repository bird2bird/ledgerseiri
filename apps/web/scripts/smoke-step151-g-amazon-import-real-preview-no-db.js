#!/usr/bin/env node
const fs=require("fs"),path=require("path");
const root=path.resolve(__dirname,"../../..");
const page=fs.readFileSync(path.join(root,"apps/web/src/app/[lang]/app/data/import/page.tsx"),"utf8");
function ok(c,l){if(!c)throw new Error("[FAIL] "+l);console.log("[OK] "+l)}
function no(s,n,l){ok(!s.includes(n),l)}
function block(fn){const i=page.indexOf("function "+fn);ok(i>=0,fn+" exists");const b=page.indexOf("{",i);let d=0;for(let p=b;p<page.length;p++){if(page[p]==="{")d++;if(page[p]==="}")d--;if(d===0)return page.slice(i,p+1)}throw new Error("unclosed "+fn)}
const h=block("handleAmazonOrdersRealPreviewShell");
ok(page.includes("Step151-G-REAL-PREVIEW-NO-DB"),"Step151-G marker exists");
ok(h.includes("previewAmazonSpApiOrdersReal"),"preview handler calls real-preview");
no(h,"commitAmazonSpApiOrdersRealImportJob","preview handler does not call real-importjob");
ok(page.includes("data-import-connected-service-amazon-orders-real-preview-summary"),"preview summary UI exists");
console.log("[OK] Step151-G passed.");
