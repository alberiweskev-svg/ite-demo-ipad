/* I.T.E. 4.0.118 — PDF extraction to existing document batch; browser-only, no persistence. */
(function(root){"use strict";
const reader=root.ITEPDFLocalReader||(typeof require==="function"?require("./ite-pdf-local-reader.js"):null);
const batch=root.ITE_DocumentBatch117||(typeof require==="function"?require("./ite-document-batch-117.js"):null);
const integrity=root.ITE_DocumentIntegrity116||(typeof require==="function"?require("./ite-document-integrity-116.js"):null);
const MAX_FILES=20;
function checkFiles(files){const list=Array.from(files||[]);if(!list.length||list.length>MAX_FILES)throw Error("Selezionare da 1 a 20 PDF");for(const file of list)reader.validate(file);return list;}
async function preview(files,registry,links={},options={}){
 const list=checkFiles(files);integrity.normalizeRegistry(registry);
 const entries=[],warnings=[],details=[];
 for(let i=0;i<list.length;i++){
  const f=list[i];
  try{
   const result=await reader.extract(f,options);
   const scanned=result.needsOCR;
   const entry={filename:result.filename,text:scanned?"":result.text,links:{...links}};
   entries.push(entry);
   details.push({index:i+1,filename:result.filename,pages:result.pages,needsOCR:scanned,characters:result.text.length});
   if(scanned)warnings.push({index:i+1,code:"OCR_REQUIRED",message:"PDF senza testo estraibile: trascrizione/verifica manuale necessaria"});
  }catch(error){
   entries.push({filename:String(f.name||"").slice(0,180),text:"",links:{...links}});
   details.push({index:i+1,filename:String(f.name||"").slice(0,180),error:String(error.message||error)});
   warnings.push({index:i+1,code:"EXTRACTION_FAILED",message:String(error.message||error)});
  }
 }
 const review=batch.makeBatch(entries,registry);
 review.documents.forEach((d,i)=>{
  if(details[i].error||details[i].needsOCR){
   d.status="DA_VERIFICARE";d.validation.ok=false;d.validation.issues.push(details[i].error||"Testo non estraibile: OCR/manuale necessario");
  }
 });
 return {batch:review,details,warnings,localOnly:true,pdfStored:false,pdfUploaded:false};
}
function summary(result){return {total:result.batch.documents.length,ready:result.batch.documents.filter(x=>x.status==="PRONTO_PER_CONFERMA").length,toReview:result.batch.documents.filter(x=>x.status==="DA_VERIFICARE").length,details:result.details,warnings:result.warnings,pdfStored:false,pdfUploaded:false};}
const api=Object.freeze({preview,summary,checkFiles,MAX_FILES});
if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ITE_DocumentPdfBridge118=api;
})(typeof globalThis!=="undefined"?globalThis:this);
