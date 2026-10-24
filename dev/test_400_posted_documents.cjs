'use strict';
// Synthetic data only: prevent silent changes to documents that have generated stock.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app.js','utf8');
const start=source.indexOf('function postedDocumentSignature(d)'),end=source.indexOf('\nfunction duplicate(',start);
assert(start>=0&&end>start,'Missing posted-document signature helper');
const ctx={JSON};
vm.createContext(ctx);
vm.runInContext(source.slice(start,end)+';this.signature=postedDocumentSignature',ctx);
const signature=ctx.signature;
const original={type:'Fattura acquisto',number:'A-1',date:'2026-10-24',
 party:{name:'Fornitore dimostrativo'},subjectId:'P1',clientId:'',siteId:'S1',fileId:'F1',
 lines:[{articleId:'M1',quantity:2},{articleId:'M2',quantity:1}],notes:['Originale']};
function check(changes,allowed){const updated={...original,...changes};
 assert.equal(signature(updated)===signature(original),allowed,JSON.stringify(changes))}
check({notes:['Annotazione aggiornata']},true);
check({due:'2026-11-24'},true);
check({siteId:'S2'},false);
check({subjectId:'P2'},false);
check({fileId:'F2'},false);
check({lines:[{articleId:'M3',quantity:2},{articleId:'M2',quantity:1}]},false);
check({lines:[{articleId:'M1',quantity:3},{articleId:'M2',quantity:1}]},false);
check({date:'2026-10-25'},false);
check({number:'A-2'},false);
const guard=source.indexOf('postedDocumentSignature(existing)!==postedDocumentSignature(d)');
assert(guard>source.indexOf('delete d.guide;'),'Guard must run after document normalization');
assert(source.slice(guard-100,guard+300).includes('next.movements.some(m=>m.documentId===existing.id)'),
 'Guard must apply only after stock posting');
console.log('OK: 9 posted-document scenarios and 2 guard checks');
