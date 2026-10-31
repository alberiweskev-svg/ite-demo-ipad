const test=require('node:test'),assert=require('node:assert/strict');
const {empty,execute,dashboard}=require('../ite-operations-workspace.js');
const apply=(s,type,item)=>execute(s,{type,item}).state;
function seed(){
 let s=empty();
 for(const [type,item] of [['ADD_CLIENT',{id:'C1',name:'Cliente Demo'}],['ADD_SITE',{id:'S1',name:'Sede Demo',clientId:'C1'}],['ADD_SYSTEM',{id:'I1',name:'Impianto Demo',siteId:'S1'}],['ADD_DEVICE',{id:'D1',name:'Caldaia Demo',systemId:'I1'}],['ADD_OPERATOR',{id:'O1',name:'Tecnico Demo'}]])s=apply(s,type,item);
 return s;
}
test('integrated hierarchy, appointment, visit and revision remain valid',()=>{
 let s=seed();s=apply(s,'SCHEDULE',{id:'A1',deviceId:'D1',operatorId:'O1',type:'Manutenzione',start:'2026-10-31T09:00:00+01:00',end:'2026-10-31T10:00:00+01:00'});
 for(const [type,at] of [['ARRIVE','2026-10-31T09:05:00+01:00'],['CLOSE','2026-10-31T09:55:00+01:00'],['REOPEN','2026-10-31T10:05:00+01:00'],['CLOSE','2026-10-31T10:10:00+01:00']])s=execute(s,{type,appointmentId:'A1',operatorId:'O1',at}).state;
 const d=dashboard(s);assert.equal(d.validation.valid,true);assert.equal(d.projection.summary.closed,1);assert.equal(d.projection.rows[0].revisionCount,1);assert.equal(d.projection.rows[0].minutesOnSite,65);
});
test('rejects overlapping appointments and preserves previous state',()=>{
 const s=seed(),first=apply(s,'SCHEDULE',{id:'A1',deviceId:'D1',operatorId:'O1',type:'Manutenzione',start:'2026-10-31T09:00:00+01:00',end:'2026-10-31T10:00:00+01:00'});
 assert.throws(()=>apply(first,'SCHEDULE',{id:'A2',deviceId:'D1',operatorId:'O1',type:'Riparazione',start:'2026-10-31T09:30:00+01:00',end:'2026-10-31T10:30:00+01:00'}),/occupato/);
 assert.equal(first.appointments.length,1);
});
test('requires appointed operator for arrival',()=>{let s=seed();s=apply(s,'SCHEDULE',{id:'A1',deviceId:'D1',operatorId:'O1',type:'Manutenzione',start:'2026-10-31T09:00:00+01:00',end:'2026-10-31T10:00:00+01:00'});assert.throws(()=>execute(s,{type:'ARRIVE',appointmentId:'A1',operatorId:'OTHER',at:'2026-10-31T09:01:00+01:00'}),/Operatore/)});
test('dashboard refuses broken hierarchy',()=>{const s=seed();s.sites[0].clientId='missing';const d=dashboard(s);assert.equal(d.validation.valid,false);assert.equal(d.projection,null)});
test('command output is not persisted and original state is immutable',()=>{const s=empty();const out=execute(s,{type:'ADD_CLIENT',item:{id:'C1',name:'Demo'}});assert.equal(s.clients.length,0);assert.equal(out.persisted,false)});
