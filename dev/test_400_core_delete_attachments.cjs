'use strict';
// Regressione: impedire cancellazioni che lasciano fotografie o riferimenti magazzino orfani.
// Usa esclusivamente record e allegati fittizi.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app.js','utf8');
const start=source.indexOf('const reset=ITE.reset,importData=ITE.importData;');
const end=source.indexOf('function hasLinkedData(',start);
assert(start>=0&&end>start,'Wrapper eliminazione anagrafica non trovato');
async function scenario({kind='clienti',id=1,docs=[],missing=false,invalid=false,commerce={documents:[],movements:[]},commerceMissing=false,commerceInvalid=false,commerceFail=false}={}){
 const removed=[],alerts=[];
 const context={
  ITE:{remove:(k,n)=>{removed.push([k,n]);return 'eliminato'},reset:()=>{},importData:()=>{}},
  window:{
   ITEDocs:missing?undefined:{listDocs:async()=>{if(invalid)throw Error('Archivio documenti non leggibile');return docs}},
   ITECommerce:commerceMissing?undefined:{exportState:async()=>{if(commerceFail)throw Error('Archivio magazzino non leggibile');return commerceInvalid?{documents:null,movements:null}:commerce}}
  },
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
 r=await scenario({kind:'cantieri',id:9,commerce:{documents:[],movements:[{siteId:'9'}]}});
 assert.equal(r.removed.length,0,'Non eliminare cantiere con movimenti magazzino collegati');
 assert(r.alerts.some(s=>/magazzino|moviment/i.test(s)),'Mostrare la causa del blocco magazzino');
 r=await scenario({kind:'clienti',id:1,commerce:{documents:[{id:'fattura-demo',subjectIds:['1']}],movements:[]}});
 assert.equal(r.removed.length,0,'Non eliminare soggetto citato in subjectIds di un documento importato');
 r=await scenario({kind:'clienti',id:1,commerce:{documents:[{id:'fattura-demo',clientId:'1'}],movements:[]}});
 assert.equal(r.removed.length,0,'Non eliminare cliente collegato a una fattura');
 r=await scenario({kind:'immobili',id:5,commerce:{documents:[{id:'fattura-demo',propertyId:'5'}],movements:[]}});
 assert.equal(r.removed.length,0,'Non eliminare immobile collegato a un documento importato');
 r=await scenario({kind:'impianti',id:6,commerce:{documents:[{id:'progetto-demo',plantId:'6'}],movements:[]}});
 assert.equal(r.removed.length,0,'Non eliminare impianto collegato a un documento importato');
 r=await scenario({kind:'apparecchiature',id:7,commerce:{documents:[{id:'progetto-demo',deviceId:'7'}],movements:[]}});
 assert.equal(r.removed.length,0,'Non eliminare apparecchiatura collegata a un documento importato');
 r=await scenario({kind:'interventi',id:8,commerce:{documents:[{id:'rapporto-demo',jobId:'8'}],movements:[]}});
 assert.equal(r.removed.length,0,'Non eliminare intervento collegato a un documento importato');
 r=await scenario({kind:'cantieri',id:9,commerce:{documents:[{id:'pos-demo',siteId:'9'}],movements:[]}});
 assert.equal(r.removed.length,0,'Non eliminare cantiere collegato a un documento importato');
 r=await scenario({kind:'cantieri',id:9,commerce:{documents:[{id:'pos-altro',siteId:'10'}],movements:[{siteId:'10'}]}});
 assert.equal(r.removed.length,1,'Movimenti e documenti di un altro cantiere non devono bloccare');
 r=await scenario({commerceMissing:true});
 assert.equal(r.removed.length,0,'Blocco sicuro se il magazzino non e disponibile');
 r=await scenario({commerceInvalid:true});
 assert.equal(r.removed.length,0,'Blocco sicuro se il magazzino restituisce dati non validi');
 r=await scenario({commerceFail:true});
 assert.equal(r.removed.length,0,'Blocco sicuro se la lettura del magazzino fallisce');
 console.log('OK: cancellazione anagrafiche protetta da allegati e riferimenti magazzino, fallimento sicuro e casi leciti');
})().catch(e=>{console.error(e);process.exitCode=1});
