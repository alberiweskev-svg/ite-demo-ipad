'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {snapshot,prepare}=require('../ite-operational-changeset.js');
const core=()=>({clienti:[{id:'c'}],immobili:[{id:'s',client_id:'c'}],impianti:[{id:'p',immobile_id:'s'}],apparecchiature:[{id:'d',impianto_id:'p'}],dipendenti:[{id:'t'}],appuntamenti:[],interventi:[]});
const commerce=()=>({quotes:[],extras:[],documents:[]});
const appointment={type:'appointment',input:{id:'a',clientId:'c',siteId:'s',plantId:'p',deviceId:'d',operatorId:'t',start:'2026-11-01T09:00:00+01:00',end:'2026-11-01T10:00:00+01:00'}};
const arrival={type:'arrival',input:{id:'j',appointmentId:'a',arrivedAt:'2026-11-01T09:10:00+01:00'}};
const closure={type:'closure',input:{interventionId:'j',departedAt:'2026-11-01T10:10:00+01:00'}};
const quote={type:'quote',input:{id:'q',clientId:'c',siteId:'s',interventionId:'j',lines:[{kind:'FORNITURA',description:'Materiale sintetico',quantity:2,unitPrice:10},{kind:'POSA',description:'Lavoro sintetico',quantity:1,unitPrice:20}]}};
test('full workflow produces reconciled CREATE changes and a closed intervention',()=>{
 const c=core(),m=commerce(),original=JSON.stringify([c,m]);
 const p=prepare(c,m,[appointment,arrival,closure,quote],snapshot(c,m));
 assert.equal(p.changes.length,3);assert.equal(p.audit.length,4);
 assert.equal(p.changes.find(x=>x.collection==='interventi').after.workflow_status,'CHIUSO');
 assert.equal(p.changes.find(x=>x.collection==='quotes').after.subtotal,40);
 assert.equal(p.persisted,false);assert.equal(p.fiscalIssued,false);
 assert.equal(JSON.stringify([c,m]),original);
});
test('stale snapshot prevents staging',()=>{
 const c=core(),m=commerce(),base=snapshot(c,m);c.clienti.push({id:'other'});
 assert.throws(()=>prepare(c,m,[appointment],base),/modificati/);
});
test('invalid late operation never changes source',()=>{
 const c=core(),m=commerce(),original=JSON.stringify([c,m]);
 assert.throws(()=>prepare(c,m,[appointment,{...arrival,input:{...arrival.input,appointmentId:'wrong'}}],snapshot(c,m)),/Operazione 2/);
 assert.equal(JSON.stringify([c,m]),original);
});
test('an existing intervention is represented as UPDATE, not duplicated',()=>{
 const c=core(),m=commerce();
 c.appuntamenti.push({id:'a',client_id:'c',immobile_id:'s',impianto_id:'p',apparecchiatura_id:'d',operatorId:'t',start:'2026-11-01T08:00:00Z'});
 c.interventi.push({id:'j',appointmentId:'a',client_id:'c',immobile_id:'s',impianto_id:'p',apparecchiatura_id:'d',operatorId:'t',arrivedAt:'2026-11-01T08:10:00Z',workflow_status:'APERTO'});
 const p=prepare(c,m,[closure],snapshot(c,m));
 assert.equal(p.changes.length,1);assert.equal(p.changes[0].operation,'UPDATE');
 assert.equal(p.changes[0].before.workflow_status,'APERTO');
 assert.equal(c.interventi[0].workflow_status,'APERTO');
});
