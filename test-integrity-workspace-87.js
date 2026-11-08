/* I.T.E. 4.0.87 - regressione integrazione audit */
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const html=fs.readFileSync("index.html","utf8");
for(const name of ["ite-service-ledger-40.js","ite-estimate-workflow-40.js","ite-calendar-84.js","ite-integrity-86.js","ite-integrity-workspace-87.js"])assert.ok(html.includes(name),name+" non incluso");
const order=["ite-service-ledger-40.js","ite-estimate-workflow-40.js","ite-calendar-84.js","ite-integrity-86.js","ite-integrity-workspace-87.js"];
for(let i=1;i<order.length;i++)assert.ok(html.indexOf(order[i-1])<html.indexOf(order[i]),"ordine dipendenze "+order[i]);
for(const name of ["ite-integrity-86.js","ite-integrity-workspace-87.js"])new vm.Script(fs.readFileSync(name,"utf8"),{filename:name});
const source=fs.readFileSync("ite-integrity-workspace-87.js","utf8");
assert.ok(source.includes("ITEIntegrity86"));
assert.ok(source.includes("E.importJSON"));
assert.ok(source.includes("L.importJSON"));
assert.ok(source.includes("URL.revokeObjectURL"));
assert.ok(!source.includes("fetch("),"nessuna trasmissione dati");
console.log("OK: audit UI integrata, dipendenze, sintassi e controlli TEST");
