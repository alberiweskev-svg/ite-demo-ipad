'use strict';
// Anteprima allegati: mai mostrare come valida una foto tronca o priva di byte.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('app.js','utf8');
const start=source.indexOf('async function openFile(id){');
const end=source.indexOf('\nfunction protectInterventionDocument(doc){',start);
assert(start>=0&&end>start,'Apertura allegati non trovata');
async function preview(doc){
 const notices=[];let urls=0,visible=false;
 const fields={
  'docs-preview':{hidden:true,scrollIntoView(){visible=true}},
  'docs-preview-content':{append(){}},
  'docs-download':{href:'',download:''}
 };
 const context={
  list:async()=>[doc],closePreview:()=>{},mime:()=> 'image/jpeg',
  Blob,ArrayBuffer,Uint8Array,Number,Error,
  URL:{createObjectURL:()=>{urls++;return 'blob:foto-fittizia'}},
  document:{createElement:()=>({style:{},textContent:'',src:'',alt:''})},
  note:text=>notices.push(text),$:id=>fields[id],previewUrl:null
 };
 vm.createContext(context);
 vm.runInContext(source.slice(start,end)+';this.showDocument=openFile',context);
 await context.showDocument('foto-1');
 return {notices,urls,visible,download:fields['docs-download']};
}
(async()=>{
 const bytes=Uint8Array.from([1,2,3,4]).buffer;
 const doc={id:'foto-1',fileName:'foto-fittizia.jpg',size:4,fileBytes:bytes};
 let r=await preview(doc);
 assert.equal(r.urls,1,'Foto integra: anteprima consentita');
 assert.equal(r.visible,true,'Foto integra: anteprima visibile');
 assert.equal(r.download.download,'foto-fittizia.jpg');
 r=await preview({...doc,fileBytes:Uint8Array.from([1,2,3]).buffer});
 assert.equal(r.urls,0,'Foto tronca: non creare URL di anteprima');
 assert.equal(r.visible,false,'Foto tronca: non dichiarare anteprima visibile');
 assert(r.notices.some(x=>x.includes('Allegato incompleto')),'Foto tronca: errore esplicito');
 r=await preview({...doc,fileBytes:null,file:null});
 assert.equal(r.urls,0,'Foto assente: non creare URL di anteprima');
 assert(r.notices.some(x=>x.includes('Allegato incompleto')),'Foto assente: errore esplicito');
 r=await preview({...doc,fileBytes:null,file:new Blob([new Uint8Array([1,2,3,4])])});
 assert.equal(r.urls,1,'Formato storico Blob integro: anteprima consentita');
 console.log('OK: anteprima foto integra, blocco file tronco/assente e compatibilita Blob');
})().catch(e=>{console.error(e);process.exitCode=1});
