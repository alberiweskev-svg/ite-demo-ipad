/* I.T.E. 4.0.141 — integrated TEST scheduling and intervention actions. No storage or network. */
(function(root){"use strict";
const trim=v=>String(v??"").trim();
const local=v=>/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v.slice(0,10);
function validate(state,record){
 if(state?.schema!=="ITE_OPERATIONS_123")throw Error("STATO_NON_VALIDO");
 const c=state.field.catalog,r={...record};
 for(const k of ["id","clientId","siteId","systemId","operatorId","kind","startAt","endAt"])if(!trim(r[k]))throw Error("CAMPO_OBBLIGATORIO:"+k);
 if(!local(r.startAt)||!local(r.endAt)||Date.parse(r.endAt)<=Date.parse(r.startAt))throw Error("INTERVALLO_NON_VALIDO");
 if(!c.clients.some(x=>x.id===r.clientId))throw Error("CLIENTE_INESISTENTE");
 if(!c.sites.some(x=>x.id===r.siteId&&x.clientId===r.clientId))throw Error("SEDE_NON_COERENTE");
 if(!c.systems.some(x=>x.id===r.systemId&&x.siteId===r.siteId))throw Error("IMPIANTO_NON_COERENTE");
 if(r.equipmentId&&!c.equipment.some(x=>x.id===r.equipmentId&&x.systemId===r.systemId))throw Error("APPARECCHIATURA_NON_COERENTE");
 if(!c.operators.some(x=>x.id===r.operatorId))throw Error("TECNICO_INESISTENTE");
 if(c.appointments.some(x=>x.id===r.id))throw Error("ID_GIA_PRESENTE");
 const conflicts=c.appointments.filter(x=>x.operatorId===r.operatorId&&x.status!=="ANNULLATO"&&Date.parse(x.startAt)<Date.parse(r.endAt)&&Date.parse(r.startAt)<Date.parse(x.endAt)).map(x=>x.id);
 return {ok:conflicts.length===0,conflicts,record:r};
}
function available(state,operatorId,date,startHour=8,endHour=18,step=30,duration=60){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isInteger(step)||step<15||step>120||!Number.isInteger(duration)||duration<15||duration>480)throw Error("PARAMETRI_NON_VALIDI");
 const c=state.field.catalog;if(!c.operators.some(x=>x.id===operatorId))throw Error("TECNICO_INESISTENTE");
 const result=[];for(let m=startHour*60;m+duration<=endHour*60;m+=step){
 const fmt=n=>String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0");
 const startAt=date+"T"+fmt(m),endAt=date+"T"+fmt(m+duration);
 if(!c.appointments.some(x=>x.operatorId===operatorId&&x.status!=="ANNULLATO"&&x.startAt<endAt&&startAt<x.endAt))result.push({startAt,endAt});
 }return result;
}
function intervention(state,appointmentId){
 const c=state.field.catalog,appointment=c.appointments.find(x=>x.id===appointmentId);
 if(!appointment)throw Error("APPUNTAMENTO_INESISTENTE");
 const record=c.interventions.find(x=>x.appointmentId===appointmentId)||null;
 return {appointment,intervention:record,allowed:record?(record.status==="CHIUSO"?["REVISE"]:["CLOSE"]):["ARRIVE"]};
}
const api=Object.freeze({validate,available,intervention});if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ITE_CalendarActions141=api;
})(typeof globalThis!=="undefined"?globalThis:this);
