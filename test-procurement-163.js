/* I.T.E. 4.0.163 — TEST-only procurement integration contracts. */
"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs");
const html=fs.readFileSync("index.html","utf8");
const ui=fs.readFileSync("ite-procurement-ui-163.js","utf8");
for(const file of ["ite-inventory-154.js","ite-supplier-import-160.js","ite-procurement-162.js","ite-procurement-ui-163.js"])assert(html.includes(file),"Missing script: "+file);
const scripts=[...html.matchAll(/<script[^>]*src=["']([^"']+)/g)].map(m=>m[1].split("?")[0].replace(/^\.\//,""));
for(const file of ["ite-inventory-154.js","ite-supplier-import-160.js","ite-procurement-162.js"])assert(scripts.indexOf(file)<scripts.indexOf("ite-procurement-ui-163.js"),"Dependency order: "+file);
for(const contract of ["ITE_UnifiedSession129","ITE_Procurement162","requirements(","receiveAgainstPlan(","audit(","S.restore(","S.subscribe(","ANTEPRIMA_SCADUTA","textContent","createElement"])assert(ui.includes(contract),"Missing UI contract "+contract);
assert(!ui.includes("innerHTML"),"Unsafe HTML interpolation");
assert(!ui.includes("fetch("),"No network transfer allowed");
assert(!ui.includes("localStorage"),"Must use unified TEST session");
require("./test-procurement-162.js");
console.log("4.0.163 procurement UI contracts passed");
