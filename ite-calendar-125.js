/* I.T.E. 4.0.125 — read-only calendar projections for TEST operations. */
(function(root){"use strict";
const dateKey=s=>String(s||"").slice(0,10);
const dayNumber=s=>{const n=Date.parse(s+"T12:00:00Z");if(!Number.isFinite(n)||new Date(n).toISOString().slice(0,10)!==s)throw Error("DATA_NON_VALIDA");return n;};
const plus=(s,n)=>new Date(dayNumber(s)+n*86400000).toISOString().slice(0,10);
const monday=s=>plus(s,-((new Date(dayNumber(s)).getUTCDay()+6)%7));
function calendar(state,{date,view="week",operatorId="",status=""}={}){
 if(!root.ITE_Audit124)throw Error("AUDIT_ASSENTE");
 const audit=root.ITE_Audit124.audit(state);if(!audit.ok)throw Error("AUDIT_NON_SUPERATO:"+audit.errors.join("|"));
 dayNumber(date);if(!["day","week","month"].includes(view))throw Error("VISTA_NON_VALIDA");
 const start=view==="day"?date:view==="week"?monday(date):date.slice(0,7)+"-01";
 const end=view==="day"?plus(start,1):view==="week"?plus(start,7):plus(start,32).slice(0,7)+"-01";
 const c=state.field.catalog;
 const entries=c.appointments.filter(a=>dateKey(a.startAt)<end&&dateKey(a.endAt)>=start&&(!operatorId||a.operatorId===operatorId)&&(!status||a.status===status)).sort((a,b)=>a.startAt.localeCompare(b.startAt)||a.id.localeCompare(b.id)).map(a=>{
 const job=c.interventions.find(i=>i.appointmentId===a.id);
 return {id:a.id,startAt:a.startAt,endAt:a.endAt,status:a.status,operatorId:a.operatorId,operator:c.operators.find(x=>x.id===a.operatorId)?.name||a.operatorId,client:c.clients.find(x=>x.id===a.clientId)?.name||a.clientId,site:c.sites.find(x=>x.id===a.siteId)?.address||a.siteId,equipment:c.equipment.find(x=>x.id===a.equipmentId)?.model||"",intervention:job?.status||"NON_AVVIATO",arrivedAt:job?.arrivedAt||null,departedAt:job?.departedAt||null};
 });
 const days=[];for(let d=start;d<end;d=plus(d,1))days.push({date:d,entries:entries.filter(a=>dateKey(a.startAt)<=d&&dateKey(a.endAt)>=d)});
 return {schema:"ITE_CALENDAR_125",view,start,end,operatorId,status,days,entries,operators:c.operators.map(o=>({id:o.id,name:o.name,color:/^#[0-9a-fA-F]{6}$/.test(o.color||"")?o.color:"#64748b"}))};
}
function conflicts(state,record){const a=root.ITE_Audit124.audit(state);if(!a.ok)throw Error("AUDIT_NON_SUPERATO");const start=Date.parse(record?.startAt),end=Date.parse(record?.endAt);if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)throw Error("ORARIO_NON_VALIDO");return state.field.catalog.appointments.filter(x=>x.id!==record.id&&x.operatorId===record.operatorId&&x.status!=="ANNULLATO"&&start<Date.parse(x.endAt)&&end>Date.parse(x.startAt)).map(x=>x.id);}
const api=Object.freeze({calendar,conflicts});if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ITE_Calendar125=api;
})(typeof globalThis!=="undefined"?globalThis:this);
