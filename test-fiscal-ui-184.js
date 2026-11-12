/* Regression 4.0.184: synthetic fiscal lifecycle and UI wiring. */
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const A=require("./ite-fiscal-test-183.js");
const doc=(id,type="VENDITA")=>({id,type,number:"TEST-"+id,date:"2026-11-12",counterparty:"Cliente Fittizio",lines:[{description:"FORNITURA dimostrativa",quantity:2,unitPrice:125.50,vatRate:10},{description:"POSA dimostrativa",quantity:1,unitPrice:80,vatRate:22}],...(type==="TD04"?{reference:{number:"TEST-origin",date:"2026-11-01"}}:{})});
const s=A.createStore();for(const [i,t] of ["VENDITA","ACQUISTO","PROFORMA","TD04"].entries())A.add(s,doc("D"+i,t));
assert.equal(s.documents.length,4);assert.equal(s.documents[0].totals.netCents,33100);assert.equal(s.documents[0].totals.vatCents,4270);assert.equal(s.documents[0].totals.totalCents,37370);
A.transition(s,"D0","REGISTRATO");assert.throws(()=>A.transition(s,"D0","ANNULLATO"),/BLOCCATO/);assert.throws(()=>A.add(s,doc("D0")),/DUPLICATO/);
assert.equal(A.importTest(A.exportTest(s)).documents.length,4);
const html=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
assert.match(html,/ite-fiscal-test-183\.js/);assert.match(html,/ite-fiscal-workspace-ui-184\.js/);
assert.ok(html.indexOf("ite-fiscal-test-183.js")<html.indexOf("ite-fiscal-workspace-ui-184.js"));
const ui=fs.readFileSync(path.join(__dirname,"ite-fiscal-workspace-ui-184.js"),"utf8");assert.match(ui,/textContent/);assert.doesNotMatch(ui,/innerHTML\s*=/);
console.log("ITE fiscal UI 4.0.184 synthetic checks OK");
