/* I.T.E. 4.0.142 — technical dossier and intervention quality gates. TEST read-only. */
(function(root){"use strict";
const safe=x=>String(x??"").trim();
const by=(a,id)=>Array.isArray(a)?a.find(x=>x.id===id):undefined;
const time=v=>typeof v==="string"&&/^\d{4}-\d\d-\d\dT\d\d:\d\d/.test(v)&&Number.isFinite(Date.parse(v))?Date.parse(v):null;
const templates={
 MANUTENZIONE:["Identificazione apparecchiatura","Controlli visivi e sicurezza","Pulizia e manutenzione","Prove funzionali","Rapporto e allegati"],
 RIPARAZIONE:["Diagnosi iniziale","Verifica sicurezza","Intervento eseguito","Prova funzionale finale","Ricambi e documentazione"],
 INSTALLAZIONE:["Verifica progetto e materiali","Posa e collegamenti","Prove di tenuta e sicurezza","Avviamento e collaudo","Documentazione tecnica"],
 CONTROLLO:["Identificazione impianto","Misure e controlli","Verifica anomalie","Esito finale","Rapporto tecnico"]
};
function build(state,filters={}){
 if(state?.schema!=="ITE_OPERATIONS_123"||!state.field?.catalog)throw Error("STATO_NON_VALIDO");
 const c=state.field.catalog,m=state.commercial||{},appointments=c.appointments||[];
 const seen=new Set(),results=[];
 for(const a of appointments){
  if(filters.clientId&&a.clientId!==filters.clientId||filters.operatorId&&a.operatorId!==filters.operatorId||filters.from&&safe(a.startAt).slice(0,10)<filters.from||filters.to&&safe(a.startAt).slice(0,10)>filters.to)continue;
  const warnings=[],checks=[],put=(code,ok)=>{checks.push({code,ok:!!ok});if(!ok)warnings.push(code);};
  if(seen.has(a.id))warnings.push("APPUNTAMENTO_DUPLICATO");seen.add(a.id);
  const client=by(c.clients,a.clientId),site=by(c.sites,a.siteId),system=by(c.systems,a.systemId),device=by(c.equipment,a.equipmentId),operator=by(c.operators,a.operatorId);
  put("CLIENTE",!!client);put("SEDE",!!site&&site.clientId===a.clientId);put("IMPIANTO",!!system&&system.siteId===a.siteId);
  put("TECNICO",!!operator);if(a.equipmentId)put("APPARECCHIATURA",!!device&&device.systemId===a.systemId);
  const start=time(a.startAt),end=time(a.endAt);
  put("ORARIO_PROGRAMMATO",start!==null&&end!==null&&end>start);
  const records=(c.interventions||[]).filter(x=>x.appointmentId===a.id),job=records[0]||null;
  if(records.length>1)warnings.push("INTERVENTI_MULTIPLI");
  if(!job&&a.status!=="ANNULLATO")warnings.push("INTERVENTO_NON_AVVIATO");
  if(job){put("STATO_INTERVENTO",["APERTO","CHIUSO","REVISIONATO","IN_CORSO"].includes(safe(job.status).toUpperCase()));
   const arrival=time(job.arrivedAt||job.arrivalAt||job.startedAt),departure=time(job.leftAt||job.exitAt||job.closedAt);
   if(arrival!==null&&departure!==null)put("TEMPI_EFFETTIVI",departure>=arrival);
  }
  const conflicts=appointments.filter(x=>x.id!==a.id&&x.operatorId===a.operatorId&&x.status!=="ANNULLATO"&&a.status!=="ANNULLATO"&&time(x.startAt)!==null&&time(x.endAt)!==null&&start!==null&&end!==null&&time(x.startAt)<end&&start<time(x.endAt)).map(x=>x.id);
  if(conflicts.length)warnings.push("SOVRAPPOSIZIONE_TECNICO");
  const extras=(m.extras||[]).filter(x=>x.appointmentId===a.id);
  const linkedInvoices=(m.invoices||[]).filter(x=>x.appointmentId===a.id);
  const kind=safe(a.kind).toUpperCase();
  const checklist=templates[kind]||templates.CONTROLLO;
  results.push({id:a.id,kind,status:a.status,startAt:a.startAt,endAt:a.endAt,client:client?.name||a.clientId,site:site?.address||a.siteId,system:system?.description||system?.model||a.systemId,equipment:device?.model||a.equipmentId||"",operator:operator?.name||a.operatorId,intervention:job?{status:job.status,arrivedAt:job.arrivedAt||job.arrivalAt||"",leftAt:job.leftAt||job.exitAt||job.closedAt||""}:null,checks,checklist,conflicts,extras:extras.map(x=>({id:x.id,approved:x.approved||{}})),invoices:linkedInvoices.map(x=>({id:x.id,type:x.type})),warnings,ready:warnings.length===0});
 }
 return {version:"4.0.142",revision:state.revision,items:results,summary:{total:results.length,ready:results.filter(x=>x.ready).length,withWarnings:results.filter(x=>!x.ready).length,overlaps:results.filter(x=>x.conflicts.length).length}};
}
const api=Object.freeze({build,templates});if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ITE_Technical142=api;
})(typeof globalThis!=="undefined"?globalThis:this);
