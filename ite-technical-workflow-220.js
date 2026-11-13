/* I.T.E. 4.0.220 — technical document workflow, synthetic metadata only. */
(function(root,factory){const api=factory(root);if(typeof module==="object"&&module.exports)module.exports=api;root.ITETechnicalWorkflow220=api;})(typeof globalThis!=="undefined"?globalThis:this,function(root){"use strict";
const Intake=root.ITEDocumentIntake217||(typeof require==="function"?require("./ite-document-intake-217.js"):null);
const clone=x=>JSON.parse(JSON.stringify(x));
function options(field,clientId,siteId){
 const clients=field.clients.map(x=>({id:x.id,name:x.name||x.id}));
 const sites=field.sites.filter(x=>x.clientId===clientId).map(x=>({id:x.id,name:x.name||x.id}));
 const appointments=new Map(field.appointments.map(x=>[x.id,x]));
 const interventions=field.interventions.filter(x=>{const a=appointments.get(x.appointmentId);return a&&a.clientId===clientId&&(!siteId||a.siteId===siteId);}).map(x=>({id:x.id,name:x.name||x.id}));
 return {clients,sites,interventions};
}
function change(documents,field,operation){
 Intake.checkRelations(documents,field);
 const {action,id,patch}=operation;
 let next;
 if(action==="add"){next=[...documents,clone(patch)];}
 else if(action==="update"){
  if(!documents.some(x=>x.id===id))throw Error("DOCUMENTO_MANCANTE");
  if(!patch||Object.keys(patch).some(k=>!["type","status","label","note","clientId","siteId","interventionId"].includes(k)))throw Error("MODIFICA_NON_VALIDA");
  next=documents.map(x=>x.id===id?{...x,...clone(patch)}:x);
 }else if(action==="remove"){
  if(!documents.some(x=>x.id===id))throw Error("DOCUMENTO_MANCANTE");
  next=documents.filter(x=>x.id!==id);
 }else throw Error("AZIONE_NON_VALIDA");
 Intake.checkRelations(next,field);return next;
}
function apply(store,operation){
 // Use the local snapshot, never restore here: restoring would silently adopt
 // a concurrent tab's revision and defeat the optimistic locking contract.
 const current=store.snapshot();
 const technicalDocuments=change(current.technicalDocuments,current.field,operation);
 return store.save({...current,technicalDocuments},current.revision);
}
function report(workspace){
 const docs=workspace.technicalDocuments||[],counts={};
 for(const t of Intake.TYPES)counts[t]=0;
 for(const d of docs)counts[d.type]++;
 return {total:docs.length,byType:counts,unlinked:docs.filter(d=>!d.clientId).map(d=>d.id),pending:docs.filter(d=>d.status==="DA_CLASSIFICARE"||d.status==="DA_VERIFICARE").map(d=>d.id)};
}
return Object.freeze({options,change,apply,report});
});