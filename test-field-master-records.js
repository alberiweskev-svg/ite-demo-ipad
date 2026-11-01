'use strict';
const assert=require('node:assert/strict');
const masters=require('./ite-field-master-records.js');
const workspace=require('./ite-field-workspace.js');
const base={catalog:{clients:[],sites:[],systems:[],equipment:[],operators:[]},appointments:[]};
const ops=[
 {action:'create',collection:'clients',record:{id:'C',name:'Cliente fittizio'}},
 {action:'create',collection:'sites',record:{id:'S',clientId:'C',address:'Via Demo 1'}},
 {action:'create',collection:'systems',record:{id:'I',siteId:'S'}},
 {action:'create',collection:'equipment',record:{id:'E',systemId:'I'}},
 {action:'create',collection:'operators',record:{id:'O',name:'Tecnico fittizio'}}
];
const created=masters.batch(base,ops);
assert.equal(created.catalog.equipment.length,1);
assert.equal(base.catalog.clients.length,0);
assert.throws(()=>masters.apply(created,{action:'delete',collection:'clients',id:'C'}),/COLLEGAMENTI/);
assert.throws(()=>masters.apply(created,{action:'create',collection:'sites',record:{id:'X',clientId:'missing'}}),/GERARCHIA|COLLEGAMENTO/);
assert.throws(()=>masters.apply(created,{action:'update',collection:'equipment',id:'E',record:{systemId:'missing'}}),/GERARCHIA|COLLEGAMENTO/);
assert.throws(()=>masters.apply(created,{action:'create',collection:'clients',record:{id:'C'}}),/DUPLICATO/);
const revised=masters.apply(created,{action:'update',collection:'clients',id:'C',record:{name:'Cliente prova'}});
assert.equal(revised.catalog.clients[0].name,'Cliente prova');
const planned=workspace.apply(created,{type:'schedule',appointment:{id:'A',clientId:'C',siteId:'S',systemId:'I',equipmentId:'E',operatorId:'O',kind:'Manutenzione',startsAt:'2026-11-05T09:00:00+01:00',endsAt:'2026-11-05T10:00:00+01:00'}});
assert.throws(()=>masters.apply(planned,{action:'delete',collection:'equipment',id:'E'}),/COLLEGAMENTI/);
console.log('PASS synthetic master records hierarchy, immutability and appointment links');
