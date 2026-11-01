'use strict';
const assert=require('node:assert/strict');
const workspace=require('./ite-field-workspace.js');
const empty={catalog:{clients:[],sites:[],systems:[],equipment:[],operators:[]},appointments:[]};
const master=(action,collection,record,id)=>({type:'masterRecord',payload:{action,collection,record,id}});
const ops=[
 master('create','clients',{id:'C',name:'Cliente fittizio'}),
 master('create','sites',{id:'S',clientId:'C',address:'Via Prova 1'}),
 master('create','systems',{id:'I',siteId:'S'}),
 master('create','equipment',{id:'E',systemId:'I',name:'Caldaia fittizia'}),
 master('create','operators',{id:'O',name:'Operatore fittizio'}),
 {type:'schedule',appointment:{id:'A',clientId:'C',siteId:'S',systemId:'I',equipmentId:'E',operatorId:'O',kind:'Manutenzione',startsAt:'2026-11-05T09:00:00+01:00',endsAt:'2026-11-05T10:00:00+01:00'}},
 {type:'arrive',id:'A',operatorId:'O',at:'2026-11-05T09:02:00+01:00'},
 {type:'addExtra',id:'A',operatorId:'O',at:'2026-11-05T09:10:00+01:00',payload:{extra:{id:'X',description:'Ricambio e installazione',category:'riscaldamento',lines:[{type:'FORNITURA',description:'Ricambio',quantity:2,unitCents:1200},{type:'POSA',description:'Installazione',quantity:1,unitCents:5800}]}}},
 {type:'approveLines',id:'A',operatorId:'O',at:'2026-11-05T09:20:00+01:00',payload:{id:'X',quantities:[1,0.5]}},
 {type:'close',id:'A',operatorId:'O',at:'2026-11-05T09:40:00+01:00'}
];
const result=workspace.batch(empty,ops);
assert.equal(result.catalog.clients.length,1);
assert.equal(result.appointments.length,1);
assert.equal(result.appointments[0].status,'closed');
assert.equal(result.appointments[0].extraWorks[0].status,'parzialmente_accettato');
assert.deepEqual(workspace.restore(workspace.snapshot(result)),result);
assert.equal(empty.catalog.clients.length,0);
const rejected=workspace.preview(empty,[...ops,master('delete','clients',undefined,'C')]);
assert.equal(rejected.valid,false);
assert.equal(rejected.next,null);
console.log('PASS integrated master -> appointment -> visit -> extra -> approval -> close -> restore');
