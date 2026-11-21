'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const core=require('../ite-integrated-core-225.js'),ops=require('../gestionale4/operations-228.js');
const store=core.createStore(),add=(type,x)=>core.add(store,type,x);
add('clients',{id:'c',name:'Cliente sintetico'});add('clients',{id:'c2',name:'Altro sintetico'});
add('sites',{id:'s',clientId:'c',address:'Via Esempio 1'});
add('sites',{id:'s2',clientId:'c2',address:'Via Esempio 2'});
add('plants',{id:'p',siteId:'s',type:'Termico'});
add('equipment',{id:'e',plantId:'p',type:'Caldaia'});
add('appointments',{id:'a',siteId:'s',operator:'Tecnico demo',start:'2026-11-23T09:00:00',end:'2026-11-23T10:00:00'});
add('appointments',{id:'b',siteId:'s',operator:'Tecnico demo',start:'2026-11-23T09:30:00',end:'2026-11-23T10:30:00'});
add('interventions',{id:'i',siteId:'s',equipmentId:'e',operator:'Tecnico demo',status:'APERTO'});
add('quotes',{id:'q',clientId:'c',status:'BOZZA',lines:[{id:'l',kind:'FORNITURA',description:'Fornitura demo',cents:10000,qty:1},{id:'m',kind:'POSA',description:'Posa demo',cents:5000,qty:1}]});
add('invoices',{id:'f',clientId:'c',kind:'VENDITA',number:'DEMO-1',cents:15000,quoteId:'q'});
add('documents',{id:'d',clientId:'c',siteId:'s',kind:'DICO',filename:'synthetic.pdf',mime:'application/pdf',bytes:0});
assert(ops.issues(store.snapshot()).some(x=>x.code==='CONFLITTO_OPERATORE'));
const invalidEquipment=store.snapshot();invalidEquipment.interventions[0].siteId='s2';assert(ops.issues(invalidEquipment).some(x=>x.code==='APPARECCHIO_SEDE_DIVERSA'));
const invalidDocument=store.snapshot();invalidDocument.documents[0].clientId='c2';assert(ops.issues(invalidDocument).some(x=>x.code==='DOCUMENTO_CLIENTE_DIVERSO'));
assert.equal(ops.summary(store.snapshot()).openInterventions,1);
ops.changeQuote(store,'q','INVIATO');ops.changeQuote(store,'q','ACCETTATO');
assert.throws(()=>ops.changeQuote(store,'q','BOZZA'),/TRANSIZIONE/);
ops.addCreditNote(store,'f','credit1','NC-1',8000);
assert.throws(()=>ops.addCreditNote(store,'f','credit2','NC-2',8000),/CREDITO_SUPERA/);
assert.equal(store.snapshot().invoices.length,2);

const request={
 appointment:{id:'plan-a',siteId:'s',operator:'Tecnico 2',start:'2026-11-24T09:00:00+01:00',end:'2026-11-24T10:00:00+01:00'},
 intervention:{id:'plan-i',siteId:'s',equipmentId:'e',appointmentId:'plan-a',operator:'Tecnico 2',status:'APERTO'},
 quote:{id:'plan-q',clientId:'c',status:'BOZZA',lines:[{id:'plan-f',kind:'FORNITURA',description:'Materiale demo',qty:1,cents:2000},{id:'plan-p',kind:'POSA',description:'Posa demo',qty:1,cents:3000}]}
};
const rev=store.snapshot().revision;
ops.planJob(store,request);
assert.equal(store.snapshot().revision,rev+1);
assert.equal(store.snapshot().appointments.length,3);
assert.equal(store.snapshot().interventions.length,2);
assert.equal(store.snapshot().quotes.length,2);
const stable=store.snapshot();
assert.throws(()=>ops.planJob(store,{...request,appointment:{...request.appointment,id:'overlap'},intervention:{...request.intervention,id:'overlap-i',appointmentId:'overlap'},quote:{...request.quote,id:'overlap-q'}}),/OPERATORE_GIA_OCCUPATO/);
assert.deepEqual(store.snapshot(),stable);
assert.throws(()=>ops.closeJob(store,'plan-i','2026-11-24T10:00:00+01:00','2026-11-24T09:00:00+01:00','Tecnico 2'),/TEMPI_NON_VALIDI/);
assert.deepEqual(store.snapshot(),stable);
ops.closeJob(store,'plan-i','2026-11-24T09:00:00+01:00','2026-11-24T10:00:00+01:00','Tecnico 2');
assert.equal(store.snapshot().interventions.find(x=>x.id==='plan-i').status,'CHIUSO');
const html=fs.readFileSync('gestionale4/index.html','utf8');
assert.match(html,/operations-228\.js/);assert.match(html,/renderOverview\(s\)/);
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]).filter(Boolean);
assert.equal(scripts.length,1);new vm.Script(scripts[0]);
console.log('4.0.228 operational checks, transitions, TD04 and UI syntax OK');
