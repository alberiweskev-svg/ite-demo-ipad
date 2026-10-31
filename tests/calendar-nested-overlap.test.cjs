const test=require('node:test');
const assert=require('node:assert/strict');
const integrity=require('../ite-operations-integrity.js');
function fixture(){
 const start='2026-11-03T';
 const app=(id,from,to)=>({id,deviceId:'D',operatorId:'T',start:start+from+':00+01:00',end:start+to+':00+01:00',status:'PLANNED'});
 return {clients:[{id:'C'}],sites:[{id:'S',clientId:'C'}],systems:[{id:'P',siteId:'S'}],devices:[{id:'D',systemId:'P'}],operators:[{id:'T'}],appointments:[app('A','08:00','12:00'),app('B','09:00','10:00'),app('C','10:30','11:30')],interventions:[],audit:[]};
}
test('nested appointments detect conflicts with the long appointment',()=>{
 const report=integrity.check(fixture());
 const pairs=report.issues.filter(x=>x.type==='OVERLAP').map(x=>x.ids.join('-'));
 assert.deepEqual(pairs,['A-B','A-C']);
});
test('cancelled appointment is excluded from overlap validation',()=>{
 const state=fixture();state.appointments[0].status='CANCELLED';
 assert.equal(integrity.check(state).issues.some(x=>x.type==='OVERLAP'),false);
});
