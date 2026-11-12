"use strict";
const assert=require("node:assert/strict");
globalThis.ITE_FiscalTest183=require("./ite-fiscal-test-183.js");
const F=globalThis.ITE_FiscalTest183,S=require("./ite-settlement-test-190.js");
const fiscal=F.createStore();
for(const [id,type] of [["sale","VENDITA"],["buy","ACQUISTO"]]){
 F.add(fiscal,{id,type,number:id,date:"2026-11-12",counterparty:"Cliente TEST",status:"REGISTRATO",lines:[{description:"Servizio dimostrativo",quantity:1,unitPrice:100,vatRate:10}]});
}
const blank=S.create();assert.equal(S.inspect(fiscal,blank).valid,true);
const e={id:"due1",documentId:"sale",dueDate:"2026-12-12",amountCents:11000};
const withDue=S.addEntry(fiscal,blank,e);assert.equal(blank.entries.length,0);
assert.throws(()=>S.addEntry(fiscal,withDue,e),/SCADENZA_DOCUMENTO_DUPLICATO/);
const paid=S.addPayment(fiscal,withDue,{id:"p1",entryId:"due1",date:"2026-11-12",method:"BONIFICO",amountCents:4000});
assert.equal(S.inspect(fiscal,paid).totals.openReceivablesCents,7000);
assert.throws(()=>S.addPayment(fiscal,paid,{id:"p2",entryId:"due1",date:"2026-11-13",method:"POS",amountCents:8000}),/SOVRAPAGAMENTO/);
const both=S.addEntry(fiscal,paid,{id:"due2",documentId:"buy",dueDate:"2026-12-20",amountCents:11000});
assert.equal(S.inspect(fiscal,both).totals.openPayablesCents,11000);
assert.deepEqual(S.importTest(fiscal,S.exportTest(fiscal,both)),both);
assert.throws(()=>S.importTest(fiscal,JSON.stringify({...both,payments:[...both.payments,{id:"orphan",entryId:"missing",date:"2026-11-12",method:"POS",amountCents:100}]})),/MOVIMENTO_ORFANO/);
assert.match(S.csv(S.inspect(fiscal,both)),/Residuo cent/);
const tampered=structuredClone(fiscal);tampered.documents[0].totals.totalCents=999;
assert.equal(S.inspect(tampered,both).valid,false);
console.log("ITE 4.0.190: test scadenziario TEST superati");
