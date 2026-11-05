'use strict';
const assert=require('node:assert/strict');
const api=require('./ite-local-pdf.js');
const intake=require('./ite-pdf-intake.js');
const synthetic='DICHIARAZIONE TEST-DEMO\nNumero: TEST-123\nData: 05/11/2026\nCommittente: TEST Cliente\nIndirizzo: TEST Via Prova 1\nImpianto: TEST idrico';
function fakeFile(text,name='TEST.pdf',type='application/pdf'){
 const bytes=Buffer.from('%PDF-1.4\n'+text);
 return {name,type,size:bytes.length,arrayBuffer:async()=>Uint8Array.from(bytes).buffer};
}
function fakeEngine(text,pages=1){
 let destroyed=false;
 return {getDocument:()=>({promise:Promise.resolve({numPages:pages,getPage:async()=>({getTextContent:async()=>({items:[{str:text}]})}),destroy:async()=>{destroyed=true}})})};
}
(async()=>{
 const result=await api.extract(fakeFile(synthetic),fakeEngine(synthetic));
 assert.equal(result.pages,1);
 assert.equal(api.preview(result.text,'DICO_IDRICA',intake).fields.number,'TEST-123');
 await assert.rejects(api.extract(fakeFile('REAL DOCUMENT'),fakeEngine('REAL DOCUMENT')),/SOLO_PDF_FITTIZI_TEST/);
 await assert.rejects(api.extract(fakeFile(''),fakeEngine('')),/PDF_SCANSIONE_SENZA_TESTO/);
 await assert.rejects(api.extract(fakeFile(synthetic,'a.txt'),fakeEngine(synthetic)),/SOLO_FILE_PDF/);
 await assert.rejects(api.extract(fakeFile(synthetic),fakeEngine(synthetic,13)),/PDF_TROPPE_PAGINE/);
 await assert.rejects(api.extract({name:'a.pdf',size:9000000,arrayBuffer:async()=>new ArrayBuffer(0)},fakeEngine(synthetic)),/PDF_DIMENSIONE_NON_VALIDA/);
 await assert.rejects(api.extract(fakeFile(synthetic)),/MOTORE_PDF_NON_DISPONIBILE/);
 console.log('Local PDF synthetic tests: OK');
})().catch(e=>{console.error(e);process.exitCode=1});
