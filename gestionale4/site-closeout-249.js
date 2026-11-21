/* I.T.E. 4.0.249 — site visit closeout and client dossier, synthetic/local only.
 * No fiscal issuance, PDF storage or changes to 2.7.5/3.0.74. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITESiteCloseout249=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const copy=x=>JSON.parse(JSON.stringify(x));
const date=x=>typeof x==="string"&&/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d)?$/.test(x)&&Number.isFinite(Date.parse(x));
const text=(x,max=1000)=>typeof x==="string"&&!!x.trim()&&x.length<=max;
function dossier(s,siteId){
 const site=s.sites.find(x=>x.id===siteId);if(!site)throw Error("SEDE_ASSENTE");
 const client=s.clients.find(x=>x.id===site.clientId);if(!client)throw Error("CLIENTE_ASSENTE");
 const plants=s.plants.filter(x=>x.siteId===siteId),ids=new Set(plants.map(x=>x.id));
 const equipment=s.equipment.filter(x=>ids.has(x.plantId)),appointments=s.appointments.filter(x=>x.siteId===siteId);
 const interventions=s.interventions.filter(x=>x.siteId===siteId),documents=s.documents.filter(x=>x.siteId===siteId);
 const quotes=s.quotes.filter(x=>x.clientId===client.id),qids=new Set(quotes.map(x=>x.id));
 const invoices=s.invoices.filter(x=>x.clientId===client.id&&(x.quoteId&&qids.has(x.quoteId)||x.kind==="TD04"&&s.invoices.some(y=>y.id===x.originalInvoiceId&&qids.has(y.quoteId))));
 return copy({client,site,plants,equipment,appointments,interventions,documents,quotes,invoices});
}
function scheduleAndOpen(store,{appointmentId,interventionId,siteId,equipmentId,operator,start,end}){
 if(!text(appointmentId,64)||!text(interventionId,64)||!text(operator,180)||!date(start)||!date(end)||Date.parse(end)<=Date.parse(start))throw Error("PIANIFICAZIONE_NON_VALIDA");
 return store.transact(store.snapshot().revision,s=>{
  const site=s.sites.find(x=>x.id===siteId);if(!site)throw Error("SEDE_ASSENTE");
  if(s.appointments.some(x=>x.id===appointmentId)||s.interventions.some(x=>x.id===interventionId))throw Error("ID_DUPLICATO");
  if(s.appointments.some(x=>x.operator.trim().toLowerCase()===operator.trim().toLowerCase()&&Date.parse(x.start)<Date.parse(end)&&Date.parse(start)<Date.parse(x.end)))throw Error("OPERATORE_OCCUPATO");
  if(equipmentId){const eq=s.equipment.find(x=>x.id===equipmentId),p=eq&&s.plants.find(x=>x.id===eq.plantId);if(!p||p.siteId!==siteId)throw Error("APPARECCHIO_SEDE_DIVERSA");}
  s.appointments.push({id:appointmentId,siteId,operator:operator.trim(),start,end});
  s.interventions.push({id:interventionId,siteId,appointmentId,operator:operator.trim(),status:"APERTO",...(equipmentId?{equipmentId}:{})});
 });
}
function arrive(store,{interventionId,operator,arrival}){
 if(!date(arrival)||!text(operator,180))throw Error("ARRIVO_NON_VALIDO");
 return store.transact(store.snapshot().revision,s=>{
  const i=s.interventions.find(x=>x.id===interventionId);
  if(!i||i.status!=="APERTO")throw Error("INTERVENTO_NON_APERTO");
  if(i.operator!==operator.trim())throw Error("OPERATORE_NON_COINCIDE");
  const a=s.appointments.find(x=>x.id===i.appointmentId);
  if(a&&Date.parse(arrival)<Date.parse(a.start)-86400000)throw Error("ARRIVO_TROPPO_ANTICIPATO");
  i.arrival=arrival;i.status="IN_CORSO";
 });
}
function closeAndQuote(store,{interventionId,operator,exit,quoteId,lines,notes}){
 if(!date(exit)||!text(operator,180)||!text(quoteId,64)||!Array.isArray(lines)||!lines.length||lines.length>100||notes!==undefined&&typeof notes!=="string")throw Error("CHIUSURA_NON_VALIDA");
 return store.transact(store.snapshot().revision,s=>{
  const i=s.interventions.find(x=>x.id===interventionId);
  if(!i||i.status!=="IN_CORSO"||!date(i.arrival))throw Error("INTERVENTO_NON_IN_CORSO");
  if(i.operator!==operator.trim())throw Error("OPERATORE_NON_COINCIDE");
  if(Date.parse(exit)<Date.parse(i.arrival))throw Error("USCITA_PRIMA_ARRIVO");
  if(s.quotes.some(x=>x.id===quoteId))throw Error("PREVENTIVO_DUPLICATO");
  const site=s.sites.find(x=>x.id===i.siteId);if(!site)throw Error("SEDE_ASSENTE");
  const approvedKinds=new Set(["FORNITURA","POSA","SMONTAGGIO","SMALTIMENTO"]);
  for(const l of lines)if(!text(l.id,64)||!text(l.description)||!approvedKinds.has(l.kind)||!Number.isSafeInteger(l.cents)||l.cents<0||!Number.isSafeInteger(l.qty)||l.qty<1)throw Error("RIGA_NON_VALIDA");
  const kinds=new Set(lines.map(x=>x.kind));
  if(!kinds.has("FORNITURA")&&!kinds.has("POSA"))throw Error("FORNITURA_O_POSA_ASSENTE");
  i.exit=exit;i.status="CHIUSO";if(notes)i.notes=notes.slice(0,2000);
  s.quotes.push({id:quoteId,clientId:site.clientId,status:"BOZZA",lines:copy(lines),sourceInterventionId:interventionId});
 });
}
function report(s,siteId){
 const d=dossier(s,siteId);
 return {siteId,clientId:d.client.id,plants:d.plants.length,equipment:d.equipment.length,appointments:d.appointments.length,open:d.interventions.filter(x=>x.status!=="CHIUSO").length,closed:d.interventions.filter(x=>x.status==="CHIUSO").length,quotes:d.quotes.length,invoices:d.invoices.length,documents:d.documents.length};
}
return Object.freeze({dossier,scheduleAndOpen,arrive,closeAndQuote,report});
});