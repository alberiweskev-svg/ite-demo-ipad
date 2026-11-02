const assert=require('node:assert/strict');
const Reader=require('./ite-pdf-local-reader.js');
const bytes=new TextEncoder().encode('%PDF-1.7 mock document');
const file=(name='demo.pdf',type='application/pdf')=>({name,type,size:bytes.length,arrayBuffer:async()=>bytes.buffer.slice(0)});
const fakePdf={numPages:2,getPage:async n=>({getTextContent:async()=>({items:[{str:n===1?'Fattura n. 1/2026':'Totale documento € 110,00'}]})}),destroy:async()=>{}};
(async()=>{
 assert.throws(()=>Reader.validate(file('x.txt')),/SOLO_PDF/);
 assert.throws(()=>Reader.validate({...file(),size:Reader.MAX_BYTES+1}),/DIMENSIONE/);
 const out=await Reader.extract(file(),{loadPdf:async()=>({getDocument:()=>({promise:Promise.resolve(fakePdf)})})});
 assert.equal(out.pages,2);assert.match(out.text,/Fattura/);assert.equal(out.localOnly,true);
 const scanned=await Reader.extract(file(),{loadPdf:async()=>({getDocument:()=>({promise:Promise.resolve({...fakePdf,numPages:1,getPage:async()=>({getTextContent:async()=>({items:[]})})})})})});
 assert.equal(scanned.needsOCR,true);
 await assert.rejects(Reader.extract({...file(),arrayBuffer:async()=>new TextEncoder().encode('wrong').buffer},{loadPdf:async()=>({})}),/PDF_NON_VALIDO/);
 await assert.rejects(Reader.extract(file(),{loadPdf:async()=>({getDocument:()=>({promise:Promise.resolve({...fakePdf,numPages:81})})})}),/TROPPE_PAGINE/);
 console.log('Local PDF reader: synthetic tests passed');
})().catch(e=>{console.error(e);process.exitCode=1});
