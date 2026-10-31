/* I.T.E. 4.0 — integrated operational integrity checks.
 * Pure validation: no client data, persistence, billing or stock mutations.
 */
(function(root){'use strict';
const s=v=>String(v??'').trim();
const required=['clients','sites','systems','devices','operators','appointments','interventions','audit'];
function check(state,{extras=[]}={}){
 const issues=[],summary={clients:0,sites:0,systems:0,devices:0,operators:0,appointments:0,interventions:0,extras:0};
 if(!state||required.some(k=>!Array.isArray(state[k]))||!Array.isArray(extras))throw Error('Stato operativo non valido');
 const maps={};
 for(const table of required){
  const ids=new Map();maps[table]=ids;
  state[table].forEach((item,i)=>{const id=s(item?.id);
   if(!id)issues.push({severity:'error',type:'MISSING_ID',table,index:i});
   else if(ids.has(id))issues.push({severity:'error',type:'DUPLICATE_ID',table,id});
   else ids.set(id,item);
  });
  if(table in summary)summary[table]=state[table].length;
 }
 const link=(table,parent,field)=>state[table].forEach(x=>{if(!maps[parent].has(s(x[field])))issues.push({severity:'error',type:'BROKEN_REFERENCE',table,id:x.id,field})});
 link('sites','clients','clientId');link('systems','sites','siteId');link('devices','systems','systemId');
 const times=new Map();
 for(const a of state.appointments){
  if(!maps.devices.has(s(a.deviceId))||!maps.operators.has(s(a.operatorId)))issues.push({severity:'error',type:'APPOINTMENT_REFERENCE',id:a.id});
  const start=Date.parse(a.start),end=Date.parse(a.end);
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start){issues.push({severity:'error',type:'INVALID_TIME',id:a.id});continue}
  if(a.status!=='CANCELLED'){const entries=times.get(a.operatorId)||[];entries.push({id:a.id,start,end});times.set(a.operatorId,entries)}
 }
 for(const [operatorId,entries] of times){
  entries.sort((a,b)=>a.start-b.start);
  for(let i=1;i<entries.length;i++)if(entries[i].start<entries[i-1].end)issues.push({severity:'error',type:'OVERLAP',operatorId,ids:[entries[i-1].id,entries[i].id]});
 }
 const visits=new Map();
 for(const v of state.interventions){
  if(!maps.appointments.has(s(v.appointmentId)))issues.push({severity:'error',type:'ORPHAN_VISIT',id:v.id});
  if(visits.has(v.appointmentId))issues.push({severity:'error',type:'DUPLICATE_VISIT',id:v.id});
  visits.set(v.appointmentId,v);
  if(v.status==='CLOSED'&&(!v.arrivalAt||!v.exitAt||Date.parse(v.exitAt)<Date.parse(v.arrivalAt)))issues.push({severity:'error',type:'INVALID_CLOSED_VISIT',id:v.id});
 }
 for(const [i,event] of state.audit.entries()){
  if(!maps.appointments.has(s(event.appointmentId))||!maps.operators.has(s(event.operatorId))||!Number.isFinite(Date.parse(event.at)))issues.push({severity:'error',type:'INVALID_AUDIT',index:i});
 }
 for(const a of state.appointments){
  const v=visits.get(a.id);
  if(['OPEN','REOPENED','CLOSED'].includes(a.status)&&!v)issues.push({severity:'error',type:'MISSING_VISIT',id:a.id});
  if(v&&a.status!==v.status)issues.push({severity:'error',type:'VISIT_STATUS_MISMATCH',id:a.id});
 }
 for(const [i,e] of extras.entries()){
  if(!maps.appointments.has(s(e.appointmentId)))issues.push({severity:'error',type:'ORPHAN_EXTRA',index:i});
  if(!Array.isArray(e.lines)||!e.lines.length)issues.push({severity:'warning',type:'EMPTY_EXTRA',index:i});
  else e.lines.forEach((l,j)=>{if(!['Fornitura','Posa'].includes(l.line_type)||!(Number(l.qty)>0)||!(Number(l.price)>=0))issues.push({severity:'error',type:'INVALID_EXTRA_LINE',index:i,line:j})});
 }
 summary.extras=extras.length;
 return {valid:!issues.some(x=>x.severity==='error'),issues,summary,readOnly:true,stockChanged:false,invoiceChanged:false};
}
const api=Object.freeze({check});root.ITEOperationsIntegrity=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
