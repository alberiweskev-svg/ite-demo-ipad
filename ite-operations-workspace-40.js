/* I.T.E. 4.0 — workspace operativo integrato, esclusivamente dati TEST. */
(function(root){'use strict';
const operations=root.ITEOperations40||(typeof require==='function'?require('./ite-operations-40.js'):null);
if(!operations)throw Error('MOTORE_OPERATIVO_ASSENTE');
const KEY='ite40-operations-test-v1';
const clone=x=>JSON.parse(JSON.stringify(x));
const safeId=x=>typeof x==='string'&&/^TEST-[A-Za-z0-9_-]{1,70}$/.test(x);
function inspect(s){
 operations.validate(s);
 const errors=[],seen=new Set();
 function unique(x,type){if(!safeId(x)){errors.push(type+':ID_NON_TEST');return}if(seen.has(x))errors.push(type+':ID_DUPLICATO:'+x);seen.add(x)}
 for(const c of s.clients){unique(c.id,'CLIENTE');if(!Array.isArray(c.sites))throw Error('SEDE_NON_VALIDA');
  for(const site of c.sites){unique(site.id,'SEDE');if(!Array.isArray(site.plants))throw Error('IMPIANTO_NON_VALIDO');
   for(const plant of site.plants){unique(plant.id,'IMPIANTO');if(!Array.isArray(plant.devices))throw Error('APPARECCHIATURA_NON_VALIDA');
    for(const device of plant.devices)unique(device.id,'APPARECCHIATURA');
   }
  }
 }
 for(const o of s.operators)unique(o.id,'OPERATORE');
 for(const a of s.appointments){unique(a.id,'APPUNTAMENTO');try{
  const c=s.clients.find(x=>x.id===a.clientId),site=c&&c.sites.find(x=>x.id===a.siteId),plant=site&&site.plants.find(x=>x.id===a.plantId);
  if(!plant||(a.deviceId&&!plant.devices.some(x=>x.id===a.deviceId)))throw Error('GERARCHIA');
  if(!s.operators.some(x=>x.id===a.operatorId))throw Error('OPERATORE');
  if(!(Date.parse(a.end)>Date.parse(a.start)))throw Error('TEMPI');
 }catch(e){errors.push('APPUNTAMENTO:'+a.id+':'+e.message)}}
 for(const i of s.interventions){unique(i.id,'INTERVENTO');if(!s.appointments.some(x=>x.id===i.appointmentId))errors.push('INTERVENTO_ORFANO:'+i.id)}
 for(const q of s.quotes){unique(q.id,'PREVENTIVO');if(!s.clients.some(x=>x.id===q.clientId))errors.push('PREVENTIVO_ORFANO:'+q.id);
  for(const line of q.lines||[]){unique(line.id,'RIGA');if(!['FORNITURA','POSA'].includes(line.kind))errors.push('TIPO_RIGA:'+line.id)}
 }
 return {valid:errors.length===0,errors};
}
function create(storage){const store=storage||(typeof localStorage!=='undefined'?localStorage:null);
 if(!store||typeof store.getItem!=='function'||typeof store.setItem!=='function')throw Error('ARCHIVIO_NON_DISPONIBILE');
 function read(){const raw=store.getItem(KEY);if(!raw)return operations.empty();const parsed=JSON.parse(raw);
 if(!parsed||parsed.schema!==1||!parsed.state)throw Error('VERSIONE_ARCHIVIO_NON_SUPPORTATA');
 const report=inspect(parsed.state);if(!report.valid)throw Error('ARCHIVIO_TEST_INCOERENTE:'+report.errors.join(','));
 return clone(parsed.state)}
 function save(state){const report=inspect(state);if(!report.valid)throw Error('DATI_NON_VALIDI:'+report.errors.join(','));
 store.setItem(KEY,JSON.stringify({schema:1,state:clone(state)}));return report}
 function transact(fn){const current=read(),next=fn(clone(current));save(next);return clone(next)}
 function backup(){return JSON.stringify({format:'ITE40_OPERATIONS_TEST_BACKUP',schema:1,exportedAt:new Date().toISOString(),state:read()},null,2)}
 function restore(json){if(typeof json!=='string'||json.length>2000000)throw Error('BACKUP_NON_VALIDO');
 const payload=JSON.parse(json);if(payload.format!=='ITE40_OPERATIONS_TEST_BACKUP'||payload.schema!==1)throw Error('FORMATO_BACKUP_NON_VALIDO');
 save(payload.state);return read()}
 function calendar(from,to,operatorId){const s=read(),start=Date.parse(from),end=Date.parse(to);if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)throw Error('INTERVALLO_NON_VALIDO');
 return s.appointments.filter(a=>(!operatorId||a.operatorId===operatorId)&&Date.parse(a.start)<end&&Date.parse(a.end)>start).sort((a,b)=>a.start.localeCompare(b.start)).map(a=>{
 const c=s.clients.find(x=>x.id===a.clientId),site=c.sites.find(x=>x.id===a.siteId),op=s.operators.find(x=>x.id===a.operatorId);
 return {...clone(a),clientName:c.name,siteAddress:site.address,operatorName:op.name,operatorColor:op.color};
 })}
 function equipmentHistory(deviceId){const s=read(),out=[];for(const a of s.appointments.filter(x=>x.deviceId===deviceId)){
 const i=s.interventions.find(x=>x.appointmentId===a.id);out.push({appointment:clone(a),intervention:i?clone(i):null})}
 return out.sort((a,b)=>b.appointment.start.localeCompare(a.appointment.start))}
 function quoteReport(quoteId){const q=read().quotes.find(x=>x.id===quoteId);if(!q)throw Error('PREVENTIVO_ASSENTE');
 return {quote:clone(q),totals:operations.totals(q),supply:q.lines.filter(x=>x.kind==='FORNITURA'),installation:q.lines.filter(x=>x.kind==='POSA'),pendingExtras:q.lines.filter(x=>x.extra&&!x.approved)}}
 return Object.freeze({read,save,transact,backup,restore,calendar,equipmentHistory,quoteReport,inspect});
}
const api=Object.freeze({create,inspect,KEY});root.ITEOperationsWorkspace40=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
