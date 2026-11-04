/* I.T.E. 4.0 — fascicolo tecnico locale, solo metadati verificati.
 * Non interpreta né carica PDF; moduli originali 2.7.5 invariati.
 */
(function(root){'use strict';
const H=root.ITEHierarchyWorkspace||(typeof require==='function'?require('./ite-hierarchy-workspace.js'):null);
const I=root.ITEDocumentIntake||(typeof require==='function'?require('./ite-document-intake.js'):null);
const TECH=new Set(['DICO_ELETTRICO','DICO_IDRICO','DIRI','ALLEGATI_GAS','POS','CAD']);
const id=v=>typeof v==='string'&&v.trim().length>0&&v.length<=240;
const copy=x=>JSON.parse(JSON.stringify(x));
function resolve(master,ref){
 const h=H.validate(master),client=h.clients.find(x=>x.id===ref.clientId),site=h.sites.find(x=>x.id===ref.siteId);
 if(!client||!site||site.clientId!==client.id)throw Error('CLIENTE_SEDE_INCOERENTI');
 let plant=null,device=null,appointment=null,intervention=null;
 if(ref.plantId){plant=h.plants.find(x=>x.id===ref.plantId);if(!plant||plant.siteId!==site.id)throw Error('IMPIANTO_SEDE_INCOERENTE')}
 if(ref.deviceId){device=h.devices.find(x=>x.id===ref.deviceId);if(!device||!plant||device.plantId!==plant.id)throw Error('APPARECCHIATURA_IMPIANTO_INCOERENTE')}
 if(ref.interventionId){intervention=h.interventions.find(x=>x.id===ref.interventionId);appointment=intervention&&h.appointments.find(x=>x.id===intervention.appointmentId);
  if(!appointment||appointment.clientId!==client.id||appointment.siteId!==site.id||ref.deviceId&&appointment.deviceId!==ref.deviceId)throw Error('INTERVENTO_SEDE_INCOERENTE')}
 return {client,site,plant,device,appointment,intervention};
}
function empty(){return {version:1,links:[]}}
function validate(state,queue,master){
 if(!state||state.version!==1||!Array.isArray(state.links)||state.links.length>10000)throw Error('FASCICOLO_NON_VALIDO');
 const docs=I.validate(queue),seen=new Set();
 for(const link of state.links){
  if(!link||!id(link.documentId)||seen.has(link.documentId)||!id(link.clientId)||!id(link.siteId)||!id(link.checkedBy)||!/^\d{4}-\d{2}-\d{2}$/.test(link.linkedAt))throw Error('COLLEGAMENTO_NON_VALIDO');
  seen.add(link.documentId);
  const doc=docs.items.find(x=>x.id===link.documentId);
  if(!doc||!TECH.has(doc.type)||!['VERIFICATO','ARCHIVIATO'].includes(doc.status)||doc.clientId!==link.clientId||doc.siteId!==link.siteId||doc.checkedBy!==link.checkedBy)throw Error('DOCUMENTO_NON_VERIFICATO_O_INCOERENTE');
  resolve(master,link);
 }
 return copy(state);
}
function attach(state,queue,master,ref){
 const current=validate(state,queue,master),docs=I.validate(queue),doc=docs.items.find(x=>x.id===ref?.documentId);
 if(!doc||!TECH.has(doc.type)||!['VERIFICATO','ARCHIVIATO'].includes(doc.status)||!doc.originalChecked||!doc.checkedBy)throw Error('DOCUMENTO_TECNICO_DA_VERIFICARE');
 if(current.links.some(x=>x.documentId===doc.id))throw Error('DOCUMENTO_GIA_COLLEGATO');
 if(doc.clientId!==ref.clientId||doc.siteId!==ref.siteId)throw Error('DOCUMENTO_CLIENTE_SEDE_INCOERENTE');
 resolve(master,ref);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(ref.linkedAt)||Number.isNaN(Date.parse(ref.linkedAt)))throw Error('DATA_COLLEGAMENTO_NON_VALIDA');
 const link={documentId:doc.id,clientId:ref.clientId,siteId:ref.siteId,plantId:ref.plantId||'',deviceId:ref.deviceId||'',interventionId:ref.interventionId||'',checkedBy:doc.checkedBy,linkedAt:ref.linkedAt};
 return validate({version:1,links:[...current.links,link]},queue,master);
}
function dossier(state,queue,master,filters={}){
 const s=validate(state,queue,master),q=I.validate(queue);
 const links=s.links.filter(x=>(!filters.clientId||x.clientId===filters.clientId)&&(!filters.siteId||x.siteId===filters.siteId)&&(!filters.plantId||x.plantId===filters.plantId)&&(!filters.deviceId||x.deviceId===filters.deviceId));
 return links.map(x=>{const d=q.items.find(y=>y.id===x.documentId);return {...copy(x),type:d.type,number:d.number||'',documentDate:d.documentDate||'',filename:d.filename,status:d.status}}).sort((a,b)=>a.linkedAt.localeCompare(b.linkedAt)||a.documentId.localeCompare(b.documentId));
}
function coverage(state,queue,master,clientId,siteId){
 const h=H.validate(master);resolve(h,{clientId,siteId});
 const records=dossier(state,queue,h,{clientId,siteId});
 const types=Object.fromEntries([...TECH].map(t=>[t,records.filter(x=>x.type===t).length]));
 return {clientId,siteId,documents:records.length,byType:types,unlinkedVerified:I.validate(queue).items.filter(x=>TECH.has(x.type)&&x.clientId===clientId&&x.siteId===siteId&&x.status==='VERIFICATO'&&!state.links.some(l=>l.documentId===x.id)).map(x=>x.id)};
}
const KEY='ite40_technical_dossier_v1';
function load(storage,queue,master){const raw=storage.getItem(KEY);return validate(raw?JSON.parse(raw):empty(),queue,master)}
function save(storage,state,queue,master){const next=validate(state,queue,master),old=storage.getItem(KEY);storage.setItem(KEY+'_previous',old===null?JSON.stringify(empty()):old);storage.setItem(KEY,JSON.stringify(next));return next}
const api=Object.freeze({KEY,empty,validate,attach,dossier,coverage,load,save});
root.ITETechnicalDossier=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
