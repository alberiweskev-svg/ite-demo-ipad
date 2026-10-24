'use strict';
// Dati esclusivamente fittizi: importazione archivio demo cifrato e conferme di sicurezza.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app.js','utf8');
const start=source.indexOf('function importData(e){'),end=source.indexOf('function commit(mutator)',start);
assert(start>=0&&end>start,'Importazione demo non trovata');
const code=source.slice(start,end);
const initial=()=>({clienti:[{id:1,name:'Cliente precedente'}],immobili:[],impianti:[],apparecchiature:[],interventi:[],cantieri:[]});
async function scenario(file,opts={}){
 const pending=[],calls={persist:0,render:0,alerts:[],feedback:[],confirmed:0};
 const context={
  db:initial(),FileReader:class{
   readAsText(f){if(f.fail){this.onerror();return}this.result=f.content;pending.push(this.onload())}
  },
  ITEVault:{openBackup:async value=>{
   if(value.format!=='ITE-encrypted-backup')return value;
   if(value.badPassword)throw Error('Password errata');
   return value.payload;
  }},
  valid:value=>!!value&&Array.isArray(value.clienti),
  window:{ITEContacts:{validateLinks:()=>{}}},ITEContacts:{validateLinks:()=>{}},
  persist:()=>{calls.persist++},render:()=>{calls.render++},
  feedback:value=>calls.feedback.push(value),
  alert:value=>calls.alerts.push(value),
  confirm:()=>{calls.confirmed++;return opts.confirm!==false},
  File:undefined,JSON,Array,Error
 };
 vm.createContext(context);
 vm.runInContext(code+';this.runImport=importData',context);
 const input={files:[file],value:'selected'};
 context.runImport({target:input});
 await Promise.all(pending);
 return {calls,db:context.db,input};
}
(async()=>{
 const fresh={...initial(),clienti:[{id:2,name:'Cliente dimostrativo'}]};
 let r=await scenario({content:JSON.stringify({format:'ITE-encrypted-backup',payload:{version:'4.0.0',data:fresh}})});
 assert.equal(r.db.clienti[0].id,2);assert.equal(r.calls.persist,1);assert.equal(r.input.value,'');
 r=await scenario({content:JSON.stringify({version:'3.0',data:fresh})});
 assert.equal(r.db.clienti[0].id,2);assert.equal(r.calls.persist,1);
 r=await scenario({content:JSON.stringify({format:'ITE-encrypted-backup',badPassword:true})});
 assert.equal(r.db.clienti[0].id,1);assert.equal(r.calls.persist,0);assert.match(r.calls.alerts[0],/Password errata/);
 r=await scenario({content:JSON.stringify({format:'ITE-encrypted-backup',payload:{format:'ITE-complete',data:fresh}})});
 assert.equal(r.calls.persist,0);assert.match(r.calls.alerts[0],/Ripristina backup completo/);
 r=await scenario({content:JSON.stringify({version:'3.0',data:{clienti:'invalid'}})});
 assert.equal(r.calls.persist,0);assert.match(r.calls.alerts[0],/Struttura non valida/);
 r=await scenario({content:JSON.stringify({version:'3.0',data:fresh})},{confirm:false});
 assert.equal(r.calls.persist,0);assert.equal(r.db.clienti[0].id,1);
 r=await scenario({fail:true});
 assert.equal(r.calls.persist,0);assert.match(r.calls.alerts[0],/Impossibile leggere/);
 for(const name of ['ITE.reset=async()=>','ITE.importData=async event=>']){
  const begin=source.indexOf(name),finish=source.indexOf(';\n',begin);
  assert(begin>=0&&finish>begin,'Missing '+name);
  const block=source.slice(begin,finish);
  assert(block.indexOf('downloadObject(await pack())')>=0,'Backup missing '+name);
  assert(block.indexOf('downloadObject(await pack())')<block.indexOf("if(!confirm('Verifica nei Download"),'Confirmation must follow backup '+name);
 }
 console.log('OK: 7 demo import scenarios and 2 destructive-action guards');
})().catch(e=>{console.error(e);process.exitCode=1});
