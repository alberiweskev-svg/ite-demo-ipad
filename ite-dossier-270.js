/* ITE 4.0.270 — synthetic dossier editing and calendar workflow. */
(function(root,factory){const api=factory(root.ITEDossier269);if(typeof module==="object"&&module.exports)module.exports=factory(require("./ite-dossier-269.js"));root.ITEDossier270=api;})(typeof globalThis!=="undefined"?globalThis:this,function(dossier){"use strict";
const groups=["clients","sites","systems","devices","appointments","interventions"];
function clone(x){return JSON.parse(JSON.stringify(x));}
function mutate(state,group,record,mode){const s=dossier.validate(state);if(!groups.includes(group)||!record||typeof record.id!=="string")throw Error("DATI_NON_VALIDI");const index=s[group].findIndex(x=>x.id===record.id);
if(mode==="create"){if(index!==-1)throw Error("ID_GIA_PRESENTE");s[group].push(clone(record));}
else if(mode==="update"){if(index<0)throw Error("RECORD_NON_TROVATO");s[group][index]=clone(record);}
else if(mode==="delete"){if(index<0)throw Error("RECORD_NON_TROVATO");s[group].splice(index,1);}
else throw Error("OPERAZIONE_NON_VALIDA");
s.revision++;return dossier.validate(s);}
function calendar(state,from,to,operator){const s=dossier.validate(state),start=Date.parse(from),end=Date.parse(to);if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)throw Error("INTERVALLO_NON_VALIDO");return s.appointments.filter(x=>Date.parse(x.start)<end&&Date.parse(x.end)>start&&(!operator||x.operator===operator)).sort((a,b)=>Date.parse(a.start)-Date.parse(b.start)).map(clone);}
function beginIntervention(state,appointmentId,start){const s=dossier.validate(state),a=s.appointments.find(x=>x.id===appointmentId);if(!a)throw Error("APPUNTAMENTO_NON_TROVATO");if(s.interventions.some(x=>x.appointmentId===a.id))throw Error("INTERVENTO_GIA_PRESENTE");const when=Date.parse(start);if(!Number.isFinite(when))throw Error("ORARIO_NON_VALIDO");const id="TEST-W"+(s.interventions.length+1);return mutate(s,"interventions",{id,appointmentId:a.id,siteId:a.siteId,deviceId:a.deviceId,operator:a.operator,start:new Date(when).toISOString(),end:new Date(when+60000).toISOString(),status:"APERTO"},"create");}
function closeIntervention(state,id,end){const s=dossier.validate(state),i=s.interventions.find(x=>x.id===id);if(!i)throw Error("INTERVENTO_NON_TROVATO");if(i.status==="CHIUSO")throw Error("INTERVENTO_GIA_CHIUSO");return mutate(s,"interventions",{...i,end,status:"CHIUSO"},"update");}
return Object.freeze({mutate,calendar,beginIntervention,closeIntervention});
});