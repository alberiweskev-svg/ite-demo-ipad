"use strict";
const assert=require("node:assert/strict");
const M=require("./ite-finance-reconciliation-194.js");
const fiscal={schema:"ITE_FISCAL_TEST_183",documents:[]};
const simple={entries:[]},installments={plans:[]};
const engines={
 simple:{inspect:()=>({issues:[],rows:[{documentId:"TEST-A",type:"VENDITA",dueDate:"2026-11-01",amountCents:10001,paidCents:4000}]})},
 installments:{inspect:()=>({issues:[],rows:[{documentId:"TEST-B",installmentId:"TEST-R1",type:"ACQUISTO",dueDate:"2026-11-30",amountCents:5000,paidCents:1000}]})}
};
let report=M.audit(fiscal,simple,installments,"2026-11-12",engines);
assert.equal(report.valid,true);
assert.equal(report.totals.openReceivablesCents,6001);
assert.equal(report.totals.openPayablesCents,4000);
assert.equal(report.totals.overdueReceivablesCents,6001);
assert.equal(report.totals.overduePayablesCents,0);
assert.match(M.csv(report),/TEST-R1/);
engines.installments.inspect=()=>({issues:[],rows:[{documentId:"TEST-A",installmentId:"TEST-R2",type:"VENDITA",dueDate:"2026-11-30",amountCents:10001,paidCents:0}]});
report=M.audit(fiscal,simple,installments,"2026-11-12",engines);
assert.equal(report.valid,false);
assert(report.issues.includes("DOPPIA_CONTABILIZZAZIONE:TEST-A"));
assert.throws(()=>M.csv(report),/REPORT_NON_VALIDO/);
assert.throws(()=>M.audit(fiscal,simple,installments,"2026-02-30",engines),/DATA_RIFERIMENTO/);
engines.installments.inspect=()=>({issues:["MOVIMENTO_ORFANO:TEST-X"],rows:[]});
report=M.audit(fiscal,simple,installments,"2026-11-12",engines);
assert.equal(report.valid,false);
assert(report.issues.includes("RATE:MOVIMENTO_ORFANO:TEST-X"));
console.log("ITE 4.0.194 reconciliation tests OK");
