'use strict';
const assert=require('node:assert/strict');
const calendar=require('./ite-field-calendar-views.js');
const appointments=[
 {id:'A',startsAt:'2026-11-02T09:00:00+01:00',endsAt:'2026-11-02T10:00:00+01:00',operatorId:'O1',status:'scheduled'},
 {id:'B',startsAt:'2026-11-04T15:00:00+01:00',endsAt:'2026-11-04T16:00:00+01:00',operatorId:'O2',status:'closed'},
 {id:'C',startsAt:'2026-12-01T09:00:00+01:00',endsAt:'2026-12-01T10:00:00+01:00',operatorId:'O1',status:'scheduled'}
];
const week=calendar.view(appointments,{mode:'week',anchor:'2026-11-04'});
assert.equal(week.startDay,'2026-11-02');assert.equal(week.days.length,7);assert.equal(week.total,2);
assert.equal(calendar.view(appointments,{mode:'week',anchor:'2026-11-04',operatorId:'O1'}).total,1);
assert.equal(calendar.view(appointments,{mode:'week',anchor:'2026-11-04',status:'closed'}).total,1);
const month=calendar.view(appointments,{mode:'month',anchor:'2026-11-15'});
assert.equal(month.days.length,30);assert.equal(month.total,2);
assert.equal(calendar.view(appointments,{mode:'day',anchor:'2026-11-04'}).total,1);
assert.equal(calendar.shift('month','2026-01-31',1),'2026-02-28');
assert.equal(calendar.shift('week','2026-11-04',-1),'2026-10-28');
assert.throws(()=>calendar.range('year','2026-11-04'),/VISTA/);
assert.throws(()=>calendar.range('day','not-a-date'),/DATA/);
console.log('PASS synthetic calendar day/week/month, filters and navigation');
