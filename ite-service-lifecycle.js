/* I.T.E. 4.0 — service lifecycle domain: hierarchy, calendar, visit audit.
 * Pure deterministic state transitions. No storage, customers or network calls.
 */
(function(root){'use strict';
const copy=x=>JSON.parse(JSON.stringify(x)),s=x=>String(x??'').trim();
function requireText(x,label){if(!s(x))throw Error(label+' obbligatorio');return s(x)}
function iso(x,label){const t=Date.parse(x);if(!x||!Number.isFinite(t)||!/\d{4}-\d\d-\d\dT/.test(x))throw Error(label+' non valido');return t}
function empty(){return {clients:[],sites:[],systems:[],devices:[],operators:[],appointments:[],interventions:[],audit:[]}}
const tables={client:['clients',null],site:['sites','clients'],system:['systems','sites'],device:['devices','systems'],operator:['operators',null]};
function add(state,type,item){
 const next=copy(state),meta=tables[type];if(!meta)throw Error('Tipo anagrafica sconosciuto');
 const [table,parentTable]=meta,id=requireText(item?.id,'ID'),name=requireText(item?.name,'Nome');
 if(next[table].some(x=>x.id===id))throw Error('ID già esistente');
 if(parentTable){const field={sites:'clientId',systems:'siteId',devices:'systemId'}[table],pid=requireText(item[field],'Riferimento');if(!next[parentTable].some(x=>x.id===pid))throw Error('Gerarchia non valida')}
 next[table].push({...copy(item),id,name});return next;
}
function appointment(state,item){
 const next=copy(state),id=requireText(item?.id,'Appuntamento'),deviceId=requireText(item?.deviceId,'Apparecchiatura'),operatorId=requireText(item?.operatorId,'Operatore');
 const device=next.devices.find(x=>x.id===deviceId),operator=next.operators.find(x=>x.id===operatorId);
 if(!device||!operator)throw Error('Apparecchiatura o operatore non trovato');
 const start=iso(item.start,'Inizio'),end=iso(item.end,'Fine');if(end<=start)throw Error('Intervallo appuntamento non valido');
 if(next.appointments.some(x=>x.id===id))throw Error('Appuntamento duplicato');
 if(next.appointments.some(x=>x.operatorId===operatorId&&x.status!=='CANCELLED'&&start<Date.parse(x.end)&&end>Date.parse(x.start)))throw Error('Operatore già occupato');
 next.appointments.push({id,deviceId,operatorId,start:item.start,end:item.end,type:requireText(item.type,'Tipo intervento'),status:'PLANNED'});
 return next;
}
function event(state,appointmentId,action,{at,operatorId,notes='',attachments=[]}={}){
 const next=copy(state),app=next.appointments.find(x=>x.id===appointmentId);
 if(!app)throw Error('Appuntamento inesistente');
 if(!['ARRIVE','CLOSE','REOPEN'].includes(action))throw Error('Azione non valida');
 if(s(operatorId)!==app.operatorId)throw Error('Operatore diverso da quello assegnato');
 const time=iso(at,'Ora evento'),history=next.audit.filter(x=>x.appointmentId===appointmentId);
 if(history.length&&time<Date.parse(history[history.length-1].at))throw Error('Orario precedente allo storico');
 if(action==='CLOSE'){
  const current=next.interventions.find(x=>x.appointmentId===appointmentId);
  if(!current||time<Date.parse(current.arrivalAt))throw Error('Uscita precedente all’arrivo');
 }
 const transitions={PLANNED:{ARRIVE:'OPEN'},OPEN:{CLOSE:'CLOSED'},CLOSED:{REOPEN:'REOPENED'},REOPENED:{CLOSE:'CLOSED'}};
 const status=transitions[app.status]?.[action];if(!status)throw Error('Transizione non consentita');
 if(!Array.isArray(attachments))throw Error('Allegati non validi');
 const record={appointmentId,action,at,operatorId,notes:s(notes),attachments:copy(attachments)};
 app.status=status;
 next.audit.push(record);
 if(action==='ARRIVE')next.interventions.push({id:'INT-'+appointmentId,appointmentId,deviceId:app.deviceId,operatorId,arrivalAt:at,exitAt:null,status:'OPEN',revisionCount:0,extraWorks:[]});
 const visit=next.interventions.find(x=>x.appointmentId===appointmentId);
 if(action==='CLOSE'){visit.exitAt=at;visit.status='CLOSED'}
 if(action==='REOPEN'){visit.status='REOPENED';visit.revisionCount++}
 return next;
}
function addExtra(state,appointmentId,{description,attachments=[]}={}){
 const next=copy(state),visit=next.interventions.find(x=>x.appointmentId===appointmentId);
 if(!visit||!['OPEN','REOPENED'].includes(visit.status))throw Error('Intervento non aperto');
 if(!Array.isArray(attachments))throw Error('Allegati non validi');
 visit.extraWorks.push({description:requireText(description,'Lavoro extra'),attachments:copy(attachments)});
 return next;
}
function agenda(state,{from,to,operatorId}={}){
 const start=iso(from,'Da'),end=iso(to,'A');if(end<=start)throw Error('Intervallo non valido');
 return state.appointments.filter(x=>(!operatorId||x.operatorId===operatorId)&&Date.parse(x.start)<end&&Date.parse(x.end)>start).map(copy).sort((a,b)=>a.start.localeCompare(b.start));
}
const api=Object.freeze({empty,add,appointment,event,addExtra,agenda});
root.ITEServiceLifecycle=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
