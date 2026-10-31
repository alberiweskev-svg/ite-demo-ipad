'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {snapshot,prepare}=require('../ite-operational-changeset.js');
const {commit}=require('../ite-operational-persistence.js');
const base=()=>({core:{clienti:[{id:'c'}],immobili:[{id:'s',client_id:'c'}],impianti:[],apparecchiature:[],dipendenti:[{id:'t'}],appuntamenti:[],interventi:[]},commerce:{quotes:[],extras:[],documents:[]}});
const step={type:'appointment',input:{id:'a',clientId:'c',siteId:'s',operatorId:'t',start:'2026-11-01T09:00:00+01:00',end:'2026-11-01T10:00:00+01:00'}};
const clone=x=>JSON.parse(JSON.stringify(x));
function fixture(){const data=base();return {data,cs:prepare(data.core,data.commerce,[step],snapshot(data.core,data.commerce))};}
function store(data,failAt){
 const calls=[],original=clone(data);let live=clone(data),pending=null;
 return {encrypted:true,atomic:true,calls,get live(){return live},original,
 async read(){calls.push('read');return clone(live)},
 async backup(){calls.push('backup');if(failAt==='backup')throw Error('backup failure');return 'backup-synthetic'},
 async begin(){calls.push('begin');pending=clone(live);return {id:1}},
 async write(tx,payload){calls.push('write');if(failAt==='write')throw Error('write failure');pending={core:payload.core,commerce:payload.commerce}},
 async commit(){calls.push('commit');if(failAt==='commit')throw Error('commit failure');live=pending;pending=null},
 async rollback(){calls.push('rollback');pending=null}};
}
const opts={confirmed:true,operatorId:'t',reason:'Collaudo sintetico'};
test('encrypted transactional adapter backs up, validates and commits once',async()=>{
 const {data,cs}=fixture(),s=store(data);
 const result=await commit(s,cs,opts);
 assert.equal(result.persisted,true);assert.equal(result.fiscalIssued,false);
 assert.equal(s.live.core.appuntamenti.length,1);assert.equal(data.core.appuntamenti.length,0);
 assert.deepEqual(s.calls,['read','backup','begin','read','write','commit']);
});
test('missing encryption or atomicity rejects before any writes',async()=>{
 const {data,cs}=fixture(),s=store(data);s.encrypted=false;
 await assert.rejects(commit(s,cs,opts),/cifratura/);assert.equal(s.calls.length,0);
});
test('backup failure prevents beginning a transaction',async()=>{
 const {data,cs}=fixture(),s=store(data,'backup');
 await assert.rejects(commit(s,cs,opts),/backup failure/);
 assert.equal(s.calls.includes('begin'),false);assert.deepEqual(s.live,data);
});
test('write failure rolls back and preserves source',async()=>{
 const {data,cs}=fixture(),s=store(data,'write');
 await assert.rejects(commit(s,cs,opts),/write failure/);
 assert.equal(s.calls.at(-1),'rollback');assert.deepEqual(s.live,data);
});
test('stale archive is rejected before backup',async()=>{
 const {data,cs}=fixture();data.core.clienti.push({id:'another'});const s=store(data);
 await assert.rejects(commit(s,cs,opts),/Conflitto/);
 assert.equal(s.calls.includes('backup'),false);
});
