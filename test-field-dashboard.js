'use strict';
const assert=require('node:assert/strict');
const workspace=require('./ite-field-workspace.js');
const dashboard=require('./ite-field-dashboard.js');
const data={catalog:{clients:[{id:'C',name:'Cliente demo'}],sites:[{id:'S',clientId:'C'}],systems:[{id:'I',siteId:'S'}],equipment:[{id:'E',systemId:'I'}],operators:[{id:'O',active:true}]},appointments:[]};
const appointment={id:'A',clientId:'C',siteId:'S',systemId:'I',equipmentId:'E',operatorId:'O',kind:'Manutenzione',startsAt:'2026-11-05T09:00:00+01:00',endsAt:'2026-11-05T10:00:00+01:00'};
const operations=[
 {type:'schedule',appointment},
 {type:'arrive',id:'A',operatorId:'O',at:'2026-11-05T09:05:00+01:00'},
 {type:'addExtra',id:'A',operatorId:'O',at:'2026-11-05T09:10:00+01:00',payload:{extra:{id:'X',description:'Ricambio demo',category:'termico',lines:[{type:'FORNITURA',description:'Ricambio',quantity:2,unitCents:1000},{type:'POSA',description:'Posa',quantity:1,unitCents:5000}]}}},
 {type:'approveLines',id:'A',operatorId:'O',at:'2026-11-05T09:15:00+01:00',payload:{id:'X',quantities:[1,0.5]}},
 {type:'close',id:'A',operatorId:'O',at:'2026-11-05T09:35:00+01:00'}
];
const final=workspace.batch(data,operations),summary=dashboard.build(final);
assert.equal(summary.totals.appointments,1);
assert.equal(summary.totals.minutes,30);
assert.equal(summary.totals.FORNITURA,1000);
assert.equal(summary.totals.POSA,2500);
assert.equal(summary.totals.totalCents,3500);
assert.equal(summary.byClient.C[0].id,'A');
assert.equal(summary.byEquipment.E[0].status,'closed');
assert.equal(dashboard.build(final,{operatorId:'other'}).totals.appointments,0);
assert.equal(data.appointments.length,0);
assert.throws(()=>dashboard.build({catalog:final.catalog,appointments:[...final.appointments,final.appointments[0]]}),/ARCHIVIO_CON_ANOMALIE/);
console.log('PASS dashboard, intervention history, separated accepted extras, filtering and invalid input');
