/* I.T.E. 4.0.146 — TEST lifecycle dossier: deterministic cross-module audit. */
(function(root){"use strict";
const s=x=>String(x??"").trim(),copy=x=>JSON.parse(JSON.stringify(x));
function build(state,clientId){
 if(state?.schema!=="ITE_OPERATIONS_123"||!state.field?.catalog||!state.commercial)throw Error("STATO_NON_VALIDO");
 const c=state.field.catalog,client=c.clients.find(x=>x.id===clientId);
 if(!client)throw Error("CLIENTE_INESISTENTE");
 const sites=c.sites.filter(x=>x.clientId===clientId),siteIds=new Set(sites.map(x=>x.id));
 const systems=c.systems.filter(x=>siteIds.has(x.siteId)),systemIds=new Set(systems.map(x=>x.id));
 const equipment=c.equipment.filter(x=>systemIds.has(x.systemId)),equipmentIds=new Set(equipment.map(x=>x.id));
 const appointments=c.appointments.filter(x=>x.clientId===clientId).sort((a,b)=>s(a.startAt).localeCompare(s(b.startAt))||s(a.id).localeCompare(s(b.id)));
 const interventions=c.interventions||[],reports=state.technicalReports||[];
 const issues=[],rows=[],ids=new Set();
 for(const a of appointments){
  if(ids.has(a.id))issues.push({code:"APPUNTAMENTO_DUPLICATO",appointmentId:a.id});ids.add(a.id);
  const errors=[];
  if(!sites.some(x=>x.id===a.siteId&&x.clientId===a.clientId))errors.push("SEDE_SCOLLEGATA");
  if(!systemIds.has(a.systemId)||!systems.some(x=>x.id===a.systemId&&x.siteId===a.siteId))errors.push("IMPIANTO_SCOLLEGATO");
  if(a.equipmentId&&!equipment.some(x=>x.id===a.equipmentId&&x.systemId===a.systemId))errors.push("APPARECCHIATURA_SCOLLEGATA");
  if(!Number.isFinite(Date.parse(a.startAt))||!Number.isFinite(Date.parse(a.endAt))||Date.parse(a.endAt)<=Date.parse(a.startAt))errors.push("FASCIA_ORARIA_NON_VALIDA");
  if(appointments.some(b=>b!==a&&b.operatorId===a.operatorId&&b.status!=="ANNULLATO"&&a.status!=="ANNULLATO"&&Date.parse(b.startAt)<Date.parse(a.endAt)&&Date.parse(a.startAt)<Date.parse(b.endAt)))errors.push("SOVRAPPOSIZIONE_OPERATORE");
  if(!c.operators.some(x=>x.id===a.operatorId))errors.push("OPERATORE_ASSENTE");
  const linked=interventions.filter(x=>x.appointmentId===a.id),linkedReports=reports.filter(x=>x.appointmentId===a.id);
  if(linked.length>1)errors.push("INTERVENTI_MULTIPLI");
  if(linkedReports.length>1)errors.push("RAPPORTI_MULTIPLI");
  const intervention=linked[0]||null,report=linkedReports[0]||null;
  if(a.status==="CHIUSO"&&(!intervention||intervention.status!=="CHIUSO"||!intervention.departedAt))errors.push("CHIUSURA_INCOERENTE");
  if(a.status==="CHIUSO"&&(!report||report.status!=="COMPLETATO"))errors.push("RAPPORTO_NON_COMPLETATO");
  if(report&&(report.operatorId!==a.operatorId||report.clientId!==a.clientId||report.siteId!==a.siteId||report.systemId!==a.systemId||s(report.equipmentId)!==s(a.equipmentId)))errors.push("RAPPORTO_SCOLLEGATO");
  if(intervention?.arrivedAt&&intervention?.departedAt&&(!Number.isFinite(Date.parse(intervention.arrivedAt))||!Number.isFinite(Date.parse(intervention.departedAt))||Date.parse(intervention.departedAt)<Date.parse(intervention.arrivedAt)))errors.push("ORARI_INVERTITI");
  if(intervention&&intervention.operatorId&&intervention.operatorId!==a.operatorId)errors.push("OPERATORE_INTERVENTO_DIVERSO");
  if(report?.status==="COMPLETATO"&&(!report.checks?.length||report.checks.some(x=>x.done!==true)))errors.push("CHECKLIST_INCOMPLETA");
  const extras=(state.commercial.extras||[]).filter(x=>x.appointmentId===a.id);
  for(const x of extras)if(x.clientId!==clientId||x.siteId!==a.siteId)errors.push("EXTRA_SCOLLEGATO");
  rows.push({appointmentId:a.id,siteId:a.siteId,systemId:a.systemId,equipmentId:a.equipmentId||"",operatorId:a.operatorId,startAt:a.startAt,endAt:a.endAt,status:a.status,interventionStatus:intervention?.status||null,arrivedAt:intervention?.arrivedAt||null,departedAt:intervention?.departedAt||null,reportStatus:report?.status||null,reportId:report?.id||null,extraIds:extras.map(x=>x.id),errors});
  for(const code of errors)issues.push({code,appointmentId:a.id});
 }
 for(const r of reports)if(r.clientId===clientId&&!ids.has(r.appointmentId))issues.push({code:"RAPPORTO_ORFANO",reportId:r.id});
 for(const i of interventions)if(!ids.has(i.appointmentId)&&appointments.some(a=>a.id===i.appointmentId)===false&&i.clientId===clientId)issues.push({code:"INTERVENTO_ORFANO",interventionId:i.id});
 const estimates=(state.commercial.estimates||[]).filter(x=>x.clientId===clientId).map(x=>({id:x.id,siteId:x.siteId,status:x.status}));
 const invoices=(state.commercial.invoices||[]).filter(x=>x.clientId===clientId).map(x=>({id:x.id,siteId:x.siteId,type:x.type||x.kind||"",status:x.status||""}));
 return copy({schema:"ITE_LIFECYCLE_AUDIT_146",version:"4.0.146",revision:state.revision,clientId,counts:{sites:sites.length,systems:systems.length,equipment:equipment.length,appointments:rows.length,closed:rows.filter(x=>x.status==="CHIUSO").length,reports:rows.filter(x=>x.reportId).length,issues:issues.length},rows,estimates,invoices,issues});
}
function all(state){if(!Array.isArray(state?.field?.catalog?.clients))throw Error("STATO_NON_VALIDO");return state.field.catalog.clients.map(x=>build(state,x.id));}
function verifyExport(report){if(report?.schema!=="ITE_LIFECYCLE_AUDIT_146"||!Array.isArray(report.rows)||!Array.isArray(report.issues))throw Error("REPORT_NON_VALIDO");return JSON.stringify(report,null,2);}
const api=Object.freeze({build,all,verifyExport});if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ITE_Lifecycle146=api;
})(typeof globalThis!=="undefined"?globalThis:this);
