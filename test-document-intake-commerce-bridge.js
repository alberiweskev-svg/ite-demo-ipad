'use strict';
const assert=require('node:assert/strict');
const I=require('./ite-document-intake.js'),C=require('./ite-commerce.js'),B=require('./ite-document-intake-commerce-bridge.js');
let q=I.empty(),c=C.empty();
function doc(id,type,number){q=I.add(q,{id,filename:id+'.pdf',addedAt:'2026-11-04',documentDate:'2026-11-03',type,number});q=I.verify(q,id,'Tecnico fittizio')}
function inv(id,kind,direction,number){return {id,kind,direction,number,netCents:10000,vatCents:1000}}
doc('d1','FATTURA_VENDITA','TEST-001');
assert.equal(B.preview(q,'d1').ready,true);
assert.throws(()=>B.importInvoice(q,c,null,'d1',inv('f1','FATTURA','ACQUISTO','TEST-001')),/IMPORTAZIONE_RICHIEDE_VERIFICA/);
let r=B.importInvoice(q,c,null,'d1',inv('f1','FATTURA','VENDITA','TEST-001'));
assert.equal(r.commerce.invoices[0].totalCents,11000);
assert.equal(r.commerce.invoices[0].sourceDocumentId,'d1');
assert.equal(r.intake.items[0].status,'ARCHIVIATO');
assert.equal(q.items[0].status,'VERIFICATO');
assert.throws(()=>B.importInvoice(q,r.commerce,null,'d1',inv('f2','FATTURA','VENDITA','TEST-001')),/DOCUMENTO_CONTABILE_DUPLICATO/);
doc('d2','TD04','NC-01');doc('d3','PROFORMA','PR-01');
assert.equal(B.preview(q,'d2').directionRequiresReview,true);
assert.equal(B.preview(q,'d3').directionRequiresReview,true);
const before=JSON.stringify(q);
r=B.importBatch(q,c,null,[{documentId:'d1',invoice:inv('f1','FATTURA','VENDITA','TEST-001')},{documentId:'d2',invoice:inv('f2','TD04','ACQUISTO','NC-01')},{documentId:'d3',invoice:inv('f3','PROFORMA','VENDITA','PR-01')}]);
assert.equal(r.commerce.invoices.length,3);
assert.equal(r.commerce.invoices[1].status,'DA_RECUPERARE');
assert.equal(r.intake.items.filter(x=>x.status==='ARCHIVIATO').length,3);
assert.equal(JSON.stringify(q),before);
assert.throws(()=>B.importBatch(q,c,null,[{documentId:'d1',invoice:inv('f1','FATTURA','VENDITA','TEST-001')},{documentId:'d2',invoice:inv('f2','TD04','VENDITA','WRONG')}]),/IMPORTAZIONE_RICHIEDE_VERIFICA/);
assert.equal(c.invoices.length,0);
assert.throws(()=>B.importBatch(q,c,null,[{documentId:'d1',invoice:inv('f1','FATTURA','VENDITA','TEST-001')},{documentId:'d1',invoice:inv('f2','FATTURA','VENDITA','TEST-001')}]),/LOTTO_DUPLICATO/);
console.log('OK: verified intake, TD04, proforma, deduplication, atomic batch, immutability');
