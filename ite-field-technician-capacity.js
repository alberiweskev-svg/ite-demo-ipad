/* I.T.E. 4.0 — technician workload and conflict-free appointment slots. */
(function(root){'use strict';
const planning=root.ITEFieldPlanning||(typeof require==='function'?require('./ite-field-planning.js'):null);
const pad=n=>String(n).padStart(2,'0'),key=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
function dayBounds(day){if(!/^\d{4}-\d{2}-\d{2}$/.test(day))throw Error('GIORNO_NON_VALIDO');const start=new Date(day+'T00:00:00');if(!Number.isFinite(start.getTime())||key(start)!==day)throw Error('GIORNO_NON_VALIDO');return {start,end:new Date(start.getFullYear(),start.getMonth(),start.getDate()+1)}}
function workload(catalog,appointments,day){
 const {start,end}=dayBounds(day),entries=planning.calendar(appointments,{from:start.toISOString(),to:end.toISOString()});
 return catalog.operators.map(op=>{
  const jobs=entries.filter(a=>a.operatorId===op.id&&a.status!=='cancelled');
  const busyMinutes=jobs.reduce((total,a)=>total+Math.max(0,Math.min(Date.parse(a.endsAt),end.getTime())-Math.max(Date.parse(a.startsAt),start.getTime()))/60000,0);
  return {operatorId:op.id,name:op.name||op.id,color:op.color||null,active:op.active!==false,count:jobs.length,busyMinutes,appointments:jobs.map(a=>a.id)};
 });
}
function slots(appointments,{day,operatorId,durationMinutes=60,startHour=8,endHour=18,stepMinutes=30}={}){
 if(!operatorId)throw Error('OPERATORE_OBBLIGATORIO');
 if(!Number.isInteger(durationMinutes)||durationMinutes<=0||!Number.isInteger(stepMinutes)||stepMinutes<=0||!Number.isInteger(startHour)||!Number.isInteger(endHour)||startHour<0||endHour>24||startHour>=endHour)throw Error('PARAMETRI_FASCIA_NON_VALIDI');
 const {start}=dayBounds(day),busy=appointments.filter(a=>a.operatorId===operatorId&&a.status!=='cancelled');
 const result=[];
 for(let offset=startHour*60;offset+durationMinutes<=endHour*60;offset+=stepMinutes){
  const from=new Date(start.getFullYear(),start.getMonth(),start.getDate(),0,offset),to=new Date(from.getTime()+durationMinutes*60000);
  if(from.getFullYear()!==start.getFullYear()||from.getMonth()!==start.getMonth()||from.getDate()!==start.getDate()||to.getFullYear()!==start.getFullYear()||to.getMonth()!==start.getMonth()||to.getDate()!==start.getDate()||to.getHours()*60+to.getMinutes()!==offset+durationMinutes)continue;
  if(busy.some(a=>from.getTime()<Date.parse(a.endsAt)&&Date.parse(a.startsAt)<to.getTime()))continue;
  result.push({startsAt:from.toISOString(),endsAt:to.toISOString(),label:pad(from.getHours())+':'+pad(from.getMinutes())+'–'+pad(to.getHours())+':'+pad(to.getMinutes())});
 }
 return result;
}
const api=Object.freeze({workload,slots});root.ITEFieldTechnicianCapacity=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
