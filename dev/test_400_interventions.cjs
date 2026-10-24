'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app.js','utf8');
function extract(name){const start=source.indexOf('function '+name+'(');assert(start>=0,'Missing '+name);const begin=source.indexOf('{',start);let depth=0,quote='',esc=false;for(let i=begin;i<source.length;i++){const c=source[i];if(quote){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if(c===quote)quote='';continue}if(c==='"'||c==="'"||c==='\x60'){quote=c;continue}if(c==='{')depth++;else if(c==='}'&&!--depth)return source.slice(start,i+1)}throw Error('Unterminated '+name)}
const functions=['recalculate','finish'].map(extract).join(';');
function scenario({revision=false,openSupport=false,actorId='2'}={}){
 const alerts=[],msgs=[],job={id:7,appointment:'1',workflow_status:'In corso',assigned_operators:JSON.stringify([{operator_id:'2',role:'Principale'},{operator_id:'3',role:'Supporto'}]),work_sessions:JSON.stringify([{id:'s1',operator_id:'2',arrived_at:'2026-10-24T08:00:00Z',departed_at:''},{id:'s2',operator_id:'3',arrived_at:'2026-10-24T08:00:00Z',departed_at:openSupport?'':'2026-10-24T08:30:00Z'}]),revision_audit:revision?JSON.stringify([{action:'CHIUSURA_INTERVENTO',at:'2026-10-23T09:00:00Z'},{action:'RIAPERTURA_REVISIONE',at:'2026-10-24T08:00:00Z',previous_closed_at:'2026-10-23T09:00:00Z'}]):'[]'};
 const ctx={actor:()=>actorId,confirm:()=>true,now:()=> '2026-10-24T09:00:00Z',ITE:{commit:fn=>fn({interventi:[job]})},assignments:j=>JSON.parse(j.assigned_operators),sessions:j=>JSON.parse(j.work_sessions),secondsFor:s=>(Date.parse(s.departed_at)-Date.parse(s.arrived_at))/1000,validateDatabase:()=>{},open:()=>{},message:m=>msgs.push(m),alert:m=>alerts.push(m),Date,JSON,String,Math,Number};
 vm.createContext(ctx);vm.runInContext(functions+';finish(7)',ctx);return {job,alerts,msgs};
}
let r=scenario();assert.equal(r.alerts.length,0);assert.equal(r.job.workflow_status,'Chiuso');assert.equal(JSON.parse(r.job.revision_audit)[0].action,'CHIUSURA_INTERVENTO');
r=scenario({revision:true});assert.equal(r.job.workflow_status,'Chiuso');assert.deepEqual(JSON.parse(r.job.revision_audit).map(x=>x.action),['CHIUSURA_INTERVENTO','RIAPERTURA_REVISIONE','CHIUSURA_DOPO_REVISIONE']);
r=scenario({revision:true,openSupport:true});assert.equal(r.job.workflow_status,'In corso');assert.equal(JSON.parse(r.job.revision_audit).length,2);
r=scenario({actorId:'4'});assert.equal(r.alerts.length,1);assert.equal(JSON.parse(r.job.revision_audit).length,0);
console.log('OK: 4 intervention closure tests (first close, revision close, support still active, unauthorized operator)');
