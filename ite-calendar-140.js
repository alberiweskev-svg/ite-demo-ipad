/* I.T.E. 4.0.140 — integrated TEST calendar; no network or persistence. */
(function(root){"use strict";
const clone=x=>JSON.parse(JSON.stringify(x));
function day(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||new Date(s+"T12:00:00Z").toISOString().slice(0,10)!==s)throw Error("DATA_NON_VALIDA");return s;}
function monday(s){const d=new Date(day(s)+"T12:00:00Z");d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return d.toISOString().slice(0,10);}
function add(s,n){const d=new Date(day(s)+"T12:00:00Z");d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
function range(date,mode){day(date);if(!["giorno","settimana","mese"].includes(mode))throw Error("VISTA_NON_VALIDA");if(mode==="giorno")return [date,add(date,1)];if(mode==="settimana"){const m=monday(date);return [m,add(m,7)];}const start=date.slice(0,7)+"-01";return [start,add(start,new Date(Date.UTC(+date.slice(0,4),+date.slice(5,7),0)).getUTCDate())];}
function view(state,date,mode="settimana",operatorId="",status=""){
 if(state?.schema!=="ITE_OPERATIONS_123"||!root.ITE_Operations123)throw Error("STATO_NON_VALIDO");
 root.ITE_Operations123.check(state.field,state.commercial);
 const c=state.field.catalog,[from,to]=range(date,mode),clients=new Map(c.clients.map(x=>[x.id,x])),sites=new Map(c.sites.map(x=>[x.id,x])),operators=new Map(c.operators.map(x=>[x.id,x]));
 const appointments=c.appointments.filter(x=>x.startAt.slice(0,10)>=from&&x.startAt.slice(0,10)<to&&(!operatorId||x.operatorId===operatorId)&&(!status||x.status===status)).sort((a,b)=>a.startAt.localeCompare(b.startAt)||a.id.localeCompare(b.id));
 const rows=appointments.map(a=>{const i=c.interventions.find(x=>x.appointmentId===a.id);return {id:a.id,date:a.startAt.slice(0,10),startAt:a.startAt,endAt:a.endAt,client:clients.get(a.clientId)?.name||a.clientId,site:sites.get(a.siteId)?.address||a.siteId,operator:operators.get(a.operatorId)?.name||a.operatorId,operatorId:a.operatorId,color:operators.get(a.operatorId)?.color||"",status:a.status,systemId:a.systemId,equipmentId:a.equipmentId||"",intervention:i?{status:i.status,arrivedAt:i.arrivedAt,departedAt:i.departedAt}:null};});
 const load={};for(const r of rows){const k=r.operatorId+"|"+r.date;load[k]=(load[k]||0)+Math.max(0,(Date.parse(r.endAt)-Date.parse(r.startAt))/60000);}
 const conflicts=[];const byOperator={};for(const r of rows){(byOperator[r.operatorId]??=[]).push(r);}for(const [op,list] of Object.entries(byOperator)){const sorted=[...list].filter(x=>x.status!=="ANNULLATO").sort((a,b)=>Date.parse(a.startAt)-Date.parse(b.startAt));for(let i=0;i<sorted.length;i++)for(let j=i+1;j<sorted.length&&Date.parse(sorted[j].startAt)<Date.parse(sorted[i].endAt);j++)if(Date.parse(sorted[j].endAt)>Date.parse(sorted[i].startAt))conflicts.push({operatorId:op,first:sorted[i].id,second:sorted[j].id});}
 return clone({revision:state.revision,mode,from,to,rows,load,conflicts,counts:{appointments:rows.length,interventions:rows.filter(x=>x.intervention).length,operators:new Set(rows.map(x=>x.operatorId)).size}});
}
const api=Object.freeze({day,monday,add,range,view});if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ITE_Calendar140=api;
})(typeof globalThis!=="undefined"?globalThis:this);
