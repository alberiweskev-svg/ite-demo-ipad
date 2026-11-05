/* I.T.E. 4.0 TEST — fascicolo tecnico: audit trasversale, nessuna modifica ai dati. */
(function(root){'use strict';
const copy=x=>JSON.parse(JSON.stringify(x));
function audit(reg,ops){
 const issues=[],byType={},byStatus={},linked=new Set(),deviceCounts={};
 const add=(severity,code,documentId,detail)=>issues.push({severity,code,documentId,detail});
 if(!reg||!Array.isArray(reg.documents)||!ops||!Array.isArray(ops.clients))throw Error('ARCHIVI_NON_VALIDI');
 const docs=reg.documents,seen=new Set();
 for(const d of docs){
  byType[d.type]=(byType[d.type]||0)+1;byStatus[d.status]=(byStatus[d.status]||0)+1;
  if(seen.has(d.id))add('ERROR','DOCUMENTO_DUPLICATO',d.id,'ID duplicato');seen.add(d.id);
  const c=ops.clients.find(x=>x.id===d.clientId),s=c?.sites?.find(x=>x.id===d.siteId),p=s?.plants?.find(x=>x.id===d.plantId);
  if(!c)add('ERROR','CLIENTE_ASSENTE',d.id,'Cliente non presente');
  if(d.siteId&&!s)add('ERROR','SEDE_ASSENTE',d.id,'Sede non presente');
  if(d.plantId&&!p)add('ERROR','IMPIANTO_ASSENTE',d.id,'Impianto non presente');
  if(d.deviceId&&!p?.devices?.some(x=>x.id===d.deviceId))add('ERROR','APPARECCHIATURA_ASSENTE',d.id,'Apparecchiatura non presente');
  if(d.deviceId)deviceCounts[d.deviceId]=(deviceCounts[d.deviceId]||0)+1;
  if(d.interventionId){
   const i=ops.interventions?.find(x=>x.id===d.interventionId),a=ops.appointments?.find(x=>x.id===i?.appointmentId);
   if(!i||!a)add('ERROR','INTERVENTO_ASSENTE',d.id,'Intervento non trovato');
   else if(a.clientId!==d.clientId||(d.siteId&&a.siteId!==d.siteId)||(d.plantId&&a.plantId!==d.plantId)||(d.deviceId&&a.deviceId!==d.deviceId))add('ERROR','INTERVENTO_NON_COERENTE',d.id,'Gerarchia intervento differente');
   else linked.add(d.interventionId);
  }else if(d.status==='VERIFICATO')add('WARNING','VERIFICATO_SENZA_INTERVENTO',d.id,'Verificare se il collegamento sia necessario');
  if(!Array.isArray(d.history)||d.history.length!==d.revision)add('ERROR','STORICO_INCOERENTE',d.id,'Numero revisioni non coerente');
  if(d.status==='VERIFICATO'&&(!d.attachments||!d.attachments.length))add('WARNING','NESSUN_ALLEGATO',d.id,'Nessun allegato registrato');
  if(d.attachments?.some(a=>'content'in a||'base64'in a||'url'in a))add('ERROR','ALLEGATO_CON_CONTENUTO',d.id,'Contenuto vietato nel registro TEST');
 }
 for(const i of ops.interventions||[])if(!linked.has(i.id))add('INFO','INTERVENTO_SENZA_DOCUMENTO',i.id,'Nessun documento collegato');
 const counts={documents:docs.length,interventions:(ops.interventions||[]).length,linkedInterventions:linked.size,errors:issues.filter(x=>x.severity==='ERROR').length,warnings:issues.filter(x=>x.severity==='WARNING').length};
 return copy({format:'ITE40_FASCICOLO_AUDIT_TEST',counts,byType,byStatus,deviceCounts,issues});
}
const api=Object.freeze({audit});root.ITE40TechnicalDossierAudit=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
