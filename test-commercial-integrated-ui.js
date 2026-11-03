'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const H=require('./ite-hierarchy-workspace.js'),Q=require('./ite-commercial-workspace.js');
const ui=fs.readFileSync('ite-integrated-workspace.js','utf8');
for(const token of ['Aggiungi voce EXTRA','Carica articolo nel magazzino demo','Associa materiale come FORNITURA','Accetta preventivo','Prenota materiali','Scarica materiali','Q.availability','Q.addLine','Q.accept','Q.reserve','Q.discharge','persist()'])assert.ok(ui.includes(token),'UI missing '+token);
let h=H.empty();h=H.add(h,'clients',{id:'C1',name:'Cliente demo'});h=H.add(h,'sites',{id:'S1',clientId:'C1',address:'Via prova 1'});
let q=Q.empty(h);
q=Q.validate({...q,stock:[{id:'ST1',description:'Tubo demo',unitCost:10,onHand:8}]},h);
q=Q.addQuote(q,h,{id:'Q1',clientId:'C1',siteId:'S1',status:'BOZZA',lines:[
{id:'F1',groupId:'G1',kind:'FORNITURA',description:'Fornitura demo',quantity:1,unitPrice:30},
{id:'P1',groupId:'G1',kind:'POSA',description:'Posa demo',quantity:1,unitPrice:40}
]});
q=Q.addLine(q,h,'Q1',{id:'X1',groupId:'X1',kind:'EXTRA',description:'Extra demo',quantity:1,unitPrice:20});
q=Q.addLine(q,h,'Q1',{id:'M1',groupId:'M1',kind:'FORNITURA',description:'Tubo demo',quantity:3,unitPrice:15,stockId:'ST1'});
assert.equal(Q.totals(q,h,'Q1').subtotal,135);
q=Q.accept(q,h,'Q1');assert.equal(q.quotes[0].status,'ACCETTATO');
q=Q.reserve(q,h,'Q1');assert.equal(Q.availability(q,h)[0].available,5);
assert.throws(()=>Q.reserve(q,h,'Q1'),/PRENOTAZIONE_GIA_PRESENTE/);
const before=JSON.stringify(q);
assert.throws(()=>Q.discharge({...q,stock:[{...q.stock[0],onHand:1}]},h,'Q1'),/GIACENZA_INSUFFICIENTE/);
assert.equal(JSON.stringify(q),before);
q=Q.discharge(q,h,'Q1');assert.equal(q.stock[0].onHand,5);
assert.equal(q.reservations[0].status,'SCARICATO');
assert.equal(Q.availability(q,h)[0].available,5);
assert.throws(()=>Q.addLine(q,h,'Q1',{id:'BAD',groupId:'BAD',kind:'EXTRA',description:'After acceptance',quantity:1,unitPrice:1}),/PREVENTIVO_BLOCCATO/);
console.log('PASS: integrated commercial UI wiring and end-to-end Extras, stock, acceptance, reserve, discharge');
