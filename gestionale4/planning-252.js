/* I.T.E. 4.0.252 — atomic multi-visit scheduling and operational audit.
 * Local metadata only. No production data, no automatic migration. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITEPlanning252=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const validId=x=>typeof x==="string"&&x.trim().length>0&&x.length<=64;
const validOperator=x=>typeof x==="string"&&x.trim().length>0&&x.length<=180;
const date=x=>typeof x==="string"&&/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d)?$/.test(x)&&Number.isFinite(Date.parse(x));
const key=x=>x.trim().toLocaleLowerCase("it");
function interval(v){if(!date(v.start)||!date(v.end)||Date.parse(v.end)<=Date.parse(v.start))throw Error("FASCIA_ORARIA_NON_VALIDA");return [Date.parse(v.start),Date.parse(v.end)];}
function overlaps(a,b){const [as,ae]=interval(a),[bs,be]=interval(b);return as<be&&bs<ae;}
function assertNoConflicts(appointments){for(let i=0;i<appointments.length;i++)for(let j=i+1;j<appointments.length;j++)if(key(appointments[i].operator)===key(appointments[j].operator)&&overlaps(appointments[i],appointments[j]))throw Error("OPERATORE_OCCUPATO:"+appointments[i].id+":"+appointments[j].id);}
function batchSchedule(store,visits){
 if(!Array.isArray(visits)||visits.length<1||visits.length>100)throw Error("LOTTO_NON_VALIDO");
 return store.transact(store.snapshot().revision,s=>{
  const siteMap=new Map(s.sites.map(x=>[x.id,x])),eqMap=new Map(s.equipment.map(x=>[x.id,x])),plantMap=new Map(s.plants.map(x=>[x.id,x]));
  const aid=new Set(s.appointments.map(x=>x.id)),iid=new Set(s.interventions.map(x=>x.id));
  const additions=[];
  for(const v of visits){
   if(!v||!validId(v.appointmentId)||!validId(v.interventionId)||!validOperator(v.operator)||!siteMap.has(v.siteId))throw Error("VISITA_NON_VALIDA");
   interval(v);
   if(aid.has(v.appointmentId)||iid.has(v.interventionId))throw Error("ID_DUPLICATO");
   aid.add(v.appointmentId);iid.add(v.interventionId);
   if(v.equipmentId){const eq=eqMap.get(v.equipmentId),plant=eq&&plantMap.get(eq.plantId);if(!plant||plant.siteId!==v.siteId)throw Error("APPARECCHIO_SEDE_DIVERSA");}
   additions.push({id:v.appointmentId,siteId:v.siteId,operator:v.operator.trim(),start:v.start,end:v.end});
  }
  assertNoConflicts(s.appointments.concat(additions));
  for(let n=0;n<visits.length;n++){const v=visits[n],a=additions[n];s.appointments.push(a);s.interventions.push({id:v.interventionId,siteId:v.siteId,appointmentId:a.id,operator:a.operator,status:"APERTO",...(v.equipmentId?{equipmentId:v.equipmentId}:{})});}
 });
}
function batchReschedule(store,moves){
 if(!Array.isArray(moves)||moves.length<1||moves.length>100)throw Error("LOTTO_NON_VALIDO");
 return store.transact(store.snapshot().revision,s=>{
  const seen=new Set();
  for(const m of moves){
   if(!m||!validId(m.appointmentId)||!validOperator(m.operator))throw Error("SPOSTAMENTO_NON_VALIDO");
   interval(m);if(seen.has(m.appointmentId))throw Error("APPUNTAMENTO_DUPLICATO_NEL_LOTTO");seen.add(m.appointmentId);
   const a=s.appointments.find(x=>x.id===m.appointmentId);if(!a)throw Error("APPUNTAMENTO_ASSENTE");
   const linked=s.interventions.filter(x=>x.appointmentId===a.id);
   if(linked.some(x=>x.status!=="APERTO"))throw Error("INTERVENTO_GIA_AVVIATO");
   a.operator=m.operator.trim();a.start=m.start;a.end=m.end;
   linked.forEach(x=>{x.operator=a.operator;});
  }
  assertNoConflicts(s.appointments);
 });
}
function auditSchedule(s){
 const issues=[];const sorted=s.appointments.slice().sort((a,b)=>a.id.localeCompare(b.id));
 for(const a of sorted){try{interval(a)}catch(e){issues.push({code:"FASCIA_ORARIA_NON_VALIDA",appointmentId:a.id});}}
 for(let i=0;i<sorted.length;i++)for(let j=i+1;j<sorted.length;j++){
  const a=sorted[i],b=sorted[j];try{if(key(a.operator)===key(b.operator)&&overlaps(a,b))issues.push({code:"OPERATORE_OCCUPATO",appointmentId:a.id,otherId:b.id});}catch(e){}
 }
 for(const i of s.interventions){if(i.appointmentId){const a=s.appointments.find(x=>x.id===i.appointmentId);if(a&&a.operator!==i.operator)issues.push({code:"OPERATORE_DIVERSO",interventionId:i.id,appointmentId:a.id});}}
 return issues;
}
return Object.freeze({batchSchedule,batchReschedule,auditSchedule});
});