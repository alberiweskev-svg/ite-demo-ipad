'use strict';
// Regressione download backup su Safari/iPad: il link deve essere nel DOM al click.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('app.js','utf8');
const start=source.indexOf('function downloadObject(value){');
const end=source.indexOf('\nasync function download(){',start);
assert(start>=0&&end>start,'Funzione downloadObject non trovata');
const fn=source.slice(start,end)+';downloadObject';
async function exercise(throwOnClick=false){
 let connected=false,clicked=0,removed=0,blob,revoke,timeout;
 const anchor={href:'',download:'',
  click(){assert.equal(connected,true,'Link backup non inserito nel DOM prima del click');clicked++;if(throwOnClick)throw Error('Download non disponibile')},
  remove(){assert.equal(connected,true);connected=false;removed++}};
 const context={
  Blob,Date,JSON,
  ITEVault:{sealBackup:payload=>({format:'ITE-encrypted-backup',payload})},
  URL:{createObjectURL:value=>{blob=value;return 'blob:backup-fittizio'},revokeObjectURL:value=>{revoke=value}},
  document:{body:{append:node=>{assert.equal(node,anchor);connected=true}},createElement:tag=>{assert.equal(tag,'a');return anchor}},
  setTimeout:(fn,ms)=>{timeout={fn,ms}}
 };
 const download=vm.runInNewContext(fn,context);
 if(throwOnClick)assert.throws(()=>download({format:'ITE-complete',docs:[]}),/Download non disponibile/);
 else download({format:'ITE-complete',docs:[]});
 assert.equal(clicked,1,'Il download deve essere attivato una sola volta');
 assert.equal(removed,1,'Il link temporaneo deve essere rimosso anche se il click fallisce');
 assert.equal(connected,false,'Il link non deve restare nel DOM');
 assert.match(anchor.download,/^ITE_backup_completo_.*\.json$/);
 assert.equal(timeout.ms,30000,'L’URL deve restare disponibile per il browser');
 timeout.fn();
 assert.equal(revoke,'blob:backup-fittizio');
 const exported=JSON.parse(await blob.text());
 assert.equal(exported.format,'ITE-encrypted-backup','Il file deve restare cifrato');
 assert.equal(exported.payload.format,'ITE-complete');
}
(async()=>{
 await exercise(false);
 await exercise(true);
 console.log('OK: download backup con link nel DOM, pulizia su errore e contenuto cifrato');
})().catch(error=>{console.error(error);process.exitCode=1});
