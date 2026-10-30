'use strict';
const assert=require('node:assert/strict');
globalThis.ITEFinancialDesk=require('../ite-financial-desk.js');
globalThis.ITEContractBilling=require('../ite-contract-billing.js');
globalThis.ITESiteCosting=require('../ite-site-costing.js');
globalThis.ITEJobEconomics=require('../ite-job-economics.js');
const api=require('../ite-site-reconciliation.js');
const site={id:9,client_id:1,name:'=Cantiere fittizio',ite_quotes:JSON.stringify([{
 id:'q1',number:'=PREV',status:'Accettato',lines:[
 {line_type:'Fornitura',description:'=TUBO',qty:5,unit:'m',price:10,discount:0,vat:10,category:'Idrico'},
 {line_type:'Posa',description:'Posa',qty:1,unit:'h',price:50,discount:0,vat:10,category:'Idrico'}]}]),ite_extras:'[]'};
const core={clienti:[{id:1,name:'Cliente fittizio'},{id:2,name:'Altro cliente'},{id:3,name:'Tecnico sintetico',kind:'Dipendente'}],
 cantieri:[site,{id:10,client_id:2}],interventi:[{id:11,cantiere_id:9,client_id:1,time_tracking:'manual',
 work_logs:JSON.stringify([{operator_id:'3',duration_minutes:60}])}]};
const state=()=>({documents:[{id:'f1',type:'Fattura vendita',status:'Registrato',clientId:'1',subjectId:'1',siteId:'9',number:'=FATT',
 net:100,tax:10,total:110,date:'2026-10-30',due:'2026-11-30'}],
 settings:{contractBillingLinks:[{id:'bill_abcdef',siteId:'9',sourceType:'quote',sourceId:'q1',documentId:'f1',amountCents:4000,sourceNetCents:10000,createdAt:'2026-10-30T04:00:00Z'}],
 financialSettlements:[{id:'pay_1234',kind:'movimento',documentId:'f1',amountCents:5500,date:'2026-10-30',reference:'Pagamento sintetico'}],
 jobMaterialUsage:[{id:'u1',quantity:2,unit:'m',articleId:'a',unitCostCents:300,clientId:'1',siteId:'9',jobId:'11',articleLabel:'Tubo',reversedAt:''}],
 jobMaterialAllocations:[],jobSiteExpenses:[],jobLaborRates:{}},audit:[]});
const s=state(),r=api.analyze(site,core,s);
assert.equal(r.approved,10000);
assert.equal(r.attributed,4000);
assert.equal(r.approvedUnattributed,6000);
assert.equal(r.invoiced,10000);
assert.equal(r.invoiceUnattributed,6000);
assert.equal(r.collectedGross,5500);
assert.equal(r.outstandingGross,5500);
assert.equal(r.knownCost,5000);
assert.equal(r.indicativeDifference,5000);
assert.equal(r.unassignedMaterials,1);
assert.ok(r.alerts.some(x=>x.message.includes('consumi materiali')));
assert.match(api.render(site,core,s),/Quadro integrato commessa/);
assert.doesNotMatch(api.render(site,core,s),/<script/);
assert.match(api.csv(site,core,s),/"'=Cantiere fittizio"/);
assert.match(api.csv(site,core,s),/"'=PREV"/);
assert.match(api.csv(site,core,s),/"'=FATT"/);
s.settings.jobMaterialUsage[0].unitCostCents=null;
const incomplete=api.analyze(site,core,s);
assert.equal(incomplete.reliable,false);
assert.ok(incomplete.alerts.some(x=>x.message.includes('senza costo')));
s.settings.jobMaterialUsage[0].unitCostCents=300;
s.documents[0].clientId='2';
assert.equal(api.analyze(site,core,s).invoices.length,0);
assert.equal(api.analyze(site,core,s).collectedGross,0);
assert.equal(api.analyze(site,core,s).outstandingGross,0);
assert.ok(api.analyze(site,core,s).alerts.some(x=>x.message.includes('cliente da verificare')));
const wrong=structuredClone(core);wrong.cantieri[0].client_id=2;
assert.throws(()=>api.analyze(site,wrong,state()),/cliente/);
assert.throws(()=>api.analyze({id:99,client_id:1},core,state()),/Cantiere/);
console.log('OK: approvati, fatture, incassi, costi, alert, cliente, CSV, HTML sintetici');
