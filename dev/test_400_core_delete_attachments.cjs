'use strict';
// Regressione: impedire cancellazioni anagrafiche che lasciano fotografie orfane.
// Usa esclusivamente record e allegati fittizi.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app.js','utf8');
const start=source.indexOf('const reset=ITE.reset,importData=ITE.importData;');
const end=source.indexOf('function hasLinkedData(',start);
assert(start>=0&&end>start,'Wrapper eliminazione anagrafica non trovato');
async function scenario({kind='clienti',id=1,docs=[],missing=false,invalid=false}={}){
 const removed=[],alerts=[];
 const context={
  ITE:{remove:(k,n)=>{removed.push([k,n]);return 'eliminato'},reset:()=>{},importData:()=>{}},
  window:{ITEDocs:missing?undefined:{listDocs:async()=>{if(invalid)throw Error('Archivio documenti non leggibile');return docs}}},
  alert:s=>alerts.push(s)
 };
 vm.createContext(context);
 vm.runInContext(source.slice(start,end),context);
 await context.ITE.remove(kind,id);
 return {removed,alerts};
}
(async()=>{
 let r=await scenario({docs:[{id:'d-demo',parentType:'clienti',parentId:'1',fileName:'foto-fittizia.png'}]});
 assert.equal(r.removed.length,0,'Non eliminare cliente con foto collegata');
 assert(r.alerts.some(s=>/document|allegat/i.test(s)),'Spiegare il blocco all’utente');
 r=await scenario({kind:'apparecchiature',id:8,docs:[{id:'d-demo',parentType:'apparecchiature',parentId:'8'}]});
 assert.equal(r.removed.length,0,'Non eliminare apparecchiatura con allegati');
 r=await scenario({kind:'cantieri',id:9,docs:[{id:'d-demo',parentType:'cantieri',parentId:'9'}]});
 assert.equal(r.removed.length,0,'Non eliminare cantiere con fotografie');
 r=await scenario({docs:[{id:'d-demo',parentType:'clienti',parentId:'2'}]});
 assert.equal(r.removed.length,1,'Un allegato di altro cliente non deve impedire la cancellazione');
 r=await scenario({missing:true});
 assert.equal(r.removed.length,0,'Bloccare se il modulo documenti non è disponibile');
 r=await scenario({invalid:true});
 assert.equal(r.removed.length,0,'Bloccare se la lettura IndexedDB fallisce');
 assert(r.alerts.some(s=>/non leggibile/i.test(s)),'Mostrare il problema di lettura');
 r=await scenario({docs:[]});
 assert.equal(r.removed.length,1,'Consentire eliminazione di record senza allegati');
 console.log('OK: cancellazione anagrafiche protetta dagli allegati, fallimento sicuro e casi leciti');
})().catch(e=>{console.error(e);process.exitCode=1});
