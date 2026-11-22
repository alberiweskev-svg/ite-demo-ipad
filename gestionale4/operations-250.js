/* I.T.E. 4.0.250 — operational calendar and site dossier, metadata-only demo. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITEOperations250=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const validDate=x=>typeof x==="string"&&/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d)?$/.test(x)&&Number.isFinite(Date.parse(x));
const validText=(x,n=180)=>typeof x==="string"&&!!x.trim()&&x.length<=n;
const same=(a,b)=>a.trim().toLocaleLowerCase("it")===b.trim().toLocaleLowerCase("it");
function conflicts(s,{appointmentId,operator,start,end}){
 if(!validText(operator)||!validDate(start)||!validDate(end)||Date.parse(end)<=Date.parse(start))throw Error("FASCIA_ORARIA_NON_VALIDA");
 return s.appointments.filter(a=>a.id!==appointmentId&&same(a.operator,operator)&&Date.parse(a.start)<Date.parse(end)&&Date.parse(start)<Date.parse(a.end)).map(a=>a.id);
}
function reschedule(store,{appointmentId,operator,start,end}){
 if(!validText(appointmentId,64)||!validText(operator)||!validDate(start)||!validDate(end))throw Error("SPOSTAMENTO_NON_VALIDO");
 return store.transact(store.snapshot().revision,s=>{
  const a=s.appointments.find(x=>x.id===appointmentId);if(!a)throw Error("APPUNTAMENTO_ASSENTE");
  const linked=s.interventions.filter(i=>i.appointmentId===appointmentId);
  if(linked.some(i=>i.status!=="APERTO"))throw Error("INTERVENTO_GIA_AVVIATO");
  if(conflicts(s,{appointmentId,operator,start,end}).length)throw Error("OPERATORE_OCCUPATO");
  a.operator=operator.trim();a.start=start;a.end=end;
  for(const i of linked)i.operator=operator.trim();
 });
}
function closeWithoutQuote(store,{interventionId,operator,exit,notes=""}){
 if(!validText(interventionId,64)||!validText(operator)||!validDate(exit)||typeof notes!=="string"||notes.length>2000)throw Error("CHIUSURA_NON_VALIDA");
 return store.transact(store.snapshot().revision,s=>{
  const i=s.interventions.find(x=>x.id===interventionId);
  if(!i||i.status!=="IN_CORSO"||!validDate(i.arrival))throw Error("INTERVENTO_NON_IN_CORSO");
  if(i.operator!==operator.trim())throw Error("OPERATORE_NON_COINCIDE");
  if(Date.parse(exit)<Date.parse(i.arrival))throw Error("USCITA_PRIMA_ARRIVO");
  i.exit=exit;i.status="CHIUSO";i.notes=notes;
 });
}
function siteLedger(s,siteId){
 const site=s.sites.find(x=>x.id===siteId);if(!site)throw Error("SEDE_ASSENTE");
 const client=s.clients.find(x=>x.id===site.clientId);if(!client)throw Error("CLIENTE_ASSENTE");
 const plants=s.plants.filter(x=>x.siteId===siteId),plantIds=new Set(plants.map(x=>x.id));
 const equipment=s.equipment.filter(x=>plantIds.has(x.plantId));
 const interventions=s.interventions.filter(x=>x.siteId===siteId);
 const appointments=s.appointments.filter(x=>x.siteId===siteId);
 const docs=s.documents.filter(x=>x.siteId===siteId);
 const quotes=s.quotes.filter(q=>q.sourceInterventionId&&interventions.some(i=>i.id===q.sourceInterventionId));
 const quoteIds=new Set(quotes.map(q=>q.id));
 const sales=s.invoices.filter(x=>x.kind==="VENDITA"&&quoteIds.has(x.quoteId));
 const saleIds=new Set(sales.map(x=>x.id));
 const credits=s.invoices.filter(x=>x.kind==="TD04"&&saleIds.has(x.originalInvoiceId));
 const sum=xs=>xs.reduce((n,x)=>{const v=n+x.cents;if(!Number.isSafeInteger(v))throw Error("IMPORTO_NON_VALIDO");return v;},0);
 return {siteId,clientId:client.id,plants:plants.length,equipment:equipment.length,appointments:appointments.length,interventions:interventions.length,closed:interventions.filter(i=>i.status==="CHIUSO").length,documents:docs.length,quotes:quotes.length,sales:sales.length,credits:credits.length,soldCents:sum(sales),creditedCents:sum(credits),netCents:sum(sales)-sum(credits)};
}
function siteLedgerCSV(s,siteId){
 const r=siteLedger(s,siteId);
 const safe=v=>{let t=String(v);if(/^[\s]*[=+@\-]/.test(t))t="'"+t;return '"'+t.replace(/"/g,'""')+'"';};
 return Object.keys(r).map(safe).join(",")+"\r\n"+Object.values(r).map(safe).join(",")+"\r\n";
}
return Object.freeze({conflicts,reschedule,closeWithoutQuote,siteLedger,siteLedgerCSV});
});