/* I.T.E. 4.0.119 — PDF batch review and guarded confirmation. TEST metadata only. */
(function(root){"use strict";
const integrity=root.ITE_DocumentIntegrity116||(typeof require==="function"?require("./ite-document-integrity-116.js"):null);
const batchApi=root.ITE_DocumentBatch117||(typeof require==="function"?require("./ite-document-batch-117.js"):null);
const clone=x=>JSON.parse(JSON.stringify(x));
const linkKeys=["clientId","siteId","plantId","equipmentId","originalInvoiceId"];
const clean=x=>String(x==null?"":x).trim();
function validateLinks(links){const out={};for(const k of linkKeys)if(clean(links&&links[k]))out[k]=clean(links[k]).slice(0,120);return out;}
function review(preview,registry){
 if(!preview||!preview.batch||!Array.isArray(preview.batch.documents)||!Array.isArray(preview.details)||preview.details.length!==preview.batch.documents.length)throw Error("Anteprima PDF non valida");
 integrity.normalizeRegistry(registry);
 const state={batch:clone(preview.batch),details:clone(preview.details),source:"TEST_LOCAL_ONLY",pdfStored:false};
 state.batch.documents.forEach((d,i)=>{d.extractionBlocked=!!(state.details[i].error||state.details[i].needsOCR);if(d.extractionBlocked){d.status="DA_VERIFICARE";d.validation={ok:false,issues:["Estrazione PDF non riuscita o OCR necessario"]};}});
 return state;
}
function updateLinks(state,key,links,registry){
 integrity.normalizeRegistry(registry);
 const out=clone(state),d=out.batch.documents.find(x=>x.key===key);
 if(!d)throw Error("Documento non trovato");
 if(d.status==="CONFERMATO_TEST")throw Error("Documento già confermato: non modificabile");
 d.links=validateLinks(links);
 const v=integrity.evaluate(d.metadata,d.links,registry);
 const same=out.batch.documents.filter(x=>x.key!==key&&batchApi.fingerprint(x)===batchApi.fingerprint(d));
 if(!d.metadata.number||!d.metadata.date)v.issues.push("Numero e data da verificare");
 if(same.length)v.issues.push("Possibile duplicato nel lotto");
 if(d.extractionBlocked)v.issues.push("PDF senza testo utilizzabile: revisione manuale esterna necessaria");
 v.ok=v.issues.length===0;d.validation=v;d.status=v.ok?"PRONTO_PER_CONFERMA":"DA_VERIFICARE";
 return out;
}
function confirm(state,keys,operator,registry){
 if(!Array.isArray(keys)||new Set(keys).size!==keys.length)throw Error("Selezione non valida");
 if(!clean(operator))throw Error("Operatore obbligatorio");
 integrity.normalizeRegistry(registry);
 let out=clone(state);const errors=[];
 for(const key of keys){
  const d=out.batch.documents.find(x=>x.key===key);
  if(!d){errors.push({key,error:"Documento inesistente"});continue;}
  if(d.extractionBlocked){errors.push({key,error:"Estrazione non valida/OCR richiesto"});continue;}
  if(d.status!=="PRONTO_PER_CONFERMA"){errors.push({key,error:"Documento non pronto"});continue;}
  try{
   out=updateLinks(out,key,d.links,registry);
   const checked=out.batch.documents.find(x=>x.key===key);
   if(checked.status!=="PRONTO_PER_CONFERMA")throw Error(checked.validation.issues.join("; "));
   Object.assign(checked,integrity.confirm(checked,operator,registry));
  }catch(e){errors.push({key,error:String(e.message||e)});}
 }
 return {state:out,approved:out.batch.documents.filter(x=>x.status==="CONFERMATO_TEST").length,errors};
}
function exportMetadata(state){return {source:"TEST_LOCAL_ONLY",pdfStored:false,documents:state.batch.documents.map(d=>({key:d.key,type:d.metadata.type,number:d.metadata.number,date:d.metadata.date,links:clone(d.links),status:d.status,issues:clone(d.validation.issues),extractionBlocked:!!d.extractionBlocked}))};}
const api=Object.freeze({review,updateLinks,confirm,exportMetadata,validateLinks});
if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ITE_DocumentReview119=api;
})(typeof globalThis!=="undefined"?globalThis:this);
