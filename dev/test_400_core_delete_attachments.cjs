'use strict';
// Regressione: impedire cancellazioni che lasciano fotografie o riferimenti magazzino orfani.
// Usa esclusivamente record e allegati fittizi.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app.js','utf8');
const start=source.indexOf('const reset=ITE.reset,importData=ITE.importData;');
const end=source.indexOf('function hasLinkedData(',start);
assert(start>=0&&end>start,'Wrapper eliminazione anagrafica non trovato');
async function scenario({kind='clienti',id=1,docs=[],docSnapshots=null,missing=false,invalid=false,commerce={documents:[],movements:[]},commerceSnapshots=null,commerceMissing=false,commerceInvalid=false,commerceFail=false,docsSaving=false}={}){
 const removed=[],alerts=[];let docRead=0,commerceRead=0;
 const context={
  ITE:{remove:(k,n)=>{removed.push([k,n]);return 'eliminato'},reset:()=>{},importData:()=>{}},
  window:{
   ITEDocs:missing?undefined:{isSaving:()=>docsSaving,listDocs:async()=>{if(invalid)throw Error('Archivio documenti non leggibile');return docSnapshots?docSnapshots[Math.min(docRead++,docSnapshots.length-1)]:docs}},
   ITECommerce:commerceMissing?undefined:{exportState:async()=>{if(commerceFail)throw Error('Archivio magazzino non leggibile');return commerceInvalid?{documents:null,movements:null}:commerceSnapshots?commerceSnapshots[Math.min(commerceRead++,commerceSnapshots.length-1)]:commerce}}
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
 r=await scenario({docs:[],docsSaving:true});
 assert.equal(r.removed.length,0,'Bloccare eliminazione durante il salvataggio di una foto non ancora visibile in IndexedDB');
 assert(r.alerts.some(s=>/salvataggio|acquisizione|fotograf/i.test(s)),'Segnalare che la foto e in acquisizione');
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
 r=await scenario({kind:'clienti',id:1,commerce:{documents:[{id:'fattura-altro',subjectIds:['2']}],movements:[]}});
 assert.equal(r.removed.length,1,'Soggetti diversi nei documenti importati non devono impedire la cancellazione');
 r=await scenario({commerce:{documents:[null],movements:[]}});
 assert.equal(r.removed.length,0,'Bloccare in sicurezza se un documento importato e corrotto');
 r=await scenario({commerceMissing:true});
 assert.equal(r.removed.length,0,'Blocco sicuro se il magazzino non e disponibile');
 r=await scenario({commerceInvalid:true});
 assert.equal(r.removed.length,0,'Blocco sicuro se il magazzino restituisce dati non validi');
 r=await scenario({commerceFail:true});
 assert.equal(r.removed.length,0,'Blocco sicuro se la lettura del magazzino fallisce');
 r=await scenario({docs:[{id:'d-subject',parentType:'cantieri',parentId:'9',subjectId:'1'}]});
 assert.equal(r.removed.length,0,'Un allegato associato al soggetto deve impedirne la cancellazione');
 r=await scenario({kind:'cantieri',id:9,docs:[{id:'d-site',parentType:'clienti',parentId:'2',siteId:'9'}]});
 assert.equal(r.removed.length,0,'Un allegato associato al cantiere deve impedirne la cancellazione');
 r=await scenario({docSnapshots:[[],[{id:'d-late',parentType:'clienti',parentId:'1'}]]});
 assert.equal(r.removed.length,0,'Un documento aggiunto durante la verifica non deve diventare orfano');
 r=await scenario({docSnapshots:[[],[{id:'d-other',parentType:'clienti',parentId:'2'}]]});
 assert.equal(r.removed.length,1,'Un documento aggiunto a un altro cliente non deve bloccare');
 r=await scenario({docSnapshots:[[],null]});
 assert.equal(r.removed.length,0,'Una seconda lettura documenti corrotta deve bloccare');
 r=await scenario({commerceSnapshots:[{documents:[],movements:[]},{documents:[{id:'invoice-late',clientId:'1'}],movements:[]}]});
 assert.equal(r.removed.length,0,'Una fattura aggiunta durante la verifica deve bloccare');
 r=await scenario({commerceSnapshots:[{documents:[],movements:[]},{documents:[{id:'invoice-other',clientId:'2'}],movements:[]}]});
 assert.equal(r.removed.length,0,'Una modifica concorrente del magazzino deve richiedere una nuova verifica');
 r=await scenario({kind:'cantieri',id:9,docSnapshots:[[],[{id:'late-site',parentType:'clienti',parentId:'2',siteId:'9'}]]});
 assert.equal(r.removed.length,0,'Un collegamento al cantiere aggiunto durante la verifica deve bloccare');
 r=await scenario({commerceSnapshots:[{documents:[],movements:[]},null]});
 assert.equal(r.removed.length,0,'Una seconda lettura del magazzino non valida deve bloccare');
 r=await scenario({docs:[null]});
 assert.equal(r.removed.length,0,'Un documento corrotto deve bloccare prima della cancellazione');
 console.log('OK: cancellazione anagrafiche protetta da allegati e riferimenti magazzino, fallimento sicuro e casi leciti');
})().catch(e=>{console.error(e);process.exitCode=1});
