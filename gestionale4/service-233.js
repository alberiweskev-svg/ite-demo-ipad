/* I.T.E. 4.0.233 — site dossier, visit lifecycle and maintenance planning.
   Demo-only data. Does not modify production archives or 2.7.5 modules. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITEService233=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const find=(s,type,id)=>s[type].find(x=>x.id===id);
const stamp=x=>typeof x==="string"&&/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d)?$/.test(x)&&Number.isFinite(Date.parse(x));
function dossier(s,siteId){
 const site=find(s,"sites",siteId);if(!site)throw Error("SEDE_ASSENTE");
 const client=find(s,"clients",site.clientId);if(!client)throw Error("CLIENTE_ASSENTE");
 const plants=s.plants.filter(p=>p.siteId===siteId);
 const plantIds=new Set(plants.map(p=>p.id));
 const equipment=s.equipment.filter(e=>plantIds.has(e.plantId));
 const appointments=s.appointments.filter(a=>a.siteId===siteId).slice().sort((a,b)=>a.start.localeCompare(b.start));
 const interventions=s.interventions.filter(i=>i.siteId===siteId).slice().sort((a,b)=>(b.arrival||"").localeCompare(a.arrival||""));
 const documents=s.documents.filter(d=>d.siteId===siteId);
 const quotes=s.quotes.filter(q=>q.clientId===client.id);
 const invoices=s.invoices.filter(i=>i.clientId===client.id);
 return {client,site,plants,equipment,appointments,interventions,documents,quotes,invoices};
}
function start(store,{appointmentId,interventionId,operator,arrival,equipmentId}){
 if(!interventionId||!stamp(arrival))throw Error("ARRIVO_NON_VALIDO");
 return store.transact(store.snapshot().revision,s=>{
  const a=find(s,"appointments",appointmentId);if(!a)throw Error("APPUNTAMENTO_ASSENTE");
  if(operator!==a.operator)throw Error("OPERATORE_NON_COINCIDE");
  if(s.interventions.some(i=>i.appointmentId===appointmentId||i.id===interventionId))throw Error("INTERVENTO_GIA_PRESENTE");
  if(equipmentId){const e=find(s,"equipment",equipmentId),p=e&&find(s,"plants",e.plantId);if(!p||p.siteId!==a.siteId)throw Error("APPARECCHIO_SEDE_DIVERSA");}
  s.interventions.push({id:interventionId,siteId:a.siteId,appointmentId,operator,status:"IN_CORSO",arrival,...(equipmentId?{equipmentId}:{})});
 });
}
function finish(store,{interventionId,exit}){
 if(!stamp(exit))throw Error("USCITA_NON_VALIDA");
 return store.transact(store.snapshot().revision,s=>{
  const i=find(s,"interventions",interventionId);
  if(!i||i.status!=="IN_CORSO"||!i.arrival)throw Error("INTERVENTO_NON_IN_CORSO");
  if(Date.parse(exit)<Date.parse(i.arrival))throw Error("USCITA_PRIMA_ARRIVO");
  i.exit=exit;i.status="CHIUSO";
 });
}
function schedule(store,{id,siteId,operator,start,end}){
 if(!id||!operator||!operator.trim()||!stamp(start)||!stamp(end)||Date.parse(end)<=Date.parse(start))throw Error("APPUNTAMENTO_NON_VALIDO");
 return store.transact(store.snapshot().revision,s=>{
  if(!find(s,"sites",siteId))throw Error("SEDE_ASSENTE");
  if(s.appointments.some(a=>a.id===id))throw Error("ID_DUPLICATO");
  if(s.appointments.some(a=>a.operator.trim().toLocaleLowerCase("it")===operator.trim().toLocaleLowerCase("it")&&Date.parse(a.start)<Date.parse(end)&&Date.parse(start)<Date.parse(a.end)))throw Error("OPERATORE_OCCUPATO");
  s.appointments.push({id,siteId,operator:operator.trim(),start,end});
 });
}
function workload(s){
 const byOperator=new Map();
 for(const a of s.appointments){const k=a.operator.trim(),row=byOperator.get(k)||{operator:k,appointments:0,plannedMinutes:0,open:0,closed:0,actualMinutes:0};row.appointments++;row.plannedMinutes+=Math.max(0,Math.round((Date.parse(a.end)-Date.parse(a.start))/60000));byOperator.set(k,row);}
 for(const i of s.interventions){const k=i.operator.trim(),row=byOperator.get(k)||{operator:k,appointments:0,plannedMinutes:0,open:0,closed:0,actualMinutes:0};if(i.status==="CHIUSO")row.closed++;else row.open++;if(i.arrival&&i.exit)row.actualMinutes+=Math.max(0,Math.round((Date.parse(i.exit)-Date.parse(i.arrival))/60000));byOperator.set(k,row);}
 return [...byOperator.values()].sort((a,b)=>a.operator.localeCompare(b.operator,"it"));
}
return Object.freeze({dossier,start,finish,schedule,workload});
});