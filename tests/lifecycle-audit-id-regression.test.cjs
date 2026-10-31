const test=require('node:test');
const assert=require('node:assert/strict');
const api=require('../ite-operations-workspace.js');
test('arrival and closure keep distinct audit identifiers',()=>{
 let s=api.empty();
 const cmds=[
 ['ADD_CLIENT',{id:'C',name:'Cliente demo'}],
 ['ADD_SITE',{id:'S',name:'Sede demo',clientId:'C'}],
 ['ADD_SYSTEM',{id:'P',name:'Impianto demo',siteId:'S'}],
 ['ADD_DEVICE',{id:'D',name:'Generatore demo',systemId:'P'}],
 ['ADD_OPERATOR',{id:'T',name:'Tecnico demo'}],
 ['SCHEDULE',{id:'A',deviceId:'D',operatorId:'T',start:'2026-11-03T09:00:00+01:00',end:'2026-11-03T10:00:00+01:00',type:'Manutenzione'}]
 ];
 for(const [type,item] of cmds)s=api.execute(s,{type,item}).state;
 s=api.execute(s,{type:'ARRIVE',appointmentId:'A',operatorId:'T',at:'2026-11-03T09:00:00+01:00'}).state;
 s=api.execute(s,{type:'CLOSE',appointmentId:'A',operatorId:'T',at:'2026-11-03T09:30:00+01:00'}).state;
 s=api.execute(s,{type:'REOPEN',appointmentId:'A',operatorId:'T',at:'2026-11-03T09:40:00+01:00'}).state;
 s=api.execute(s,{type:'CLOSE',appointmentId:'A',operatorId:'T',at:'2026-11-03T09:50:00+01:00'}).state;
 assert.deepEqual(s.audit.map(x=>x.id),['AUD-A-1','AUD-A-2','AUD-A-3','AUD-A-4']);
 assert.equal(s.interventions[0].revisionCount,1);
 assert.equal(api.dashboard(s).validation.valid,true);
});
