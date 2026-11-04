/* I.T.E. 4.0 — agenda integrata: gerarchia, conflitti, ciclo intervento ed extra. */
(function(root){'use strict';
const F=root.ITEFieldWorkflow||(typeof require==='function'?require('./ite-field-workflow.js'):null);
const copy=x=>JSON.parse(JSON.stringify(x));
function get(items,id,label){const x=(items||[]).find(v=>v.id===id);if(!x)throw Error(label+'_INESISTENTE');return x}
function chain(master,p){
 const client=get(master.clients,p.clientId,'CLIENTE'),site=get(master.sites,p.siteId,'SEDE'),system=get(master.systems,p.systemId,'IMPIANTO'),equipment=get(master.equipment,p.equipmentId,'APPARECCHIATURA'),operator=get(master.operators,p.operatorId,'OPERATORE');
 if(site.clientId!==client.id||system.siteId!==site.id||equipment.systemId!==system.id)throw Error('GERARCHIA_NON_COHERENTE');
 return {client,site,system,equipment,operator};
}
function conflict(appointments,p,excludeId){
 const start=Date.parse(p.startsAt),end=Date.parse(p.endsAt);
 if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)throw Error('FASCIA_NON_VALIDA');
 return (appointments||[]).filter(a=>a.id!==excludeId&&a.status!=='cancelled'&&a.operatorId===p.operatorId&&start<Date.parse(a.endsAt)&&end>Date.parse(a.startsAt)).map(a=>a.id);
}
function schedule(state,master,p){
 chain(master,p);if((state.appointments||[]).some(a=>a.id===p.id))throw Error('APPUNTAMENTO_DUPLICATO');
 const overlaps=conflict(state.appointments,p);if(overlaps.length)throw Error('OPERATORE_OCCUPATO:'+overlaps.join(','));
 const next=copy(state);next.appointments=[...(next.appointments||[]),F.appointment(p)];return next;
}
function transition(state,id,action,operatorId,at,payload){
 const next=copy(state),i=(next.appointments||[]).findIndex(a=>a.id===id);if(i<0)throw Error('APPUNTAMENTO_INESISTENTE');
 const a=next.appointments[i],x=payload||{};
 const ops={arrive:()=>F.arrive(a,operatorId,at),close:()=>F.close(a,operatorId,at,x.notes),reopen:()=>F.reopen(a,operatorId,at,x.reason),reviseTimes:()=>F.reviseTimes(a,operatorId,at,x.changes),finishRevision:()=>F.finishRevision(a,operatorId,at),addExtra:()=>F.addExtra(a,x.extra,operatorId,at),approveLines:()=>F.approveLines(a,x.extraId,x.quantities,operatorId,at)};
 if(!ops[action])throw Error('AZIONE_NON_VALIDA');next.appointments[i]=ops[action]();return next;
}
function agenda(state,operatorId,from,to){
 const lo=Date.parse(from),hi=Date.parse(to);if(!Number.isFinite(lo)||!Number.isFinite(hi)||hi<=lo)throw Error('PERIODO_NON_VALIDO');
 return (state.appointments||[]).filter(a=>(!operatorId||a.operatorId===operatorId)&&Date.parse(a.startsAt)<hi&&Date.parse(a.endsAt)>lo).sort((a,b)=>a.startsAt.localeCompare(b.startsAt)).map(a=>({...copy(a),summary:F.summary(a)}));
}
function batch(state,commands,master){return commands.reduce((s,c)=>c.action==='schedule'?schedule(s,master,c.payload):transition(s,c.id,c.action,c.operatorId,c.at,c.payload),copy(state))}
const api=Object.freeze({chain,conflict,schedule,transition,agenda,batch});root.ITEFieldAgenda=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
