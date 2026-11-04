'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const C=require('./ite-commerce.js'),L=require('./ite-commerce-ledger.js');
const html=fs.readFileSync('index.html','utf8'),ui=fs.readFileSync('ite-commerce-ledger-ui.js','utf8');
const scripts=[...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(x=>x[1].split('?')[0].replace(/^\.\//,''));
for(const name of ['ite-commerce.js','ite-commerce-ledger.js','ite-commerce-ui.js','ite-commerce-ledger-ui.js']){
 assert.equal(scripts.filter(x=>x===name).length,1,'script missing or duplicate: '+name);
}
assert.ok(scripts.indexOf('ite-commerce.js')<scripts.indexOf('ite-commerce-ledger.js'));
assert.ok(scripts.indexOf('ite-commerce-ledger.js')<scripts.indexOf('ite-commerce-ledger-ui.js'));
assert.match(ui,/L\.record\(/);assert.match(ui,/L\.link\(/);assert.match(ui,/L\.summary\(/);assert.match(ui,/L\.save\(/);
assert.match(ui,/textContent/);assert.doesNotMatch(ui,/innerHTML\s*=/);
let c=C.empty();c=C.createQuote(c,null,{id:'Q1',clientId:'TEST-CLIENT'});
c=C.addLine(c,null,'Q1',{id:'L1',type:'POSA',category:'idrico',description:'Collaudo sintetico',quantityMilli:1000,unitCents:10000,vatRate:10,origin:'BASE'});
c=C.setQuoteStatus(c,null,'Q1','ACCETTATO');
c=C.addInvoice(c,null,{id:'F1',direction:'VENDITA',kind:'FATTURA',number:'FAKE-1',netCents:10000,vatCents:1000,totalCents:11000});
c=C.addInvoice(c,null,{id:'NC1',direction:'ACQUISTO',kind:'TD04',number:'FAKE-NC',netCents:1000,vatCents:220,totalCents:1220});
let l=L.link(L.empty(),c,'F1','Q1');
l=L.record(l,c,{id:'M1',invoiceId:'F1',amountCents:4000,date:'2026-11-04',method:'BONIFICO'}).ledger;
l=L.record(l,c,{id:'M2',invoiceId:'NC1',amountCents:1220,date:'2026-11-04',method:'POS'}).ledger;
assert.equal(L.summary(l,c)[0].remainingCents,7000);
assert.equal(L.summary(l,c)[1].status,'RECUPERATA');
assert.equal(L.summary(l,c)[0].quoteId,'Q1');
assert.throws(()=>L.record(l,c,{id:'M3',invoiceId:'NC1',amountCents:1,date:'2026-11-04',method:'POS'}),/IMPORTO_SUPERIORE/);
console.log('Ledger UI integration: synthetic checks passed');
