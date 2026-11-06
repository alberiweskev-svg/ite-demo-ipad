'use strict';
const assert=require('node:assert/strict'),a=require('./ite-agenda-40.js');
assert.deepEqual(a.range('2026-11-06','week'),['2026-11-02','2026-11-09']);
assert.deepEqual(a.range('2026-12-15','month'),['2026-12-01','2027-01-01']);
assert.deepEqual(a.range('2026-11-06','day'),['2026-11-06','2026-11-07']);
const db={appointments:[{id:'TEST-A',start:'2026-11-06T09:00:00',end:'2026-11-06T10:00:00',operatorId:'TEST-OP1',clientId:'TEST-C',siteId:'TEST-S',equipmentId:'TEST-E',status:'PLANNED'},{id:'TEST-B',start:'2026-11-06T11:00:00',end:'2026-11-06T12:00:00',operatorId:'TEST-OP2',status:'CANCELLED'},{id:'TEST-C',start:'2026-11-07T11:00:00',end:'2026-11-07T12:00:00',operatorId:'TEST-OP2',status:'PLANNED'}],clients:[{id:'TEST-C',name:'Cliente fittizio'}],sites:[{id:'TEST-S',name:'Sede TEST'}],equipment:[{id:'TEST-E',name:'Caldaia TEST'}],operators:[{id:'TEST-OP1',name:'Tecnico TEST'}]};
assert.equal(a.list(db,'2026-11-06','day').length,1);
assert.equal(a.list(db,'2026-11-06','week','TEST-OP1').length,1);
assert.equal(a.list(db,'2026-11-06','week','TEST-OP2').length,1);
assert.match(a.printable(a.list(db,'2026-11-06','day')),/Cliente fittizio/);
assert.throws(()=>a.range('2026-11-06','year'),/Vista/);

assert.equal(a.shiftMonth('2026-01-31',1),'2026-02-28');
assert.equal(a.shiftMonth('2024-01-31',1),'2024-02-29');
assert.equal(a.plus('2026-12-31',1),'2027-01-01');
assert.throws(()=>a.range('2026-02-30','day'),/Data non valida/);
const overnight={...db,appointments:[{id:'TEST-N',start:'2026-11-06T23:30:00',end:'2026-11-07T01:00:00',status:'PLANNED',operatorId:'TEST-OP1'}]};
assert.equal(a.list(overnight,'2026-11-07','day').length,1);
assert.equal(a.list(overnight,'2026-11-06','day').length,1);
const g=a.grouped(a.list(overnight,'2026-11-06','week'),...a.range('2026-11-06','week'));
assert.equal(g['2026-11-06'].length,1);
assert.equal(g['2026-11-07'].length,1);
const midnight={...overnight,appointments:[{...overnight.appointments[0],end:'2026-11-07T00:00:00'}]};
assert.equal(a.list(midnight,'2026-11-07','day').length,0);
assert.equal((a.grouped(a.list(midnight,'2026-11-06','week'))['2026-11-07']||[]).length,0);

console.log('Agenda 4.0.44: test superati');