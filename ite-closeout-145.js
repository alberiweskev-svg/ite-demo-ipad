/* I.T.E. 4.0.145 — atomic TEST closeout: report + field intervention. */
(function(root){"use strict";
const clone=x=>JSON.parse(JSON.stringify(x)),str=x=>String(x??"").trim();
function inspect(state,appointmentId){
 if(state?.schema!=="ITE_OPERATIONS_123")throw Error("STATO_NON_VALIDO");
 const c=state.field.catalog,a=c.appointments.find(x=>x.id===appointmentId);
 if(!a)throw Error("APPUNTAMENTO_INESISTENTE");
 const i=c.interventions.find(x=>x.appointmentId===a.id);
 const r=(state.technicalReports||[]).find(x=>x.appointmentId===a.id);
 const errors=[];
 if(a.status!=="IN_CORSO")errors.push("APPUNTAMENTO_NON_IN_CORSO");
 if(!i||i.status!=="APERTO"||!i.arrivedAt)errors.push("INTERVENTO_NON_APERTO");
 if(!r)errors.push("RAPPORTO_ASSENTE");
 else {
  if(r.status!=="COMPLETATO")errors.push("RAPPORTO_NON_COMPLETATO");
  if(r.operatorId!==a.operatorId)errors.push("TECNICO_NON_COINCIDENTE");
  if(r.clientId!==a.clientId||r.siteId!==a.siteId||r.systemId!==a.systemId||r.equipmentId!==(a.equipmentId||""))errors.push("GERARCHIA_NON_COINCIDENTE");
  if(!r.checks?.length||r.checks.some(x=>x.done!==true)||!str(r.notes))errors.push("RAPPORTO_INCOMPLETO");
 }
 return {appointmentId:a.id,operatorId:a.operatorId,reportId:r?.id||null,arrivedAt:i?.arrivedAt||null,status:a.status,errors,ready:errors.length===0};
}
function close(state,{appointmentId,departedAt,additionalWork=""},actor,expectedRevision,deps){
 if(!str(actor))throw Error("OPERATORE_OBBLIGATORIO");
 if(state.revision!==expectedRevision)throw Error("REVISIONE_OBSOLETA");
 const check=inspect(state,appointmentId);
 if(!check.ready)throw Error("CHIUSURA_BLOCCATA:"+check.errors.join(","));
 if(!Number.isFinite(Date.parse(departedAt))||Date.parse(departedAt)<Date.parse(check.arrivedAt))throw Error("ORARIO_USCITA_NON_VALIDO");
 if(!deps?.operations?.apply||!deps?.reports?.validate)throw Error("DIPENDENZE_ASSENTI");
 deps.reports.validate(state);
 const next=deps.operations.apply(clone(state),{type:"CLOSE",id:appointmentId,at:departedAt,additionalWork},actor);
 deps.reports.validate(next);
 if(next.field.catalog.appointments.find(x=>x.id===appointmentId)?.status!=="CHIUSO")throw Error("CHIUSURA_NON_CONFERMATA");
 return next;
}
function audit(state){
 const c=state.field.catalog,rows=c.appointments.map(a=>inspect(state,a.id));
 return {version:"4.0.145",revision:state.revision,rows,summary:{total:rows.length,ready:rows.filter(x=>x.ready).length,blocked:rows.filter(x=>x.status==="IN_CORSO"&&!x.ready).length,closed:rows.filter(x=>x.status==="CHIUSO").length}};
}
const api=Object.freeze({inspect,close,audit});
if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ITE_Closeout145=api;
})(typeof globalThis!=="undefined"?globalThis:this);
