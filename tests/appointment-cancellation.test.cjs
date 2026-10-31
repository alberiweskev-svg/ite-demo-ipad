const test=require('node:test');
const assert=require('node:assert/strict');
const ops=require('../ite-operations-workspace.js');
function setup(){
 const commands=[
 {type:'ADD_CLIENT',item:{id:'C',name:'Demo'}},
 {type:'ADD_SITE',item:{id:'S',name:'Sede',clientId:'C'}},
 {type:'ADD_SYSTEM',item:{id:'P',name:'Impianto',siteId:'S'}},
 {type:'ADD_DEVICE',item:{id:'D',name:'Apparecchiatura',systemId:'P'}},
 {type:'ADD_OPERATOR',item:{id:'T',name:'Tecnico'}},
 {type:'SCHEDULE',item:{id:'A',deviceId:'D',operatorId:'T',start:'2026-11-03T09:00:00+01:00',end:'2026-11-03T10:00:00+01:00',type:'Manutenzione'}}
 ];return ops.batch(ops.empty(),commands).state;
}
test('cancellation preserves an audit entry and frees the technician',()=>{
 const initial=setup();
 const result=ops.execute(initial,{type:'CANCEL_APPOINTMENT',appointmentId:'A',operatorId:'T',at:'2026-11-02T12:00:00+01:00',notes:'Cliente indisponibile'});
 assert.equal(initial.appointments[0].status,'PLANNED');
 assert.equal(result.state.appointments[0].status,'CANCELLED');
 assert.equal(result.state.audit[0].action,'CANCEL');
 assert.equal(result.validation.valid,true);
 const next=ops.execute(result.state,{type:'SCHEDULE',item:{id:'B',deviceId:'D',operatorId:'T',start:'2026-11-03T09:30:00+01:00',end:'2026-11-03T10:30:00+01:00',type:'Riparazione'}});
 assert.equal(next.state.appointments.length,2);
});
test('cancel rejects unassigned operator and preserves input',()=>{
 const s=setup(),before=JSON.stringify(s);
 assert.throws(()=>ops.execute(s,{type:'CANCEL_APPOINTMENT',appointmentId:'A',operatorId:'OTHER',at:'2026-11-02T12:00:00+01:00'}));
 assert.equal(JSON.stringify(s),before);
});
test('cancel cannot repeat on cancelled appointment',()=>{
 const s=ops.execute(setup(),{type:'CANCEL_APPOINTMENT',appointmentId:'A',operatorId:'T',at:'2026-11-02T12:00:00+01:00'}).state;
 assert.throws(()=>ops.execute(s,{type:'CANCEL_APPOINTMENT',appointmentId:'A',operatorId:'T',at:'2026-11-02T13:00:00+01:00'}));
});
