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
async function verify(changes={},originalChanges={}){
 const saved={...doc,...changes};
 const context={readOne:async()=>saved,crypto:webcrypto,Uint8Array,ArrayBuffer,Promise,Error};
 vm.createContext(context);
 vm.runInContext(source.slice(start,end)+';this.checkSaved=verifySavedDocument',context);
 return context.checkSaved({...doc,...originalChanges});
}
(async()=>{
 assert.equal(await verify(),true,'Foto e metadati identici devono essere recuperabili');
 for(const [field,value] of [['parentId','9'],['subjectId','3'],['siteId','4'],['type','Altro'],['mime','application/pdf'],['fileName','altra-foto.jpg']]){
  await assert.rejects(()=>verify({[field]:value}),/File o collegamento non recuperabile/,'Modifica non rilevata: '+field);
 }
 await assert.rejects(()=>verify({fileBytes:Uint8Array.from([1,2,3,5]).buffer}),/Contenuto del file diverso/,'Byte alterati non rilevati');
 await assert.rejects(()=>verify({size:5},{size:5}),/File acquisito incompleto/,'Dimensione dichiarata incoerente con i byte acquisiti');
 const partial=Uint8Array.from([1,2,3]).buffer;
 await assert.rejects(()=>verify({fileBytes:partial},{fileBytes:partial}),/File acquisito incompleto/,'Byte incompleti non devono risultare verificati anche se coincidono in archivio');
 // Simula il percorso file input fotocamera su iPad: il file incompleto
 // deve essere rifiutato prima della scrittura IndexedDB.
 const saveStart=source.indexOf('async function save(e){',end);
 const saveEnd=source.indexOf('\nfunction closePreview()',saveStart);
 assert(saveStart>=0&&saveEnd>saveStart,'Salvataggio documento non trovato');
 let writes=0;const notices=[];let captured;
 let currentRecords={clienti:[{id:1},{id:2}],immobili:[{id:3,client_id:'1'}],cantieri:[{id:8,client_id:'2'},{id:9,client_id:'1'}]};
 const cameraFile={name:'foto-fittizia.jpg',size:4,arrayBuffer:async()=>partial};
 const fields={
  'docs-camera':{files:[cameraFile]},
  'docs-file':{files:[{name:'altro.pdf',size:100}]},
  'docs-parent-type':{value:'clienti'},
  'docs-parent-id':{value:'1'},
  'docs-subject':{value:'1'},
  'docs-site':{value:''},
  'docs-type':{value:'Fotografia tecnica'},
  'docs-date':{value:''},
  'docs-expires':{value:''},
  'docs-number':{value:''},
  'docs-note':{value:''},
  'docs-form':{querySelector:()=>({disabled:false})}
 };
 const saveContext={
  ITE:{archiveReadable:()=>true},data:()=>currentRecords,ownerFor:()=> '1',
  selectedFileSource:'camera',saving:false,$:id=>fields[id],
  mime:name=>name.endsWith('.jpg')?'image/jpeg':undefined,
  validDate:()=>true,alert:message=>notices.push(message),
  note:message=>notices.push(message),
  change:async fn=>fn({put:value=>{writes++;captured=value}}),
  verifySavedDocument:async()=>true,hideForm:()=>{},refresh:async()=>{},
  ArrayBuffer,Number,Date,Math,Promise,Error,crypto:webcrypto
 };
 vm.createContext(saveContext);
 vm.runInContext(source.slice(saveStart,saveEnd)+';this.savePhoto=save',saveContext);
 await saveContext.savePhoto({preventDefault(){}});
 assert.equal(writes,0,'Foto incompleta: nessuna scrittura IndexedDB');
 assert(notices.some(message=>message.includes('Acquisizione incompleta')),'Mostrare errore esplicito per la foto incompleta');
 cameraFile.arrayBuffer=async()=>bytes;
 await saveContext.savePhoto({preventDefault(){}});
 assert.equal(writes,1,'Foto completa: scrittura consentita');
 assert.equal(captured.fileName,'foto-fittizia.jpg','Deve usare il file fotocamera, non quello da archivio');
 assert.equal(captured.sha256,require('node:crypto').createHash('sha256').update(Buffer.from(bytes)).digest('hex'),'Impronta SHA-256 salvata con la foto');
 // La selezione manuale del cantiere non deve associare una foto a un altro cliente.
 fields['docs-parent-type'].value='immobili';
 fields['docs-parent-id'].value='3';
 fields['docs-subject'].value='1';
 fields['docs-site'].value='8';
 await saveContext.savePhoto({preventDefault(){}});
 assert.equal(writes,1,'Foto immobile non salvabile sul cantiere di altro cliente');
 assert(notices.some(message=>message.includes('Cantiere non collegato al cliente')));
 fields['docs-site'].value='9';
 await saveContext.savePhoto({preventDefault(){}});
 assert.equal(writes,2,'Foto immobile salvabile sul cantiere dello stesso cliente');
 // Il soggetto selezionato deve essere il cliente proprietario dell'immobile.
 fields['docs-subject'].value='2';
 await saveContext.savePhoto({preventDefault(){}});
 assert.equal(writes,2,'Foto immobile non salvabile sotto il soggetto di altro cliente');
 assert(notices.some(message=>message.includes('Soggetto non collegato al cliente')));
 // Un documento di cantiere deve restare collegato al cliente del cantiere.
 fields['docs-parent-type'].value='cantieri';
 fields['docs-parent-id'].value='9';
 await saveContext.savePhoto({preventDefault(){}});
 assert.equal(writes,2,'Foto cantiere non salvabile sotto il soggetto di altro cliente');
 fields['docs-subject'].value='1';
 await saveContext.savePhoto({preventDefault(){}});
 assert.equal(writes,3,'Foto cantiere salvabile sotto il cliente corretto');
 // Anche un documento anagrafico del cliente non deve puntare al cantiere di terzi.
 fields['docs-parent-type'].value='clienti';
 fields['docs-parent-id'].value='1';
 fields['docs-subject'].value='1';
 fields['docs-site'].value='8';
 await saveContext.savePhoto({preventDefault(){}});
 assert.equal(writes,3,'Foto cliente non salvabile sul cantiere di un altro cliente');
 assert(notices.some(message=>message.includes('Cantiere non collegato al cliente')));
 fields['docs-site'].value='9';
 await saveContext.savePhoto({preventDefault(){}});
 assert.equal(writes,4,'Foto cliente salvabile sul proprio cantiere');
 // Un cliente eliminato mentre iOS legge il file non deve ricevere un allegato orfano.
 fields['docs-site'].value='';
 cameraFile.arrayBuffer=async()=>{currentRecords={...currentRecords,clienti:currentRecords.clienti.filter(r=>r.id!==1)};return bytes};
 await saveContext.savePhoto({preventDefault(){}});
 assert.equal(writes,4,'Cliente eliminato durante acquisizione: nessuna foto orfana');
 assert(notices.some(message=>/riferimento|cliente|soggetto/i.test(message)),'Segnalare che il riferimento non esiste più');
 // Un cantiere spostato ad altro cliente durante la lettura non deve ricevere la foto.
 currentRecords={clienti:[{id:1},{id:2}],immobili:[{id:3,client_id:'1'}],cantieri:[{id:9,client_id:'1'}]};
 fields['docs-site'].value='9';
 cameraFile.arrayBuffer=async()=>{currentRecords.cantieri[0].client_id='2';return bytes};
 await saveContext.savePhoto({preventDefault(){}});
 assert.equal(writes,4,'Cantiere riassegnato durante acquisizione: nessuna foto con cliente errato');
 assert(notices.some(message=>/cantiere modificato/i.test(message)),'Segnalare il cambiamento del cantiere');
 console.log('OK: metadati, SHA-256, dimensione reale e salvataggio fotocamera con file completo');
})().catch(error=>{console.error(error);process.exitCode=1});
