/* I.T.E. 4.0 — local-only document-to-service history projection.
 * Metadata only; never persists PDF contents. Does not modify legacy stores.
 */
(function(root){'use strict';
const D=root.ITEDocumentIntake||(typeof require==='function'?require('./ite-document-intake.js'):null);
const H=root.ITEHierarchyWorkspace||(typeof require==='function'?require('./ite-hierarchy-workspace.js'):null);
const MAX=5000;
function engines(){if(!D||!H)throw Error('MOTORI_NON_DISPONIBILI')}
function validateLinks(links,registry,hierarchy){
 engines();const docs=D.validate(registry),h=H.validate(hierarchy);
 if(!Array.isArray(links)||links.length>MAX)throw Error('COLLEGAMENTI_NON_VALIDI');
 const ids=new Set(),byId=new Map(docs.items.map(d=>[d.id,d]));
 const sites=new Map(h.sites.map(s=>[s.id,s])),plants=new Map(h.plants.map(p=>[p.id,p]));
 const devices=new Map(h.devices.map(d=>[d.id,d])),appointments=new Map(h.appointments.map(a=>[a.id,a]));
 const interventions=new Map(h.interventions.map(i=>[i.id,i]));
 return links.map(link=>{
  if(!link||typeof link.documentId!=='string'||ids.has(link.documentId)||!byId.has(link.documentId))throw Error('DOCUMENTO_COLLEGATO_NON_VALIDO');
  ids.add(link.documentId);
  const doc=byId.get(link.documentId),keys=['plantId','deviceId','appointmentId','interventionId'];
  if(keys.some(k=>link[k]!=null&&(typeof link[k]!=='string'||!link[k].trim())))throw Error('RIFERIMENTO_NON_VALIDO');
  const p=link.plantId?plants.get(link.plantId):null,d=link.deviceId?devices.get(link.deviceId):null;
  const a=link.appointmentId?appointments.get(link.appointmentId):null,i=link.interventionId?interventions.get(link.interventionId):null;
  if((link.plantId&&!p)||(link.deviceId&&!d)||(link.appointmentId&&!a)||(link.interventionId&&!i))throw Error('RIFERIMENTO_INESISTENTE');
  if(i&&(!a||i.appointmentId!==a.id))throw Error('INTERVENTO_APPUNTAMENTO_INCOERENTE');
  if(d&&(!p||d.plantId!==p.id))throw Error('APPARECCHIATURA_IMPIANTO_INCOERENTE');
  const siteId=doc.siteId||null,clientId=doc.clientId||null;
  if(!siteId&&(p||d||a||i))throw Error('SEDE_DOCUMENTO_OBBLIGATORIA');
  if(siteId&&(!sites.has(siteId)||sites.get(siteId).clientId!==clientId))throw Error('SEDE_CLIENTE_INCOERENTE');
  if(p&&p.siteId!==siteId||a&&(a.siteId!==siteId||a.clientId!==clientId))throw Error('SEDE_RIFERIMENTO_INCOERENTE');
  if(a&&d&&a.deviceId&&a.deviceId!==d.id)throw Error('APPUNTAMENTO_APPARECCHIATURA_INCOERENTE');
  if(link.note!==undefined&&(typeof link.note!=='string'||link.note.length>500))throw Error('NOTA_NON_VALIDA');
  return {documentId:link.documentId,plantId:link.plantId||null,deviceId:link.deviceId||null,appointmentId:link.appointmentId||null,interventionId:link.interventionId||null,note:link.note||''};
 });
}
function link(links,record,registry,hierarchy){
 const existing=links.filter(x=>x.documentId!==record.documentId);
 return validateLinks([...existing,record],registry,hierarchy);
}
function unlink(links,documentId,registry,hierarchy){return validateLinks(links.filter(x=>x.documentId!==documentId),registry,hierarchy)}
function timeline(registry,hierarchy,links,filter={}){
 const valid=validateLinks(links,registry,hierarchy),byId=new Map(valid.map(x=>[x.documentId,x]));
 return D.validate(registry).items.filter(doc=>{
  const l=byId.get(doc.id)||{};
  return (!filter.clientId||doc.clientId===filter.clientId)&&(!filter.siteId||doc.siteId===filter.siteId)&&(!filter.plantId||l.plantId===filter.plantId)&&(!filter.deviceId||l.deviceId===filter.deviceId)&&(!filter.interventionId||l.interventionId===filter.interventionId);
 }).map(doc=>({id:doc.id,filename:doc.filename,type:doc.type,status:doc.status,date:doc.documentDate||doc.addedAt,clientId:doc.clientId||null,siteId:doc.siteId||null,...(byId.get(doc.id)||{})})).sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
}
function reconcile(registry,hierarchy,links){
 const docs=D.validate(registry),h=H.validate(hierarchy),clientIds=new Set(h.clients.map(x=>x.id)),siteIds=new Set(h.sites.map(x=>x.id)),docIds=new Set(docs.items.map(x=>x.id));
 const missingDocuments=links.filter(x=>!docIds.has(x.documentId)).map(x=>x.documentId);
 const orphaned=docs.items.filter(x=>x.clientId&&!clientIds.has(x.clientId)||x.siteId&&!siteIds.has(x.siteId)).map(x=>x.id);
 let invalidLinks=[];for(const l of links){try{validateLinks([l],registry,hierarchy)}catch(e){invalidLinks.push({documentId:l.documentId||null,reason:e.message})}}
 return {documents:docs.items.length,linked:links.length,unlinked:docs.items.filter(x=>!links.some(l=>l.documentId===x.id)).length,missingDocuments,orphaned,invalidLinks};
}
const api=Object.freeze({validateLinks,link,unlink,timeline,reconcile});
root.ITEDocumentHistory=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
