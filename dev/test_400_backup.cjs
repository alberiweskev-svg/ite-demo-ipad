'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app.js','utf8');
const start=source.indexOf('async function restore(input){'),end=source.indexOf('\nwindow.ITEBackup=',start);
assert(start>=0&&end>start,'restore function not found');
const restoreCode=source.slice(start,end);
async function check(failAt){
 const calls=[],data={clienti:[],immobili:[],impianti:[],apparecchiature:[],interventi:[],cantieri:[]};
 const backup={format:'ITE-complete',schema:1,data,docs:[],commerce:{documents:[],articles:[],movements:[]}};
 let docsCount=0,commerceCount=0;
 const context={
 busy:false,window:{ITECommerce:{busy:()=>false,validate:()=>{},replaceState:async()=>{commerceCount++;if(failAt==='commerce'&&commerceCount===1)throw Error('Commerce error')}},ITEHistory:{create:async()=>{}}},
 document:{getElementById:()=>({hidden:true})},message:m=>calls.push(m),
 ITEVault:{openBackup:async()=>backup},ITE:{validate:()=>true,replaceData:()=>{if(failAt==='data')throw Error('Data error')}},
 ITEDocs:{validDate:()=>true,replaceDocs:async()=>{docsCount++;if(failAt==='docs'&&docsCount===1)throw Error('Docs error')}},
 pack:async()=>backup,downloadObject:()=>calls.push('download'),confirm:()=>true,location:{reload:()=>calls.push('reload')},
 Uint8Array,atob:()=>'',JSON,Set,Array,Object,Number,String,Error
 };
 vm.createContext(context);
 vm.runInContext(restoreCode+';this.runRestore=restore',context);
 await context.runRestore({files:[{text:async()=>JSON.stringify(backup)}],value:''});
 return {calls,docsCount,commerceCount};
}
(async()=>{
 let r=await check();assert(r.calls.includes('reload'));
 for(const failure of ['docs','commerce','data']){
  r=await check(failure);
  assert(!r.calls.includes('reload'),failure);
  assert.equal(r.docsCount,2,failure);
  assert.equal(r.commerceCount,2,failure);
  assert(r.calls.some(x=>x.includes('Ripristino non completato')),failure);
 }
 console.log('OK: 4 backup restore scenarios');
})().catch(e=>{console.error(e);process.exitCode=1});
