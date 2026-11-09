/* I.T.E. 4.0.117 — batch metadata review, fictional input only; no PDF bytes or persistence. */
(function(root){"use strict";
const integrity=root.ITE_DocumentIntegrity116||(typeof require==="function"?require("./ite-document-integrity-116.js"):null);
const id=v=>String(v==null?"":v).trim();
const clone=v=>JSON.parse(JSON.stringify(v));
const keys=["clientId","siteId","plantId","equipmentId","originalInvoiceId"];
function fingerprint(d){return [d.metadata.type,id(d.metadata.number).toUpperCase(),id(d.metadata.date),id(d.links.clientId),id(d.links.originalInvoiceId)].join("|");}
function makeBatch(entries,registry){
 if(!Array.isArray(entries)||entries.length===0||entries.length>200)throw Error("Lotto TEST: da 1 a 200 documenti");
 integrity.normalizeRegistry(registry);
 const docs=entries.map((e,i)=>{
  if(!e||typeof e!=="object"||typeof e.text!=="string"||typeof e.filename!=="string")throw Error("Documento TEST "+(i+1)+" non valido");
  const draft=integrity.prepare({text:e.text,filename:e.filename},e.links||{},registry);
  return {key:"DOC-"+String(i+1).padStart(4,"0"),...draft};
 });
 const seen=new Map();
 for(const d of docs){
  const f=fingerprint(d);
  if(!d.metadata.number||!d.metadata.date){d.status="DA_VERIFICARE";d.validation.issues.push("Numero e data da verificare");d.validation.ok=false;continue;}
  if(seen.has(f)){d.status="DA_VERIFICARE";d.validation.issues.push("Possibile duplicato del documento "+seen.get(f));d.validation.ok=false;}
  else seen.set(f,d.key);
 }
 return {source:"TEST_LOCAL_ONLY",pdfStored:false,documents:docs};
}
function approveBatch(batch,keysToApprove,operator,registry){
 if(!batch||!Array.isArray(batch.documents)||!Array.isArray(keysToApprove))throw Error("Lotto non valido");
 if(!id(operator))throw Error("Operatore obbligatorio");
 integrity.normalizeRegistry(registry);
 const selected=new Set(keysToApprove);
 if(selected.size!==keysToApprove.length)throw Error("Selezione duplicata");
 const known=new Set(batch.documents.map(d=>d.key));
 if([...selected].some(k=>!known.has(k)))throw Error("Documento selezionato inesistente");
 const updated=clone(batch), errors=[];
 for(const d of updated.documents){
  if(!selected.has(d.key))continue;
  try{
   if(!d.metadata.number||!d.metadata.date)throw Error("Numero/data obbligatori");
   const validation=integrity.evaluate(d.metadata,d.links,registry);
   if(!validation.ok)throw Error(validation.issues.join("; "));
   const duplicates=updated.documents.filter(x=>x.key!==d.key&&fingerprint(x)===fingerprint(d));
   if(duplicates.length)throw Error("Documento duplicato nel lotto");
   const approved=integrity.confirm({...d,status:"PRONTO_PER_CONFERMA",validation},operator,registry);
   Object.assign(d,approved);
  }catch(e){errors.push({key:d.key,error:e.message});}
 }
 return {batch:updated,approved:updated.documents.filter(d=>d.status==="CONFERMATO_TEST").length,errors};
}
function dossier(batch,clientId){
 const docs=(batch&&batch.documents||[]).filter(d=>d.status==="CONFERMATO_TEST"&&(!clientId||d.links.clientId===id(clientId)));
 return {clientId:id(clientId),count:docs.length,documents:docs.map(d=>({key:d.key,type:d.metadata.type,number:d.metadata.number,date:d.metadata.date,links:clone(d.links),operator:d.operator})),pdfStored:false,source:"TEST_LOCAL_ONLY"};
}
const api=Object.freeze({makeBatch,approveBatch,dossier,fingerprint});
if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ITE_DocumentBatch117=api;
})(typeof globalThis!=="undefined"?globalThis:this);
