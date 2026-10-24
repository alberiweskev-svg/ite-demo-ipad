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
  }},ITEHistory:{create:async()=>{}}},
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
  pack:async()=>previous,downloadObject:()=>calls.push('download'),confirm:()=>true,location:{reload:()=>calls.push('reload')},
  Uint8Array,atob:()=>'',JSON,Set,Array,Object,Number,String,Error
 };
 context.ITECommerce=context.window.ITECommerce;context.ITEHistory=context.window.ITEHistory;
 vm.createContext(context);
 vm.runInContext(restoreCode+';this.runRestore=restore',context);
 await context.runRestore({files:[{text:async()=>JSON.stringify(backup)}],value:''});
 return {calls,docsCount,commerceCount,coreCount,currentCore};
}
(async()=>{
 let r=await check();
 assert(r.calls.includes('reload'));assert.equal(r.currentCore.clienti[0].id,2);assert.equal(r.coreCount,1);
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
 console.log('OK: 5 backup restore and rollback scenarios');
})().catch(e=>{console.error(e);process.exitCode=1});
