/* I.T.E. 4.0.121 — TEST-only integrated field operations. No network or persistence. */
(function(root){"use strict";
const clone=x=>JSON.parse(JSON.stringify(x));
const str=x=>String(x==null?"":x).trim();
const collections=["clients","sites","systems","equipment","operators","appointments","interventions"];
const parents={sites:["clientId","clients"],systems:["siteId","sites"],equipment:["systemId","systems"],appointments:["clientId","clients"],interventions:["appointmentId","appointments"]};
function empty(){return {schema:"ITE_FIELD_WORKSPACE_V1",revision:0,catalog:Object.fromEntries(collections.map(k=>[k,[]])),history:[]};}
function validate(workspace){
 if(!workspace||workspace.schema!=="ITE_FIELD_WORKSPACE_V1"||!workspace.catalog)throw Error("SCHEMA_NON_VALIDO");
 const c=workspace.catalog,errors=[],idx={};
 for(const k of collections){if(!Array.isArray(c[k])){errors.push("COLLEZIONE:"+k);continue;}idx[k]=new Map();for(const item of c[k]){const id=str(item&&item.id);if(!id||idx[k].has(id))errors.push("ID:"+k+":"+id);else idx[k].set(id,item);}}
 for(const [k,[field,target]] of Object.entries(parents))for(const item of c[k]||[])if(!idx[target]?.has(str(item[field])))errors.push("RIF:"+k+":"+item.id+":"+field);
 for(const item of c.appointments||[]){
  if(!idx.operators?.has(str(item.operatorId)))errors.push("OPERATORE:"+item.id);
  const site=idx.sites?.get(str(item.siteId)),system=idx.systems?.get(str(item.systemId)),eq=item.equipmentId?idx.equipment?.get(str(item.equipmentId)):null;
  if(!site||site.clientId!==item.clientId)errors.push("SEDE:"+item.id);
  if(!system||system.siteId!==item.siteId)errors.push("IMPIANTO:"+item.id);
  if(item.equipmentId&&(!eq||eq.systemId!==item.systemId))errors.push("APPARECCHIATURA:"+item.id);
  if(!Number.isFinite(Date.parse(item.startAt))||!Number.isFinite(Date.parse(item.endAt))||Date.parse(item.endAt)<=Date.parse(item.startAt))errors.push("ORARIO:"+item.id);
 }
 for(const item of c.interventions||[]){
  const ap=idx.appointments?.get(str(item.appointmentId));
  if(ap&&item.operatorId!==ap.operatorId)errors.push("OPERATORE_INTERVENTO:"+item.id);
  if(item.arrivedAt&&item.departedAt&&Date.parse(item.departedAt)<Date.parse(item.arrivedAt))errors.push("TEMPI:"+item.id);
 }
 return {ok:errors.length===0,errors};
}
function transact(workspace,action,actor,mutate){
 const next=clone(workspace),who=str(actor);if(!who)throw Error("OPERATORE_OBBLIGATORIO");
 mutate(next.catalog);const check=validate(next);if(!check.ok)throw Error(check.errors.join("|"));
 next.revision=(Number(workspace.revision)||0)+1;
 next.history.push({revision:next.revision,action,actor:who,at:new Date().toISOString()});return next;
}
function add(workspace,kind,record,actor){
 if(!collections.includes(kind))throw Error("TIPO_NON_VALIDO");
 return transact(workspace,"ADD_"+kind,actor,c=>{c[kind].push(clone(record));});
}
function schedule(workspace,record,actor){
 if(!record||!record.id)throw Error("APPUNTAMENTO_NON_VALIDO");
 return transact(workspace,"SCHEDULE",actor,c=>{
  const start=Date.parse(record.startAt),end=Date.parse(record.endAt);
  if(c.appointments.some(a=>a.operatorId===record.operatorId&&a.status!=="ANNULLATO"&&start<Date.parse(a.endAt)&&end>Date.parse(a.startAt)))throw Error("SOVRAPPOSIZIONE_OPERATORE");
  c.appointments.push({...clone(record),status:"PROGRAMMATO"});
 });
}
function arrive(workspace,appointmentId,at,actor){
 return transact(workspace,"ARRIVE",actor,c=>{
  const ap=c.appointments.find(a=>a.id===appointmentId);if(!ap||ap.status!=="PROGRAMMATO")throw Error("APPUNTAMENTO_NON_APERTO");
  if(!Number.isFinite(Date.parse(at)))throw Error("DATA_NON_VALIDA");
  if(c.interventions.some(i=>i.appointmentId===appointmentId))throw Error("INTERVENTO_GIA_ESISTENTE");
  ap.status="IN_CORSO";c.interventions.push({id:"INT-"+appointmentId,appointmentId,operatorId:ap.operatorId,arrivedAt:at,departedAt:null,status:"APERTO",additionalWork:"",revisions:[]});
 });
}
function close(workspace,appointmentId,at,additionalWork,actor){
 return transact(workspace,"CLOSE",actor,c=>{
  const ap=c.appointments.find(a=>a.id===appointmentId),i=c.interventions.find(x=>x.appointmentId===appointmentId);
  if(!ap||!i||ap.status!=="IN_CORSO"||Date.parse(at)<Date.parse(i.arrivedAt)||!Number.isFinite(Date.parse(at)))throw Error("CHIUSURA_NON_VALIDA");
  i.departedAt=at;i.additionalWork=str(additionalWork);i.status="CHIUSO";ap.status="CHIUSO";
 });
}
function revise(workspace,appointmentId,reason,actor){
 return transact(workspace,"REVISE",actor,c=>{
  const ap=c.appointments.find(a=>a.id===appointmentId),i=c.interventions.find(x=>x.appointmentId===appointmentId);
  if(!ap||!i||i.status!=="CHIUSO"||!str(reason))throw Error("REVISIONE_NON_VALIDA");
  i.revisions.push({previousDeparture:i.departedAt,reason:str(reason),actor,at:new Date().toISOString()});
  i.status="APERTO";ap.status="IN_CORSO";i.departedAt=null;
 });
}
function agenda(workspace,day,operatorId){
 const date=str(day);return workspace.catalog.appointments.filter(a=>a.startAt.slice(0,10)===date&&(!operatorId||a.operatorId===operatorId)).sort((a,b)=>a.startAt.localeCompare(b.startAt)).map(clone);
}
const api=Object.freeze({empty,validate,add,schedule,arrive,close,revise,agenda});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.ITE_FieldWorkspace121=api;
})(typeof globalThis!=="undefined"?globalThis:this);
