'use strict';
const assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const source=`
const assert=require('node:assert/strict'),c=require('./ite-field-technician-capacity.js');
const jobs=[{id:'A',operatorId:'T1',startsAt:'2026-11-05T09:00:00+01:00',endsAt:'2026-11-05T10:00:00+01:00',status:'scheduled'},{id:'B',operatorId:'T1',startsAt:'2026-11-05T11:00:00+01:00',endsAt:'2026-11-05T12:30:00+01:00',status:'closed'}];
const a=c.slots(jobs,{day:'2026-11-05',operatorId:'T1',startHour:8,endHour:13});
assert(a.some(x=>x.label==='08:00–09:00'));assert(!a.some(x=>x.label==='09:00–10:00'));
assert.equal(c.workload({operators:[{id:'T1'}]},jobs,'2026-11-05')[0].busyMinutes,150);
assert.equal(c.dayBounds('2026-03-29').end-c.dayBounds('2026-03-29').start,23*3600000);
assert.equal(c.dayBounds('2026-10-25').end-c.dayBounds('2026-10-25').start,25*3600000);
const spring=c.slots([],{day:'2026-03-29',operatorId:'T1',startHour:1,endHour:5,durationMinutes:60,stepMinutes:30});
assert(!spring.some(x=>x.label==='02:00–03:00'));assert(!spring.some(x=>x.label==='01:30–02:30'));
assert.throws(()=>c.dayBounds('2026-02-30'),/GIORNO/);
console.log(JSON.stringify({a,spring,bounds:[c.dayBounds('2026-03-29').start.toISOString(),c.dayBounds('2026-10-25').start.toISOString()]}));
`;
const outputs=['UTC','Europe/Rome','America/New_York'].map(TZ=>execFileSync(process.execPath,['-e',source],{env:{...process.env,TZ},encoding:'utf8'}).trim());assert(outputs.every(x=>x===outputs[0]));console.log('PASS Rome timezone invariance, DST, workload, slots');
