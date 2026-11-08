/* I.T.E. 4.0.94 — fascicolo documentale TEST, vista incrociata in sola lettura. */
(function(root,factory){const api=factory(root);if(typeof module==="object"&&module.exports)module.exports=api;root.ITEDocumentDossier94=api;})(typeof globalThis!=="undefined"?globalThis:this,function(root){
"use strict";
const assert=(v,m)=>{if(!v)throw Error(m);};
function build(manifest,links,ledger,reviews){
 const I=root.ITEDocumentIntake90,L=root.ITEDocumentLinks93,S=root.ITEServiceLedger40,R=root.ITEDocumentReview92;
 assert(I&&L&&S&&R,"Moduli documentali non disponibili");
 I.validateManifest(manifest);L.validate(links);S.validate(ledger);if(reviews)R.validate(reviews);
 const findings=L.audit(links,manifest,ledger,reviews);
 const byId=new Map(findings.map(f=>[f.documentId,f]));
 const documents=manifest.records.map(d=>{
  const l=links.links.find(x=>x.documentId===d.id);
  const f=byId.get(d.id);
  return {id:d.id,name:d.name,type:f.type,clientId:l?l.clientId:null,siteId:l?l.siteId:null,plantId:l?l.plantId:null,equipmentId:l?l.equipmentId:null,appointmentId:l?l.appointmentId:null,issues:f.issues.slice()};
 });
 const orphans=findings.filter(f=>!manifest.records.some(d=>d.id===f.documentId));
 const clients=ledger.clients.map(c=>({id:c.id,name:c.name||c.id,sites:ledger.sites.filter(s=>s.clientId===c.id).length,documents:documents.filter(d=>d.clientId===c.id).length,issues:documents.filter(d=>d.clientId===c.id).reduce((n,d)=>n+d.issues.length,0)}));
 return {documents,clients,orphans,summary:{documents:documents.length,linked:documents.filter(d=>d.clientId).length,needsAttention:documents.filter(d=>d.issues.length).length,orphanLinks:orphans.length}};
}
function select(report,filter){const q=filter||{};return report.documents.filter(d=>(!q.clientId||d.clientId===q.clientId)&&(!q.siteId||d.siteId===q.siteId)&&(!q.plantId||d.plantId===q.plantId)&&(!q.equipmentId||d.equipmentId===q.equipmentId)&&(!q.appointmentId||d.appointmentId===q.appointmentId)&&(!q.onlyIssues||d.issues.length>0));}
function csv(report,filter){const rows=[["ID","Nome","Tipologia","Cliente","Sede","Impianto","Apparecchiatura","Appuntamento","Anomalie"]];for(const d of select(report,filter))rows.push([d.id,d.name,d.type,d.clientId,d.siteId,d.plantId,d.equipmentId,d.appointmentId,d.issues.join(";")]);return rows.map(row=>row.map(v=>{let s=String(v==null?"":v);if(/^[\s]*[=+@\-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}).join(",")).join("\r\n");}
return Object.freeze({build,select,csv});
});