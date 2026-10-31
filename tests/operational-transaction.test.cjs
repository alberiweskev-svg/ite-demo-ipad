'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {snapshot,prepare}=require('../ite-operational-changeset.js');
const {apply}=require('../ite-operational-transaction.js');
const core=()=>({clienti:[{id:'c'}],immobili:[{id:'s',client_id:'c'}],impianti:[{id:'p',immobile_id:'s'}],apparecchiature:[{id:'d',impianto_id:'p'}],dipendenti:[{id:'t'}],appuntamenti:[],interventi:[]});
const commerce=()=>({quotes:[],extras:[],documents:[]});
const steps=[{type:'appointment',input:{id:'a',clientId:'c',siteId:'s',plantId:'p',deviceId:'d',operatorId:'t',start:'2026-11-01T09:00:00+01:00',end:'2026-11-01T10:00:00+01:00'}},{type:'arrival',input:{id:'j',appointmentId:'a',arrivedAt:'2026-11-01T09:10:00+01:00'}},{type:'closure',input:{interventionId:'j',departedAt:'2026-11-01T10:10:00+01:00'}},{type:'quote',input:{id:'q',clientId:'c',siteId:'s',interventionId:'j',lines:[{kind:'FORNITURA',description:'Materiale TEST',quantity:1,unitPrice:10},{kind:'POSA',description:'Posa TEST',quantity:1,unitPrice:20}]}}];
const fixture=()=>{const c=core(),m=commerce();return {base:{core:c,commerce:m},cs:prepare(c,m,steps,snapshot(c,m))}};
const approval={confirmed:true,operatorId:'t',reason:'Test interno',reviewApproved:true};
test('atomic in-memory application reconciles all collections and emits audit events',()=>{
 const {base,cs}=fixture(),original=JSON.stringify(base),result=apply(base,cs,approval);
 assert.equal(result.events.length,3);assert.equal(result.next.core.interventi[0].workflow_status,'CHIUSO');
 assert.equal(result.next.commerce.quotes[0].subtotal,30);assert.equal(result.persisted,false);
 assert.equal(JSON.stringify(base),original);
});
test('confirmation and review are mandatory',()=>{
 const {base,cs}=fixture();
 assert.throws(()=>apply(base,cs,{...approval,confirmed:false}),/Conferma/);
 assert.throws(()=>apply(base,cs,{...approval,reviewApproved:false}),/Revisione/);
});
test('stale source is rejected without mutation',()=>{
 const {base,cs}=fixture();base.core.clienti.push({id:'another'});
 const before=JSON.stringify(base);assert.throws(()=>apply(base,cs,approval),/Conflitto/);
 assert.equal(JSON.stringify(base),before);
});
test('tampered change and duplicate modifications rejected',()=>{
 const {base,cs}=fixture();
 const tampered=JSON.parse(JSON.stringify(cs));tampered.changes.push({...tampered.changes[0]});
 assert.throws(()=>apply(base,tampered,approval),/duplicata/);
 const wrong=JSON.parse(JSON.stringify(cs));wrong.changes[0].after.description='altered';
 assert.throws(()=>apply(base,wrong,approval),/Riconciliazione/);
});
