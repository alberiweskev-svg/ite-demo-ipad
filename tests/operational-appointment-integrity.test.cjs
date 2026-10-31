const test=require('node:test');
const assert=require('node:assert/strict');
const integrity=require('../ite-operational-integrity.js');
function fixture(){return {clienti:[{id:'C'}],immobili:[{id:'S',client_id:'C'}],impianti:[],apparecchiature:[],interventi:[{id:'J',client_id:'C',immobile_id:'S',appointmentId:'A'}],appuntamenti:[{id:'A'}]}}
test('existing appointment reference is accepted',()=>{
 const report=integrity.inspect(fixture());
 assert.equal(report.issues.some(x=>x.code==='APPUNTAMENTO_ASSENTE'),false);
});
test('missing appointment reference is reported without mutating data',()=>{
 const core=fixture();core.appuntamenti=[];const before=JSON.stringify(core);
 const report=integrity.inspect(core);
 assert.equal(report.issues.some(x=>x.code==='APPUNTAMENTO_ASSENTE'),true);
 assert.equal(JSON.stringify(core),before);
});
test('duplicate appointment identifiers are blocking',()=>{
 const core=fixture();core.appuntamenti.push({id:'A'});
 const report=integrity.inspect(core);
 assert.equal(report.issues.some(x=>x.code==='ID_DUPLICATO'&&x.entity==='appuntamento'),true);
});

test('appointment from a different client or site is blocked',()=>{
 const core=fixture();core.appuntamenti[0].client_id='OTHER';
 const report=integrity.inspect(core);
 assert.equal(report.issues.some(x=>x.code==='APPUNTAMENTO_ALTRA_SEDE'&&x.severity==='BLOCCANTE'),true);
});
test('appointment matching client and site is accepted',()=>{
 const core=fixture();core.appuntamenti[0].client_id='C';core.appuntamenti[0].immobile_id='S';
 const report=integrity.inspect(core);
 assert.equal(report.issues.some(x=>x.code==='APPUNTAMENTO_ALTRA_SEDE'),false);
});
