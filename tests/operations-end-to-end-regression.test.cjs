'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const workspace=require('../ite-operations-workspace.js');
const integrity=require('../ite-operations-integrity.js');
function seed(){
 let state=workspace.empty();
 for(const [type,item] of [
 ['ADD_CLIENT',{id:'C1',name:'Cliente prova'}],
 ['ADD_SITE',{id:'S1',name:'Sede prova',clientId:'C1'}],
 ['ADD_SYSTEM',{id:'I1',name:'Impianto prova',siteId:'S1'}],
 ['ADD_DEVICE',{id:'A1',name:'Caldaia prova',systemId:'I1'}],
 ['ADD_OPERATOR',{id:'O1',name:'Tecnico prova'}],
 ['SCHEDULE',{id:'P1',deviceId:'A1',operatorId:'O1',start:'2026-11-03T09:00:00+01:00',end:'2026-11-03T10:00:00+01:00',type:'Manutenzione'}]
 ])state=workspace.execute(state,{type,item}).state;
 return state;
}
test('full appointment to closed and reviewed intervention preserves audit',()=>{
 let s=seed();for(const [type,at] of [['ARRIVE','2026-11-03T09:00:00+01:00'],['CLOSE','2026-11-03T09:40:00+01:00'],['REOPEN','2026-11-03T10:00:00+01:00'],['CLOSE','2026-11-03T10:15:00+01:00']])s=workspace.execute(s,{type,appointmentId:'P1',operatorId:'O1',at}).state;
 assert.equal(s.audit.length,4);assert.equal(s.interventions[0].revisionCount,1);assert.equal(s.interventions[0].status,'CLOSED');assert.equal(integrity.check(s).valid,true);
});
test('close before arrival is rejected without mutating original',()=>{
 let s=seed();s=workspace.execute(s,{type:'ARRIVE',appointmentId:'P1',operatorId:'O1',at:'2026-11-03T09:20:00+01:00'}).state;
 assert.throws(()=>workspace.execute(s,{type:'CLOSE',appointmentId:'P1',operatorId:'O1',at:'2026-11-03T09:10:00+01:00'}),/precedente/);
 assert.equal(s.audit.length,1);
});
test('orphan audit events are reported',()=>{
 const s=seed();s.audit.push({appointmentId:'MISSING',operatorId:'O1',at:'2026-11-03T09:00:00+01:00'});
 assert.equal(integrity.check(s).issues.some(x=>x.type==='INVALID_AUDIT'),true);
});
test('operator calendar overlap is blocked',()=>{
 const s=seed();assert.throws(()=>workspace.execute(s,{type:'SCHEDULE',item:{id:'P2',deviceId:'A1',operatorId:'O1',start:'2026-11-03T09:30:00+01:00',end:'2026-11-03T10:30:00+01:00',type:'Riparazione'}}),/occupato/);
});
