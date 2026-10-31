'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {plan}=require('../ite-operational-batch.js');
const core=()=>({clienti:[{id:'c'}],immobili:[{id:'s',client_id:'c'}],impianti:[{id:'p',immobile_id:'s'}],apparecchiature:[{id:'d',impianto_id:'p'}],dipendenti:[{id:'tech'}],appuntamenti:[],interventi:[]});
const commerce=()=>({quotes:[],extras:[],documents:[]});
const appointment={type:'appointment',input:{id:'a',clientId:'c',siteId:'s',plantId:'p',deviceId:'d',operatorId:'tech',start:'2026-11-01T09:00:00+01:00',end:'2026-11-01T10:00:00+01:00'}};
const arrival={type:'arrival',input:{id:'j',appointmentId:'a',arrivedAt:'2026-11-01T09:10:00+01:00'}};
const closure={type:'closure',input:{interventionId:'j',departedAt:'2026-11-01T10:10:00+01:00'}};
const quote={type:'quote',input:{id:'q',clientId:'c',siteId:'s',interventionId:'j',lines:[{kind:'FORNITURA',description:'Materiale TEST',quantity:2,unitPrice:10},{kind:'POSA',description:'Posa TEST',quantity:1,unitPrice:20}]}};
test('stages full appointment-intervention-closure-quote flow without modifying archives',()=>{
 const c=core(),m=commerce(),before=JSON.stringify([c,m]);
 const x=plan(c,m,[appointment,arrival,closure,quote]);
 assert.equal(x.audit.length,4);assert.equal(x.preview.core.interventi[0].workflow_status,'CHIUSO');
 assert.equal(x.preview.core.interventi[0].minutes,60);
 assert.equal(x.preview.commerce.quotes[0].subtotal,40);
 assert.equal(x.committed,false);assert.equal(x.releaseAllowed,false);
 assert.equal(JSON.stringify([c,m]),before);
});
test('failed late step rejects whole preview and does not mutate input',()=>{
 const c=core(),m=commerce(),before=JSON.stringify([c,m]);
 assert.throws(()=>plan(c,m,[appointment,arrival,{...quote,input:{...quote.input,clientId:'foreign'}}]),/Operazione 3/);
 assert.equal(JSON.stringify([c,m]),before);
});
test('duplicate appointment id and double intervention are rejected',()=>{
 assert.throws(()=>plan(core(),commerce(),[appointment,appointment]),/duplicato|utilizzato/);
 assert.throws(()=>plan(core(),commerce(),[appointment,arrival,{...arrival,input:{...arrival.input,id:'j2'}}]),/già aperto/);
});
test('cannot issue accounting document from an unaccepted draft quote',()=>{
 assert.throws(()=>plan(core(),commerce(),[appointment,arrival,quote,{type:'invoice',input:{id:'inv',quoteId:'q',type:'VENDITA',amount:40}}]),/non accettato/);
});
test('accepted quote supports extra and invoice drafts, never fiscal issue',()=>{
 const m=commerce();m.quotes.push({id:'accepted',clientId:'c',siteId:'s',status:'ACCETTATO'});
 const x=plan(core(),m,[{type:'extra',input:{id:'e',quoteId:'accepted',lines:[{kind:'POSA',description:'Extra TEST',quantity:1,unitPrice:50}]}},{type:'invoice',input:{id:'inv',quoteId:'accepted',type:'PROFORMA',amount:50}}]);
 assert.equal(x.preview.commerce.extras.length,1);
 assert.equal(x.preview.commerce.documents[0].fiscalIssued,false);
 assert.equal(x.requiresReview,true);
});
test('rejects malformed operations, oversized batches and foreign locations',()=>{
 assert.throws(()=>plan(core(),commerce(),[{type:'unknown',input:{}}]),/non valida/);
 assert.throws(()=>plan(core(),commerce(),Array(101).fill(appointment)),/Sequenza non valida/);
 assert.throws(()=>plan(core(),commerce(),[{...appointment,input:{...appointment.input,siteId:'foreign'}}]),/non coerenti/);
});
