const assert=require("node:assert/strict");
const bridge=require("./ite-document-pdf-bridge-118.js");
const registry={clients:[{id:"C"}],sites:[{id:"S",clientId:"C"}],plants:[{id:"P",siteId:"S"}],equipment:[],invoices:[]};
const links={clientId:"C",siteId:"S",plantId:"P"};
const bytes=new TextEncoder().encode("%PDF-1.7 fake");
function file(name="dico.pdf"){return {name,type:"application/pdf",size:bytes.length,arrayBuffer:async()=>bytes.buffer.slice(0)}}
function pdf(text){return {getDocument:()=>({promise:Promise.resolve({numPages:1,getPage:async()=>({getTextContent:async()=>({items:[{str:text}]})}),destroy:async()=>{}})})}}
(async()=>{
 assert.throws(()=>bridge.checkFiles([]),/1 a 20/);
 assert.throws(()=>bridge.checkFiles(Array.from({length:21},()=>file())),/1 a 20/);
 const out=await bridge.preview([file("dico.pdf"),file("scan.pdf")],registry,links,{loadPdf:async()=>pdf("Dichiarazione di conformità numero 12 data 01/11/2026")});
 assert.equal(out.batch.documents.length,2);assert.equal(out.batch.documents[0].status,"PRONTO_PER_CONFERMA");
 assert.equal(out.pdfStored,false);assert.equal(out.pdfUploaded,false);
 const scan=await bridge.preview([file("scan.pdf")],registry,links,{loadPdf:async()=>pdf("")});
 assert.equal(scan.batch.documents[0].status,"DA_VERIFICARE");assert.equal(scan.warnings[0].code,"OCR_REQUIRED");
 const bad=await bridge.preview([file("bad.pdf")],registry,links,{loadPdf:async()=>{throw Error("simulated failure")}});
 assert.equal(bad.batch.documents[0].status,"DA_VERIFICARE");
 const approved=require("./ite-document-batch-117.js").approveBatch(out.batch,["DOC-0001"],"Tecnico TEST",registry);
 assert.equal(approved.batch.documents[0].status,"CONFERMATO_TEST");
 console.log("PDF bridge 118 synthetic tests passed");
})().catch(e=>{console.error(e);process.exitCode=1});
