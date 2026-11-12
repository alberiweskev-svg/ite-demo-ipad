/* Test Node.js 22 — nessun dato cliente. */
const assert=require("node:assert/strict");
const F=require("./ite-fiscal-test-183.js"),A=require("./ite-fiscal-audit-187.js");
const store=F.createStore();
F.add(store,{id:"demo1",type:"PROFORMA",number:"TEST-001",date:"2026-11-12",counterparty:"Cliente Inventato",sourceQuoteId:"Q1",lines:[{description:"FORNITURA",quantity:2,unitPrice:100,vatRate:10},{description:"POSA",quantity:1,unitPrice:80,vatRate:22}]});
F.add(store,{id:"demo2",type:"TD04",number:"NC-001",date:"2026-11-12",counterparty:"Cliente Inventato",reference:{number:"TEST-001",date:"2026-11-11"},lines:[{description:"Rettifica",quantity:1,unitPrice:20,vatRate:10}]});
const before=JSON.stringify(store),r=A.audit(store);
assert.equal(r.valid,true);assert.equal(r.count,2);assert.equal(r.byType.PROFORMA.netCents,28000);assert.equal(r.byVat["22"].vatCents,1760);
assert.equal(JSON.stringify(store),before);
assert.match(A.exportCSV(store),/Cliente Inventato/);
const copy=F.createStore(store.documents);copy.documents[0].sourceQuoteId="=HYPERLINK(1)";
assert.match(A.exportCSV(copy),/'=HYPERLINK/);
copy.documents[1].sourceQuoteId="=HYPERLINK(1)";assert.equal(A.audit(copy).valid,false);
assert.throws(()=>A.exportCSV(copy),/ARCHIVIO_INCOERENTE/);
const altered=F.createStore(store.documents);altered.documents[0].totals.totalCents++;
assert.equal(A.audit(altered).valid,false);
const invalid=F.createStore(store.documents);invalid.documents[1].reference.date="2026-11-13";
assert.equal(A.audit(invalid).issues.some(x=>x.code==="TD04_DATA_PRECEDENTE"),true);
console.log("4.0.187 fiscal audit: OK");
