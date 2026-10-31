const test=require('node:test');
const assert=require('node:assert/strict');
const check=require('../ite-operations-integrity.js').check;
function fixture(){
 return {clients:[{id:'C'}],sites:[{id:'S',clientId:'C'}],systems:[{id:'P',siteId:'S'}],devices:[{id:'D',systemId:'P'}],operators:[{id:'T'}],appointments:[{id:'A',deviceId:'D',operatorId:'T',start:'2026-11-03T09:00:00+01:00',end:'2026-11-03T10:00:00+01:00',status:'OPEN'}],interventions:[{id:'I',appointmentId:'A',deviceId:'D',operatorId:'T',arrivalAt:'2026-11-03T09:00:00+01:00',status:'OPEN'}],audit:[]};
}
test('matching visit references pass',()=>{assert.equal(check(fixture()).valid,true)});
test('wrong technician on visit is rejected',()=>{const x=fixture();x.interventions[0].operatorId='OTHER';assert.ok(check(x).issues.some(i=>i.type==='VISIT_OPERATOR_MISMATCH'))});
test('wrong equipment on visit is rejected',()=>{const x=fixture();x.interventions[0].deviceId='OTHER';assert.ok(check(x).issues.some(i=>i.type==='VISIT_DEVICE_MISMATCH'))});
