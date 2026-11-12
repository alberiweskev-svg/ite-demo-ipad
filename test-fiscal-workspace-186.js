/* I.T.E. 4.0.186 — test sintetici, nessun dato cliente reale. */
"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs");
const F=require("./ite-fiscal-test-183.js");
const ui=fs.readFileSync("ite-fiscal-workspace-ui-184.js","utf8");
for(const token of ["rowsInput","parsedRows","A.importTest(text)","file.size>2000000","root.confirm","store=candidate","importInput.value=\"\""])assert.ok(ui.includes(token),"UI missing "+token);
const doc=(id,num,lines)=>({id,type:"VENDITA",number:num,date:"2026-11-12",counterparty:"Cliente TEST inventato",lines,status:"BOZZA"});
const store=F.createStore();
F.add(store,doc("demo1","TEST-186-01",[{description:"Fornitura TEST",quantity:2,unitPrice:100,vatRate:10},{description:"Posa TEST",quantity:1,unitPrice:80,vatRate:22},{description:"Smaltimento TEST",quantity:1,unitPrice:20,vatRate:0}]));
assert.deepEqual(F.totals(store.documents[0]),{netCents:30000,vatCents:3760,totalCents:33760,vatGroups:{"0":{netCents:2000,vatCents:0},"10":{netCents:20000,vatCents:2000},"22":{netCents:8000,vatCents:1760}}});
const exported=F.exportTest(store),restored=F.importTest(exported);
assert.deepEqual(restored,store);
assert.throws(()=>F.importTest(JSON.stringify({schema:"ALTRO",documents:[]})),/FORMATO_NON_VALIDO/);
assert.throws(()=>F.add(restored,doc("demo2","TEST-186-01",[{description:"Duplicato",quantity:1,unitPrice:1,vatRate:10}])),/NUMERO_DUPLICATO/);
const tampered=JSON.parse(exported);tampered.documents[0].totals.totalCents=1;
assert.throws(()=>F.importTest(JSON.stringify(tampered)),/ARCHIVIO_INCOERENTE/);
assert.equal(F.summary(store).issues.length,0);
console.log("4.0.186: test fiscali sintetici OK");
