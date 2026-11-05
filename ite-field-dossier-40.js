/* I.T.E. 4.0 — Fascicolo operativo integrato TEST: lettura, nessun dato reale. */
(function(root){'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const test=x=>typeof x==='string'&&/^TEST-[A-Za-z0-9_-]{1,70}$/.test(x);
const euro=x=>Math.round(x*100)/100;
function build(operations,registry,options){
 if(!operations||!Array.isArray(operations.clients)||!Array.isArray(operations.appointments)||!Array.isArray(operations.interventions)||!Array.isArray(operations.quotes)||!Array.isArray(operations.operators))throw Error('OPERAZIONI_NON_VALIDE');
 if(!registry||!Array.isArray(registry.documents))throw Error('REGISTRO_NON_VALIDO');
 const filter=options||{};if(filter.clientId&&!test(filter.clientId))throw Error('FILTRO_NON_TEST');
 const rows=[],issues=[],linked=new Set();
 const warn=(code,id,detail)=>issues.push({code,id,detail});
 for(const appointment of operations.appointments){
  if(filter.clientId&&appointment.clientId!==filter.clientId)continue;
  const client=operations.clients.find(x=>x.id===appointment.clientId);
  const site=client?.sites?.find(x=>x.id===appointment.siteId);
  const plant=site?.plants?.find(x=>x.id===appointment.plantId);
  const device=plant?.devices?.find(x=>x.id===appointment.deviceId);
  const operator=operations.operators.find(x=>x.id===appointment.operatorId);
  const intervention=operations.interventions.find(x=>x.appointmentId===appointment.id);
  const documents=registry.documents.filter(d=>d.interventionId===intervention?.id);
  for(const d of documents)linked.add(d.id);
  const quotes=operations.quotes.filter(q=>q.clientId===appointment.clientId);
  const financial=quotes.map(q=>({id:q.id,status:q.status,approved:euro(q.lines.reduce((sum,l)=>sum+((!l.extra||l.approved)?l.quantity*l.unitPrice:0),0)),pendingExtra:euro(q.lines.reduce((sum,l)=>sum+((l.extra&&!l.approved)?l.quantity*l.unitPrice:0),0)),supply:euro(q.lines.reduce((sum,l)=>sum+(l.kind==='FORNITURA'?l.quantity*l.unitPrice:0),0)),installation:euro(q.lines.reduce((sum,l)=>sum+(l.kind==='POSA'?l.quantity*l.unitPrice:0),0))}));
  const arrival=intervention?.arrival||null,departure=intervention?.departure||null;
  const minutes=arrival&&departure&&Number.isFinite(Date.parse(arrival))&&Number.isFinite(Date.parse(departure))?Math.round((Date.parse(departure)-Date.parse(arrival))/60000):null;
  const row={appointmentId:appointment.id,clientId:appointment.clientId,clientName:client?.name||null,siteAddress:site?.address||null,plantType:plant?.type||null,deviceName:device?device.brand+' '+device.model:null,operatorName:operator?.name||null,operatorColor:operator?.color||null,scheduledStart:appointment.start,scheduledEnd:appointment.end,appointmentStatus:appointment.status,interventionId:intervention?.id||null,interventionStatus:intervention?.status||null,arrival,departure,minutes,documentCount:documents.length,documents:documents.map(d=>({id:d.id,type:d.type,title:d.title,status:d.status,revision:d.revision,attachmentCount:d.attachments?.length||0})),quotes:financial};
  if(!client||!site||!plant||!operator)warn('GERARCHIA_O_OPERATORE_MANCANTE',appointment.id,'Verificare riferimenti appuntamento');
  if(appointment.status==='CHIUSO'&&!intervention)warn('INTERVENTO_MANCANTE',appointment.id,'Appuntamento chiuso senza intervento');
  if(intervention?.status==='CHIUSO'&&minutes===null)warn('TEMPI_NON_COMPLETI',appointment.id,'Orari intervento incompleti');
  if(minutes!==null&&minutes<0)warn('TEMPI_NEGATIVI',appointment.id,'Uscita precedente ad arrivo');
  if(intervention?.status==='CHIUSO'&&!documents.length)warn('FASCICOLO_SENZA_DOCUMENTI',appointment.id,'Intervento chiuso senza documenti collegati');
  if(documents.some(d=>d.status==='DA_VERIFICARE'))warn('DOCUMENTI_DA_VERIFICARE',appointment.id,'Documenti in attesa di verifica');
  rows.push(row);
 }
 for(const d of registry.documents){
  if(filter.clientId&&d.clientId!==filter.clientId)continue;
  if(d.interventionId&&!linked.has(d.id))warn('DOCUMENTO_NON_ASSOCIATO',d.id,'Documento collegato a intervento non presente nel filtro operativo');
 }
 rows.sort((a,b)=>String(a.scheduledStart).localeCompare(String(b.scheduledStart)));
 return clone({format:'ITE40_FIELD_DOSSIER_TEST',version:'4.0.24',counts:{appointments:rows.length,closedInterventions:rows.filter(r=>r.interventionStatus==='CHIUSO').length,linkedDocuments:rows.reduce((n,r)=>n+r.documentCount,0),issues:issues.length},rows,issues});
}
function exportJSON(report){if(!report||report.format!=='ITE40_FIELD_DOSSIER_TEST')throw Error('REPORT_NON_VALIDO');return JSON.stringify(report,null,2)}
const api=Object.freeze({build,exportJSON});
root.ITE40FieldDossier=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
