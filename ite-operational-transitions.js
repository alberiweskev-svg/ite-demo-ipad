/* I.T.E. 4.0 — pure operational transaction planner.
   Produces validated, immutable proposals. No archive writes or fiscal issuance. */
(function(root){'use strict';
const arr=x=>Array.isArray(x)?x:[];
const id=x=>String(x??'').trim();
const copy=x=>JSON.parse(JSON.stringify(x));
const lookup=(xs,k)=>arr(xs).find(x=>id(x.id)===id(k));
const fail=m=>{throw Error(m)};
const positive=(n,label)=>{if(!Number.isFinite(Number(n))||Number(n)<0)fail(label+' non valido');return Number(n)};
const money=n=>Math.round((Number(n)+Number.EPSILON)*100)/100;
function context(core,commerce,clientId,siteId,plantId,deviceId){
 const client=lookup(core.clienti,clientId),site=lookup(core.immobili,siteId);
 if(!client||!site||id(site.client_id)!==id(clientId))fail('Cliente o sede non coerenti');
 if(plantId){const plant=lookup(core.impianti,plantId);if(!plant||id(plant.immobile_id)!==id(siteId))fail('Impianto non coerente');}
 if(deviceId){const device=lookup(core.apparecchiature,deviceId);if(!device||!plantId||id(device.impianto_id)!==id(plantId))fail('Apparecchiatura non coerente');}
 return {clientId:id(clientId),siteId:id(siteId),plantId:id(plantId),deviceId:id(deviceId)};
}
function unique(core,commerce,newId){if(!id(newId)||!/^[-\w:.]{1,80}$/.test(id(newId)))fail('Identificativo non valido');
 const sets=[core.appuntamenti,core.interventi,commerce.quotes,commerce.extras,commerce.documents];
 if(sets.some(xs=>lookup(xs,newId)))fail('Identificativo già utilizzato');
 return id(newId);
}
function operator(core,operatorId){if(!id(operatorId))fail('Operatore obbligatorio');
 const staff=[...arr(core.dipendenti),...arr(core.operatori),...arr(core.collaboratori)];
 if(staff.length&&!lookup(staff,operatorId))fail('Operatore non presente');
 return id(operatorId);
}
function iso(value){const t=Date.parse(value);if(!value||!Number.isFinite(t))fail('Data/ora non valida');return t;}
function appointment(core,commerce,input){
 const c=context(core,commerce,input.clientId,input.siteId,input.plantId,input.deviceId);
 const start=iso(input.start),end=iso(input.end);
 if(end<=start)fail('Fine appuntamento precedente all’inizio');
 return Object.freeze({action:'CREATE_APPOINTMENT',collection:'appuntamenti',record:{
  id:unique(core,commerce,input.id),client_id:c.clientId,immobile_id:c.siteId,
  impianto_id:c.plantId,apparecchiatura_id:c.deviceId,operatorId:operator(core,input.operatorId),
  start:new Date(start).toISOString(),end:new Date(end).toISOString(),status:'PROGRAMMATO',
  description:id(input.description)},requiresReview:false});
}
function arrival(core,commerce,input){
 const a=lookup(core.appuntamenti,input.appointmentId);
 if(!a)fail('Appuntamento inesistente');
 const c=context(core,commerce,a.client_id||a.clientId,a.immobile_id||a.siteId,a.impianto_id||a.plantId,a.apparecchiatura_id||a.deviceId);
 if(lookup(core.interventi,input.id))fail('Intervento duplicato');
 if(arr(core.interventi).some(j=>id(j.appointmentId)===id(a.id)))fail('Intervento già aperto per appuntamento');
 const arrived=iso(input.arrivedAt);
 if(a.start&&arrived<iso(a.start)-86400000)fail('Arrivo non coerente con appuntamento');
 const technician=operator(core,input.operatorId||a.operatorId);
 return Object.freeze({action:'OPEN_INTERVENTION',collection:'interventi',record:{
 id:unique(core,commerce,input.id),appointmentId:id(a.id),client_id:c.clientId,immobile_id:c.siteId,
 impianto_id:c.plantId,apparecchiatura_id:c.deviceId,operatorId:technician,
 arrivedAt:new Date(arrived).toISOString(),workflow_status:'APERTO',description:id(a.description)},requiresReview:false});
}
function closure(core,commerce,input){
 const job=lookup(core.interventi,input.interventionId);
 if(!job||id(job.workflow_status).toUpperCase()==='CHIUSO')fail('Intervento inesistente o già chiuso');
 context(core,commerce,job.client_id||job.clientId,job.immobile_id||job.siteId,job.impianto_id||job.plantId,job.apparecchiatura_id||job.deviceId);
 const start=iso(job.arrivedAt),end=iso(input.departedAt);
 if(end<start)fail('Uscita precedente all’arrivo');
 const extras=id(input.additionalWork);
 return Object.freeze({action:'CLOSE_INTERVENTION',collection:'interventi',recordId:id(job.id),
 patch:{departedAt:new Date(end).toISOString(),workflow_status:'CHIUSO',additionalWork:extras,
 minutes:Math.round((end-start)/60000)},audit:{operatorId:operator(core,input.operatorId||job.operatorId),
 reason:'Chiusura intervento',previousStatus:id(job.workflow_status)},requiresReview:false});
}
function quote(core,commerce,input){
 const c=context(core,commerce,input.clientId,input.siteId,input.plantId,input.deviceId);
 const job=input.interventionId?lookup(core.interventi,input.interventionId):null;
 if(input.interventionId&&(!job||id(job.client_id||job.clientId)!==c.clientId||id(job.immobile_id||job.siteId)!==c.siteId))fail('Intervento del preventivo non coerente');
 const lines=arr(input.lines);
 if(!lines.length)fail('Voci preventivo mancanti');
 const normalized=lines.map((line,i)=>{const kind=id(line.kind).toUpperCase();
  if(!['FORNITURA','POSA','SMONTAGGIO','SMALTIMENTO','ALTRO'].includes(kind))fail('Tipo voce '+(i+1)+' non valido');
  const qty=positive(line.quantity,'Quantità'),price=positive(line.unitPrice,'Prezzo');
  if(qty===0||!id(line.description))fail('Voce preventivo incompleta');
  return {kind,description:id(line.description),quantity:qty,unitPrice:money(price),total:money(qty*price)};
 });
 return Object.freeze({action:'CREATE_QUOTE_DRAFT',collection:'quotes',record:{id:unique(core,commerce,input.id),
 clientId:c.clientId,siteId:c.siteId,interventionId:id(input.interventionId),status:'DA ACCETTARE',
 lines:normalized,subtotal:money(normalized.reduce((s,x)=>s+x.total,0))},requiresReview:true});
}
function extra(core,commerce,input){
 const q=lookup(commerce.quotes||commerce.preventivi,input.quoteId);
 if(!q)fail('Preventivo non presente');
 const c=context(core,commerce,q.clientId||q.client_id,q.siteId||q.immobile_id);
 if(id(q.status).toUpperCase()!=='ACCETTATO')fail('Extra collegabile solo a preventivo accettato');
 const planned=quote(core,{...commerce,quotes:[]},{id:input.id,clientId:c.clientId,siteId:c.siteId,lines:input.lines});
 return Object.freeze({action:'CREATE_EXTRA_DRAFT',collection:'extras',record:{...planned.record,
 quoteId:id(q.id),status:'DA APPROVARE',category:id(input.category)||'DA CLASSIFICARE'},requiresReview:true});
}
function invoiceDraft(core,commerce,input){
 const q=lookup(commerce.quotes||commerce.preventivi,input.quoteId);
 if(!q||id(q.status).toUpperCase()!=='ACCETTATO')fail('Preventivo non accettato');
 const c=context(core,commerce,q.clientId||q.client_id,q.siteId||q.immobile_id);
 const type=id(input.type).toUpperCase();
 if(!['VENDITA','PROFORMA','TD04'].includes(type))fail('Tipologia documento non valida');
 const amount=positive(input.amount,'Importo');
 if(type==='TD04'&&!id(input.originalInvoiceId))fail('TD04 senza fattura originaria');
 if(type==='TD04'){
  const original=lookup(commerce.documents,input.originalInvoiceId);
  if(!original||id(original.clientId||original.subjectId)!==c.clientId)fail('Fattura originaria non coerente');
 }
 return Object.freeze({action:'CREATE_ACCOUNTING_DRAFT',collection:'documents',record:{
 id:unique(core,commerce,input.id),clientId:c.clientId,siteId:c.siteId,quoteId:id(q.id),
 type,status:'BOZZA DA VERIFICARE',amount:money(amount),originalInvoiceId:id(input.originalInvoiceId),
 fiscalIssued:false},requiresReview:true,warning:'Bozza interna: non emette fatture o note di credito fiscali.'});
}
const api=Object.freeze({context,appointment,arrival,closure,quote,extra,invoiceDraft});
root.ITEOperationalTransitions=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
