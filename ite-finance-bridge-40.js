/* I.T.E. 4.0.76 - TEST-only finance intake and reconciliation bridge. */
(function(root,factory){const api=factory(typeof module==="object"&&module.exports?require("./ite-finance-workspace-40.js"):root.ITEFinanceWorkspace40,typeof module==="object"&&module.exports?require("./ite-finance-reconcile-40.js"):root.ITEFinanceReconcile40);if(typeof module==="object"&&module.exports)module.exports=api;root.ITEFinanceBridge40=api;})(typeof globalThis!=="undefined"?globalThis:this,function(W,F){
"use strict";
if(!W||!F)throw Error("Dipendenze finanziarie mancanti");
const ID=/^TEST-[A-Z0-9-]{2,60}$/;
function clone(a){return JSON.parse(JSON.stringify(a));}
function fingerprint(d){return [d.direction,d.partyId,String(d.number||"").trim().toUpperCase(),String(d.td||"TD01").trim().toUpperCase(),F.cents(d.total)].join("|");}
function merge(archive,batch){
 W.validateArchive(archive);
 if(!Array.isArray(batch)||batch.length>100)throw Error("Lotto non valido (massimo 100)");
 const next=clone(archive),known=new Set(next.documents.map(fingerprint)),ids=new Set(next.documents.map(d=>d.id));
 const linked=new Set(next.links.map(l=>l.appointmentId+"|"+l.documentId));
 for(const raw of batch){
  if(!raw||!ID.test(raw.appointmentId))throw Error("Appuntamento TEST obbligatorio");
  const doc={...raw};F.validate(doc);
  if(ids.has(doc.id)||known.has(fingerprint(doc)))throw Error("Documento duplicato: "+doc.id);
  ids.add(doc.id);known.add(fingerprint(doc));
  const key=doc.appointmentId+"|"+doc.id;
  if(linked.has(key))throw Error("Collegamento duplicato");
  linked.add(key);
  next.documents.push(doc);next.links.push({appointmentId:doc.appointmentId,documentId:doc.id});
 }
 W.validateArchive(next);
 return next;
}
function audit(archive,appointments){
 W.validateArchive(archive);
 if(!Array.isArray(appointments))throw Error("Elenco appuntamenti TEST non valido");
 const appointmentIds=new Set();
 for(const a of appointments){if(!a||!ID.test(a.id)||appointmentIds.has(a.id))throw Error("Appuntamento TEST non valido o duplicato");appointmentIds.add(a.id);}
 const report=W.report(archive),warnings=[...report.warnings];
 const docs=new Map(archive.documents.map(d=>[d.id,d]));
 const seen=new Set();
 for(const d of archive.documents){const key=fingerprint(d);if(seen.has(key))warnings.push("POSSIBILE_DUPLICATO_FISCALE:"+d.id);seen.add(key);}
 for(const link of archive.links){
  if(!appointmentIds.has(link.appointmentId))warnings.push("APPUNTAMENTO_NON_PRESENTE:"+link.appointmentId);
  const d=docs.get(link.documentId);
  if(d&&d.appointmentId&&d.appointmentId!==link.appointmentId)warnings.push("APPUNTAMENTO_INCOERENTE:"+d.id);
 }
 for(const c of report.credits)if(c.residualCents>0)warnings.push("TD04_DA_RECUPERARE:"+c.documentId);
 return {schema:"ITE-FINANCE-AUDIT-TEST-1",documents:report.documents,links:report.links,summaries:report.summaries,credits:report.credits,warnings:[...new Set(warnings)].sort()};
}
function previewMerge(archive,batch,appointments){const merged=merge(archive,batch);return {archive:merged,audit:audit(merged,appointments)};}
return Object.freeze({fingerprint,merge,audit,previewMerge});
});