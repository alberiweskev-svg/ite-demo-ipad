'use strict';
const assert=require('node:assert/strict');
const I=require('./ite-document-intake.js'),C=require('./ite-commerce.js'),T=require('./ite-document-intake-transaction.js');
function storage(){
 const map=new Map();let failKey=null;
 return {getItem:k=>map.has(k)?map.get(k):null,setItem(k,v){if(k===failKey){failKey=null;throw Error('SIMULATED_QUOTA')}map.set(k,String(v))},removeItem:k=>map.delete(k),fail:k=>{failKey=k}};
}
const s=storage();let q=I.empty();
for(const [id,type,number] of [['a','FATTURA_VENDITA','TEST-001'],['b','TD04','NC-001'],['c','PROFORMA','PR-001']]){
 q=I.add(q,{id,filename:id+'.pdf',addedAt:'2026-11-04',documentDate:'2026-11-03',type,number});
 q=I.verify(q,id,'Operatore fittizio');
}
s.setItem(T.KEY_INTAKE,I.exportJSON(q));
const request=(id,kind,direction,number)=>({documentId:id,invoice:{id:'f-'+id,kind,direction,number,netCents:10000,vatCents:2200}});
const requests=[request('a','FATTURA','VENDITA','TEST-001'),request('b','TD04','ACQUISTO','NC-001'),request('c','PROFORMA','VENDITA','PR-001')];
const before=s.getItem(T.KEY_INTAKE);
assert.equal(T.review(s,null,requests).documents,3);
assert.equal(s.getItem(T.KEY_INTAKE),before,'preview must not write');
assert.throws(()=>T.commit(s,null,[requests[0],{...requests[1],invoice:{...requests[1].invoice,number:'ERRATO'}}]),/IMPORTAZIONE_RICHIEDE_VERIFICA/);
assert.equal(s.getItem(T.KEY_INTAKE),before,'invalid batch must not write');
s.fail(T.KEY_COMMERCE);
assert.throws(()=>T.commit(s,null,requests),/SIMULATED_QUOTA/);
assert.equal(s.getItem(T.KEY_INTAKE),before,'failed write must rollback');
assert.equal(s.getItem(T.KEY_COMMERCE),null);
assert.equal(s.getItem(T.JOURNAL),null);
assert.deepEqual(T.commit(s,null,requests),{documents:3,imported:3});
assert.equal(T.read(s,null).commerce.invoices.length,3);
assert.equal(T.read(s,null).intake.items.filter(x=>x.status==='ARCHIVIATO').length,3);
assert.throws(()=>T.commit(s,null,requests),/VERIFICA|DOCUMENTO_CONTABILE_DUPLICATO/);
const recovery=storage();recovery.setItem(T.KEY_INTAKE,before);
recovery.setItem(T.JOURNAL,JSON.stringify({version:1,before:{[T.KEY_INTAKE]:before,[T.KEY_COMMERCE]:null}}));
recovery.setItem(T.KEY_INTAKE,'BROKEN');
assert.equal(T.recover(recovery),true);
assert.equal(recovery.getItem(T.KEY_INTAKE),before);
assert.equal(recovery.getItem(T.KEY_COMMERCE),null);
assert.equal(T.recover(recovery),false);
console.log('OK: preview, batch validation, atomic rollback, commit, duplicate protection, recovery');
