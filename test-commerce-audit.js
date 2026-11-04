/* Test sintetici: nessun dato cliente. Eseguire: node test-commerce-audit.js */
'use strict';
const assert=require('node:assert/strict');
const C=require('./ite-commerce.js'),L=require('./ite-commerce-ledger.js'),A=require('./ite-commerce-audit.js');
const commerce={version:1,quotes:[],invoices:[
{id:'f1',kind:'FATTURA',direction:'VENDITA',number:'TEST-001',netCents:10000,vatCents:1000,totalCents:11000,status:'DA_PAGARE'},
{id:'f2',kind:'FATTURA',direction:'ACQUISTO',number:'TEST-002',netCents:5000,vatCents:500,totalCents:5500,status:'DA_PAGARE'},
{id:'n1',kind:'TD04',direction:'ACQUISTO',number:'TEST-NC',netCents:2000,vatCents:200,totalCents:2200,status:'DA_RECUPERARE'}]};
const ledger={version:1,links:[],entries:[
{id:'p1',invoiceId:'f1',amountCents:6000,date:'2026-10-10',method:'BONIFICO',note:''},
{id:'p2',invoiceId:'f1',amountCents:5000,date:'2026-11-01',method:'BONIFICO',note:''},
{id:'p3',invoiceId:'n1',amountCents:1000,date:'2026-10-12',method:'ALTRO',note:''}]};
assert.deepEqual(C.validate(commerce).invoices.length,3);
assert.deepEqual(L.validate(ledger,commerce).entries.length,3);
const october=A.audit(ledger,commerce,{asOf:'2026-10-31'});
assert.equal(october.totals.receivablesCents,5000);
assert.equal(october.totals.payablesCents,5500);
assert.equal(october.totals.creditsToRecoverCents,1200);
assert.equal(october.cashByMonth[0].netCents,5000);
assert.equal(october.documents.find(x=>x.invoiceId==='f1').expectedStatus,'PARZIALE');
assert.equal(october.documents.find(x=>x.invoiceId==='n1').expectedStatus,'PARZIALMENTE_RECUPERATA');
assert.equal(A.proposeStatuses(ledger,commerce,{asOf:'2026-10-31'}).applied,false);
const november=A.audit(ledger,commerce,{asOf:'2026-11-30'});
assert.equal(november.totals.receivablesCents,0);
assert.equal(november.documents.find(x=>x.invoiceId==='f1').expectedStatus,'PAGATA');
assert.equal(november.cashByMonth.length,2);
assert.equal(commerce.invoices[0].status,'DA_PAGARE'); // nessuna mutazione
assert.throws(()=>A.audit(ledger,commerce,{asOf:'2026-02-30'}),/DATA_NON_VALIDA/);
console.log('OK audit contabile, saldi, scadenze, TD04, periodi e immutabilita');
