/* I.T.E. 4.0 — calendar day/week/month, local time, no external dependencies. */
(function(root){'use strict';
const planning=root.ITEFieldPlanning||(typeof require==='function'?require('./ite-field-planning.js'):null);
const pad=n=>String(n).padStart(2,'0');
const dayKey=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const startOfDay=d=>new Date(d.getFullYear(),d.getMonth(),d.getDate());
const addDays=(d,n)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);
function range(mode,anchor){
 const date=anchor instanceof Date?new Date(anchor):new Date(String(anchor)+'T12:00:00');
 if(!Number.isFinite(date.getTime()))throw Error('DATA_CALENDARIO_NON_VALIDA');
 if(!['day','week','month'].includes(mode))throw Error('VISTA_CALENDARIO_NON_VALIDA');
 let start=startOfDay(date),end;
 if(mode==='week')start=addDays(start,-((start.getDay()+6)%7));
 if(mode==='month')start=new Date(start.getFullYear(),start.getMonth(),1);
 if(mode==='day')end=addDays(start,1);
 if(mode==='week')end=addDays(start,7);
 if(mode==='month')end=new Date(start.getFullYear(),start.getMonth()+1,1);
 return {mode,from:start.toISOString(),to:end.toISOString(),startDay:dayKey(start),endExclusive:dayKey(end)};
}
function view(appointments,{mode='week',anchor,operatorId,status}={}){
 const period=range(mode,anchor||new Date());
 const entries=planning.calendar(appointments,{from:period.from,to:period.to,operatorId,status});
 const days=[];
 for(let d=new Date(period.startDay+'T12:00:00');dayKey(d)<period.endExclusive;d=addDays(d,1)){
  const from=startOfDay(d),to=addDays(from,1);
  days.push({date:dayKey(d),appointments:entries.filter(a=>Date.parse(a.startsAt)<to.getTime()&&Date.parse(a.endsAt)>from.getTime())});
 }
 return {...period,days,total:entries.length,readOnly:true};
}
function shift(mode,anchor,step){
 const date=anchor instanceof Date?new Date(anchor):new Date(String(anchor)+'T12:00:00');
 if(!Number.isFinite(date.getTime())||!Number.isInteger(step))throw Error('NAVIGAZIONE_CALENDARIO_NON_VALIDA');
 if(mode==='day')return dayKey(addDays(date,step));
 if(mode==='week')return dayKey(addDays(date,step*7));
 if(mode==='month')return dayKey(new Date(date.getFullYear(),date.getMonth()+step,Math.min(date.getDate(),new Date(date.getFullYear(),date.getMonth()+step+1,0).getDate())));
 throw Error('VISTA_CALENDARIO_NON_VALIDA');
}
const api=Object.freeze({range,view,shift});root.ITEFieldCalendarViews=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
