/* I.T.E. 4.0 — calendar views and safe printable agenda. No network or PDF storage. */
(function(root){'use strict';
const F=root.ITEFieldOperations||(typeof require==='function'?require('./ite-field-operations.js'):null);
const pad=n=>String(n).padStart(2,'0');
const local=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
function date(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))throw Error('DATA_NON_VALIDA');const d=new Date(value+'T12:00:00');if(Number.isNaN(+d)||local(d)!==value)throw Error('DATA_NON_VALIDA');return d}
function plus(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x}
function bounds(day,view){
 const d=date(day);if(!['giorno','settimana','mese'].includes(view))throw Error('VISTA_NON_VALIDA');
 let first=d,last=d;
 if(view==='settimana'){first=plus(d,-((d.getDay()+6)%7));last=plus(first,6)}
 if(view==='mese'){first=new Date(d.getFullYear(),d.getMonth(),1,12);last=new Date(d.getFullYear(),d.getMonth()+1,0,12)}
 return {from:local(first)+'T00:00',to:local(plus(last,1))+'T00:00',first:local(first),last:local(last)};
}
function view(state,day,mode,operator=''){
 if(!F)throw Error('AGENDA_NON_DISPONIBILE');
 const b=bounds(day,mode),rows=F.agenda(state,operator,b.from,b.to);
 const days=[],last=date(b.last);
 for(let d=date(b.first);d<=last;d=plus(d,1)){
  const key=local(d),start=key+'T00:00',end=local(plus(d,1))+'T00:00';
  days.push({date:key,appointments:rows.filter(a=>a.start<end&&a.end>start).map(a=>{
   const j=state.interventions.filter(x=>x.appointmentId===a.id);
   return {...a,status:j.some(x=>x.status==='IN_CORSO')?'IN_CORSO':j.some(x=>x.status==='REVISIONATO')?'REVISIONATO':j.some(x=>x.status==='CONCLUSO')?'CONCLUSO':'PROGRAMMATO'};
  })});
 }
 return {mode,operator,bounds:b,days,total:rows.length,operatorLoad:F.operatorLoad(state,b.from,b.to)};
}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function printable(state,day,mode,operator=''){
 const v=view(state,day,mode,operator);
 let body='';
 for(const d of v.days){if(!d.appointments.length)continue;
  body+='<h2>'+esc(d.date)+'</h2><table><thead><tr><th>Orario</th><th>Cliente</th><th>Sede</th><th>Operatore</th><th>Stato</th></tr></thead><tbody>';
  for(const a of d.appointments){
   const c=state.clients.find(x=>x.id===a.clientId),s=state.sites.find(x=>x.id===a.siteId);
   body+='<tr><td>'+esc(a.start.slice(11)+'–'+a.end.slice(11))+'</td><td>'+esc(c?.name||a.clientId)+'</td><td>'+esc(s?.address||a.siteId)+'</td><td>'+esc(a.operator)+'</td><td>'+esc(a.status)+'</td></tr>';
  }body+='</tbody></table>';
 }
 return '<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Agenda I.T.E. 4.0</title><style>body{font:14px system-ui;margin:24px;color:#172d47}table{border-collapse:collapse;width:100%;margin-bottom:24px}th,td{border:1px solid #aaa;padding:8px;text-align:left}h1{font-size:22px}@media print{body{margin:8mm}h2{break-after:avoid}tr{break-inside:avoid}}</style><h1>Agenda I.T.E. 4.0 — '+esc(mode)+' '+esc(day)+'</h1><p>Operatore: '+esc(operator||'tutti')+' · Appuntamenti: '+v.total+'</p>'+body+'</html>';
}
const api=Object.freeze({bounds,view,printable});
root.ITECalendarViews=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
