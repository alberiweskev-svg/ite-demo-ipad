/* I.T.E. 4.0.103 — controlled TEST editing and dossier links. No official writes. */
(function(root,factory){const api=factory(typeof module==="object"&&module.exports?require("./ite-workflow-100.js"):root.ITEWorkflow100);if(typeof module==="object"&&module.exports)module.exports=api;root.ITEWorkflowEdit103=api;})(typeof globalThis!=="undefined"?globalThis:this,function(base){
"use strict";
const copy=x=>JSON.parse(JSON.stringify(x));
const validDate=x=>typeof x==="string"&&Number.isFinite(Date.parse(x));
function update(s,kind,id,patch,actor,expected,reason){
base.validate(s);
if(expected!==s.revision)throw Error("Conflitto revisione");
if(!["appointments","interventions","documents","quotes","extras","invoices"].includes(kind))throw Error("Tipo modifica non ammesso");
if(typeof actor!=="string"||!actor.trim()||actor.length>80)throw Error("Operatore obbligatorio");
if(typeof reason!=="string"||reason.trim().length<5||reason.length>300)throw Error("Motivazione obbligatoria");
if(!patch||typeof patch!=="object"||Array.isArray(patch))throw Error("Modifica non valida");
const next=copy(s),row=next.records[kind].find(x=>x.id===id);
if(!row)throw Error("Registrazione inesistente");
const fields={appointments:["startsAt","endsAt","operatorId"],interventions:["arrivedAt","leftAt","notes"],documents:["appointmentId","plantId","deviceId","name"],quotes:["description"],extras:["description"],invoices:["reference"]};
const keys=Object.keys(patch);if(!keys.length||keys.some(k=>!fields[kind].includes(k)))throw Error("Campo non modificabile");
const before={};for(const k of keys){before[k]=row[k]??null;row[k]=patch[k];}
if(kind==="appointments"){
if(!validDate(row.startsAt)||row.endsAt&&!validDate(row.endsAt)||row.endsAt&&Date.parse(row.endsAt)<=Date.parse(row.startsAt))throw Error("Intervallo appuntamento non valido");
if(keys.includes("operatorId")){if(!next.records.operators.some(x=>x.id===row.operatorId))throw Error("Operatore inesistente");if(next.records.interventions.some(x=>x.appointmentId===id&&x.operatorId!==row.operatorId))throw Error("Operatore già associato a intervento");}
if(["CONCLUSO","ANNULLATO"].includes(row.status)&&keys.some(k=>k!=="endsAt"))throw Error("Appuntamento concluso o annullato");
}
if(kind==="interventions"){
if(row.arrivedAt&&!validDate(row.arrivedAt)||row.leftAt&&!validDate(row.leftAt)||row.leftAt&&!row.arrivedAt||row.arrivedAt&&row.leftAt&&Date.parse(row.leftAt)<Date.parse(row.arrivedAt))throw Error("Orari intervento non validi");
if(["CHIUSO","REVISIONATO"].includes(row.status)&&keys.some(k=>k!=="notes"))throw Error("Riaprire l'intervento prima di correggere gli orari");
if(keys.includes("notes")&&(typeof row.notes!=="string"||row.notes.length>2000))throw Error("Note non valide");
}
if(kind==="documents"){
if(keys.includes("appointmentId")&&row.appointmentId){const a=next.records.appointments.find(x=>x.id===row.appointmentId);if(!a||a.clientId!==row.clientId)throw Error("Appuntamento non coerente con cliente");if(row.plantId&&row.plantId!==a.plantId||row.deviceId&&row.deviceId!==a.deviceId)throw Error("Impianto o apparecchiatura non coerente");}
if(row.plantId){const p=next.records.plants.find(x=>x.id===row.plantId);if(!p||p.clientId!==row.clientId)throw Error("Impianto non coerente");}
if(row.deviceId){const d=next.records.devices.find(x=>x.id===row.deviceId);if(!d||d.clientId!==row.clientId||row.plantId&&d.plantId!==row.plantId)throw Error("Apparecchiatura non coerente");}
if(keys.includes("name")&&(typeof row.name!=="string"||!row.name.trim()||row.name.length>200))throw Error("Nome documento non valido");
}
if(kind==="quotes"||kind==="extras"){if(typeof row.description!=="string"||!row.description.trim()||row.description.length>500)throw Error("Descrizione non valida");if(row.status&&row.status!=="DA_ACCETTARE"&&row.status!=="DA_APPROVARE")throw Error("Voce già deliberata");}
if(kind==="invoices"&&(typeof row.reference!=="string"||row.reference.length>120))throw Error("Riferimento non valido");
next.revision++;
next.audit.push({revision:next.revision,kind,id,operator:actor.trim(),action:"EDIT",before,after:copy(patch),reason:reason.trim()});
if(next.audit.length>5000)next.audit=next.audit.slice(-5000);
base.validate(next);
return next;
}
function dossier(s,appointmentId){
base.validate(s);const a=s.records.appointments.find(x=>x.id===appointmentId);if(!a)throw Error("Appuntamento inesistente");
return copy({appointment:a,client:s.records.clients.find(x=>x.id===a.clientId),site:s.records.sites.find(x=>x.id===a.siteId),plant:s.records.plants.find(x=>x.id===a.plantId),device:s.records.devices.find(x=>x.id===a.deviceId),interventions:s.records.interventions.filter(x=>x.appointmentId===a.id),documents:s.records.documents.filter(x=>x.appointmentId===a.id),quotes:s.records.quotes.filter(x=>x.clientId===a.clientId),extras:s.records.extras.filter(x=>x.clientId===a.clientId),invoices:s.records.invoices.filter(x=>x.clientId===a.clientId),officialReady:false});
}
return Object.freeze({update,dossier});
});