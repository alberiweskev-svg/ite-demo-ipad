'use strict';
// Regressione: una foto salvata non deve risultare verificata se cambia cliente, cantiere o tipo.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const source=fs.readFileSync('app.js','utf8');
const start=source.indexOf('async function verifySavedDocument(doc){');
const end=source.indexOf('\nconst data=()=>ITE.snapshot();',start);
assert(start>=0&&end>start,'Verifica documento non trovata');
const bytes=Uint8Array.from([1,2,3,4]).buffer;
const doc={id:'d-test',parentType:'interventi',parentId:'1',subjectId:'1',siteId:'2',type:'Fotografia tecnica',mime:'image/jpeg',fileName:'foto-fittizia.jpg',size:4,fileBytes:bytes};
async function verify(changes={}){
 const saved={...doc,...changes};
 const context={readOne:async()=>saved,crypto:webcrypto,Uint8Array,ArrayBuffer,Promise,Error};
 vm.createContext(context);
 vm.runInContext(source.slice(start,end)+';this.checkSaved=verifySavedDocument',context);
 return context.checkSaved(doc);
}
(async()=>{
 assert.equal(await verify(),true,'Foto e metadati identici devono essere recuperabili');
 for(const [field,value] of [['parentId','9'],['subjectId','3'],['siteId','4'],['type','Altro'],['mime','application/pdf'],['fileName','altra-foto.jpg']]){
  await assert.rejects(()=>verify({[field]:value}),/File o collegamento non recuperabile/,'Modifica non rilevata: '+field);
 }
 await assert.rejects(()=>verify({fileBytes:Uint8Array.from([1,2,3,5]).buffer}),/Contenuto del file diverso/,'Byte alterati non rilevati');
 console.log('OK: verifica allegato salvato, cliente, cantiere, tipo, MIME, nome e SHA-256');
})().catch(error=>{console.error(error);process.exitCode=1});
