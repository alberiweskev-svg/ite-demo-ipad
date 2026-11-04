/* I.T.E. 4.0 — dispatch appuntamenti demo: spostamento, riassegnazione, annullamento e audit. */
(function(root){'use strict';
const A=root.ITEFieldAgenda||(typeof require==='function'?require('./ite-field-agenda.js'):null);
const copy=x=>JSON.parse(JSON.stringify(x));
function dispatch(state,master,id,change,actor,at){
 if(!state||!Array.isArray(state.appointments))throw Error('ARCHIVIO_NON_VALIDO');
 const i=state.appointments.findIndex(a=>a.id===id);if(i<0)throw Error('APPUNTAMENTO_INESISTENTE');
 const old=state.appointments[i];
 if(old.status!=='scheduled')throw Error('SOLO_APPUNTAMENTI_PROGRAMMATI');
 if(!actor||!String(actor).trim())throw Error('OPERATORE_OBBLIGATORIO');
 if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(at)||!Number.isFinite(Date.parse(at)))throw Error('DATA_AUDIT_NON_VALIDA');
 if(!change||!['reschedule','reassign','cancel'].includes(change.action))throw Error('AZIONE_NON_VALIDA');
 const next=copy(state),target=next.appointments[i],before={startsAt:old.startsAt,endsAt:old.endsAt,operatorId:old.operatorId,status:old.status};
 if(change.action==='cancel'){
   if(!String(change.reason||'').trim())throw Error('MOTIVO_OBBLIGATORIO');
   target.status='cancelled';
 }else{
   if(change.action==='reschedule'){
     if(!change.startsAt||!change.endsAt)throw Error('FASCIA_OBBLIGATORIA');
     target.startsAt=change.startsAt;target.endsAt=change.endsAt;
   }else{
     if(!change.operatorId)throw Error('OPERATORE_OBBLIGATORIO');
     target.operatorId=change.operatorId;
   }
   A.chain(master,target);
   if(!Number.isFinite(Date.parse(target.startsAt))||!Number.isFinite(Date.parse(target.endsAt))||Date.parse(target.endsAt)<=Date.parse(target.startsAt))throw Error('FASCIA_NON_VALIDA');
   const overlaps=A.conflict(next.appointments,target,id);if(overlaps.length)throw Error('OPERATORE_OCCUPATO:'+overlaps.join(','));
 }
 target.revision=(target.revision||0)+1;
 target.audit=[...(target.audit||[]),{event:change.action==='cancel'?'CANCELLED':change.action==='reassign'?'REASSIGNED':'RESCHEDULED',operatorId:String(actor),at,before,after:{startsAt:target.startsAt,endsAt:target.endsAt,operatorId:target.operatorId,status:target.status},reason:String(change.reason||'')}];
 return next;
}
function batch(state,master,commands){
 if(!Array.isArray(commands)||!commands.length||commands.length>100)throw Error('LOTTO_NON_VALIDO');
 return commands.reduce((s,c)=>dispatch(s,master,c.id,c.change,c.actor,c.at),copy(state));
}
function workload(state,master,from,to){
 const lo=Date.parse(from),hi=Date.parse(to);if(!Number.isFinite(lo)||!Number.isFinite(hi)||hi<=lo)throw Error('PERIODO_NON_VALIDO');
 return (master.operators||[]).map(o=>{const appointments=(state.appointments||[]).filter(a=>a.operatorId===o.id&&a.status!=='cancelled'&&Date.parse(a.startsAt)<hi&&Date.parse(a.endsAt)>lo);
 return {operatorId:o.id,name:o.name||o.id,count:appointments.length,scheduledMinutes:appointments.reduce((n,a)=>n+Math.round((Math.min(Date.parse(a.endsAt),hi)-Math.max(Date.parse(a.startsAt),lo))/60000),0)}});
}
const api=Object.freeze({dispatch,batch,workload});root.ITEAgendaDispatch=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
