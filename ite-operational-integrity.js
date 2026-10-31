/* I.T.E. 4.0 — verifica integrata di coerenza operativa, sola lettura.
   Nessuna modifica automatica ai dati; importi e prove non sono certificazioni. */
(function(root){'use strict';
const same=(a,b)=>String(a??'')===String(b??'');
const list=v=>Array.isArray(v)?v:[];
const id=v=>String(v??'').trim();
const index=rows=>new Map(list(rows).map(x=>[id(x.id),x]));
function inspect(core,commerce={}){
 if(!core||typeof core!=='object')throw Error('Archivio operativo non valido.');
 const clients=index(core.clienti),sites=index(core.immobili),plants=index(core.impianti),devices=index(core.apparecchiature),jobs=index(core.interventi),appointments=index(core.appuntamenti),people=index(core.operatori||core.tecnici||core.dipendenti);
 const documents=index(commerce.documents),issues=[],counts={clients:clients.size,sites:sites.size,plants:plants.size,devices:devices.size,jobs:jobs.size,documents:documents.size};
 const add=(severity,code,entity,entityId,detail)=>issues.push({severity,code,entity,id:id(entityId),detail});
 const requireUnique=(rows,entity)=>{
  const seen=new Set();
  for(const row of list(rows)){
   if(!row||!id(row.id)){add('BLOCCANTE','ID_ASSENTE',entity,'','Identificativo mancante');continue}
   if(seen.has(id(row.id)))add('BLOCCANTE','ID_DUPLICATO',entity,row.id,'Identificativo duplicato');
   seen.add(id(row.id));
  }
 };
 for(const [rows,entity] of [[core.clienti,'anagrafica'],[core.immobili,'sede'],[core.impianti,'impianto'],[core.apparecchiature,'apparecchiatura'],[core.interventi,'intervento'],[core.appuntamenti,'appuntamento'],[commerce.documents,'documento']])requireUnique(rows,entity);
 for(const s of list(core.immobili))if(!clients.has(id(s.client_id)))add('BLOCCANTE','CLIENTE_ASSENTE','sede',s.id,'Sede priva di cliente');
 for(const p of list(core.impianti))if(!sites.has(id(p.immobile_id)))add('BLOCCANTE','SEDE_ASSENTE','impianto',p.id,'Impianto privo di sede');
 for(const d of list(core.apparecchiature))if(!plants.has(id(d.impianto_id)))add('BLOCCANTE','IMPIANTO_ASSENTE','apparecchiatura',d.id,'Apparecchiatura priva di impianto');
 function ownerForDevice(deviceId){
  const d=devices.get(id(deviceId)),p=d&&plants.get(id(d.impianto_id)),s=p&&sites.get(id(p.immobile_id));
  return s?{client:id(s.client_id),site:id(s.id)}:null;
 }
 for(const j of list(core.interventi)){
  const site=sites.get(id(j.immobile_id)),client=clients.get(id(j.client_id));
  if(!client)add('BLOCCANTE','CLIENTE_ASSENTE','intervento',j.id,'Cliente intervento inesistente');
  if(!site)add('BLOCCANTE','SEDE_ASSENTE','intervento',j.id,'Sede intervento inesistente');
  else if(!same(site.client_id,j.client_id))add('BLOCCANTE','CLIENTE_SEDE_DIVERSI','intervento',j.id,'Sede appartenente ad altro cliente');
  if(id(j.apparecchiatura_id)){
   const owner=ownerForDevice(j.apparecchiatura_id);
   if(!owner)add('BLOCCANTE','APPARECCHIATURA_ASSENTE','intervento',j.id,'Apparecchiatura o gerarchia non disponibile');
   else if(owner.client!==id(j.client_id)||owner.site!==id(j.immobile_id))add('BLOCCANTE','APPARECCHIATURA_ALTRA_SEDE','intervento',j.id,'Apparecchiatura di altra sede o cliente');
  }
  const appointmentId=id(j.appointmentId||j.appuntamento_id),appointment=appointments.get(appointmentId);
  if(appointmentId&&!appointment)add('REVISIONE','APPUNTAMENTO_ASSENTE','intervento',j.id,'Appuntamento collegato non presente');
  if(appointment){
   const appointmentClient=id(appointment.client_id||appointment.clientId),appointmentSite=id(appointment.immobile_id||appointment.siteId);
   if(appointmentClient&&appointmentClient!==id(j.client_id)||appointmentSite&&appointmentSite!==id(j.immobile_id))add('BLOCCANTE','APPUNTAMENTO_ALTRA_SEDE','intervento',j.id,'Appuntamento di cliente o sede differente');
  }
  if(id(j.technician_id)&&people.size&&!people.has(id(j.technician_id)))add('REVISIONE','OPERATORE_ASSENTE','intervento',j.id,'Operatore assegnato non presente in anagrafica');
  if(j.workflow_status==='Chiuso'&&!j.finished_at)add('REVISIONE','CHIUSURA_SENZA_ORA','intervento',j.id,'Intervento chiuso senza ora di uscita');
  if(j.scheduled_start&&j.finished_at&&Date.parse(j.finished_at)<Date.parse(j.scheduled_start))add('REVISIONE','TEMPI_INCOERENTI','intervento',j.id,'Uscita precedente all’appuntamento');
 }
 for(const d of list(commerce.documents)){
  const site=id(d.siteId)?sites.get(id(d.siteId)):null;
  const clientId=id(d.clientId||d.subjectId);
  if(clientId&&!clients.has(clientId))add('BLOCCANTE','CLIENTE_ASSENTE','documento',d.id,'Cliente documento non presente');
  if(id(d.siteId)&&!site)add('BLOCCANTE','SEDE_ASSENTE','documento',d.id,'Sede documento non presente');
  if(site&&clientId&&!same(site.client_id,clientId))add('BLOCCANTE','DOCUMENTO_ALTRA_SEDE','documento',d.id,'Documento associato a sede di altro cliente');
  if(d.type==='Proforma'&&d.status==='Pagato')add('REVISIONE','PROFORMA_PAGATA','documento',d.id,'Verificare classificazione proforma e incasso');
  if((d.type==='Nota di credito'||d.fiscal?.tipoDocumento==='TD04')&&d.status==='Da pagare')add('REVISIONE','TD04_DA_PAGARE','documento',d.id,'Nota di credito non trattabile come fattura da pagare');
 }
 for(const p of list(commerce.settings?.technicalDrafts)){
  const clientId=id(p.clientId),site=id(p.propertyId)?sites.get(id(p.propertyId)):null;
  if(!clients.has(clientId))add('BLOCCANTE','CLIENTE_ASSENTE','pratica',p.id,'Cliente pratica inesistente');
  if(id(p.propertyId)&&!site)add('BLOCCANTE','SEDE_ASSENTE','pratica',p.id,'Sede pratica inesistente');
  if(site&&!same(site.client_id,clientId))add('BLOCCANTE','PRATICA_ALTRA_SEDE','pratica',p.id,'Pratica tecnica associata a cliente diverso dalla sede');
  if(id(p.interventionId)){
   const job=jobs.get(id(p.interventionId));
   if(!job)add('REVISIONE','INTERVENTO_ASSENTE','pratica',p.id,'Intervento collegato non presente');
   else if(!same(job.client_id,clientId)||id(p.propertyId)&&!same(job.immobile_id,p.propertyId))add('BLOCCANTE','PRATICA_ALTRO_INTERVENTO','pratica',p.id,'Intervento tecnico di altro cliente o sede');
  }
 }
 const severityOrder={BLOCCANTE:0,REVISIONE:1};
 issues.sort((a,b)=>(severityOrder[a.severity]-severityOrder[b.severity])||a.entity.localeCompare(b.entity)||a.id.localeCompare(b.id)||a.code.localeCompare(b.code));
 return {counts,issues,blocking:issues.filter(x=>x.severity==='BLOCCANTE').length,review:issues.filter(x=>x.severity==='REVISIONE').length,releaseAllowed:false,disclaimer:'Diagnostica interna di coerenza: non certifica documenti, dati fiscali o conformita.'};
}
function csv(report){
 const safe=x=>{let s=String(x??'').replace(/[\r\n\t]/g,' ');if(/^\s*[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
 const rows=[['Gravita','Codice','Entita','ID','Descrizione'],...report.issues.map(x=>[x.severity,x.code,x.entity,x.id,x.detail])];
 return '\uFEFF'+rows.map(r=>r.map(safe).join(';')).join('\r\n')+'\r\n';
}
const api=Object.freeze({inspect,csv});
root.ITEOperationalIntegrity=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
