'use strict';
// Riapertura: conservare ore precedenti e aggiungere solo quelle della revisione.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app.js','utf8');
const start=source.indexOf('function recalculate(job){'),end=source.indexOf('function start(id){',start);
assert(start>=0&&end>start,'Ricalcolo calendario non trovato');
const context={sessions:job=>JSON.parse(job.work_sessions),assignments:job=>JSON.parse(job.operator_assignments),secondsFor:s=>(Date.parse(s.departed_at||s.arrived_at)-Date.parse(s.arrived_at))/1000,JSON,String,Math};
vm.createContext(context);vm.runInContext(source.slice(start,end)+';this.recalculateJob=recalculate',context);
const job={operator_assignments:JSON.stringify([{operator_id:'1',role:'Principale'},{operator_id:'2',role:'Supporto'}]),work_sessions:JSON.stringify([
 {id:'a',operator_id:'1',arrived_at:'2026-10-24T08:00:00Z',departed_at:'2026-10-24T09:30:00Z'},
 {id:'b',operator_id:'2',arrived_at:'2026-10-24T08:00:00Z',departed_at:'2026-10-24T09:15:00Z'}])};
context.recalculateJob(job);
assert.equal(job.workflow_status,'Chiuso');
assert.equal(job.labor_minutes,'165');
const sessions=JSON.parse(job.work_sessions);
sessions.push({id:'rev',operator_id:'1',arrived_at:'2026-10-24T10:00:00Z',departed_at:''});
job.work_sessions=JSON.stringify(sessions);context.recalculateJob(job);
assert.equal(job.workflow_status,'In corso');
assert.equal(job.labor_minutes,'165','Ore precedenti preservate durante revisione');
sessions[2].departed_at='2026-10-24T10:30:00Z';job.work_sessions=JSON.stringify(sessions);
context.recalculateJob(job);
assert.equal(job.workflow_status,'Chiuso');
assert.equal(job.labor_minutes,'195','30 minuti revisione aggiunti senza duplicare le ore precedenti');
assert.equal(JSON.parse(job.work_logs).length,2,'Un totale per operatore');
console.log('OK: chiusura, riapertura e seconda chiusura con ore preservate');
