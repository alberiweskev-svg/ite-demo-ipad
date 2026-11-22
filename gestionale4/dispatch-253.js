/* I.T.E. 4.0.253 — operator dispatch overview and integrity checks. Synthetic metadata only. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITEDispatch253=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const validTime=v=>typeof v==="string"&&/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d)?$/.test(v)&&Number.isFinite(Date.parse(v));
function audit(state){
 const issues=[],sites=new Map(state.sites.map(x=>[x.id,x])),plants=new Map(state.plants.map(x=>[x.id,x])),equipment=new Map(state.equipment.map(x=>[x.id,x])),appointments=new Map(state.appointments.map(x=>[x.id,x]));
 for(const a of state.appointments){if(!sites.has(a.siteId))issues.push({code:"SEDE_APPUNTAMENTO_ASSENTE",id:a.id});if(!a.operator||!a.operator.trim())issues.push({code:"OPERATORE_ASSENTE",id:a.id});if(!validTime(a.start)||!validTime(a.end)||Date.parse(a.start)>=Date.parse(a.end))issues.push({code:"ORARIO_NON_VALIDO",id:a.id});}
 for(const i of state.interventions){
  if(!sites.has(i.siteId))issues.push({code:"SEDE_INTERVENTO_ASSENTE",id:i.id});
  if(i.appointmentId){const a=appointments.get(i.appointmentId);if(!a)issues.push({code:"APPUNTAMENTO_INTERVENTO_ASSENTE",id:i.id});else{if(a.siteId!==i.siteId)issues.push({code:"SEDE_INTERVENTO_DIVERSA",id:i.id});if(a.operator!==i.operator)issues.push({code:"OPERATORE_INTERVENTO_DIVERSO",id:i.id});}}
  if(i.equipmentId){const eq=equipment.get(i.equipmentId),plant=eq&&plants.get(eq.plantId);if(!plant||plant.siteId!==i.siteId)issues.push({code:"APPARECCHIATURA_SEDE_DIVERSA",id:i.id});}
  if(i.status==="CHIUSO"&&(!validTime(i.arrival)||!validTime(i.exit)||Date.parse(i.exit)<Date.parse(i.arrival)))issues.push({code:"CHIUSURA_ORARIA_INCOERENTE",id:i.id});
 }
 return issues.sort((a,b)=>a.code.localeCompare(b.code)||a.id.localeCompare(b.id));
}
function workload(state,{from,to,operator=""}){
 if(!validTime(from)||!validTime(to)||Date.parse(from)>=Date.parse(to))throw Error("PERIODO_NON_VALIDO");
 const start=Date.parse(from),end=Date.parse(to),rows=new Map(),interventions=state.interventions;
 for(const a of state.appointments){
  if(!validTime(a.start)||!validTime(a.end)||Date.parse(a.end)<=Date.parse(a.start))continue;
  if(operator&&a.operator!==operator)continue;
  const left=Math.max(start,Date.parse(a.start)),right=Math.min(end,Date.parse(a.end));if(left>=right)continue;
  const k=a.operator,record=rows.get(k)||{operator:k,appointments:0,minutes:0,open:0,inProgress:0,closed:0};
  record.appointments++;record.minutes+=(right-left)/60000;
  for(const i of interventions.filter(x=>x.appointmentId===a.id)){if(i.status==="APERTO")record.open++;else if(i.status==="IN_CORSO")record.inProgress++;else if(i.status==="CHIUSO")record.closed++;}
  rows.set(k,record);
 }
 return [...rows.values()].sort((a,b)=>a.operator.localeCompare(b.operator,"it"));
}
return Object.freeze({audit,workload});
});