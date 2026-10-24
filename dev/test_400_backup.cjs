'use strict';
// Ripristino e rollback con soli dati dimostrativi.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app.js','utf8');
const start=source.indexOf('async function restore(input){'),end=source.indexOf('\nwindow.ITEBackup=',start);
assert(start>=0&&end>start,'restore function not found');
const restoreCode=source.slice(start,end);
const dataFor=id=>({clienti:[{id,name:'Cliente prova '+id}],immobili:[],impianti:[],apparecchiature:[],interventi:[],cantieri:[]});
async function check(failAt){
 const calls=[],original=dataFor(1),incoming=dataFor(2),commerce={documents:[],articles:[],movements:[]};
 const backup={format:'ITE-complete',schema:1,data:incoming,docs:[],commerce};
 const previous={format:'ITE-complete',schema:1,data:original,docs:[],commerce};
 let docsCount=0,commerceCount=0,coreCount=0,currentCore=original;
 const context={
  busy:false,window:{ITECommerce:{busy:()=>false,validate:()=>{},replaceState:async()=>{
   commerceCount++;if(failAt==='commerce'&&commerceCount===1)throw Error('Commerce error')
  }},ITEHistory:{create:async()=>{}},ITEOperators:{validateDatabase:()=>{if(failAt==='operatorInvalid')throw Error('Tempi operatore incoerenti')}},ITEAgenda:{validateDatabase:()=>{if(failAt==='agendaInvalid')throw Error('Appuntamento incoerente')}}},
  document:{getElementById:()=>({hidden:true})},message:m=>calls.push(m),
  ITEVault:{openBackup:async()=>backup},ITE:{validate:()=>true,replaceData:value=>{
   coreCount++;
   if(failAt==='coreRollback'&&coreCount===2)throw Error('Core rollback error');
   currentCore=value;
   if((failAt==='data'||failAt==='coreRollback')&&coreCount===1)throw Error('Data error');
  }},
  ITEDocs:{validDate:()=>true,replaceDocs:async()=>{
   docsCount++;if(failAt==='docs'&&docsCount===1)throw Error('Docs error')
  }},
  pack:async()=>{if(failAt==='packFailure')throw Error('Backup preventivo non disponibile');return previous},downloadObject:()=>calls.push('download'),confirm:prompt=>failAt==='declineBackupConfirmation'?!prompt.includes('Verifica nell’app File / Download'):true,location:{reload:()=>calls.push('reload')},
  Uint8Array,atob:()=>'',JSON,Set,Array,Object,Number,String,Error
 };
 if(failAt==='moduleMissing')context.window.ITECommerce=undefined;
 if(failAt==='agendaMissing')context.window.ITEAgenda=undefined;
 if(failAt==='operatorsMissing')context.window.ITEOperators=undefined;
 context.ITECommerce=context.window.ITECommerce;context.ITEHistory=context.window.ITEHistory;
 context.ITEAgenda=context.window.ITEAgenda;context.ITEOperators=context.window.ITEOperators;
 vm.createContext(context);
 vm.runInContext(restoreCode+';this.runRestore=restore',context);
 await context.runRestore({files:[{text:async()=>JSON.stringify(backup)}],value:''});
 return {calls,docsCount,commerceCount,coreCount,currentCore};
}
(async()=>{
 let r=await check();
 assert(r.calls.includes('reload'));assert(r.calls.includes('download'),'Backup preventivo obbligatorio prima del ripristino');assert(r.calls.indexOf('download')<r.calls.indexOf('reload'),'Backup prima del ricaricamento');assert.equal(r.currentCore.clienti[0].id,2);assert.equal(r.coreCount,1);
 r=await check('declineBackupConfirmation');
 assert(r.calls.includes('download'),'Backup prepared before final confirmation');
 assert(!r.calls.includes('reload'),'Declined confirmation must not reload');
 assert.equal(r.docsCount,0);assert.equal(r.commerceCount,0);assert.equal(r.coreCount,0);
 r=await check('packFailure');
 assert(!r.calls.includes('download')&&!r.calls.includes('reload'),'Failed preventive backup must block restore');
 assert.equal(r.docsCount,0);assert.equal(r.commerceCount,0);assert.equal(r.coreCount,0);
 assert(r.calls.some(x=>x.includes('Backup preventivo non disponibile')));
 for(const failure of ['docs','commerce','data']){
  r=await check(failure);
  assert(!r.calls.includes('reload'),failure);
  assert.equal(r.docsCount,2,failure);
  assert.equal(r.commerceCount,failure==='docs'?1:2,failure);
  assert.equal(r.coreCount,failure==='data'?2:0,failure);
  assert.equal(r.currentCore.clienti[0].id,1,'Original core must survive '+failure);
  assert(r.calls.some(x=>x.includes('Ripristino non completato')),failure);
 }
 r=await check('coreRollback');
 assert(!r.calls.includes('reload'));
 assert.equal(r.coreCount,2);
 assert.equal(r.currentCore.clienti[0].id,2,'Incomplete rollback must not be reported as success');
 assert(r.calls.some(x=>x.includes('recupero incompleto')&&x.includes('anagrafica')), 'Explicit warning for incomplete core rollback');
 for(const [failure,warning] of [['agendaMissing','Modulo appuntamenti o operatori non disponibile'],['operatorsMissing','Modulo appuntamenti o operatori non disponibile'],['agendaInvalid','Appuntamento incoerente'],['operatorInvalid','Tempi operatore incoerenti']]){
  r=await check(failure);
  assert.equal(r.docsCount,0,failure);assert.equal(r.commerceCount,0,failure);assert.equal(r.coreCount,0,failure);
  assert(!r.calls.includes('download')&&!r.calls.includes('reload'),failure);
  assert(r.calls.some(x=>x.includes(warning)),failure);
 }
 r=await check('moduleMissing');
 assert.equal(r.docsCount,0,'Missing commerce must not replace attachments');
 assert.equal(r.coreCount,0,'Missing commerce must not replace core data');
 assert.equal(r.commerceCount,0,'Missing commerce must not replace warehouse');
 assert(!r.calls.includes('download')&&!r.calls.includes('reload'));
 assert(r.calls.some(x=>x.includes('Modulo magazzino non disponibile')));
 const packStart=source.indexOf('async function pack(){'),packEnd=source.indexOf('\nfunction downloadObject(',packStart);
 assert(packStart>=0&&packEnd>packStart,'Complete backup function not found');
 const packContext={window:{},Error};
 vm.createContext(packContext);
 vm.runInContext(source.slice(packStart,packEnd)+';this.runPack=pack',packContext);
 await assert.rejects(()=>packContext.runPack(),/Modulo magazzino non disponibile/);
 console.log('OK: 13 backup restore, rollback and missing-module scenarios');
})().catch(e=>{console.error(e);process.exitCode=1});
