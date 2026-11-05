/* I.T.E. 4.0 — motore integrato appuntamenti/interventi/preventivi, solo dati TEST. */
(function(root){'use strict';
const copy=x=>JSON.parse(JSON.stringify(x));
const str=(v,n=180)=>{if(typeof v!=='string'||!v.trim()||v.length>n)throw Error('CAMPO_NON_VALIDO');return v.trim()};
const id=v=>{v=str(v,80);if(!v.startsWith('TEST-'))throw Error('SOLO_DATI_TEST');return v};
const iso=v=>{if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(v)||!Number.isFinite(Date.parse(v)))throw Error('DATA_NON_VALIDA');return new Date(v).toISOString()};
const money=v=>{if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>1000000)throw Error('IMPORTO_NON_VALIDO');return Math.round(v*100)/100};
const empty=()=>({clients:[],operators:[],appointments:[],interventions:[],quotes:[],audit:[]});
function validate(state){if(!state||!['clients','operators','appointments','interventions','quotes','audit'].every(k=>Array.isArray(state[k])))throw Error('ARCHIVIO_NON_VALIDO');return state}
function clientSite(state,clientId,siteId,plantId,deviceId){
 const c=state.clients.find(x=>x.id===clientId);if(!c)throw Error('CLIENTE_ASSENTE');
 const s=c.sites.find(x=>x.id===siteId);if(!s)throw Error('SEDE_NON_DEL_CLIENTE');
 const p=s.plants.find(x=>x.id===plantId);if(!p)throw Error('IMPIANTO_NON_DELLA_SEDE');
 if(deviceId&&!p.devices.some(x=>x.id===deviceId))throw Error('APPARECCHIATURA_NON_DELL_IMPIANTO');
 return {c,s,p};
}
function change(state,action,operator,at,fn){const next=copy(validate(state));const stamp=iso(at);fn(next);next.audit.push({action,operator:str(operator,80),at:stamp});return next}
function addClient(state,raw,operator,at){return change(state,'CLIENTE_CREATO',operator,at,s=>{
 const c={id:id(raw.id),name:str(raw.name),sites:[]};if(s.clients.some(x=>x.id===c.id))throw Error('ID_DUPLICATO');s.clients.push(c);
})}
function addSite(state,clientId,raw,operator,at){return change(state,'SEDE_CREATA',operator,at,s=>{
 const c=s.clients.find(x=>x.id===clientId);if(!c)throw Error('CLIENTE_ASSENTE');
 const site={id:id(raw.id),address:str(raw.address),plants:[]};if(c.sites.some(x=>x.id===site.id))throw Error('ID_DUPLICATO');c.sites.push(site);
})}
function addPlant(state,clientId,siteId,raw,operator,at){return change(state,'IMPIANTO_CREATO',operator,at,s=>{
 const c=s.clients.find(x=>x.id===clientId),site=c&&c.sites.find(x=>x.id===siteId);if(!site)throw Error('SEDE_NON_DEL_CLIENTE');
 const p={id:id(raw.id),type:str(raw.type),devices:[]};if(site.plants.some(x=>x.id===p.id))throw Error('ID_DUPLICATO');site.plants.push(p);
})}
function addDevice(state,link,raw,operator,at){return change(state,'APPARECCHIATURA_CREATA',operator,at,s=>{
 const {p}=clientSite(s,link.clientId,link.siteId,link.plantId);
 const d={id:id(raw.id),brand:str(raw.brand),model:str(raw.model),serial:str(raw.serial)};
 if(p.devices.some(x=>x.id===d.id))throw Error('ID_DUPLICATO');p.devices.push(d);
})}
function addOperator(state,raw,operator,at){return change(state,'OPERATORE_CREATO',operator,at,s=>{
 const o={id:id(raw.id),name:str(raw.name),color:/^#[0-9a-f]{6}$/i.test(raw.color)?raw.color:'#285b84'};
 if(s.operators.some(x=>x.id===o.id))throw Error('ID_DUPLICATO');s.operators.push(o);
})}
function appointment(state,raw,operator,at){return change(state,'APPUNTAMENTO_CREATO',operator,at,s=>{
 const key=id(raw.id);if(s.appointments.some(x=>x.id===key))throw Error('ID_DUPLICATO');
 clientSite(s,raw.clientId,raw.siteId,raw.plantId,raw.deviceId);
 if(!s.operators.some(x=>x.id===raw.operatorId))throw Error('OPERATORE_ASSENTE');
 const start=iso(raw.start),end=iso(raw.end);if(end<=start)throw Error('ORARIO_NON_VALIDO');
 if(s.appointments.some(x=>x.operatorId===raw.operatorId&&x.status!=='ANNULLATO'&&start<x.end&&end>x.start))throw Error('OPERATORE_OCCUPATO');
 s.appointments.push({id:key,clientId:raw.clientId,siteId:raw.siteId,plantId:raw.plantId,deviceId:raw.deviceId||null,operatorId:raw.operatorId,start,end,kind:str(raw.kind),status:'PROGRAMMATO'});
})}
function arrive(state,appointmentId,operatorId,at){return change(state,'ARRIVO',operatorId,at,s=>{
 const a=s.appointments.find(x=>x.id===appointmentId);if(!a)throw Error('APPUNTAMENTO_ASSENTE');
 if(a.operatorId!==operatorId)throw Error('OPERATORE_NON_ASSEGNATO');
 if(a.status!=='PROGRAMMATO'||s.interventions.some(x=>x.appointmentId===a.id))throw Error('INTERVENTO_GIA_AVVIATO');
 a.status='IN_CORSO';s.interventions.push({id:'TEST-INT-'+a.id.slice(5),appointmentId:a.id,operatorId,arrival:iso(at),departure:null,status:'APERTO',extraWork:[],history:[{action:'ARRIVO',at:iso(at),operatorId}]});
})}
function finish(state,interventionId,operatorId,at,details){return change(state,'USCITA',operatorId,at,s=>{
 const i=s.interventions.find(x=>x.id===interventionId);if(!i)throw Error('INTERVENTO_ASSENTE');
 if(i.operatorId!==operatorId||i.status!=='APERTO')throw Error('INTERVENTO_NON_CHIUDIBILE');
 const out=iso(at);if(out<i.arrival)throw Error('USCITA_PRIMA_ARRIVO');
 i.departure=out;i.status='CHIUSO';i.description=str(details.description,2000);
 i.extraWork=Array.isArray(details.extraWork)?details.extraWork.map(x=>str(x,500)):[];
 i.history.push({action:'CHIUSURA',at:out,operatorId});s.appointments.find(x=>x.id===i.appointmentId).status='CHIUSO';
})}
function revise(state,interventionId,operatorId,at,reason){return change(state,'REVISIONE_INTERVENTO',operatorId,at,s=>{
 const i=s.interventions.find(x=>x.id===interventionId);if(!i||i.status!=='CHIUSO')throw Error('INTERVENTO_NON_REVISIONABILE');
 i.history.push({action:'RIAPERTURA',at:iso(at),operatorId,reason:str(reason,500),previousDeparture:i.departure});
 i.status='APERTO';i.departure=null;s.appointments.find(x=>x.id===i.appointmentId).status='IN_CORSO';
})}
function quote(state,raw,operator,at){return change(state,'PREVENTIVO_CREATO',operator,at,s=>{
 const key=id(raw.id);if(s.quotes.some(x=>x.id===key))throw Error('ID_DUPLICATO');
 const client=s.clients.find(x=>x.id===raw.clientId);if(!client)throw Error('CLIENTE_ASSENTE');
 if(!Array.isArray(raw.lines)||!raw.lines.length)throw Error('VOCI_OBBLIGATORIE');
 const lines=raw.lines.map((x,i)=>({id:id(x.id),category:str(x.category,60),kind:x.kind==='FORNITURA'||x.kind==='POSA'?x.kind:(()=>{throw Error('FORNITURA_POSA_SEPARATE')})(),description:str(x.description,500),quantity:money(x.quantity),unitPrice:money(x.unitPrice),extra:!!x.extra,approved:false}));
 if(new Set(lines.map(x=>x.id)).size!==lines.length)throw Error('ID_DUPLICATO');
 s.quotes.push({id:key,clientId:raw.clientId,lines,status:'DA_ACCETTARE',created:iso(at)});
})}
function approveExtra(state,quoteId,lineIds,operator,at){return change(state,'EXTRA_APPROVATI',operator,at,s=>{
 const q=s.quotes.find(x=>x.id===quoteId);if(!q)throw Error('PREVENTIVO_ASSENTE');
 if(!Array.isArray(lineIds)||!lineIds.length||new Set(lineIds).size!==lineIds.length)throw Error('SELEZIONE_NON_VALIDA');
 for(const key of lineIds){const line=q.lines.find(x=>x.id===key&&x.extra);if(!line)throw Error('EXTRA_ASSENTE');line.approved=true}
})}
function totals(q){return q.lines.reduce((r,x)=>{const amount=Math.round(x.quantity*x.unitPrice*100)/100;if(x.extra&&!x.approved)r.pendingExtra+=amount;else r.approved+=amount;if(x.kind==='FORNITURA')r.supply+=amount;else r.installation+=amount;return r},{approved:0,pendingExtra:0,supply:0,installation:0})}
const api=Object.freeze({empty,validate,addClient,addSite,addPlant,addDevice,addOperator,appointment,arrive,finish,revise,quote,approveExtra,totals});
root.ITEOperations40=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
