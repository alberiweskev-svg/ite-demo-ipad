/* Regression tests — fake records only. Run: node test-installments-192.js */
const assert=require("node:assert/strict");
globalThis.ITE_FiscalTest183=require("./ite-fiscal-test-183.js");
const F=globalThis.ITE_FiscalTest183,A=require("./ite-installments-192.js");
const f=F.createStore();F.add(f,{id:"f1",type:"VENDITA",number:"TEST-1",date:"2026-11-12",counterparty:"Cliente fittizio",lines:[{description:"Posa TEST",quantity:1,unitPrice:100,vatRate:10}]});F.transition(f,"f1","REGISTRATO");
let s=A.create();s=A.split(f,s,"f1",["2026-12-01","2027-01-01","2027-02-01"],"p1");
assert.equal(A.inspect(f,s).rows.length,3);
assert.equal(A.inspect(f,s).totals.openReceivableCents,11000);
assert.deepEqual(s.plans[0].installments.map(x=>x.amountCents),[3667,3667,3666]);
s=A.addMovement(f,s,{id:"m1",installmentId:"p1_1",date:"2026-12-01",amountCents:3000,method:"BONIFICO"});
assert.equal(A.inspect(f,s).totals.openReceivableCents,8000);
assert.throws(()=>A.addMovement(f,s,{id:"m2",installmentId:"p1_1",date:"2026-12-01",amountCents:1000,method:"POS"}),/SOVRAPAGAMENTO/);
assert.throws(()=>A.split(f,s,"f1",["2026-12-01"],"p2"),/DOCUMENTO_DUPLICATO/);
assert.deepEqual(A.importTest(f,A.exportTest(f,s)),s);
assert.ok(A.csv(A.inspect(f,s)).includes("TEST-1"));
const bad=JSON.parse(A.exportTest(f,s));bad.plans[0].installments[0].amountCents++;
assert.throws(()=>A.importTest(f,JSON.stringify(bad)),/TOTALE_RATE/);
console.log("ITE 4.0.192 installments: OK");
