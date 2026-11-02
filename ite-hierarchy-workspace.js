/* I.T.E. 4.0 — local demo master-data and appointment workflow.
 * Synthetic/test data only. Never syncs customer records to a public server.
 * Independent from legacy 2.7.5 and production 3.0.74.
 */
(function(root){'use strict';
const KEY='ite40_hierarchy_workspace_v1';
const str=v=>String(v??'').trim();
const iso=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)&&Number.isFinite(Date.parse(v));
const id=v=>str(v).length>0&&str(v).length<=100;
function unique(items,group){
 if(!Array.isArray(items)||items.length>10000)throw Error('GRUPPO_NON_VALIDO_'+group);
 const ids=new Set();
 for(const x of items){if(!x||!id(x.id))throw Error('ID_NON_VALIDO_'+group);
 if(ids.has(x.id))throw Error('DUPLICATO_'+group);ids.add(x.id)}
 return items;
}
function validate(input){
 if(!input||typeof input!=='object')throw Error('ARCHIVIO_NON_VALIDO');
 const clients=unique(input.clients||[],'clients'),sites=unique(input.sites||[],'sites'),plants=unique(input.plants||[],'plants'),devices=unique(input.devices||[],'devices'),appointments=unique(input.appointments||[],'appointments'),interventions=unique(input.interventions||[],'interventions');
 const lookup=(items,key)=>items.some(x=>x.id===key);
 for(const s of sites)if(!lookup(clients,s.clientId))throw Error('SEDE_CLIENTE_INCOERENTE');
 for(const p of plants)if(!lookup(sites,p.siteId))throw Error('IMPIANTO_SEDE_INCOERENTE');
 for(const d of devices)if(!lookup(plants,d.plantId))throw Error('APPARECCHIATURA_IMPIANTO_INCOERENTE');
 for(const a of appointments){
 if(!lookup(clients,a.clientId)||!lookup(sites,a.siteId)||!str(a.operator)||!iso(a.start)||!iso(a.end)||a.end<=a.start)throw Error('APPUNTAMENTO_NON_VALIDO');
 const s=sites.find(s=>s.id===a.siteId);if(s.clientId!==a.clientId)throw Error('APPUNTAMENTO_SEDE_INCOERENTE');
 if(a.deviceId){const d=devices.find(d=>d.id===a.deviceId),p=d&&plants.find(p=>p.id===d.plantId);if(!p||p.siteId!==a.siteId)throw Error('APPUNTAMENTO_APPARECCHIATURA_INCOERENTE')}
 }
 for(const j of interventions){
 const a=appointments.find(a=>a.id===j.appointmentId);
 if(!a||!str(j.operator)||j.operator!==a.operator)throw Error('INTERVENTO_APPUNTAMENTO_INCOERENTE');
 if(j.arrivedAt&&!iso(j.arrivedAt))throw Error('ARRIVO_NON_VALIDO');
 if(j.leftAt&&(!j.arrivedAt||!iso(j.leftAt)||j.leftAt<j.arrivedAt))throw Error('USCITA_NON_VALIDA');
 }
 return {version:1,clients:clients.map(x=>({...x})),sites:sites.map(x=>({...x})),plants:plants.map(x=>({...x})),devices:devices.map(x=>({...x})),appointments:appointments.map(x=>({...x})),interventions:interventions.map(x=>({...x}))};
}
const empty=()=>validate({});
function add(state,group,record){if(!['clients','sites','plants','devices','appointments','interventions'].includes(group))throw Error('GRUPPO_SCONOSCIUTO');const before=validate(state);return validate({...before,[group]:[...before[group],record]})}
function createIntervention(state,appointmentId,operator,newId){
 const before=validate(state),a=before.appointments.find(x=>x.id===appointmentId);
 if(!a)throw Error('APPUNTAMENTO_NON_TROVATO');
 if(a.operator!==str(operator))throw Error('OPERATORE_NON_COINCIDE');
 if(before.interventions.some(x=>x.appointmentId===appointmentId))throw Error('INTERVENTO_GIA_APERTO');
 return add(before,'interventions',{id:newId,appointmentId,operator,status:'APERTO'});
}
function clock(state,interventionId,action,when){
 const before=validate(state),i=before.interventions.findIndex(x=>x.id===interventionId);
 if(i<0)throw Error('INTERVENTO_NON_TROVATO');
 if(!iso(when))throw Error('DATA_ORA_NON_VALIDA');
 const current=before.interventions[i],next={...current};
 if(action==='ARRIVO'&&!next.arrivedAt){next.arrivedAt=when;next.status='IN_CORSO'}
 else if(action==='USCITA'&&next.arrivedAt&&!next.leftAt&&when>=next.arrivedAt){next.leftAt=when;next.status='CONCLUSO'}
 else throw Error('TRANSIZIONE_NON_VALIDA');
 const copy=before.interventions.slice();copy[i]=next;
 return validate({...before,interventions:copy});
}
function technicalMasters(state){const s=validate(state);return {clients:s.clients,sites:s.sites,plants:s.plants,devices:s.devices}}
function parse(raw){if(!raw)return empty();let data;try{data=JSON.parse(raw)}catch(_){throw Error('BACKUP_JSON_NON_VALIDO')}if(data.version!==1)throw Error('VERSIONE_NON_SUPPORTATA');return validate(data)}
function exportJSON(state){return JSON.stringify(validate(state),null,2)}
function save(storage,state){const next=validate(state),previous=storage.getItem(KEY);storage.setItem(KEY+'_previous',previous===null?JSON.stringify(empty()):previous);storage.setItem(KEY,JSON.stringify(next));return next}
function load(storage){return parse(storage.getItem(KEY))}
const api=Object.freeze({KEY,empty,validate,add,createIntervention,clock,technicalMasters,parse,exportJSON,save,load});
root.ITEHierarchyWorkspace=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
