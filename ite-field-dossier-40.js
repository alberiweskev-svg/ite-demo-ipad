/* I.T.E. 4.0 — Fascicolo operativo integrato TEST: lettura, nessun dato reale. */
(function(root){'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const test=x=>typeof x==='string'&&/^TEST-[A-Za-z0-9_-]{1,70}$/.test(x);
const euro=x=>Math.round(x*100)/100;
function build(operations,registry,options){
 if(!operations||!Array.isArray(operations.clients)||!Array.isArray(operations.appointments)||!Array.isArray(operations.interventions)||!Array.isArray(operations.quotes)||!Array.isArray(operations.operators))throw Error('OPERAZIONI_NON_VALIDE');
 if(!registry||!Array.isArray(registry.documents))throw Error('REGISTRO_NON_VALIDO');
 const filter=options||{};if(filter.clientId&&!test(filter.clientId))throw Error('FILTRO_NON_TEST');
 const rows=[],issues=[],linked=new Set(),seenAppointments=new Set();
 const quoteSummaries=new Map();
 const cents=v=>Math.round(v*100);
 const lineAmount=l=>Number.isFinite(l.quantity)&&Number.isFinite(l.unitPrice)?Math.round(l.quantity*l.unitPrice*100):NaN;
 const quoteTotals=q=>{const r={approved:0,pendingExtra:0,supply:0,installation:0,approvedSupply:0,approvedInstallation:0};for(const l of q.lines||[]){const amount=lineAmount(l);if(!Number.isFinite(amount)||amount<0){warn('VOCE_PREVENTIVO_NON_VALIDA',q.id,'Quantita o prezzo non validi');continue;}const accepted=!l.extra||l.approved;if(accepted)r.approved+=amount;else r.pendingExtra+=amount;if(l.kind==='FORNITURA'){r.supply+=amount;if(accepted)r.approvedSupply+=amount;}else if(l.kind==='POSA'){r.installation+=amount;if(accepted)r.approvedInstallation+=amount;}else warn('TIPO_VOCE_NON_VALIDO',q.id,'Fornitura e posa devono essere distinte');}return Object.fromEntries(Object.entries(r).map(([k,v])=>[k,v/100]));};
 const warn=(code,id,detail)=>issues.push({code,id,detail});
 for(const appointment of operations.appointments){
  if(filter.clientId&&appointment.clientId!==filter.clientId)continue;
  if(seenAppointments.has(appointment.id))warn('APPUNTAMENTO_DUPLICATO',appointment.id,'ID appuntamento ripetuto');seenAppointments.add(appointment.id);
  const client=operations.clients.find(x=>x.id===appointment.clientId);
  const site=client?.sites?.find(x=>x.id===appointment.siteId);
  const plant=site?.plants?.find(x=>x.id===appointment.plantId);
  const device=plant?.devices?.find(x=>x.id===appointment.deviceId);
  const operator=operations.operators.find(x=>x.id===appointment.operatorId);
  const interventionMatches=operations.interventions.filter(x=>x.appointmentId===appointment.id);
  const intervention=interventionMatches[0];
  if(interventionMatches.length>1)warn('INTERVENTI_MULTIPLI',appointment.id,'Piu interventi per lo stesso appuntamento');
  const documents=registry.documents.filter(d=>d.interventionId===intervention?.id);
  for(const d of documents)linked.add(d.id);
  const quotes=operations.quotes.filter(q=>q.clientId===appointment.clientId);
  // Preventivi privi di sede/intervento sono riferiti al CLIENTE, non attribuiti economicamente al singolo intervento.
  const financial=quotes.map(q=>{if(!quoteSummaries.has(q.id))quoteSummaries.set(q.id,{id:q.id,clientId:q.clientId,status:q.status,scope:'CLIENTE',...quoteTotals(q)});return quoteSummaries.get(q.id);});
  const arrival=intervention?.arrival||null,departure=intervention?.departure||null;
  const minutes=arrival&&departure&&Number.isFinite(Date.parse(arrival))&&Number.isFinite(Date.parse(departure))?Math.round((Date.parse(departure)-Date.parse(arrival))/60000):null;
  const row={appointmentId:appointment.id,clientId:appointment.clientId,clientName:client?.name||null,siteAddress:site?.address||null,plantType:plant?.type||null,deviceName:device?device.brand+' '+device.model:null,operatorName:operator?.name||null,operatorColor:operator?.color||null,scheduledStart:appointment.start,scheduledEnd:appointment.end,appointmentStatus:appointment.status,interventionId:intervention?.id||null,interventionStatus:intervention?.status||null,arrival,departure,minutes,documentCount:documents.length,documents:documents.map(d=>({id:d.id,type:d.type,title:d.title,status:d.status,revision:d.revision,attachmentCount:d.attachments?.length||0})),quotes:financial,quoteScope:'CLIENTE_NON_ATTRIBUITO',interventionHistory:clone(intervention?.history||[])};
  if(!client||!site||!plant||(appointment.deviceId&&!device)||!operator)warn('GERARCHIA_O_OPERATORE_MANCANTE',appointment.id,'Verificare riferimenti appuntamento');
  if(appointment.status==='CHIUSO'&&!intervention)warn('INTERVENTO_MANCANTE',appointment.id,'Appuntamento chiuso senza intervento');
  if(intervention&&intervention.operatorId!==appointment.operatorId)warn('OPERATORE_DIVERSO',appointment.id,'Operatore intervento diverso da appuntamento');
  if(intervention?.status==='CHIUSO'&&minutes===null)warn('TEMPI_NON_COMPLETI',appointment.id,'Orari intervento incompleti');
  if(minutes!==null&&minutes<0)warn('TEMPI_NEGATIVI',appointment.id,'Uscita precedente ad arrivo');
  if(intervention?.status==='CHIUSO'&&!documents.length)warn('FASCICOLO_SENZA_DOCUMENTI',appointment.id,'Intervento chiuso senza documenti collegati');
  if(documents.some(d=>d.status==='DA_VERIFICARE'))warn('DOCUMENTI_DA_VERIFICARE',appointment.id,'Documenti in attesa di verifica');
  rows.push(row);
 }
 for(const i of operations.interventions){if(!operations.appointments.some(a=>a.id===i.appointmentId)&&!filter.clientId)warn('INTERVENTO_ORFANO',i.id,'Intervento senza appuntamento');}
 for(const d of registry.documents){
  if(filter.clientId&&d.clientId!==filter.clientId)continue;
  if(d.interventionId&&!linked.has(d.id))warn('DOCUMENTO_NON_ASSOCIATO',d.id,'Documento collegato a intervento non presente nel filtro operativo');
 }
 rows.sort((a,b)=>String(a.scheduledStart).localeCompare(String(b.scheduledStart)));
 return clone({format:'ITE40_FIELD_DOSSIER_TEST',version:'4.0.25',financialScope:'CLIENTE',clientQuotes:[...quoteSummaries.values()],counts:{appointments:rows.length,closedInterventions:rows.filter(r=>r.interventionStatus==='CHIUSO').length,linkedDocuments:rows.reduce((n,r)=>n+r.documentCount,0),issues:issues.length},rows,issues});
}
function exportJSON(report){if(!report||report.format!=='ITE40_FIELD_DOSSIER_TEST')throw Error('REPORT_NON_VALIDO');return JSON.stringify(report,null,2)}
const api=Object.freeze({build,exportJSON});
root.ITE40FieldDossier=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
