/* I.T.E. 4.0 — field service lifecycle, local-only metadata.
 * Keeps 2.7.5 technical modules and production 3.0.74 untouched.
 */
(function(root){'use strict';
const H=root.ITEHierarchyWorkspace||(typeof require==='function'?require('./ite-hierarchy-workspace.js'):null);
const stamp=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v));
function checked(s){if(!H)throw Error('GERARCHIA_NON_DISPONIBILE');return H.validate(s)}
function schedule(state,record){
 const s=checked(state);
 if(!record||!record.id||!record.operator||!stamp(record.start)||!stamp(record.end)||record.end<=record.start)throw Error('APPUNTAMENTO_NON_VALIDO');
 if(s.appointments.some(a=>a.operator===record.operator&&a.start<record.end&&record.start<a.end))throw Error('OPERATORE_GIA_OCCUPATO');
 return H.add(s,'appointments',record);
}
function reschedule(state,appointmentId,change,actor,at){
 const s=checked(state),a=s.appointments.find(x=>x.id===appointmentId);
 if(!a||!change||!String(actor||'').trim()||!stamp(at))throw Error('RIPROGRAMMAZIONE_NON_VALIDA');
 if(s.interventions.some(j=>j.appointmentId===appointmentId))throw Error('APPUNTAMENTO_GIA_AVVIATO');
 const start=change.start??a.start,end=change.end??a.end,operator=change.operator??a.operator;
 if(!stamp(start)||!stamp(end)||end<=start||!String(operator||'').trim())throw Error('INTERVALLO_NON_VALIDO');
 if(s.appointments.some(x=>x.id!==appointmentId&&x.operator===operator&&x.start<end&&start<x.end))throw Error('OPERATORE_GIA_OCCUPATO');
 const appointments=s.appointments.map(x=>x.id!==appointmentId?x:{...x,start,end,operator,
  history:[...(x.history||[]),{action:'RIPROGRAMMAZIONE',at,actor:String(actor).trim(),previous:{start:x.start,end:x.end,operator:x.operator}}]});
 return checked({...s,appointments});
}
function operatorLoad(state,from,to){
 const s=checked(state);if(!stamp(from)||!stamp(to)||to<=from)throw Error('INTERVALLO_NON_VALIDO');
 const byOperator=new Map();
 for(const a of s.appointments){
  const start=Math.max(Date.parse(a.start),Date.parse(from)),end=Math.min(Date.parse(a.end),Date.parse(to));
  if(end<=start)continue;
  const entry=byOperator.get(a.operator)||{operator:a.operator,appointments:0,minutes:0};
  entry.appointments++;entry.minutes+=(end-start)/60000;byOperator.set(a.operator,entry);
 }
 return [...byOperator.values()].sort((a,b)=>a.operator.localeCompare(b.operator,'it'));
}
function start(state,appointmentId,operator,id,when){
 const s=checked(state),a=s.appointments.find(x=>x.id===appointmentId);
 if(!a||a.operator!==operator||!stamp(when))throw Error('ARRIVO_NON_VALIDO');
 return H.clock(H.createIntervention(s,appointmentId,operator,id),id,'ARRIVO',when);
}
function close(state,id,when,extra){
 const s=checked(state),job=s.interventions.find(x=>x.id===id);
 if(!job||job.status!=='IN_CORSO'||!stamp(when)||when<job.arrivedAt)throw Error('CHIUSURA_NON_VALIDA');
 if(extra!==undefined&&(!Array.isArray(extra)||extra.some(x=>!x||typeof x.description!=='string'||!x.description.trim()||x.description.length>2000)))throw Error('EXTRA_NON_VALIDI');
 const next=H.clock(s,id,'USCITA',when);
 return replace(next,id,x=>({...x,otherWork:(extra||[]).map(e=>({description:e.description.trim(),attachments:(e.attachments||[]).map(String)})),history:[...(x.history||[]),{action:'CHIUSURA',at:when,operator:x.operator}]}));
}
function replace(s,id,fn){const n={...s,interventions:s.interventions.map(x=>x.id===id?fn(x):x)};return checked(n)}
function reopen(state,id,operator,when,reason){
 const s=checked(state),j=s.interventions.find(x=>x.id===id);
 if(!j||j.status!=='CONCLUSO'||!operator||!stamp(when)||!String(reason||'').trim())throw Error('RIAPERTURA_NON_VALIDA');
 return replace(s,id,x=>({...x,status:'REVISIONATO',history:[...(x.history||[]),{action:'RIAPERTURA',at:when,operator,reason:String(reason).trim()}]}));
}
function revise(state,id,operator,patch,when){
 const s=checked(state),j=s.interventions.find(x=>x.id===id);
 if(!j||j.status!=='REVISIONATO'||!operator||!stamp(when)||!patch||typeof patch!=='object')throw Error('REVISIONE_NON_VALIDA');
 const arrivedAt=patch.arrivedAt||j.arrivedAt,leftAt=patch.leftAt||j.leftAt;
 if(!stamp(arrivedAt)||!stamp(leftAt)||leftAt<arrivedAt)throw Error('ORARI_NON_VALIDI');
 return replace(s,id,x=>({...x,arrivedAt,leftAt,status:'CONCLUSO',history:[...(x.history||[]),{action:'REVISIONE_CHIUSA',at:when,operator}]}));
}
function agenda(state,operator,from,to){
 const s=checked(state);if(!stamp(from)||!stamp(to)||to<=from)throw Error('INTERVALLO_NON_VALIDO');
 return s.appointments.filter(a=>(!operator||a.operator===operator)&&a.start<to&&a.end>from).sort((a,b)=>a.start.localeCompare(b.start)||a.id.localeCompare(b.id));
}
const api=Object.freeze({schedule,reschedule,operatorLoad,start,close,reopen,revise,agenda});
root.ITEFieldOperations=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
