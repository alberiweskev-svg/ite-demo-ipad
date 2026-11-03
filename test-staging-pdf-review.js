'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const review=require('./ite-staging-pdf-review.js');
test('technical DiCo identification and conservative date',()=>{
 const r=review.inspect('dico.pdf','Dichiarazione di conformità impianto elettrico. Numero 123/26 Data 03/11/2026');
 assert.equal(r.type,'DICO_ELETTRICO');
 assert.equal(r.date,'2026-11-03');
 assert.equal(r.requiresReview,true);
});
test('ambiguous invoices never auto-classify purchase or sale',()=>{
 const r=review.inspect('fattura.pdf','Fattura numero 123 del 03/11/2026 totale 100,00');
 assert.equal(r.type,null);
});
test('invalid and impossible dates are rejected',()=>{
 assert.equal(review.normalizeDate('31/02/2026'),null);
 assert.equal(review.normalizeDate('not a date'),null);
 assert.equal(review.normalizeDate('03/11/2026'),'2026-11-03');
});
test('TD04 and proforma classify only as proposals',()=>{
 assert.equal(review.inspect('TD04.pdf','Nota di credito TD04').type,'TD04');
 assert.equal(review.inspect('proforma.pdf','Documento proforma').type,'PROFORMA');
});
