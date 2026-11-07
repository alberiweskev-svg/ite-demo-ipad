/* I.T.E. 4.0.72 — privacy-preserving PDF review workflow; no persistence or network. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITEPdfReview40=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const allowed=["DICO_ELETTRICO","DICO_IDRICO","DIRI","ALLEGATI_GAS","POS","ITE_CAD","RAPPORTO","DA_VERIFICARE"];
const id=/^TEST-[A-Z0-9-]{2,60}$/;
function requireValid(x){if(!x||typeof x!=="object"||!allowed.includes(x.kind))throw Error("Tipologia non valida");if(!["pending","approved","rejected"].includes(x.status))throw Error("Stato non valido");if(x.status==="approved"&&x.kind==="DA_VERIFICARE")throw Error("Selezionare la tipologia prima di approvare");return true;}
function create(preflight){if(!preflight||!allowed.includes(preflight.kind))throw Error("Verifica PDF mancante");return {kind:preflight.kind,status:"pending",warnings:[...(preflight.warnings||[])],hasEof:!!preflight.hasEof,encrypted:!!preflight.encrypted,bytes:preflight.bytes||0};}
function decide(record,kind,status){const next={...record,kind,status};requireValid(next);if(status==="approved"&&(!next.hasEof||next.encrypted))throw Error("PDF incompleto o potenzialmente protetto: approvazione non consentita");return next;}
function summary(records){records.forEach(requireValid);return {total:records.length,pending:records.filter(x=>x.status==="pending").length,approved:records.filter(x=>x.status==="approved").length,rejected:records.filter(x=>x.status==="rejected").length};}
function manifest(records,appointmentId){if(!id.test(appointmentId))throw Error("Appuntamento TEST obbligatorio");records.forEach(requireValid);if(records.some(x=>x.status!=="approved"))throw Error("Concludere la revisione di tutti i PDF prima del riepilogo");return {schema:"ITE40_PDF_REVIEW_1",appointmentId,documents:records.map((x,i)=>({id:"TEST-PDF-"+String(i+1).padStart(4,"0"),type:x.kind,bytes:x.bytes,status:x.status})),notice:"Riepilogo sintetico non archiviato; nessun PDF o dato cliente incluso"};}
return Object.freeze({allowed,create,decide,summary,manifest});
});