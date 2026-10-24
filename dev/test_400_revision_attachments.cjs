'use strict';
// Test dinamico della riapertura su un intervento con allegati preesistenti.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app.js','utf8');
const start=source.indexOf('function revision(id){'),end=source.indexOf('function finish(id){',start);
assert(start>=0&&end>start,'Funzione revisione non trovata');
const job={id:7,appointment:'1',workflow_status:'Chiuso',finished_at:'2026-10-24T09:30:00Z',
 operator_assignments:JSON.stringify([{operator_id:'1',role:'Principale'}]),
 work_sessions:JSON.stringify([{id:'initial',operator_id:'1',arrived_at:'2026-10-24T08:00:00Z',departed_at:'2026-10-24T09:30:00Z'}]),
 revision_audit:JSON.stringify([{action:'CHIUSURA_INTERVENTO',operator_id:'1',at:'2026-10-24T09:30:00Z'}])};
const docs=[{id:'foto-1',parentType:'interventi',parentId:7,filename:'prima.jpg'},{id:'rapporto-1',parentType:'interventi',parentId:7,filename:'rapporto.pdf'}];
const originalDocs=JSON.stringify(docs);let opened=0,notice='';
const context={actor:()=> '1',confirm:()=>true,now:()=> '2026-10-24T10:00:00Z',
 ITE:{commit:fn=>fn({interventi:[job]})},assignments:j=>JSON.parse(j.operator_assignments),
 sessions:j=>JSON.parse(j.work_sessions),revisionAudit:j=>JSON.parse(j.revision_audit),
 recalculate:j=>{j.workflow_status='In corso';j.finished_at='';},
 validateDatabase:()=>{},open:()=>opened++,message:x=>notice=x,alert:x=>{throw Error(x)},
 Date,Math,JSON,Number,Error};
vm.createContext(context);vm.runInContext(source.slice(start,end)+';this.revise=revision',context);
context.revise(7);
assert.equal(job.id,7);assert.equal(job.workflow_status,'In corso');assert.equal(opened,1);
assert.equal(JSON.stringify(docs),originalDocs,'Gli allegati non devono essere modificati');
const sessions=JSON.parse(job.work_sessions);
assert.equal(sessions.length,2);assert.equal(sessions[0].departed_at,'2026-10-24T09:30:00Z');
const audit=JSON.parse(job.revision_audit);
assert.equal(audit.length,2);assert.equal(audit[0].action,'CHIUSURA_INTERVENTO');
assert.equal(audit[1].action,'RIAPERTURA_REVISIONE');
assert.equal(audit[1].previous_closed_at,'2026-10-24T09:30:00Z');
assert(notice.includes('riaperto'));
// Annullamento esplicito: nessuna scrittura e nessuna alterazione dei documenti.
const originalJob=JSON.stringify(job);
let cancelledCommits=0;
const cancelled={...context,confirm:()=>false,ITE:{commit:()=>{cancelledCommits++;}}};
vm.createContext(cancelled);vm.runInContext(source.slice(start,end)+';this.revise=revision',cancelled);
cancelled.revise(7);
assert.equal(cancelledCommits,0);
assert.equal(JSON.stringify(job),originalJob);
assert.equal(JSON.stringify(docs),originalDocs);
// Un operatore non assegnato non può riaprire né alterare lo storico.
const closedJob={...job,workflow_status:'Chiuso',finished_at:'2026-10-24T09:30:00Z'};
const unauthorizedJob=JSON.stringify(closedJob);
let unauthorizedError='',unauthorizedOpened=0;
const unauthorized={...context,actor:()=> '999',ITE:{commit:fn=>fn({interventi:[closedJob]})},
 open:()=>unauthorizedOpened++,alert:x=>{unauthorizedError=x;}};
vm.createContext(unauthorized);vm.runInContext(source.slice(start,end)+';this.revise=revision',unauthorized);
unauthorized.revise(7);
assert.match(unauthorizedError,/Non sei assegnato/);
assert.equal(unauthorizedOpened,0);
assert.equal(JSON.stringify(closedJob),unauthorizedJob);
assert.equal(JSON.stringify(docs),originalDocs);
console.log('OK: revisione dinamica conserva intervento, chiusura precedente e riferimenti allegati');
