'use strict';
const assert=require('node:assert/strict'),w=require('./ite-field-workspace.js');
const catalog={clients:[{id:'C1'}],sites:[{id:'S1',clientId:'C1'}],systems:[{id:'I1',siteId:'S1'}],equipment:[{id:'E1',systemId:'I1'}],operators:[{id:'O1',active:true}]};
const appointment={id:'A1',clientId:'C1',siteId:'S1',systemId:'I1',equipmentId:'E1',operatorId:'O1',kind:'manutenzione',startsAt:'2026-11-02T09:00:00+01:00',endsAt:'2026-11-02T10:00:00+01:00'};
let state=w.open(catalog),original=JSON.stringify(state);
state=w.apply(state,{type:'schedule',appointment});assert.equal(state.appointments.length,1);
assert.equal(original,JSON.stringify(w.open(catalog))); // no source mutation
assert.throws(()=>w.apply(state,{type:'schedule',appointment:{...appointment,id:'A2'}}),/OPERATORE_OCCUPATO/);
state=w.apply(state,{type:'arrive',id:'A1',operatorId:'O1',at:appointment.startsAt});
state=w.apply(state,{type:'addExtra',id:'A1',operatorId:'O1',at:appointment.startsAt,payload:{extra:{id:'X1',description:'Rubinetto',category:'idrico',lines:[{type:'FORNITURA',description:'Rubinetto',quantity:1,unitCents:4500},{type:'POSA',description:'Montaggio',quantity:1,unitCents:5800}]}}});
state=w.apply(state,{type:'decideExtra',id:'A1',operatorId:'O1',at:appointment.startsAt,payload:{id:'X1',status:'accettato'}});
state=w.apply(state,{type:'close',id:'A1',operatorId:'O1',at:appointment.endsAt,payload:{notes:'Test sintetico'}});
assert.equal(state.appointments[0].visits[0].leftAt,appointment.endsAt);
const snap=w.snapshot(state),again=w.restore(JSON.parse(JSON.stringify(snap)));
assert.deepEqual(again,state);
assert.throws(()=>w.restore({...snap,schema:'OTHER'}),/FORMATO/);
assert.throws(()=>w.open(catalog,[state.appointments[0],state.appointments[0]]),/ARCHIVIO_CON_ANOMALIE/);
console.log('PASS: workspace schedule, conflict, visit, supply/installation extra, close, snapshot, restore, immutable source');
