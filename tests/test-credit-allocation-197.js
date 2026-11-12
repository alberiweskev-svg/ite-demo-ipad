const assert=require("node:assert/strict");
const A=require("../ite-credit-allocation-197.js");
const sale={id:"s",type:"VENDITA",totals:{totalCents:10000}};
const fiscal={schema:"ITE_FISCAL_TEST_183",documents:[sale]};
const finance={schema:"ITE_FINANCE_RECONCILIATION_TEST_194",valid:true,issues:[],rows:[{documentId:"s",installmentId:"r1",type:"VENDITA",dueDate:"2026-11-15",amountCents:5000,paidCents:1000},{documentId:"s",installmentId:"r2",type:"VENDITA",dueDate:"2026-12-15",amountCents:5000,paidCents:0}]};
const credit={schema:"ITE_TD04_AUDIT_TEST_196",valid:true,issues:[],rows:[{saleId:"s",creditId:"c",status:"REGISTRATO",amountCents:3000}]};
let r=A.audit(fiscal,finance,credit);assert.equal(r.valid,true);assert.equal(r.totals.adjustedOpenReceivablesCents,6000);assert.equal(r.rows.find(x=>x.installmentId==="r2").creditAllocatedCents,3000);assert.equal(A.csv(r).includes("TD04 allocata"),true);
assert.equal(finance.rows[1].amountCents,5000); // immutable
r=A.audit(fiscal,finance,{...credit,rows:[{...credit.rows[0],amountCents:6000}]});assert.equal(r.valid,true);assert.equal(r.totals.adjustedOpenReceivablesCents,3000);
r=A.audit(fiscal,finance,{...credit,rows:[{...credit.rows[0],amountCents:10000}]});assert.equal(r.valid,false);assert(r.issues.includes("INCASSI_SUPERIORI_AL_NETTO_TD04"));assert.throws(()=>A.csv(r));
r=A.audit(fiscal,{...finance,rows:[]},credit);assert.equal(r.valid,false);assert(r.issues.includes("SCADENZA_MANCANTE:s"));
r=A.audit(fiscal,finance,{...credit,rows:[{...credit.rows[0],status:"BOZZA"}]});assert.equal(r.totals.creditedCents,0);
console.log("TD04 allocation 197: 7 checks passed");
