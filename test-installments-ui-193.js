/* I.T.E. 4.0.193 — regressione sintetica senza dati clienti. */
const assert=require("node:assert/strict"),fs=require("node:fs");
globalThis.ITE_FiscalTest183=require("./ite-fiscal-test-183.js");
const F=globalThis.ITE_FiscalTest183,A=require("./ite-installments-192.js");
const f=F.createStore();
for(const [id,type] of [["sale","VENDITA"],["buy","ACQUISTO"]]){
 F.add(f,{id,type,number:"FAKE-"+id,date:"2026-11-12",counterparty:"Soggetto fittizio",lines:[{description:"Fornitura TEST",quantity:1,unitPrice:90,vatRate:10},{description:"Posa TEST",quantity:1,unitPrice:10,vatRate:10}]});
 F.transition(f,id,"REGISTRATO");
}
let s=A.create();
s=A.split(f,s,"sale",["2026-12-01","2027-01-01","2027-02-01"],"planSale");
s=A.split(f,s,"buy",["2026-12-05","2027-01-05"],"planBuy");
let r=A.inspect(f,s);assert.equal(r.valid,true);assert.equal(r.rows.length,5);
assert.equal(r.totals.openReceivableCents,11000);assert.equal(r.totals.openPayableCents,11000);
s=A.addMovement(f,s,{id:"m1",installmentId:"planSale_1",date:"2026-12-01",amountCents:1000,method:"BONIFICO"});
r=A.inspect(f,s);assert.equal(r.totals.openReceivableCents,10000);
assert.throws(()=>A.addMovement(f,s,{id:"m2",installmentId:"planSale_1",date:"2026-12-01",amountCents:3000,method:"POS"}),/SOVRAPAGAMENTO/);
assert.deepEqual(A.importTest(f,A.exportTest(f,s)),s);
assert.ok(A.csv(r).includes("FAKE-sale"));
const html=fs.readFileSync("index.html","utf8");
assert.match(html,/ite-installments-192\.js[^"]*" defer/);
assert.match(html,/ite-installments-workspace-ui-193\.js[^"]*" defer/);
assert.ok(html.indexOf("ite-installments-192.js")<html.indexOf("ite-installments-workspace-ui-193.js"));
const ui=fs.readFileSync("ite-installments-workspace-ui-193.js","utf8");
assert.match(ui,/ite-fiscal-workspace-184/);assert.match(ui,/ITE_FiscalWorkspaceBridge185/);
console.log("ITE 4.0.193 installment workspace: OK");
