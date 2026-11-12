/* I.T.E. 4.0.185 — test regressione senza dati clienti. */
const assert=require("node:assert/strict");
const F=require("./ite-fiscal-test-183.js"),D=require("./ite-commercial-dossier-182.js"),B=require("./ite-quote-fiscal-bridge-185.js");
const field={clients:[{id:"C1",name:"Cliente Fittizio"}],interventions:[{id:"I1",clientId:"C1",siteId:"S1"}]};
const commerce={extras:[{id:"E1",interventionId:"I1",status:"ACCETTATO",kind:"FORNITURA",description:"Valvola prova",quantity:2,unitPrice:25},{id:"E2",interventionId:"I1",status:"ACCETTATO",kind:"POSA",description:"Posa prova",quantity:1,unitPrice:50}],quotes:[{id:"Q1",interventionId:"I1",status:"ACCETTATO",extraIds:["E1","E2"],totalCents:10000}]};
const original=JSON.stringify({field,commerce});
const prepared=B.prepare(field,commerce,"Q1",{date:"2026-11-12"});
assert.equal(prepared.document.type,"PROFORMA");assert.equal(prepared.document.lines.length,2);assert.equal(prepared.totals.netCents,10000);assert.equal(prepared.totals.vatCents,1000);
const store=F.createStore();B.insert(store,prepared);assert.equal(store.documents.length,1);
assert.throws(()=>B.insert(store,prepared),/GIA_COLLEGATO/);
assert.equal(JSON.stringify({field,commerce}),original);
assert.throws(()=>B.prepare(field,commerce,"MISSING"),/NON_ACCETTATO/);
assert.throws(()=>B.prepare(field,{...commerce,quotes:[{...commerce.quotes[0],status:"DA_ACCETTARE"}]},"Q1"),/NON_ACCETTATO/);
assert.throws(()=>B.prepare(field,{...commerce,quotes:[{...commerce.quotes[0],totalCents:1}]},"Q1"),/DOSSIER_INCOERENTE/);
assert.throws(()=>B.prepare(field,{...commerce,extras:[{...commerce.extras[0],quantity:1.5},commerce.extras[1]],quotes:[{...commerce.quotes[0],totalCents:8750}]},"Q1"),/QUANTITA_NON_INTERA/);
console.log("4.0.185: 8 controlli TEST superati");
