'use strict';
const assert=require('node:assert/strict');
const H=require('./ite-hierarchy-workspace.js'),Q=require('./ite-commercial-workspace.js'),A=require('./ite-accounting-workspace.js'),T=require('./ite-operational-transactions.js');
let h=H.empty();
h=H.add(h,'clients',{id:'C1',name:'Cliente fittizio'});
h=H.add(h,'sites',{id:'S1',clientId:'C1',address:'Via Demo 1'});
h=H.add(h,'plants',{id:'P1',siteId:'S1',description:'Impianto demo'});
h=H.add(h,'devices',{id:'D1',plantId:'P1',description:'Generatore demo'});
let state={hierarchy:h,commercial:Q.empty(h),accounting:A.empty()};
const appointment={id:'A1',clientId:'C1',siteId:'S1',deviceId:'D1',operator:'Tecnico Demo',start:'2026-11-04T09:00',end:'2026-11-04T10:00'};
state=T.scheduleAppointment(state,appointment);
assert.equal(T.dashboard(state).appointments,1);
const snapshot=JSON.stringify(state);
assert.throws(()=>T.scheduleAppointment(state,{...appointment,id:'A2',start:'2026-11-04T09:30',end:'2026-11-04T10:30'}),/OPERATORE_OCCUPATO/);
assert.equal(JSON.stringify(state),snapshot,'rejected transaction must not mutate original');
state=T.beginService(state,'A1','Tecnico Demo','J1');
state=T.clockService(state,'J1','ARRIVO','2026-11-04T09:05');
assert.equal(T.dashboard(state).inProgress,1);
state=T.clockService(state,'J1','USCITA','2026-11-04T09:55');
assert.equal(T.dashboard(state).completed,1);
const quote={id:'Q1',clientId:'C1',siteId:'S1',status:'BOZZA',lines:[
{id:'F1',groupId:'G1',kind:'FORNITURA',description:'Rubinetto demo',quantity:1,unitPrice:100},
{id:'L1',groupId:'G1',kind:'POSA',description:'Installazione demo',quantity:1,unitPrice:60},
{id:'E1',groupId:'G1',kind:'EXTRA',description:'Extra demo',quantity:1,unitPrice:20}
]};
state=T.createEstimate(state,quote);
assert.equal(Q.totals(state.commercial,state.hierarchy,'Q1').subtotal,180);
state=T.acceptAndReserve(state,'Q1');
assert.equal(T.dashboard(state).acceptedQuotes,1);
assert.equal(state.commercial.reservations.length,0);
state=T.registerDocument(state,{id:'DOC1',kind:'TD04',number:'NC-1',date:'2026-11-04',counterparty:'Fornitore demo',taxable:100,vat:22,total:122,vatCategory:'22'});
assert.equal(T.dashboard(state).documents,1);
assert.equal(state.accounting.documents[0].creditStatus,'DA_RECUPERARE');
assert.throws(()=>T.registerDocument(state,{id:'DOC2',kind:'VENDITA',number:'X',date:'2026-11-04',counterparty:'Demo',taxable:10,vat:2,total:99}),/TOTALE_NON_COHERENTE/);
assert.equal(T.dashboard(state).documents,1);
console.log('PASS: integrated transaction tests (appointments, conflicts, services, quotes, extras, TD04, rollback)');
