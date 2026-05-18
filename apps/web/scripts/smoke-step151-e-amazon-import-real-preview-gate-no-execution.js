#!/usr/bin/env node
const fs=require("fs"),path=require("path");
const root=path.resolve(__dirname,"../../..");
const page=fs.readFileSync(path.join(root,"apps/web/src/app/[lang]/app/data/import/page.tsx"),"utf8");
function ok(c,l){if(!c)throw new Error("[FAIL] "+l);console.log("[OK] "+l)}
function no(s,n,l){ok(!s.includes(n),l)}
function block(fn){const i=page.indexOf("function "+fn);ok(i>=0,fn+" exists");const b=page.indexOf("{",i);let d=0;for(let p=b;p<page.length;p++){if(page[p]==="{")d++;if(page[p]==="}")d--;if(d===0)return page.slice(i,p+1)}throw new Error("unclosed "+fn)}
const fetch=block("handleAmazonOrdersConnectedServiceFetchShell");
ok(fetch.includes("preflightAmazonSpApiOrdersGuardedImport"),"fetch button remains preflight-only");
no(fetch,"previewAmazonSpApiOrdersReal","fetch handler does not call real-preview");
no(fetch,"commitAmazonSpApiOrdersRealImportJob","fetch handler does not call real-importjob");
no(page,"previewAmazonSpApiOrdersHistoricalSyncPlan(","page does not call historical sync");
console.log("[OK] Step151-E passed.");
