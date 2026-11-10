/* I.T.E. 4.0.143 — technical field reports, TEST-only, no uploaded files. */
(function(root){"use strict";
const copy=x=>JSON.parse(JSON.stringify(x)),s=x=>String(x??"").trim();
const kinds=["MANUTENZIONE","RIPARAZIONE","INSTALLAZIONE","CONTROLLO"];
const states=["BOZZA","DA_VERIFICARE","COMPLETATO"];
function validate(state){
 if(state?.schema!=="ITE_OPERATIONS_123"||!state.field?.catalog)throw Error("STATO_NON_VALIDO");
 const reports=state.technicalReports||[];if(!Array.isArray(reports))throw Error("RAPPORTI_NON_VALIDI");
 const ids=new Set(),c=state.field.catalog;
 for(const r of reports){
  if(!s(r.id)||ids.has(r.id))throw Error("ID_RAPPORTO_DUPLICATO");ids.add(r.id);
  const a=c.appointments.find(x=>x.id===r.appointmentId);
  if(!a||a.clientId!==r.clientId||a.siteId!==r.siteId||a.systemId!==r.systemId||a.equipmentId!==r.equipmentId)throw Error("RAPPORTO_APPUNTAMENTO_NON_COERENTE");
  if(!kinds.includes(r.kind)||!states.includes(r.status)||!s(r.operatorId)||!c.operators.some(x=>x.id===r.operatorId))throw Error("RAPPORTO_CAMPI_INVALIDI");
  if(!Array.isArray(r.checks)||r.checks.length>30||r.checks.some(x=>!s(x.label)||typeof x.done!=="boolean"))throw Error("CHECKLIST_NON_VALIDA");
  if(!Array.isArray(r.measurements)||r.measurements.length>30||r.measurements.some(x=>!s(x.label)||!Number.isFinite(x.value)||!s(x.unit)))throw Error("MISURE_NON_VALIDE");
  if(!Array.isArray(r.attachments)||r.attachments.length>20||r.attachments.some(x=>!s(x.name)||!["FOTO","RAPPORTO","ALTRO"].includes(x.type)||x.data!==undefined))throw Error("ALLEGATI_NON_VALIDI");
  if(!Array.isArray(r.history)||!r.history.length||r.history.some(x=>!s(x.actor)||!s(x.at)||!s(x.action)))throw Error("STORICO_NON_VALIDO");
  if(r.status==="COMPLETATO"&&(!r.checks.length||r.checks.some(x=>!x.done)||!s(r.notes)))throw Error("COMPLETAMENTO_NON_VALIDO");
 }return true;
}
function save(state,record,actor,expectedRevision){
 if(!s(actor))throw Error("OPERATORE_OBBLIGATORIO");
 if(expectedRevision!==state.revision)throw Error("REVISIONE_OBSOLETA");
 validate(state);const n=copy(state),c=n.field.catalog,a=c.appointments.find(x=>x.id===record.appointmentId);
 if(!a)throw Error("APPUNTAMENTO_INESISTENTE");
 if(a.status==="ANNULLATO")throw Error("APPUNTAMENTO_ANNULLATO");
 const reports=n.technicalReports||(n.technicalReports=[]),old=reports.find(x=>x.appointmentId===a.id);
 if(old&&record.id!==old.id)throw Error("RAPPORTO_GIA_PRESENTE");
 if(!old&&reports.some(x=>x.id===record.id))throw Error("ID_GIA_PRESENTE");
 const checks=(record.checks||[]).map(x=>({label:s(x.label).slice(0,100),done:x.done===true}));
 const measurements=(record.measurements||[]).map(x=>({label:s(x.label).slice(0,100),value:Number(x.value),unit:s(x.unit).slice(0,24)}));
 const attachments=(record.attachments||[]).map(x=>({name:s(x.name).slice(0,120),type:s(x.type)}));
 const now=new Date().toISOString();
 const r={id:s(record.id),appointmentId:a.id,clientId:a.clientId,siteId:a.siteId,systemId:a.systemId,equipmentId:a.equipmentId||"",operatorId:s(record.operatorId||a.operatorId),kind:s(record.kind||a.kind).toUpperCase(),status:s(record.status||"BOZZA"),notes:s(record.notes).slice(0,5000),additionalWork:s(record.additionalWork).slice(0,2000),checks,measurements,attachments,history:[...(old?.history||[]),{at:now,actor:s(actor),action:old?"AGGIORNAMENTO":"CREAZIONE",previousStatus:old?.status||null}]};
 if(old)reports.splice(reports.indexOf(old),1,r);else reports.push(r);
 validate(n);n.revision++;n.events.push({revision:n.revision,type:old?"UPDATE_TECHNICAL_REPORT":"CREATE_TECHNICAL_REPORT",actor:s(actor),at:now});
 return n;
}
const api=Object.freeze({validate,save,kinds,states});
if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ITE_TechnicalReports143=api;
})(typeof globalThis!=="undefined"?globalThis:this);
