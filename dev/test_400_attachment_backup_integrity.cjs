'use strict';
// Backup allegati: soli byte e anagrafiche fittizie.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {webcrypto,createHash}=require('node:crypto');
const source=fs.readFileSync('app.js','utf8');
const digestStart=source.indexOf('async function attachmentDigest(bytes){');
const packStart=source.indexOf('async function pack(){',digestStart);
const packEnd=source.indexOf('\nfunction downloadObject(',packStart);
const restoreStart=source.indexOf('async function restore(input){',packEnd);
const restoreEnd=source.indexOf('\nwindow.ITEBackup=',restoreStart);
assert(digestStart>=0&&packStart>digestStart&&packEnd>packStart&&restoreEnd>restoreStart,'Backup helpers not found');
const data={clienti:[{id:1,name:'Cliente fittizio'}],immobili:[],impianti:[],apparecchiature:[],interventi:[],cantieri:[]};
const fileBytes=Uint8Array.from([1,2,3,4]).buffer;
const commerce={documents:[],articles:[],movements:[]};
async function build({bytes=fileBytes,size=4,storedSha256,docOverrides={},core=data,missingModule='',rejectModule='',rejectCommerce=false,onExport=null,commerceSnapshots=null,docSnapshots=null,photoSaving=false,savingOnExport=false}={}){
 let exportCount=0,docRead=0,saving=photoSaving;
 const demoDoc={id:'d-demo',parentType:'clienti',parentId:'1',subjectId:'1',fileName:'foto-fittizia.png',size,fileBytes:bytes,sha256:storedSha256,...docOverrides};
 const exportSnapshot=async()=>{if(onExport)await onExport(ctx);if(savingOnExport)saving=true;return commerceSnapshots?structuredClone(commerceSnapshots[Math.min(exportCount++,commerceSnapshots.length-1)]):commerce};
 const ctx={KEY:'ite_demo_test',crypto:webcrypto,Uint8Array,btoa,JSON,Date,Error,packing:false,busy:false,download:()=>{},restore:()=>{},
   window:{ITECommerce:{exportState:exportSnapshot,validate:()=>{if(rejectCommerce)throw Error('Archivio magazzino non valido')}}},
   ITECommerce:{exportState:exportSnapshot,validate:()=>{if(rejectCommerce)throw Error('Archivio magazzino non valido')}},
   ITE:{archiveReadable:()=>true,validate:()=>true,snapshot:()=>core},
   ITEVault:{storage:{getItem:()=>null}},
   ITEDocs:{validDate:s=>!s||/^\d{4}-\d{2}-\d{2}$/.test(s)&&(()=>{const d=new Date(s+'T12:00:00');return !Number.isNaN(d.getTime())&&d.getFullYear()===+s.slice(0,4)&&d.getMonth()+1===+s.slice(5,7)&&d.getDate()===+s.slice(8,10)})(),listDocs:async()=>docSnapshots?structuredClone(docSnapshots[Math.min(docRead++,docSnapshots.length-1)]):[demoDoc]}};
 const contacts={validateLinks:db=>{if(rejectModule==='ITEContacts')throw Error('Anagrafiche non valide');for(const site of db.cantieri||[])if(site.client_id&&!db.clienti.some(c=>String(c.id)===String(site.client_id)))throw Error('Cliente del cantiere non presente');}};
 const agenda={validateDatabase:()=>{if(rejectModule==='ITEAgenda')throw Error('Appuntamenti non validi');}};
 const operators={validateDatabase:()=>{if(rejectModule==='ITEOperators')throw Error('Operatori non validi');}};
 for(const [name,module] of [['ITEContacts',contacts],['ITEAgenda',agenda],['ITEOperators',operators]])if(name!==missingModule){ctx.window[name]=module;ctx[name]=module;}
 ctx.ITEDocs.isSaving=()=>saving;ctx.window.ITEDocs=ctx.ITEDocs;
 vm.createContext(ctx);
 vm.runInContext(source.slice(digestStart,packEnd)+';this.makeBackup=pack',ctx);
 const apiStart=source.indexOf('window.ITEBackup={download,restore,pack,busy:',restoreEnd);
 assert(apiStart>0,'Backup busy API missing');
 vm.runInContext(source.slice(apiStart,source.indexOf(';',apiStart)+1),ctx);
 return ctx.makeBackup();
}
async function attempt(backup,{savingAfterPack=false}={}){
 const messages=[];let writes=0,restoredDocs,saving=false;
 const ctx={crypto:webcrypto,Uint8Array,atob,JSON,Set,Array,Object,Number,String,Error,
   busy:false,
   window:{ITEDocs:{isSaving:()=>saving},ITECommerce:{busy:()=>false,validate:()=>{},replaceState:async()=>{writes++}},
     ITEHistory:{create:async()=>{}},ITEAgenda:{validateDatabase:()=>{}},ITEOperators:{validateDatabase:()=>{}},ITEContacts:{validateLinks:()=>{}}},
   document:{getElementById:()=>({hidden:true})},
   message:s=>messages.push(s),
   ITEVault:{openBackup:async()=>backup},
   ITE:{validate:()=>true,replaceData:()=>{writes++}},
   ITEDocs:{validDate:()=>true,replaceDocs:async docs=>{writes++;restoredDocs=docs}},
   pack:async()=>{if(savingAfterPack)saving=true;return {data,docs:[],commerce}},
   downloadObject:()=>{},confirm:()=>true,location:{reload:()=>messages.push('reload')}};
 ctx.ITECommerce=ctx.window.ITECommerce;ctx.ITEHistory=ctx.window.ITEHistory;
 ctx.ITEAgenda=ctx.window.ITEAgenda;ctx.ITEOperators=ctx.window.ITEOperators;ctx.ITEContacts=ctx.window.ITEContacts;
 vm.createContext(ctx);
 vm.runInContext(source.slice(digestStart,packStart)+source.slice(restoreStart,restoreEnd)+';this.runRestore=restore',ctx);
 await ctx.runRestore({files:[{text:async()=>JSON.stringify(backup)}],value:''});
 return {writes,messages,restoredDocs};
}
(async()=>{
 // Intervento storico (non appuntamento): apparecchiatura di un altro cliente.
 // Il collegamento errato non deve essere esportato né ripristinato.
 const equipmentOwnerMismatch={...data,
  clienti:[{id:1,name:'Cliente fittizio A'},{id:2,name:'Cliente fittizio B'}],
  immobili:[{id:11,client_id:'2'}],impianti:[{id:12,immobile_id:'11'}],
  apparecchiature:[{id:13,impianto_id:'12'}],
  interventi:[{id:14,appointment:'0',client_id:'1',apparecchiatura_id:'13'}]};
 await assert.rejects(build({core:equipmentOwnerMismatch}),/Apparecchiatura intervento non collegata al cliente/,'Non esportare interventi con apparecchiatura di un altro cliente');
 const foreignEquipmentBackup=await build();
 foreignEquipmentBackup.data=equipmentOwnerMismatch;
 let equipmentResult=await attempt(foreignEquipmentBackup);
 assert.equal(equipmentResult.writes,0,'Non ripristinare interventi storici con apparecchiatura di un altro cliente');
 assert(equipmentResult.messages.some(x=>x.includes('Apparecchiatura intervento non collegata al cliente')));
 const matchingEquipment={...equipmentOwnerMismatch,interventi:[{...equipmentOwnerMismatch.interventi[0],client_id:'2'}]};
 const validEquipmentBackup=await build({core:matchingEquipment});
 equipmentResult=await attempt(validEquipmentBackup);
 assert.equal(equipmentResult.writes,3,'Intervento con apparecchiatura dello stesso cliente rimane importabile');
 // Non esportare un backup che il ripristino rifiuterebbe: cantiere orfano
 // oppure moduli di validazione non disponibili.
 await assert.rejects(build({core:{...data,cantieri:[{id:8,client_id:'404'}]}}),/Cliente del cantiere non presente/);
 for(const module of ['ITEContacts','ITEAgenda','ITEOperators']){
  await assert.rejects(build({missingModule:module}),/Moduli anagrafiche, appuntamenti o operatori non disponibili/);
  await assert.rejects(build({rejectModule:module}),/non validi|non valide/);
 }
 // Il backup non deve esportare un magazzino che il ripristino rifiuterebbe.
 await assert.rejects(build({rejectCommerce:true}),/Archivio magazzino non valido/);
 // Una foto in acquisizione non deve essere esclusa da un backup dichiarato completo.
 await assert.rejects(build({photoSaving:true}),/Salvataggio fotografia in corso/,'Bloccare backup se la fotocamera sta salvando');
 await assert.rejects(build({savingOnExport:true}),/Salvataggio fotografia in corso/,'Bloccare backup se acquisizione inizia durante esportazione');
 // Anche i backup automatici devono segnalare occupato durante l'esportazione.
 // Una foto o un secondo backup non devono sovrapporsi alla copia in corso.
 let activePackContext;
 const lockedBackup=await build({onExport:async ctx=>{
  activePackContext=ctx;
  assert.equal(ctx.window.ITEBackup.busy(),true,'Pack automatico deve bloccare la fotocamera');
  await assert.rejects(ctx.makeBackup(),/Backup completo già in corso/,'Due pack non devono sovrapporsi');
 }});
 assert.equal(lockedBackup.docs.length,1,'Il primo backup deve terminare normalmente');
 assert.equal(activePackContext.window.ITEBackup.busy(),false,'Blocco liberato dopo backup riuscito');
 let failedPackContext;
 await assert.rejects(build({onExport:ctx=>{failedPackContext=ctx;throw Error('Esportazione sintetica interrotta')}}),/Esportazione sintetica interrotta/);
 assert.equal(failedPackContext.window.ITEBackup.busy(),false,'Blocco liberato anche dopo errore');
 // Il magazzino può cambiare durante la lettura asincrona degli allegati:
 // un backup misto non deve essere esportato.
 await assert.rejects(build({commerceSnapshots:[commerce,{...commerce,revision:2}]}),/Magazzino modificato durante il backup/,'Rifiutare magazzino modificato mentre si acquisiscono i documenti');
 // Il magazzino puo' cambiare dopo la prima verifica finale, durante la rilettura SHA-256 delle fotografie.
 // Il terzo snapshot simula tale modifica senza utilizzare dati reali.
 await assert.rejects(build({commerceSnapshots:[commerce,commerce,{...commerce,revision:3}]}),/Magazzino modificato durante il backup/,'Rifiutare magazzino cambiato durante la verifica finale degli allegati');
 // Gli identificativi duplicati o non validi produrrebbero un backup non ripristinabile.
 const duplicateDoc={id:'d-demo',parentType:'clienti',parentId:'1',subjectId:'1',fileName:'seconda-foto-fittizia.png',size:4,fileBytes};
 await assert.rejects(build({docSnapshots:[[{id:'d-demo',parentType:'clienti',parentId:'1',subjectId:'1',fileName:'foto-fittizia.png',size:4,fileBytes},duplicateDoc]]}),/Identificativo allegato non valido o duplicato/,'Rifiutare due allegati con lo stesso ID');
 await assert.rejects(build({docOverrides:{id:'id non valido'}}),/Identificativo allegato non valido o duplicato/,'Rifiutare ID allegato non ripristinabile');
 // Il ripristino rifiuta date inesistenti: il backup deve bloccarle prima del download.
 await assert.rejects(build({docOverrides:{date:'2026-13-99'}}),/Data documento non valida/,'Rifiutare la data non valida prima del backup');
 await assert.rejects(build({docOverrides:{expires:'2026-02-30'}}),/Data documento non valida/,'Rifiutare una scadenza inesistente prima del backup');
 const dated=await build({docOverrides:{date:'2026-10-26',expires:'2027-10-26'}});
 assert.equal(dated.docs[0].date,'2026-10-26','Conservare le date valide');
 // Le foto possono essere aggiunte, eliminate o rinominate durante l'esportazione.
 // Il backup deve rifiutare un elenco di allegati non piu' corrispondente all'archivio.
 const photo={id:'d-demo',parentType:'clienti',parentId:'1',subjectId:'1',fileName:'foto-fittizia.png',size:4,fileBytes};
 await assert.rejects(build({docSnapshots:[[photo],[]]}),/Allegati modificati durante il backup/,'Rifiutare una fotografia eliminata durante il backup');
 await assert.rejects(build({docSnapshots:[[photo],[photo,{...photo,id:'d-nuova'}]]}),/Allegati modificati durante il backup/,'Rifiutare una fotografia aggiunta durante il backup');
 await assert.rejects(build({docSnapshots:[[photo],[{...photo,fileName:'foto-rinominata.png'}]]}),/Allegati modificati durante il backup/,'Rifiutare metadati di foto cambiati durante il backup');
 // I metadati possono restare identici mentre i byte della foto cambiano.
 // Anche in assenza di SHA-256 storico, il backup deve rilevare la modifica.
 const alteredBytes=Uint8Array.from([1,2,3,5]).buffer;
 await assert.rejects(build({docSnapshots:[[photo],[{...photo,fileBytes:alteredBytes}]]}),/Allegati modificati durante il backup/,'Rifiutare foto con byte alterati ma dimensione e metadati invariati');
 await assert.rejects(build({docSnapshots:[[photo],[{...photo,fileBytes:new ArrayBuffer(0)}]]}),/Allegati modificati durante il backup/,'Rifiutare foto svuotata mantenendo metadati originali');
 const stablePhotos=await build({docSnapshots:[[photo],[{...photo}]]});
 assert.equal(stablePhotos.docs.length,1,'Fotografia invariata deve essere esportata');
 // Una modifica durante l'esportazione asincrona deve annullare la copia.
 const changingCore=structuredClone(data);
 await assert.rejects(build({core:changingCore,onExport:()=>{changingCore.clienti[0].name='Modificato durante backup';}}),/Dati modificati durante il backup/,'Rifiutare snapshot modificati durante esportazione asincrona');
 const foreign={id:2,name:'Cliente prova 2'};
 const linkedData={...data,clienti:[...data.clienti,foreign],cantieri:[{id:8,client_id:'2'},{id:9,client_id:'1'}]};
 await assert.rejects(build({docOverrides:{parentId:'999'}}),/Collegamento allegato non valido/,'Backup non deve esportare allegati con cliente inesistente');
 await assert.rejects(build({core:linkedData,docOverrides:{subjectId:'2'}}),/Soggetto allegato incoerente/,'Backup non deve esportare documenti assegnati ad altro cliente');
 await assert.rejects(build({core:linkedData,docOverrides:{siteId:'8'}}),/Cantiere allegato incoerente/,'Backup non deve esportare foto del cliente su cantiere di terzi');
 const validLinked=await build({core:linkedData,docOverrides:{siteId:'9'}});
 assert.equal(validLinked.docs.length,1,'Backup di allegato collegato al proprio cantiere deve riuscire');
 const backup=await build();
 const correctSha=createHash('sha256').update(Buffer.from(fileBytes)).digest('hex');
 await assert.rejects(build({bytes:Uint8Array.from([1,2,3,5]).buffer,storedSha256:correctSha}),/Integrità allegato non valida/,'Backup non deve certificare byte alterati con stessa dimensione');
 const checked=await build({storedSha256:correctSha});
 assert.equal(checked.docs[0].sha256,correctSha,'Backup integro con impronta persistente');
 await assert.rejects(build({size:5}),/Allegato incompleto/,'Mismatched attachment size must prevent unusable backups');
 await assert.rejects(build({bytes:new ArrayBuffer(0),size:0}),/Allegato incompleto/,'Empty attachments must prevent unusable backups');
 assert.equal(backup.docs.length,1);
 assert.equal(backup.docs[0].sha256,createHash('sha256').update(Buffer.from(fileBytes)).digest('hex'));
 let r=await attempt(backup,{savingAfterPack:true});
 assert.equal(r.writes,0,'Ripristino non deve sovrascrivere una foto che inizia a salvarsi dopo il backup di sicurezza');
 assert(r.messages.some(x=>x.includes('Salvataggio fotografia in corso')));
 r=await attempt(backup);
 assert.equal(r.writes,3,'Valid checksum must allow complete restore');
 assert(r.messages.includes('reload'));
 assert.equal(r.restoredDocs[0].sha256,backup.docs[0].sha256,'Ripristino deve conservare la verifica SHA-256 della foto');
 const tampered=structuredClone(backup);
 tampered.docs[0].base64=btoa(String.fromCharCode(1,2,3,5));
 r=await attempt(tampered);
 assert.equal(r.writes,0,'Modified bytes must be rejected before any restore writes');
 assert(r.messages.some(x=>x.includes('Integrità allegato non valida')));
 const empty=structuredClone(backup);
 empty.docs[0].size=0;
 empty.docs[0].base64='';
 empty.docs[0].sha256=createHash('sha256').update(Buffer.alloc(0)).digest('hex');
 r=await attempt(empty);
 assert.equal(r.writes,0,'Empty attachment with a valid SHA-256 must not replace any existing data');
 assert(r.messages.some(x=>x.includes('Dimensione allegato non valida')));

 const invalid=structuredClone(backup);invalid.docs[0].sha256='not-a-checksum';
 r=await attempt(invalid);
 assert.equal(r.writes,0,'Invalid checksum format must be rejected');
 const mismatched=structuredClone(backup);
 mismatched.data.clienti.push({id:2,name:'Cliente fittizio 2'});
 mismatched.data.interventi.push({id:7,appointment:'1',client_id:'1'});
 mismatched.docs[0].parentType='interventi';
 mismatched.docs[0].parentId='7';
 mismatched.docs[0].subjectId='2';
 r=await attempt(mismatched);
 assert.equal(r.writes,0,'Cross-client intervention attachment must block restore before writes');
 assert(r.messages.some(x=>x.includes('Soggetto allegato incoerente')));
 const matched=structuredClone(mismatched);matched.docs[0].subjectId='1';
 r=await attempt(matched);
 assert.equal(r.writes,3,'Attachment with matching intervention client must restore normally');
 // Il modulo documenti vincola il soggetto per clienti, impianti e apparecchiature.
 // Un backup alterato non deve aggirare questo vincolo né sostituire i dati esistenti.
 const wrongClient=structuredClone(backup);
 wrongClient.data.clienti.push({id:2,name:'Cliente fittizio 2'});
 wrongClient.docs[0].subjectId='2';
 r=await attempt(wrongClient);
 assert.equal(r.writes,0,'Client document with a different subject must be rejected');
 assert(r.messages.some(x=>x.includes('Soggetto allegato incoerente')));
 const hierarchy=structuredClone(wrongClient);
 hierarchy.data.immobili.push({id:3,client_id:'1'});
 hierarchy.data.impianti.push({id:4,immobile_id:'3'});
 hierarchy.data.apparecchiature.push({id:5,impianto_id:'4'});
 for(const [type,id] of [['immobili','3'],['impianti','4'],['apparecchiature','5']]){
  const tampered=structuredClone(hierarchy);
  tampered.docs[0].parentType=type;
  tampered.docs[0].parentId=id;
  r=await attempt(tampered);
  assert.equal(r.writes,0,'Cross-client '+type+' attachment must not restore');
  assert(r.messages.some(x=>x.includes('Soggetto allegato incoerente')));
  tampered.docs[0].subjectId='1';
  r=await attempt(tampered);
  assert.equal(r.writes,3,'Correctly linked '+type+' attachment must restore');
 }
 // Un allegato di immobile non puo' collegarsi a un cantiere di un altro cliente.
 const crossSite=structuredClone(backup);
 crossSite.data.clienti.push({id:2,name:'Altro cliente fittizio'});
 crossSite.data.immobili.push({id:3,client_id:'1'});
 crossSite.data.cantieri.push({id:8,client_id:'2'},{id:9,client_id:'1'});
 crossSite.docs[0].parentType='immobili';
 crossSite.docs[0].parentId='3';
 crossSite.docs[0].subjectId='1';
 crossSite.docs[0].siteId='8';
 r=await attempt(crossSite);
 assert.equal(r.writes,0,'Cross-client site link must block restore before any writes');
 assert(r.messages.some(x=>x.includes('Cantiere allegato incoerente')));
 crossSite.docs[0].siteId='9';
 r=await attempt(crossSite);
 assert.equal(r.writes,3,'Same-client worksite link must remain importable');
 const crossSubject=structuredClone(crossSite);
 crossSubject.docs[0].parentType='cantieri';
 crossSubject.docs[0].parentId='9';
 crossSubject.docs[0].subjectId='2';
 crossSubject.docs[0].siteId='9';
 r=await attempt(crossSubject);
 assert.equal(r.writes,0,'Cross-client subject on worksite document must block restore');
 assert(r.messages.some(x=>x.includes('Soggetto allegato incoerente')));
 crossSubject.docs[0].subjectId='1';
 r=await attempt(crossSubject);
 assert.equal(r.writes,3,'Correct worksite subject must restore');
 crossSubject.docs[0].siteId='8';
 r=await attempt(crossSubject);
 assert.equal(r.writes,0,'Worksite document must not point at a different worksite');
 assert(r.messages.some(x=>x.includes('Cantiere allegato incoerente')));
 // Anche i documenti collegati direttamente al cliente possono indicare un cantiere:
 // un riferimento a un cantiere di un altro cliente deve essere rifiutato.
 const clientSite=structuredClone(crossSite);
 clientSite.docs[0].parentType='clienti';
 clientSite.docs[0].parentId='1';
 clientSite.docs[0].subjectId='1';
 clientSite.docs[0].siteId='8';
 r=await attempt(clientSite);
 assert.equal(r.writes,0,'Client document must not link to another customer worksite');
 assert(r.messages.some(x=>x.includes('Cantiere allegato incoerente')));
 clientSite.docs[0].siteId='9';
 r=await attempt(clientSite);
 assert.equal(r.writes,3,'Client document may link to own worksite');
 const legacy=structuredClone(backup);delete legacy.docs[0].sha256;
 r=await attempt(legacy);
 assert.equal(r.writes,3,'Legacy backups without per-file hashes remain importable');
 assert.equal(r.restoredDocs[0].sha256,backup.docs[0].sha256,'Backup storico: generare impronta per future anteprime');
 console.log('OK: attachment backup SHA-256, tamper rejection, cross-client isolation for client, plant, equipment and intervention, and legacy compatibility');
})().catch(e=>{console.error(e);process.exitCode=1});
