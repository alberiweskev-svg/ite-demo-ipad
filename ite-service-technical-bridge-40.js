/* I.T.E. 4.0.68 — read-only service-to-technical-dossier bridge. No PDF bytes, uploads or network. */
(function(root,factory){
 const api=factory(
 typeof module==="object"&&module.exports?require("./ite-service-registry-40.js"):root.ITEServiceRegistry40,
 typeof module==="object"&&module.exports?require("./ite-technical-dossier-40.js"):root.ITETechnicalDossier40
 );
 if(typeof module==="object"&&module.exports)module.exports=api;
 root.ITEServiceTechnicalBridge40=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(R,T){
"use strict";
if(!R||!T)throw Error("Missing TEST service or technical dossier engine");
const clone=x=>JSON.parse(JSON.stringify(x));
function hierarchy(service){
 R.check(service);
 const h=clone(service);
 // The service registry resolves appointment ancestry through equipment.
 // Legacy technical dossiers additionally require explicit clientId and siteId.
 h.appointments=h.appointments.map(a=>{
  const equipment=h.equipment.find(e=>e.id===a.equipmentId);
  const plant=h.plants.find(p=>p.id===equipment.plantId);
  const site=h.sites.find(s=>s.id===plant.siteId);
  if(a.clientId&&a.clientId!==site.clientId)throw Error("Appointment client mismatch");
  if(a.siteId&&a.siteId!==site.id)throw Error("Appointment site mismatch");
  return {...a,clientId:site.clientId,siteId:site.id};
 });
 return h;
}
function context(service,appointmentId){
 const h=hierarchy(service);
 const a=h.appointments.find(x=>x.id===appointmentId);
 if(!a)throw Error("TEST appointment not found");
 const equipment=h.equipment.find(x=>x.id===a.equipmentId);
 const plant=h.plants.find(x=>x.id===equipment.plantId);
 return {clientId:a.clientId,siteId:a.siteId,plantId:plant.id,equipmentId:equipment.id,appointmentId:a.id};
}
function reconcile(service,technical,appointmentId){
 const h=hierarchy(service),link=context(service,appointmentId);
 T.validate(technical,h);
 const docs=T.list(technical,h,{appointmentId});
 const counts=Object.fromEntries(T.TYPES.map(t=>[t,0]));
 const states=Object.fromEntries(T.STATES.map(s=>[s,0]));
 const warnings=[];
 const rows=docs.map(d=>{
  counts[d.type]++;states[d.state]++;
  if(d.state!=="ARCHIVED")warnings.push("DOCUMENTO_DA_COMPLETARE:"+d.id);
  return {id:d.id,type:d.type,title:d.title,date:d.date,state:d.state,attachmentCount:d.attachments.length,
   auditCount:technical.audit.filter(a=>a.documentId===d.id).length};
 });
 return {schema:"ITE-SERVICE-TECHNICAL-BRIDGE-TEST-1",appointmentId,link,documents:rows,counts,states,warnings,
 notice:"Solo metadati TEST. Non contiene PDF, firme o documenti fiscali."};
}
function audit(service,technical){
 const h=hierarchy(service);T.validate(technical,h);
 const results=h.appointments.map(a=>reconcile(service,technical,a.id));
 const unassigned=technical.documents.filter(d=>!d.link.appointmentId).map(d=>({id:d.id,type:d.type,siteId:d.link.siteId,state:d.state}));
 return {schema:"ITE-SERVICE-TECHNICAL-AUDIT-TEST-1",appointments:results,unassigned,
 totalDocuments:technical.documents.length,assignedDocuments:results.reduce((n,r)=>n+r.documents.length,0)};
}
return Object.freeze({hierarchy,context,reconcile,audit});
});
