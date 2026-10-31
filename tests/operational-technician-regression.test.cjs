const test=require('node:test');
const assert=require('node:assert/strict');
const integrity=require('../ite-operational-integrity.js');
const core=()=>({clienti:[{id:'C'}],immobili:[{id:'S',client_id:'C'}],impianti:[],apparecchiature:[],interventi:[{id:'J',client_id:'C',immobile_id:'S',technician_id:'T'}]});
test('technician must not be looked up in customer records',()=>{
 const result=integrity.inspect(core(),{});
 assert.equal(result.issues.some(x=>x.code==='OPERATORE_ASSENTE'),false);
});
test('a known operator registry validates the assigned technician',()=>{
 const state=core();state.operatori=[{id:'T'}];
 const result=integrity.inspect(state,{});
 assert.equal(result.issues.some(x=>x.code==='OPERATORE_ASSENTE'),false);
});
test('a mismatched populated operator registry is flagged',()=>{
 const state=core();state.operatori=[{id:'OTHER'}];
 const result=integrity.inspect(state,{});
 assert.equal(result.issues.some(x=>x.code==='OPERATORE_ASSENTE'),true);
});
