const test=require('node:test');const assert=require('node:assert/strict');const ops=require('../ite-operations-workspace.js');
function fixture(){let s=ops.empty();for(const [type,item] of [['ADD_CLIENT',{id:'C',name:'Cliente demo'}],['ADD_SITE',{id:'S',name:'Sede demo',clientId:'C'}],['ADD_SYSTEM',{id:'I',name:'Impianto demo',siteId:'S'}],['ADD_DEVICE',{id:'D',name:'Generatore demo',systemId:'I'}],['ADD_OPERATOR',{id:'T',name:'Tecnico demo'}],['SCHEDULE',{id:'A',deviceId:'D',operatorId:'T',start:'2026-11-03T09:00:00+01:00',end:'2026-11-03T10:00:00+01:00',type:'Manutenzione'}]])s=ops.execute(s,{type,item}).state;return s}
test('integrated hierarchy and appointment',()=>{const s=fixture(),d=ops.dashboard(s,{from:'2026-11-03T00:00:00+01:00',to:'2026-11-04T00:00:00+01:00'});assert.equal(d.validation.valid,true);assert.equal(d.projection.summary.appointments,1)});
test('arrival, close, review, close retains audit',()=>{let s=fixture();for(const [type,at] of [['ARRIVE','2026-11-03T09:00:00+01:00'],['CLOSE','2026-11-03T09:40:00+01:00'],['REOPEN','2026-11-03T10:00:00+01:00'],['CLOSE','2026-11-03T10:20:00+01:00']])s=ops.execute(s,{type,appointmentId:'A',operatorId:'T',at}).state;assert.equal(s.audit.length,4);assert.equal(s.interventions[0].revisionCount,1);assert.equal(s.interventions[0].status,'CLOSED')});
test('refuses early exit and leaves state unchanged',()=>{let s=fixture();s=ops.execute(s,{type:'ARRIVE',appointmentId:'A',operatorId:'T',at:'2026-11-03T09:20:00+01:00'}).state;const before=JSON.stringify(s);assert.throws(()=>ops.execute(s,{type:'CLOSE',appointmentId:'A',operatorId:'T',at:'2026-11-03T09:10:00+01:00'}));assert.equal(JSON.stringify(s),before)});
test('rejects operator overlap',()=>{const s=fixture();assert.throws(()=>ops.execute(s,{type:'SCHEDULE',item:{id:'B',deviceId:'D',operatorId:'T',start:'2026-11-03T09:30:00+01:00',end:'2026-11-03T10:30:00+01:00',type:'Riparazione'}}))});
test('extra work is recorded without becoming a commercial approval',()=>{let s=fixture();s=ops.execute(s,{type:'ARRIVE',appointmentId:'A',operatorId:'T',at:'2026-11-03T09:00:00+01:00'}).state;s=ops.execute(s,{type:'ADD_EXTRA_WORK',appointmentId:'A',description:'Verifica aggiuntiva'}).state;assert.equal(s.interventions[0].extraWorks.length,1);assert.equal(s.interventions[0].extraWorks[0].description,'Verifica aggiuntiva')});

test('rejects audit events assigned to a different operator',()=>{const s=fixture();s.audit.push({appointmentId:'A',operatorId:'UNKNOWN',at:'2026-11-03T09:00:00+01:00'});const result=ops.dashboard(s);assert.equal(result.validation.valid,false);assert.equal(result.projection,null)});
test('rejects reversed audit chronology',()=>{const s=fixture();s.audit.push({appointmentId:'A',operatorId:'T',at:'2026-11-03T10:00:00+01:00'});s.audit.push({appointmentId:'A',operatorId:'T',at:'2026-11-03T09:00:00+01:00'});assert.equal(ops.dashboard(s).validation.issues.some(x=>x.type==='AUDIT_TIME_REVERSED'),true)});
test('rejects closed visits with malformed exit timestamp',()=>{const s=fixture();s.appointments[0].status='CLOSED';s.interventions.push({id:'INT-A',appointmentId:'A',status:'CLOSED',arrivalAt:'2026-11-03T09:00:00+01:00',exitAt:'invalid'});assert.equal(ops.dashboard(s).validation.issues.some(x=>x.type==='INVALID_CLOSED_VISIT'),true)});

test('batch creates hierarchy and appointment in one immutable transition',()=>{
 const initial=ops.empty();
 const commands=[
  {type:'ADD_CLIENT',item:{id:'C1',name:'Cliente sintetico'}},
  {type:'ADD_SITE',item:{id:'S1',name:'Sede sintetica',clientId:'C1'}},
  {type:'ADD_SYSTEM',item:{id:'I1',name:'Impianto sintetico',siteId:'S1'}},
  {type:'ADD_DEVICE',item:{id:'D1',name:'Apparecchiatura sintetica',systemId:'I1'}},
  {type:'ADD_OPERATOR',item:{id:'T1',name:'Tecnico sintetico'}},
  {type:'SCHEDULE',item:{id:'A1',deviceId:'D1',operatorId:'T1',start:'2026-11-03T09:00:00+01:00',end:'2026-11-03T10:00:00+01:00',type:'Manutenzione'}}
 ];
 const result=ops.batch(initial,commands);
 assert.equal(result.state.appointments.length,1);
 assert.equal(initial.clients.length,0);
 assert.equal(result.persisted,false);
});
test('failed batch does not mutate the input state',()=>{
 const initial=ops.empty();
 assert.throws(()=>ops.batch(initial,[{type:'ADD_CLIENT',item:{id:'C1',name:'Demo'}},{type:'ADD_SITE',item:{id:'S1',name:'Sede',clientId:'NON_EXISTENT'}}]));
 assert.equal(initial.clients.length,0);
});
