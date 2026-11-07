/* I.T.E. 4.0.75 — TEST finance workspace, immutable reconciliation and credit recovery. */
(function(root,factory){const api=factory(typeof module==="object"&&module.exports?require("./ite-finance-reconcile-40.js"):root.ITEFinanceReconcile40);if(typeof module==="object"&&module.exports)module.exports=api;root.ITEFinanceWorkspace40=api;})(typeof globalThis!=="undefined"?globalThis:this,function(F){
"use strict";
if(!F)throw Error("Motore finanziario TEST mancante");
const ID=/^TEST-[A-Z0-9-]{2,60}$/;
const STATUS=Object.freeze({PENDING:"DA_RECUPERARE",PARTIAL:"PARZIALMENTE_RECUPERATA",RECOVERED:"RECUPERATA"});
function validateArchive(archive){
 if(!archive||!Array.isArray(archive.documents)||!Array.isArray(archive.links)||!Array.isArray(archive.recoveries))throw Error("Archivio TEST non valido");
 const docs=new Map(),unique=new Set();
 for(const raw of archive.documents){const d=F.validate(raw);if(docs.has(d.id))throw Error("Documento duplicato");docs.set(d.id,d);}
 for(const link of archive.links){if(!link||!ID.test(link.appointmentId)||!ID.test(link.documentId)||!docs.has(link.documentId))throw Error("Collegamento non valido");const key=link.appointmentId+"|"+link.documentId;if(unique.has(key))throw Error("Collegamento duplicato");unique.add(key);}
 const recoveries=new Map();
 for(const r of archive.recoveries){
  if(!r||!ID.test(r.id)||!ID.test(r.documentId)||!docs.has(r.documentId))throw Error("Recupero non valido");
  if(docs.get(r.documentId).kind!=="NOTA_CREDITO")throw Error("Recupero consentito solo per TD04");
  if(recoveries.has(r.id))throw Error("Movimento duplicato");
  if(r.direction!=="INCASSO"&&r.direction!=="COMPENSAZIONE")throw Error("Modalita recupero non valida");
  const amount=F.cents(r.amount);if(amount===0)throw Error("Recupero nullo");
  recoveries.set(r.id,{...r,amountCents:amount});
 }
 for(const d of docs.values())if(d.kind==="NOTA_CREDITO"){
  const amount=Array.from(recoveries.values()).filter(r=>r.documentId===d.id).reduce((sum,r)=>sum+r.amountCents,0);
  if(amount>d.totalCents)throw Error("Recuperi superiori alla nota di credito");
 }
 F.reconcile(archive.documents,archive.links);
 return {docs,recoveries};
}
function report(archive){
 const {docs,recoveries}=validateArchive(archive);
 const base=F.reconcile(archive.documents,archive.links);
 const credits=[];
 for(const d of docs.values())if(d.kind==="NOTA_CREDITO"){
  const recovered=Array.from(recoveries.values()).filter(r=>r.documentId===d.id).reduce((s,r)=>s+r.amountCents,0);
  credits.push({documentId:d.id,direction:d.direction,totalCents:d.totalCents,recoveredCents:recovered,residualCents:d.totalCents-recovered,status:recovered===0?STATUS.PENDING:recovered===d.totalCents?STATUS.RECOVERED:STATUS.PARTIAL});
 }
 const warnings=[];
 for(const d of docs.values())if(!archive.links.some(l=>l.documentId===d.id))warnings.push("DOCUMENTO_SENZA_APPUNTAMENTO:"+d.id);
 return {schema:"ITE-FINANCE-WORKSPACE-TEST-1",...base,credits,warnings};
}
function addRecovery(archive,movement){
 const next=JSON.parse(JSON.stringify(archive));
 next.recoveries.push(movement);
 validateArchive(next);
 return next;
}
function exportJSON(archive){validateArchive(archive);return JSON.stringify({schema:"ITE-FINANCE-WORKSPACE-TEST-1",...archive},null,2);}
function importJSON(raw){const a=JSON.parse(raw);if(a.schema!=="ITE-FINANCE-WORKSPACE-TEST-1")throw Error("Schema incompatibile");const value={documents:a.documents,links:a.links,recoveries:a.recoveries};validateArchive(value);return value;}
function empty(){return {documents:[],links:[],recoveries:[]};}
return Object.freeze({STATUS,empty,validateArchive,report,addRecovery,exportJSON,importJSON});
});