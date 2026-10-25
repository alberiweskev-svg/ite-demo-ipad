'use strict';
// Verifica la conservazione degli allegati storici senza dati di clienti reali.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app.js','utf8');
const start=source.indexOf('function protectInterventionDocument(doc){');
const end=source.indexOf('const cameraControls=',start);
assert(start>=0&&end>start,'Controllo conservazione documenti non trovato');
const code=source.slice(start,end)+';this.removeDoc=remove;';
async function scenario({status='In corso',audit='[]',parentType='interventi',jobExists=true,allow=true,missing=false,changed=false}={}){
 let doc=missing?null:{id:'foto-test',parentType,parentId:'7',fileName:'foto-fittizia.jpg'};
 const job={id:7,workflow_status:status,revision_audit:audit};
 let reads=0,confirms=0,deletes=0,refreshes=0,previews=0;const notices=[];
 const ctx={
  data:()=>({interventi:jobExists?[job]:[]}),
  readOne:async()=>{reads++;return changed&&reads===2?{...doc,parentId:'999'}:doc},
  change:async fn=>fn({delete:()=>{deletes++;doc=null}}),
  confirm:()=>{confirms++;return allow},
  closePreview:()=>{previews++},refresh:async()=>{refreshes++},note:s=>notices.push(s)
 };
 vm.createContext(ctx);vm.runInContext(code,ctx);
 await ctx.removeDoc('foto-test');
 return {reads,confirms,deletes,refreshes,previews,notices};
}
(async()=>{
 let r=await scenario({status:'Chiuso'});
 assert.equal(r.deletes,0);assert.equal(r.confirms,0);assert.match(r.notices[0],/chiuso/);
 r=await scenario({status:'In corso',audit:JSON.stringify([{action:'CHIUSURA_INTERVENTO',at:'2026-10-24T09:00:00Z'},{action:'RIAPERTURA_REVISIONE',at:'2026-10-24T10:00:00Z'}])});
 assert.equal(r.deletes,0);assert.equal(r.confirms,0);assert.match(r.notices[0],/revisionato/);
 r=await scenario({audit:JSON.stringify([{action:'RIAPERTURA_REVISIONE'}])});
 assert.equal(r.deletes,0);
 r=await scenario({audit:'{non-valido'});
 assert.equal(r.deletes,0);assert.match(r.notices[0],/illeggibile/);
 r=await scenario({audit:'{}'});
 assert.equal(r.deletes,0);assert.match(r.notices[0],/non valido/);
 r=await scenario({jobExists:false});
 assert.equal(r.deletes,0);assert.equal(r.confirms,0);
 r=await scenario();
 assert.equal(r.deletes,1);assert.equal(r.confirms,1);assert.equal(r.reads,2);assert.equal(r.refreshes,1);
 r=await scenario({parentType:'clienti'});
 assert.equal(r.deletes,1,'Documento non collegato a intervento: normale eliminazione consentita');
 r=await scenario({allow:false});
 assert.equal(r.deletes,0);assert.equal(r.confirms,1);
 r=await scenario({changed:true});
 assert.equal(r.deletes,0);assert.match(r.notices[0],/Collegamento documento modificato/);
 r=await scenario({missing:true});
 assert.equal(r.deletes,0);assert.equal(r.confirms,0);
 console.log('OK: 11 controlli conservazione allegati (chiusura, revisione, corruzione, permessi di cancellazione e collegamenti)');
})().catch(e=>{console.error(e);process.exitCode=1});
