/* I.T.E. 4.0.26 — Pianificazione interventi TEST; funzioni pure, nessun dato cliente reale. */
(function(root){'use strict';
const copy=x=>JSON.parse(JSON.stringify(x));
const test=x=>typeof x==='string'&&/^TEST-[A-Za-z0-9_-]{1,70}$/.test(x);
const requireId=x=>{if(!test(x))throw Error('SOLO_DATI_TEST');return x};
const stamp=x=>{if(typeof x!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(x)||!Number.isFinite(Date.parse(x)))throw Error('DATA_NON_VALIDA');return new Date(x).toISOString()};
function check(state){
 if(!state||!['clients','operators','appointments','interventions','quotes','audit'].every(k=>Array.isArray(state[k])))throw Error('ARCHIVIO_NON_VALIDO');
 for(const a of state.appointments){for(const k of ['id','clientId','siteId','plantId','operatorId'])requireId(a[k]);if(a.deviceId)requireId(a.deviceId);stamp(a.start);stamp(a.end)}
 return state;
}
function hierarchy(s,a){
 const c=s.clients.find(x=>x.id===a.clientId),site=c?.sites?.find(x=>x.id===a.siteId),plant=site?.plants?.find(x=>x.id===a.plantId);
 if(!plant||(a.deviceId&&!plant.devices?.some(x=>x.id===a.deviceId)))throw Error('GERARCHIA_NON_VALIDA');
 if(!s.operators.some(x=>x.id===a.operatorId))throw Error('OPERATORE_ASSENTE');
}
function conflicts(s,candidate,except){
 const start=stamp(candidate.start),end=stamp(candidate.end);if(end<=start)throw Error('ORARIO_NON_VALIDO');
 return s.appointments.filter(a=>a.id!==except&&a.status!=='ANNULLATO'&&a.operatorId===candidate.operatorId&&start<a.end&&end>a.start).map(a=>a.id);
}
function reschedule(state,appointmentId,change,actor,at){
 const s=copy(check(state));requireId(appointmentId);requireId(actor);const when=stamp(at);
 const a=s.appointments.find(x=>x.id===appointmentId);if(!a)throw Error('APPUNTAMENTO_ASSENTE');
 if(a.status!=='PROGRAMMATO')throw Error('APPUNTAMENTO_NON_RIPROGRAMMABILE');
 const next={...a,start:change.start===undefined?a.start:stamp(change.start),end:change.end===undefined?a.end:stamp(change.end),operatorId:change.operatorId===undefined?a.operatorId:requireId(change.operatorId)};
 hierarchy(s,next);const occupied=conflicts(s,next,a.id);if(occupied.length)throw Error('OPERATORE_OCCUPATO:'+occupied.join(','));
 Object.assign(a,{start:next.start,end:next.end,operatorId:next.operatorId});
 s.audit.push({action:'APPUNTAMENTO_RIPROGRAMMATO',appointmentId,operator:actor,at:when,previous:{start:state.appointments.find(x=>x.id===appointmentId).start,end:state.appointments.find(x=>x.id===appointmentId).end,operatorId:state.appointments.find(x=>x.id===appointmentId).operatorId}});
 return s;
}
function cancel(state,appointmentId,actor,at,reason){
 const s=copy(check(state));requireId(appointmentId);requireId(actor);const a=s.appointments.find(x=>x.id===appointmentId);
 if(!a)throw Error('APPUNTAMENTO_ASSENTE');if(a.status!=='PROGRAMMATO'||s.interventions.some(i=>i.appointmentId===a.id))throw Error('APPUNTAMENTO_NON_ANNULLABILE');
 if(typeof reason!=='string'||!reason.trim()||reason.length>300)throw Error('MOTIVO_OBBLIGATORIO');
 a.status='ANNULLATO';s.audit.push({action:'APPUNTAMENTO_ANNULLATO',appointmentId,operator:actor,at:stamp(at),reason:reason.trim()});return s;
}
function calendar(state,from,to,operatorId){
 const s=check(state),start=stamp(from),end=stamp(to);if(end<=start)throw Error('INTERVALLO_NON_VALIDO');
 if(operatorId)requireId(operatorId);
 const rows=s.appointments.filter(a=>a.start<end&&a.end>start&&(!operatorId||a.operatorId===operatorId)).map(a=>{
 const c=s.clients.find(x=>x.id===a.clientId),site=c?.sites?.find(x=>x.id===a.siteId),plant=site?.plants?.find(x=>x.id===a.plantId);
 const device=plant?.devices?.find(x=>x.id===a.deviceId),op=s.operators.find(x=>x.id===a.operatorId);
 return {id:a.id,start:a.start,end:a.end,status:a.status,kind:a.kind,clientId:a.clientId,clientName:c?.name||null,siteAddress:site?.address||null,device:device?device.brand+' '+device.model:null,operatorId:a.operatorId,operatorName:op?.name||null,operatorColor:op?.color||null};
 }).sort((a,b)=>a.start.localeCompare(b.start)||a.id.localeCompare(b.id));
 return copy(rows);
}
function workload(state,from,to){
 const rows=calendar(state,from,to).filter(x=>x.status!=='ANNULLATO'),out={};
 for(const o of state.operators){requireId(o.id);out[o.id]={operatorName:o.name,operatorColor:o.color,appointments:0,scheduledMinutes:0,workedMinutes:0};}
 for(const a of rows){const x=out[a.operatorId];if(!x)continue;x.appointments++;x.scheduledMinutes+=Math.max(0,Math.round((Math.min(Date.parse(a.end),Date.parse(to))-Math.max(Date.parse(a.start),Date.parse(from)))/60000));
 const i=state.interventions.find(i=>i.appointmentId===a.id);if(i?.arrival&&i?.departure){const mins=Math.round((Date.parse(i.departure)-Date.parse(i.arrival))/60000);if(Number.isFinite(mins)&&mins>=0)x.workedMinutes+=mins;}
 }
 return copy(out);
}
function audit(state){
 const s=check(state),issues=[];
 for(const a of s.appointments){
 try{hierarchy(s,a)}catch(e){issues.push({code:e.message,appointmentId:a.id})}
 if(a.end<=a.start)issues.push({code:'ORARIO_NON_VALIDO',appointmentId:a.id});
 if(a.status==='CHIUSO'&&!s.interventions.some(i=>i.appointmentId===a.id))issues.push({code:'INTERVENTO_MANCANTE',appointmentId:a.id});
 const duplicates=s.interventions.filter(i=>i.appointmentId===a.id);if(duplicates.length>1)issues.push({code:'INTERVENTI_MULTIPLI',appointmentId:a.id});
 if(a.status!=='ANNULLATO'&&conflicts(s,a,a.id).length)issues.push({code:'SOVRAPPOSIZIONE_OPERATORE',appointmentId:a.id});
 }
 return issues;
}
const api=Object.freeze({reschedule,cancel,calendar,workload,audit,conflicts});
root.ITE40Dispatch=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
