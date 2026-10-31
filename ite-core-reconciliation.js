/* I.T.E. 4.0 — read-only cross-module reconciliation of existing vault snapshots. */
(function(root){'use strict';
const bridge=typeof module!=='undefined'&&module.exports?require('./ite-core-operations-bridge.js'):root.ITECoreOperationsBridge;
const integrity=typeof module!=='undefined'&&module.exports?require('./ite-operations-integrity.js'):root.ITEOperationsIntegrity;
const list=x=>Array.isArray(x)?x:[],str=x=>String(x??'').trim();
function inspect(core,commerce={}){
 if(!core||!commerce||typeof commerce!=='object')throw Error('Archivi non validi');
 const mapped=bridge.bridge(core),checked=integrity.check(mapped.state),issues=[...mapped.issues.map(x=>({...x,domain:'hierarchy'})),...checked.issues.map(x=>({...x,domain:'operations'}))];
 const clients=new Set(mapped.state.clients.map(x=>x.id)),sites=new Map(mapped.state.sites.map(x=>[x.id,x.clientId]));
 const appointments=list(core.appuntamenti),visits=list(core.interventi),documents=list(commerce.documents),quotes=list(commerce.quotes||commerce.preventivi),extras=list(commerce.extras);
 const checkOwner=(item,domain)=>{
  const clientId=str(item.clientId||item.client_id||item.subjectId),siteId=str(item.siteId||item.immobile_id||item.propertyId);
  if(clientId&&!clients.has(clientId))issues.push({domain,id:str(item.id),code:'CLIENTE_ASSENTE'});
  if(siteId&&!sites.has(siteId))issues.push({domain,id:str(item.id),code:'SEDE_ASSENTE'});
  if(siteId&&clientId&&sites.has(siteId)&&sites.get(siteId)!==clientId)issues.push({domain,id:str(item.id),code:'CLIENTE_SEDE_DIVERSI'});
 };
 for(const x of appointments)checkOwner(x,'appointments');
 for(const x of visits)checkOwner(x,'interventions');
 for(const x of documents){
  checkOwner(x,'documents');
  if(x.type==='Proforma'&&x.status==='Pagato')issues.push({domain:'documents',id:str(x.id),code:'PROFORMA_PAGATA_DA_VERIFICARE'});
  if((x.type==='Nota di credito'||x.fiscal?.tipoDocumento==='TD04')&&x.status==='Da pagare')issues.push({domain:'documents',id:str(x.id),code:'TD04_NON_DA_PAGARE'});
 }
 for(const x of quotes)checkOwner(x,'quotes');
 for(const x of extras){
  checkOwner(x,'extras');
  for(const [i,line] of list(x.lines).entries())if(!['Fornitura','Posa'].includes(line.line_type)||!Number.isFinite(Number(line.qty))||Number(line.qty)<=0||!Number.isFinite(Number(line.price))||Number(line.price)<0)issues.push({domain:'extras',id:str(x.id),line:i,code:'RIGA_EXTRA_NON_VALIDA'});
 }
 return {summary:{clients:mapped.state.clients.length,sites:mapped.state.sites.length,systems:mapped.state.systems.length,devices:mapped.state.devices.length,appointments:appointments.length,interventions:visits.length,documents:documents.length,quotes:quotes.length,extras:extras.length},issues,readOnly:true,persisted:false,releaseAllowed:false,importedAppointments:false,importedInterventions:false};
}
const api=Object.freeze({inspect});root.ITECoreReconciliation=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
