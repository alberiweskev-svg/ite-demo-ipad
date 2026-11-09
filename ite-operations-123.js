/* I.T.E. 4.0.123 — Integrated TEST work order ledger. No storage, uploads or network. */
(function(root){"use strict";
const clone=x=>JSON.parse(JSON.stringify(x));
const str=x=>String(x??"").trim();
function check(field,commercial){
 const F=root.ITE_FieldWorkspace121,C=root.ITE_Commercial122;
 if(!F||!C)throw Error("DIPENDENZE_ASSENTI");
 const v=F.validate(field);if(!v.ok)throw Error("ANAGRAFICHE_INVALIDЕ:"+v.errors.join(","));
 if(commercial?.schema!=="ITE_COMMERCIAL_V1")throw Error("COMMERCIALE_NON_VALIDO");
 const c=field.catalog;
 for(const e of commercial.estimates){if(!c.clients.some(x=>x.id===e.clientId)||!c.sites.some(x=>x.id===e.siteId&&x.clientId===e.clientId))throw Error("PREVENTIVO_SCOLLEGATO:"+e.id);}
 for(const e of commercial.extras){const ap=c.appointments.find(x=>x.id===e.appointmentId);if(!ap||ap.clientId!==e.clientId||ap.siteId!==e.siteId)throw Error("EXTRA_SCOLLEGATO:"+e.id);}
 for(const e of commercial.invoices){if(!c.sites.some(x=>x.id===e.siteId&&x.clientId===e.clientId))throw Error("FATTURA_SCOLLEGATA:"+e.id);}
 return true;
}
function empty(){return {schema:"ITE_OPERATIONS_123",revision:0,field:root.ITE_FieldWorkspace121.empty(),commercial:root.ITE_Commercial122.empty(),events:[]};}
function apply(state,command,actor){
 if(!str(actor))throw Error("OPERATORE_OBBLIGATORIO");
 if(!state||state.schema!=="ITE_OPERATIONS_123")throw Error("SCHEMA_NON_VALIDO");
 check(state.field,state.commercial);
 const F=root.ITE_FieldWorkspace121,C=root.ITE_Commercial122,n=clone(state),r=command?.record||{},id=command?.id;
 switch(command?.type){
 case "ADD_CLIENT":n.field=F.add(n.field,"clients",r,actor);break;
 case "ADD_SITE":n.field=F.add(n.field,"sites",r,actor);break;
 case "ADD_SYSTEM":n.field=F.add(n.field,"systems",r,actor);break;
 case "ADD_EQUIPMENT":n.field=F.add(n.field,"equipment",r,actor);break;
 case "ADD_OPERATOR":n.field=F.add(n.field,"operators",r,actor);break;
 case "SCHEDULE":n.field=F.schedule(n.field,r,actor);break;
 case "ARRIVE":n.field=F.arrive(n.field,id,command.at,actor);break;
 case "CLOSE":n.field=F.close(n.field,id,command.at,command.additionalWork||"",actor);break;
 case "REVISE":n.field=F.revise(n.field,id,command.reason,actor);break;
 case "ESTIMATE":n.commercial=C.estimate(n.commercial,n.field,r,actor);break;
 case "ACCEPT_ESTIMATE":n.commercial=C.accept(n.commercial,id,actor);break;
 case "EXTRA":n.commercial=C.extra(n.commercial,n.field,r,actor);break;
 case "APPROVE_EXTRA":n.commercial=C.approveExtra(n.commercial,id,command.approved,actor);break;
 case "INVOICE":n.commercial=C.invoice(n.commercial,n.field,r,actor);break;
 default:throw Error("COMANDO_SCONOSCIUTO");
 }
 check(n.field,n.commercial);n.revision++;
 n.events.push({revision:n.revision,type:command.type,actor:str(actor),at:new Date().toISOString()});
 return n;
}
function dossier(state,clientId){
 check(state.field,state.commercial);
 const c=state.field.catalog,client=c.clients.find(x=>x.id===clientId);if(!client)throw Error("CLIENTE_INESISTENTE");
 const sites=c.sites.filter(x=>x.clientId===clientId),siteIds=new Set(sites.map(x=>x.id));
 const systems=c.systems.filter(x=>siteIds.has(x.siteId)),systemIds=new Set(systems.map(x=>x.id));
 const equipment=c.equipment.filter(x=>systemIds.has(x.systemId));
 const appointments=c.appointments.filter(x=>x.clientId===clientId),ids=new Set(appointments.map(x=>x.id));
 const interventions=c.interventions.filter(x=>ids.has(x.appointmentId));
 const estimates=state.commercial.estimates.filter(x=>x.clientId===clientId).map(x=>({...clone(x),totals:root.ITE_Commercial122.totals(x.lines)}));
 const extras=state.commercial.extras.filter(x=>x.clientId===clientId).map(x=>({...clone(x),approvedTotals:root.ITE_Commercial122.totals(x.lines.filter(l=>Number(x.approved[l.id])>0).map(l=>({...l,quantity:x.approved[l.id]})))}));
 const invoices=state.commercial.invoices.filter(x=>x.clientId===clientId).map(clone);
 return clone({client,sites,systems,equipment,appointments,interventions,estimates,extras,invoices});
}
function agenda(state,date,operatorId){check(state.field,state.commercial);return root.ITE_FieldWorkspace121.agenda(state.field,date,operatorId);}
function restore(json){const s=typeof json==="string"?JSON.parse(json):clone(json);if(s?.schema!=="ITE_OPERATIONS_123"||!Number.isSafeInteger(s.revision)||s.revision<0||!Array.isArray(s.events))throw Error("BACKUP_NON_VALIDO");check(s.field,s.commercial);return clone(s);}
const api=Object.freeze({empty,apply,check,dossier,agenda,restore});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.ITE_Operations123=api;
})(typeof globalThis!=="undefined"?globalThis:this);
