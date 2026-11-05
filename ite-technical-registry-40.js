/* I.T.E. 4.0 - Registro documenti tecnici TEST, nessun PDF o dato reale viene memorizzato. */
(function(root){'use strict';
const TYPES=new Set(['DICO_ELETTRICO','DICO_IDRICO','DIRI','ALLEGATI_GAS','POS','CAD']);
const STATES=new Set(['BOZZA','DA_VERIFICARE','VERIFICATO','ARCHIVIATO']);
const copy=x=>JSON.parse(JSON.stringify(x));
const testId=x=>typeof x==='string'&&/^TEST-[A-Za-z0-9_-]{1,70}$/.test(x);
const checkId=x=>{if(!testId(x))throw Error('SOLO_IDENTIFICATIVI_TEST');return x};
const txt=(x,n=300)=>{if(typeof x!=='string'||!x.trim()||x.length>n)throw Error('TESTO_NON_VALIDO');return x.trim()};
const date=x=>{if(typeof x!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(x)||!Number.isFinite(Date.parse(x)))throw Error('DATA_NON_VALIDA');return new Date(x).toISOString()};
const empty=()=>({schema:1,documents:[],events:[]});
function location(ops,ids){
 if(!ops||!Array.isArray(ops.clients))throw Error('ANAGRAFICA_ASSENTE');
 const c=ops.clients.find(x=>x.id===ids.clientId);if(!c)throw Error('CLIENTE_ASSENTE');
 if(ids.siteId){const s=c.sites.find(x=>x.id===ids.siteId);if(!s)throw Error('SEDE_ASSENTE');
 if(ids.plantId){const p=s.plants.find(x=>x.id===ids.plantId);if(!p)throw Error('IMPIANTO_ASSENTE');
 if(ids.deviceId&&!p.devices.some(x=>x.id===ids.deviceId))throw Error('APPARECCHIATURA_ASSENTE');
 }else if(ids.deviceId)throw Error('IMPIANTO_OBBLIGATORIO');
 }else if(ids.plantId||ids.deviceId)throw Error('SEDE_OBBLIGATORIA');
 if(ids.interventionId){const i=ops.interventions.find(x=>x.id===ids.interventionId);if(!i)throw Error('INTERVENTO_ASSENTE');
 const a=ops.appointments.find(x=>x.id===i.appointmentId);if(!a||a.clientId!==ids.clientId||(ids.siteId&&a.siteId!==ids.siteId)||(ids.plantId&&a.plantId!==ids.plantId)||(ids.deviceId&&a.deviceId!==ids.deviceId))throw Error('INTERVENTO_NON_COLLEGATO');
 }
}
function validate(reg,ops){
 if(!reg||reg.schema!==1||!Array.isArray(reg.documents)||!Array.isArray(reg.events))throw Error('REGISTRO_NON_VALIDO');
 const ids=new Set();
 for(const d of reg.documents){
 checkId(d.id);if(ids.has(d.id))throw Error('DOCUMENTO_DUPLICATO');ids.add(d.id);
 if(!TYPES.has(d.type)||!STATES.has(d.status))throw Error('TIPO_O_STATO_NON_VALIDO');
 for(const k of ['clientId','siteId','plantId','deviceId','interventionId'])if(d[k]!=null)checkId(d[k]);
 txt(d.title,180);date(d.createdAt);if(!Number.isInteger(d.revision)||d.revision<1)throw Error('REVISIONE_NON_VALIDA');
 if(!Array.isArray(d.history)||!d.history.length)throw Error('STORICO_ASSENTE');
 if(!Array.isArray(d.attachments))throw Error('ALLEGATI_NON_VALIDI');
 for(const a of d.attachments){checkId(a.id);txt(a.filename,160);if(!/^(application\/pdf|image\/jpeg|image\/png)$/.test(a.mime))throw Error('TIPO_ALLEGATO_NON_VALIDO');if(!Number.isInteger(a.bytes)||a.bytes<0||a.bytes>20000000)throw Error('DIMENSIONE_ALLEGATO_NON_VALIDA');if('content'in a||'base64'in a||'url'in a)throw Error('CONTENUTO_ALLEGATO_VIETATO')}
 location(ops,d);
 }
 return true;
}
function create(reg,ops,raw,operator,at){
 const next=copy(reg),time=date(at),actor=checkId(operator),key=checkId(raw.id);
 if(next.documents.some(x=>x.id===key))throw Error('DOCUMENTO_DUPLICATO');
 const ids={clientId:checkId(raw.clientId)};
 for(const k of ['siteId','plantId','deviceId','interventionId'])ids[k]=raw[k]==null?null:checkId(raw[k]);
 const doc={id:key,...ids,type:raw.type,title:txt(raw.title,180),status:'BOZZA',revision:1,createdAt:time,attachments:[],history:[{revision:1,action:'CREAZIONE',operatorId:actor,at:time}]};
 next.documents.push(doc);next.events.push({documentId:key,action:'CREAZIONE',operatorId:actor,at:time});
 validate(next,ops);return next;
}
function update(reg,ops,documentId,change,operator,at){
 const next=copy(reg),d=next.documents.find(x=>x.id===checkId(documentId));if(!d)throw Error('DOCUMENTO_ASSENTE');
 const actor=checkId(operator),time=date(at);
 if(d.status==='ARCHIVIATO')throw Error('DOCUMENTO_ARCHIVIATO');
 if(change.status!==undefined){if(!STATES.has(change.status)||change.status==='BOZZA'&&d.status==='VERIFICATO')throw Error('TRANSIZIONE_NON_VALIDA');d.status=change.status}
 if(change.title!==undefined)d.title=txt(change.title,180);
 if(change.attachment){const a=change.attachment;checkId(a.id);if(d.attachments.some(x=>x.id===a.id))throw Error('ALLEGATO_DUPLICATO');d.attachments.push({id:a.id,filename:txt(a.filename,160),mime:a.mime,bytes:a.bytes})}
 d.revision++;d.history.push({revision:d.revision,action:'REVISIONE',operatorId:actor,at:time});
 next.events.push({documentId:d.id,action:'REVISIONE',operatorId:actor,at:time});
 validate(next,ops);return next;
}
function forEquipment(reg,deviceId){checkId(deviceId);return copy(reg.documents.filter(x=>x.deviceId===deviceId))}
function forClient(reg,clientId){checkId(clientId);return copy(reg.documents.filter(x=>x.clientId===clientId))}
function backup(reg,ops){validate(reg,ops);return JSON.stringify({format:'ITE40_TECHNICAL_TEST',registry:reg},null,2)}
function restore(json,ops){if(typeof json!=='string'||json.length>2000000)throw Error('BACKUP_TROPPO_GRANDE');const p=JSON.parse(json);if(p.format!=='ITE40_TECHNICAL_TEST')throw Error('BACKUP_NON_VALIDO');validate(p.registry,ops);return copy(p.registry)}
const api=Object.freeze({empty,validate,create,update,forEquipment,forClient,backup,restore});
root.ITETechnicalRegistry40=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
