/* I.T.E. 4.0 — pianificazione integrata, dati immutabili; nessun dato reale. */
(function(root){'use strict';
const wf=root.ITEFieldWorkflow||(typeof require==='function'?require('./ite-field-workflow.js'):null);
const s=v=>String(v??'').trim(),clone=v=>JSON.parse(JSON.stringify(v));
function must(v,name){if(!s(v))throw Error(name+'_OBBLIGATORIO');return s(v)}
function refs(catalog,a){
 const fields=[['clients','clientId'],['sites','siteId'],['systems','systemId'],['equipment','equipmentId'],['operators','operatorId']];
 const found={};for(const [collection,key] of fields){const items=catalog[collection];if(!Array.isArray(items))throw Error('CATALOGO_'+collection+'_MANCANTE');found[key]=items.find(x=>s(x.id)===s(a[key]));if(!found[key])throw Error('RIFERIMENTO_NON_TROVATO_'+key);}
 if(s(found.siteId.clientId)!==s(a.clientId))throw Error('SEDE_CLIENTE_INCOERENTE');
 if(s(found.systemId.siteId)!==s(a.siteId))throw Error('IMPIANTO_SEDE_INCOERENTE');
 if(s(found.equipmentId.systemId)!==s(a.systemId))throw Error('APPARECCHIATURA_IMPIANTO_INCOERENTE');
 if(found.operatorId.active===false)throw Error('OPERATORE_NON_ATTIVO');return true;
}
function overlap(a,b){return Date.parse(a.startsAt)<Date.parse(b.endsAt)&&Date.parse(b.startsAt)<Date.parse(a.endsAt)}
function schedule(catalog,appointments,input){
 refs(catalog,input);const a=wf.appointment(input);
 if((appointments||[]).some(b=>s(b.id)===a.id))throw Error('APPUNTAMENTO_DUPLICATO');
 if((appointments||[]).some(b=>b.status!=='cancelled'&&s(b.operatorId)===a.operatorId&&overlap(a,b)))throw Error('OPERATORE_OCCUPATO');
 return [...clone(appointments||[]),a];
}
function transition(appointments,id,action,operatorId,at,payload){
 const list=clone(appointments),i=list.findIndex(a=>s(a.id)===s(id));if(i<0)throw Error('APPUNTAMENTO_NON_TROVATO');
 const a=list[i];const methods={arrive:()=>wf.arrive(a,operatorId,at),close:()=>wf.close(a,operatorId,at,payload?.notes),reopen:()=>wf.reopen(a,operatorId,at,payload?.reason),reviseTimes:()=>wf.reviseTimes(a,operatorId,at,payload?.changes),finishRevision:()=>wf.finishRevision(a,operatorId,at),addExtra:()=>wf.addExtra(a,payload?.extra,operatorId,at),decideExtra:()=>wf.decideExtra(a,payload?.id,payload?.status,operatorId,at)};
 if(!methods[action])throw Error('AZIONE_NON_SUPPORTATA');list[i]=methods[action]();return list;
}
function calendar(appointments,{from,to,operatorId,status}={}){
 const begin=from?Date.parse(from):-Infinity,end=to?Date.parse(to):Infinity;
 if(Number.isNaN(begin)||Number.isNaN(end)||end<=begin)throw Error('INTERVALLO_NON_VALIDO');
 return clone((appointments||[]).filter(a=>Date.parse(a.startsAt)<end&&Date.parse(a.endsAt)>begin&&(!operatorId||s(a.operatorId)===s(operatorId))&&(!status||s(a.status)===s(status))).sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt)));
}
function equipmentHistory(appointments,equipmentId){
 return clone((appointments||[]).filter(a=>s(a.equipmentId)===must(equipmentId,'APPARECCHIATURA')).sort((a,b)=>Date.parse(b.startsAt)-Date.parse(a.startsAt)).map(a=>({...wf.summary(a),startsAt:a.startsAt,endsAt:a.endsAt,kind:a.kind,extraWorks:a.extraWorks})));
}
function extrasTotals(a){
 const result={FORNITURA:0,POSA:0,SMONTAGGIO:0,SMALTIMENTO:0};
 for(const x of a.extraWorks||[]){if(x.status!=='accettato')continue;for(const line of x.lines){const amount=Math.round(line.quantity*line.unitCents);if(!Number.isSafeInteger(amount)||amount<0)throw Error('TOTALE_NON_VALIDO');result[line.type]+=amount;if(!Number.isSafeInteger(result[line.type]))throw Error('TOTALE_NON_VALIDO');}}
 return {...result,totalCents:Object.values(result).reduce((a,b)=>a+b,0),currency:'EUR',readOnly:true};
}
const api=Object.freeze({refs,schedule,transition,calendar,equipmentHistory,extrasTotals});
root.ITEFieldPlanning=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
