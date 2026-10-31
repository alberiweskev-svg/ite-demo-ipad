const test=require('node:test');
const assert=require('node:assert/strict');
const lifecycle=require('../ite-service-lifecycle.js');
test('moving a planned visit records the old slot',()=>{
 let s=lifecycle.empty();
 s=lifecycle.add(s,'client',{id:'C',name:'Demo'});
 s=lifecycle.add(s,'site',{id:'S',name:'Sede',clientId:'C'});
 s=lifecycle.add(s,'system',{id:'P',name:'Impianto',siteId:'S'});
 s=lifecycle.add(s,'device',{id:'D',name:'Generatore',systemId:'P'});
 s=lifecycle.add(s,'operator',{id:'T',name:'Tecnico'});
 s=lifecycle.appointment(s,{id:'A',deviceId:'D',operatorId:'T',start:'2026-11-03T09:00:00+01:00',end:'2026-11-03T10:00:00+01:00',type:'Manutenzione'});
 const next=lifecycle.reschedule(s,'A',{operatorId:'T',at:'2026-11-02T10:00:00+01:00',start:'2026-11-03T08:00:00+01:00',end:'2026-11-03T09:00:00+01:00'});
 assert.equal(next.audit[0].previous.start,s.appointments[0].start);
 assert.equal(next.audit[0].action,'RESCHEDULE');
 assert.equal(next.appointments[0].start,'2026-11-03T08:00:00+01:00');
});
