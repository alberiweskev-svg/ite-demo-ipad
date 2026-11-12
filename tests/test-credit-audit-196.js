const assert=require("node:assert/strict");const A=require("../ite-credit-audit-196.js");
function doc(id,type,amount,more={}){return {id,type,status:"REGISTRATO",number:id,date:"2026-11-01",counterparty:"Cliente Fittizio",totals:{totalCents:amount},...more}}
const sale=doc("sale","VENDITA",10000),credit=doc("credit","TD04",3000,{reference:{number:"sale",date:"2026-11-01"},originSaleId:"sale"});
let r=A.audit({schema:"ITE_FISCAL_TEST_183",documents:[sale,credit]});assert.equal(r.valid,true);assert.equal(r.netCents,7000);assert.equal(r.creditCents,3000);
r=A.audit({schema:"ITE_FISCAL_TEST_183",documents:[sale,credit,doc("credit2","TD04",8000,{reference:credit.reference})]});assert.equal(r.valid,false);assert(r.issues.some(x=>x.startsWith("TD04_SUPERA_VENDITA")));
r=A.audit({schema:"ITE_FISCAL_TEST_183",documents:[sale,{...credit,counterparty:"Altra azienda"}]});assert(r.issues.some(x=>x.startsWith("CONTROPARTE_DIVERSA")));
r=A.audit({schema:"ITE_FISCAL_TEST_183",documents:[sale,{...credit,date:"2026-10-31"}]});assert(r.issues.some(x=>x.startsWith("DATA_TD04_PRECEDENTE")));
r=A.audit({schema:"ITE_FISCAL_TEST_183",documents:[sale,{...credit,status:"ANNULLATO"}]});assert.equal(r.creditCents,0);
assert.throws(()=>A.audit({}),/ARCHIVIO_INVALIDO/);
console.log("TD04 196: 6 scenari superati");
