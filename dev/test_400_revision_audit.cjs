'use strict';
// Regressione audit: chiusura originale, riapertura, nuova chiusura.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app.js','utf8');
const start=source.indexOf('function revisionAudit(job){'),end=source.indexOf('function revision(id){',start);
assert(start>=0&&end>start,'Audit revisioni non trovato');
const context={JSON,Array,Error};
vm.createContext(context);vm.runInContext(source.slice(start,end)+';this.audit=revisionAudit',context);
const job={id:7,revision_audit:JSON.stringify([
 {action:'CHIUSURA_INTERVENTO',operator_id:'1',at:'2026-10-24T09:30:00Z'},
 {action:'RIAPERTURA_REVISIONE',operator_id:'1',at:'2026-10-24T10:00:00Z',previous_closed_at:'2026-10-24T09:30:00Z'},
 {action:'CHIUSURA_DOPO_REVISIONE',operator_id:'1',at:'2026-10-24T10:30:00Z'}
])};
const events=context.audit(job);
assert.deepEqual(Array.from(events,e=>e.action),['CHIUSURA_INTERVENTO','RIAPERTURA_REVISIONE','CHIUSURA_DOPO_REVISIONE']);
assert.equal(events[1].previous_closed_at,events[0].at);
assert(events.every(e=>e.operator_id==='1'));
assert.equal(job.id,7);
assert.throws(()=>context.audit({revision_audit:'invalid'}),/Storico revisioni non leggibile/);
assert.throws(()=>context.audit({revision_audit:'[{}]'}),/Storico revisioni non valido/);
console.log('OK: storico chiusura, revisione, operatore e audit non valido');
