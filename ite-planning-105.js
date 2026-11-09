/* I.T.E. 4.0.105 — TEST dispatch, appointment lifecycle and job dossier. No operational writes. */
(function(root,factory){const api=factory(typeof module==="object"&&module.exports?require("./ite-workflow-100.js"):root.ITEWorkflow100);if(typeof module==="object"&&module.exports)module.exports=api;root.ITEPlanning105=api;})(typeof globalThis!=="undefined"?globalThis:this,function(base){
"use strict";
if(!base)throw Error("Workflow 100 richiesto");
const copy=x=>JSON.parse(JSON.stringify(x));
const validTime=x=>typeof x==="string"&&Number.isFinite(Date.parse(x));
const get=(s,k,id)=>s.records[k].find(x=>x.id===id);
function range(start,end){if(!validTime(start)||!validTime(end)||Date.parse(end)<=Date.parse(start))throw Error("Intervallo orario non valido");return [Date.parse(start),Date.parse(end)];}
function conflicts(s,operatorId,start,end,exceptId){
base.validate(s);if(!get(s,"operators",operatorId))throw Error("Operatore inesistente");
const [a,b]=range(start,end);
return copy(s.records.appointments.filter(x=>x.id!==exceptId&&x.operatorId===operatorId&&x.status!=="ANNULLATO"&&validTime(x.startsAt)&&validTime(x.endsAt)&&Date.parse(x.startsAt)<b&&Date.parse(x.endsAt)>a).map(x=>({id:x.id,startsAt:x.startsAt,endsAt:x.endsAt})));
}
function createAppointment(s,row,operator,expected){
base.validate(s);if(s.revision!==expected)throw Error("Conflitto revisione");
range(row.startsAt,row.endsAt);
if(conflicts(s,row.operatorId,row.startsAt,row.endsAt).length)throw Error("Operatore già impegnato");
return base.transact(s,"appointments",{...copy(row),status:"PROGRAMMATO"},operator,expected);
}
function reviseAppointment(s,id,changes,operator,reason,expected){
base.validate(s);if(s.revision!==expected)throw Error("Conflitto revisione");
if(typeof operator!=="string"||!operator.trim()||typeof reason!=="string"||reason.trim().length<5)throw Error("Operatore e motivazione obbligatori");
const before=get(s,"appointments",id);if(!before)throw Error("Appuntamento inesistente");
if(["ANNULLATO","CONCLUSO"].includes(before.status))throw Error("Appuntamento non modificabile");
const permitted=["startsAt","endsAt","operatorId"];if(!changes||!Object.keys(changes).length||Object.keys(changes).some(k=>!permitted.includes(k)))throw Error("Campi non consentiti");
const after={...before,...copy(changes)};
range(after.startsAt,after.endsAt);
if(conflicts(s,after.operatorId,after.startsAt,after.endsAt,id).length)throw Error("Operatore già impegnato");
if(s.records.interventions.some(x=>x.appointmentId===id)&&after.operatorId!==before.operatorId)throw Error("Operatore già collegato all'intervento");
const next=copy(s),target=get(next,"appointments",id);
Object.assign(target,after);next.revision++;
next.audit.push({revision:next.revision,kind:"appointments",id,operator:operator.trim(),action:"RESCHEDULE",reason:reason.trim(),before:copy(before),after:copy(target)});
return next;
}
function startJob(s,appointmentId,id,arrivedAt,operator,expected){
base.validate(s);if(s.revision!==expected)throw Error("Conflitto revisione");
const a=get(s,"appointments",appointmentId);
if(!a||a.status==="ANNULLATO"||a.status==="CONCLUSO")throw Error("Appuntamento non avviabile");
if(s.records.interventions.some(x=>x.appointmentId===appointmentId))throw Error("Intervento già associato");
if(!validTime(arrivedAt))throw Error("Ora arrivo non valida");
const row={id,appointmentId,clientId:a.clientId,siteId:a.siteId,plantId:a.plantId,deviceId:a.deviceId,operatorId:a.operatorId,arrivedAt,status:"IN_CORSO"};
return base.transact(s,"interventions",row,operator,expected);
}
function closeJob(s,id,leftAt,operator,reason,expected){
base.validate(s);if(s.revision!==expected)throw Error("Conflitto revisione");
if(typeof operator!=="string"||!operator.trim()||typeof reason!=="string"||reason.trim().length<5)throw Error("Operatore e descrizione lavori obbligatori");
const job=get(s,"interventions",id);
if(!job||job.status!=="IN_CORSO")throw Error("Intervento non in corso");
if(!validTime(leftAt)||Date.parse(leftAt)<Date.parse(job.arrivedAt))throw Error("Ora uscita non valida");
const next=copy(s),target=get(next,"interventions",id);target.leftAt=leftAt;target.status="CHIUSO";target.notes=reason.trim();
next.revision++;next.audit.push({revision:next.revision,kind:"interventions",id,operator:operator.trim(),action:"CLOSE",arrivedAt:job.arrivedAt,leftAt,reason:reason.trim()});
return next;
}
function dossier(s,appointmentId){
base.validate(s);const a=get(s,"appointments",appointmentId);if(!a)throw Error("Appuntamento inesistente");
const jobs=s.records.interventions.filter(x=>x.appointmentId===appointmentId);
const docs=s.records.documents.filter(x=>x.appointmentId===appointmentId||x.clientId===a.clientId&&(x.plantId===a.plantId||x.deviceId===a.deviceId));
return copy({appointment:a,client:get(s,"clients",a.clientId),site:get(s,"sites",a.siteId),plant:get(s,"plants",a.plantId),device:get(s,"devices",a.deviceId),operator:get(s,"operators",a.operatorId),interventions:jobs,documents:docs,quotes:s.records.quotes.filter(x=>x.clientId===a.clientId),extras:s.records.extras.filter(x=>x.clientId===a.clientId),invoices:s.records.invoices.filter(x=>x.clientId===a.clientId),officialReady:false});
}
return Object.freeze({conflicts,createAppointment,reviseAppointment,startJob,closeJob,dossier});
});