/* I.T.E. 4.0.73: reviewed local PDF metadata -> TEST dossier, no file persistence. */
(function(root,factory){const api=factory(typeof module==="object"&&module.exports?require("./ite-pdf-review-40.js"):root.ITEPdfReview40,typeof module==="object"&&module.exports?require("./ite-technical-batch-40.js"):root.ITETechnicalBatch40);if(typeof module==="object"&&module.exports)module.exports=api;root.ITEPdfHandoff40=api;})(typeof globalThis!=="undefined"?globalThis:this,function(Review,Batch){
"use strict";
const TEST=/^TEST-[A-Z0-9-]{2,60}$/;
const TYPES=["DICO_ELETTRICO","DICO_IDRICO","DIRI","ALLEGATI_GAS","POS","ITE_CAD","RAPPORTO"];
function build(records,appointmentId,operatorId,day,nonce){
 if(!TEST.test(appointmentId)||!TEST.test(operatorId))throw Error("Appuntamento e operatore TEST obbligatori");
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(Date.parse(day+"T00:00:00Z")))throw Error("Data non valida");
 if(!TEST.test(nonce))throw Error("Identificativo lotto TEST non valido");
 if(!Array.isArray(records)||records.length<1||records.length>30)throw Error("Da 1 a 30 PDF per lotto");
 Review.manifest(records.map(x=>x.review),appointmentId);
 const items=records.map((r,i)=>{
  if(!TYPES.includes(r.review.kind)||!r.review.hasEof||r.review.encrypted)throw Error("Documento non approvabile");
  if(!/^[a-f0-9]{64}$/.test(r.sha256)||r.bytes!==r.review.bytes||r.bytes<=0||r.bytes>25000000)throw Error("Impronta o dimensione PDF non valida");
  const suffix=nonce.slice(5)+"-"+String(i+1).padStart(3,"0");
  return {id:"TEST-DOC-"+suffix,appointmentId,type:r.review.kind,title:"Documento "+r.review.kind+" TEST",date:day,attachments:[{id:"TEST-PDF-"+suffix,name:"documento-test-"+String(i+1).padStart(3,"0")+".pdf",mime:"application/pdf",bytes:r.bytes,sha256:r.sha256}]};
 });
 Batch.validateBatch(items);return items;
}
function preview(service,archive,records,appointmentId,operatorId,day,nonce){const items=build(records,appointmentId,operatorId,day,nonce);return {items,check:Batch.preview(service,archive,items,operatorId)};}
function commit(service,archive,records,appointmentId,operatorId,day,nonce){return Batch.apply(service,archive,build(records,appointmentId,operatorId,day,nonce),operatorId);}
return Object.freeze({build,preview,commit});
});