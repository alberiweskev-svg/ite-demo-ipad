'use strict';
// Dati esclusivamente fittizi: una lettura parziale non deve diventare un originale importato.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('app.js','utf8');
const helperStart=source.indexOf('async function readCompleteImportFile(file){');
const readStart=source.indexOf('\nasync function fileRead(file){',helperStart);
const readEnd=source.indexOf('\nasync function expandFiles(files)',readStart);
const chooseStart=source.indexOf('async function choose(files){',readEnd);
const chooseEnd=source.indexOf('\nfunction semantic(d)',chooseStart);
assert(helperStart>=0&&readStart>helperStart&&readEnd>readStart&&chooseStart>readEnd&&chooseEnd>chooseStart,
 'Importazione o controllo dimensioni non trovati');
const completeBytes=Uint8Array.from([65,66,67,68]);
const complete={name:'fattura-demo.txt',size:4,type:'text/plain',arrayBuffer:async()=>completeBytes.buffer};
const truncated={...complete,size:5};
const empty={...complete,size:0,arrayBuffer:async()=>new ArrayBuffer(0)};
let hashes=0;
const readContext={
 Uint8Array,TextDecoder,Number,Promise,Error,
 hash:async()=>{hashes++;return 'synthetic-sha'},
 encode:bytes=>Buffer.from(bytes).toString('base64'),
 checkedTextDocs:async()=>[{type:'Da verificare',lines:[]}],
 inferLinks:d=>d,detectTechnical:()=>{},attachLearning:async d=>d,
 when:()=> '2026-10-28T00:00:00Z'
};
vm.createContext(readContext);
vm.runInContext(source.slice(helperStart,readEnd)+';this.readImportFile=readCompleteImportFile;this.readImportDocument=fileRead',readContext);
(async()=>{
 await assert.rejects(()=>readContext.readImportDocument(truncated),/Acquisizione incompleta/);
 assert.equal(hashes,0,'Un file incompleto non deve essere indicizzato');
 await assert.rejects(()=>readContext.readImportFile(empty),/File vuoto/);
 await assert.rejects(()=>readContext.readImportFile({...complete,size:20*1024*1024+1}),/oltre 20 MB/);
 const docs=await readContext.readImportDocument(complete);
 assert.equal(docs.length,1);
 assert.equal(docs[0].file.size,4);
 assert.equal(docs[0].file.base64,'QUJDRA==');
 assert.equal(hashes,1,'Solo il file completo deve essere indicizzato');

 // Anche il percorso di recupero dopo errore del parser deve rifiutare byte incompleti.
 const messages=[],previewContext={
  Uint8Array,Number,Promise,Error,ready:Promise.resolve(),processing:false,locked:false,
  queue:[],currentBatch:'',id:()=> 'batch-demo',
  $:()=>({disabled:false}),expandFiles:async files=>files,
  fileRead:async()=>{throw Error('Parser fittizio non disponibile')},
  blank:()=>({type:'Da verificare',notes:[]}),
  hash:async()=> 'synthetic-sha',encode:bytes=>Buffer.from(bytes).toString('base64'),
  say:value=>messages.push(value),refresh:async()=>{},drawQueue:()=>{},
  ocrWorker:null,confirm:()=>true
 };
 vm.createContext(previewContext);
 vm.runInContext(source.slice(helperStart,readStart)+'\n'+source.slice(chooseStart,chooseEnd)+';this.chooseDemo=choose',previewContext);
 await previewContext.chooseDemo([truncated]);
 assert.equal(previewContext.queue.length,0,'Non conservare in anteprima un originale troncato');
 assert(messages.some(m=>m.includes('Acquisizione incompleta')),'Errore di acquisizione visibile');
 await previewContext.chooseDemo([complete]);
 assert.equal(previewContext.queue.length,1,'Errore parser: originale completo conservato in Da verificare');
 assert.equal(previewContext.queue[0].file.base64,'QUJDRA==');
 assert.equal(previewContext.queue[0].file.size,4);
 assert.deepEqual(Array.from(previewContext.queue[0].notes),['Parser fittizio non disponibile']);
 console.log('OK: importazione documenti completa, file troncati/vuoti bloccati e fallback parser sicuro');
})().catch(error=>{console.error(error);process.exitCode=1});
