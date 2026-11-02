const assert=require('node:assert/strict');
const A=require('./ite-technical-audit.js');
const masters={
 clients:[{id:'c1'},{id:'c2'}],
 sites:[{id:'s1',clientId:'c1'},{id:'s2',clientId:'c2'}],
 plants:[{id:'p1',siteId:'s1'},{id:'p2',siteId:'s2'}],
 devices:[{id:'a1',plantId:'p1'},{id:'a2',plantId:'p2'}]
};
const doc=(id,kind,number,clientId='c1',siteId='s1',plantId='p1',deviceId='a1')=>({id,kind,number,clientId,siteId,plantId,deviceId,issued:'2026-11-02',status:'DA_VERIFICARE'});
const docs=[doc('d1','DICO','1'),doc('d2','GAS','2','c2','s2','p2','a2')];
assert.equal(A.reconcileWithMasters(docs,masters)[0].linkStatus,'COLLEGATO');
assert.equal(A.hierarchyReport(docs,masters).linked,2);
const verified=A.verifyBatchWithMasters(docs,['d1','d2'],'Operatore Demo',true,masters);
assert.equal(verified.filter(d=>d.status==='VERIFICATO').length,2);
assert.equal(docs[0].status,'DA_VERIFICARE','immutable source');
assert.equal(A.hierarchyReport(verified,masters).ready,2);
assert.throws(()=>A.verifyBatchWithMasters(docs,['d1'],'',true,masters),/OPERATORE/);
assert.throws(()=>A.verifyBatchWithMasters(docs,['d1'],'Demo',false,masters),/CONFERMA/);
assert.throws(()=>A.verifyBatchWithMasters(docs,['d1','d1'],'Demo',true,masters),/LOTTO/);
assert.throws(()=>A.verifyBatchWithMasters(docs,['missing'],'Demo',true,masters),/NON_TROVATO/);
assert.throws(()=>A.verifyBatchWithMasters(verified,['d1'],'Demo',true,masters),/GIA_VERIFICATO/);
const mismatched=[docs[0],{...docs[1],siteId:'s1'}];
assert.equal(A.reconcileWithMasters(mismatched,masters)[1].linkStatus,'DA_COLLEGARE');
assert.throws(()=>A.verifyBatchWithMasters(mismatched,['d1','d2'],'Demo',true,masters),/COLLEGAMENTI/);
assert.equal(mismatched[0].status,'DA_VERIFICARE','atomic failure');
assert.throws(()=>A.validateMasters({...masters,clients:[{id:'c1'},{id:'c1'}]}),/DUPLICATO/);
assert.throws(()=>A.validateMasters({...masters,sites:[{id:'s1',clientId:'missing'}]}),/SEDE_CLIENTE/);
assert.throws(()=>A.validateMasters({...masters,plants:[{id:'p1',siteId:'missing'}]}),/IMPIANTO_SEDE/);
assert.throws(()=>A.validateMasters({...masters,devices:[{id:'a1',plantId:'missing'}]}),/APPARECCHIATURA_IMPIANTO/);
assert.throws(()=>A.validateMasters({}),/ANAGRAFICA/);
console.log('Technical hierarchy reconciliation and atomic verification: PASS');
