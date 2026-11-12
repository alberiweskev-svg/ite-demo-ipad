/* Regression guard for milestone 4.0.195 — synthetic/static, no client data. */
const assert=require("node:assert/strict"),fs=require("node:fs");
const read=p=>fs.readFileSync(require("node:path").join(__dirname,"..",p),"utf8");
const simple=read("ite-settlement-workspace-ui-191.js");
const rates=read("ite-installments-workspace-ui-193.js");
const overview=read("ite-finance-overview-ui-195.js");
const html=read("index.html");
assert.match(simple,/FATTURA_GIA_RATEIZZATA/);
assert.match(rates,/FATTURA_GIA_IN_SCADENZIARIO_SEMPLICE/);
assert.match(simple,/ITEFinanceSession195\.simple/);
assert.match(rates,/ITEFinanceSession195\.installments/);
assert.match(simple,/ite-finance-changed-195/);
assert.match(rates,/ite-finance-changed-195/);
assert.match(overview,/R\.audit\(F\.snapshot\(\),sessions\.simple\(\),sessions\.installments\(\)/);
assert.match(overview,/if\(!current\.valid\)throw Error/);
for(const filename of ["ite-finance-reconciliation-194.js","ite-finance-overview-ui-195.js"])assert.ok(html.includes(filename));
assert.ok(html.indexOf("ite-finance-reconciliation-194.js")<html.indexOf("ite-finance-overview-ui-195.js"));
console.log("4.0.195 static integration guards: OK");
