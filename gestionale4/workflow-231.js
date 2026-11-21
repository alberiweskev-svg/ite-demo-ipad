/* I.T.E. 4.0.231 — synthetic workflow coordination. No production migrations. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITEWorkflow231=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const clone=x=>JSON.parse(JSON.stringify(x));
const euro=c=>(c/100).toFixed(2);
function resolve(s,siteId){const site=s.sites.find(x=>x.id===siteId);if(!site)throw Error("SEDE_ASSENTE");const client=s.clients.find(x=>x.id===site.clientId);if(!client)throw Error("CLIENTE_ASSENTE");return {site,client};}
function overview(s){
 const issues=[],push=(code,id)=>issues.push({code,id});
 for(const e of s.equipment){const plant=s.plants.find(p=>p.id===e.plantId);if(!plant||!s.sites.some(x=>x.id===plant.siteId))push("APPARECCHIATURA_ORFANA",e.id);}
 for(const i of s.interventions){
  const site=s.sites.find(x=>x.id===i.siteId);
  if(i.equipmentId){const eq=s.equipment.find(x=>x.id===i.equipmentId),plant=eq&&s.plants.find(x=>x.id===eq.plantId);if(!plant||plant.siteId!==i.siteId)push("APPARECCHIO_SEDE_DIVERSA",i.id);}
  if(i.appointmentId){const a=s.appointments.find(x=>x.id===i.appointmentId);if(a&&a.operator!==i.operator)push("OPERATORE_APPUNTAMENTO_DIVERSO",i.id);}
  if(!site)push("SEDE_INTERVENTO_ASSENTE",i.id);
 }
 for(const d of s.documents){if(d.siteId&&d.clientId){const site=s.sites.find(x=>x.id===d.siteId);if(site&&site.clientId!==d.clientId)push("DOCUMENTO_CLIENTE_SEDE_DIVERSI",d.id);}}
 const quotes=s.quotes.map(q=>({id:q.id,clientId:q.clientId,status:q.status,totalCents:q.lines.reduce((a,l)=>a+l.cents*l.qty,0),supplyCents:q.lines.filter(l=>l.kind.includes("FORNITURA")).reduce((a,l)=>a+l.cents*l.qty,0),laborCents:q.lines.filter(l=>l.kind.includes("POSA")).reduce((a,l)=>a+l.cents*l.qty,0)}));
 return {issues,quotes,open:s.interventions.filter(i=>i.status!=="CHIUSO").length,unbilled:quotes.filter(q=>q.status==="ACCETTATO"&&!s.invoices.some(i=>i.kind==="VENDITA"&&i.quoteId===q.id)),documents:s.documents.length};
}
function createVisit(store,{id,siteId,equipmentId,operator,start,end,appointmentId}){
 if(!id||!operator||!start||!end||!(Date.parse(end)>Date.parse(start)))throw Error("VISITA_INPUT_NON_VALIDO");
 return store.transact(store.snapshot().revision,s=>{
  resolve(s,siteId);
  if(equipmentId){const e=s.equipment.find(x=>x.id===equipmentId),p=e&&s.plants.find(x=>x.id===e.plantId);if(!p||p.siteId!==siteId)throw Error("APPARECCHIO_SEDE_DIVERSA");}
  if(s.appointments.some(a=>a.operator===operator&&Date.parse(a.start)<Date.parse(end)&&Date.parse(start)<Date.parse(a.end)))throw Error("OPERATORE_OCCUPATO");
  if(s.appointments.some(a=>a.id===id))throw Error("ID_DUPLICATO");
  s.appointments.push({id,siteId,operator,start,end});
  if(appointmentId)throw Error("PARAMETRO_NON_SUPPORTATO");
 });}
function quoteFromVisit(store,{id,appointmentId,lines}){
 return store.transact(store.snapshot().revision,s=>{
  const a=s.appointments.find(x=>x.id===appointmentId);if(!a)throw Error("APPUNTAMENTO_ASSENTE");
  const {client}=resolve(s,a.siteId);
  if(s.quotes.some(q=>q.id===id))throw Error("ID_DUPLICATO");
  if(!Array.isArray(lines)||!lines.length)throw Error("RIGHE_ASSENTI");
  s.quotes.push({id,clientId:client.id,status:"BOZZA",lines:clone(lines)});
 });}
function invoiceFromQuote(store,{id,quoteId,number}){
 return store.transact(store.snapshot().revision,s=>{
  const q=s.quotes.find(x=>x.id===quoteId);
  if(!q||q.status!=="ACCETTATO")throw Error("PREVENTIVO_NON_ACCETTATO");
  if(s.invoices.some(i=>i.id===id||i.kind==="VENDITA"&&i.quoteId===quoteId))throw Error("FATTURA_GIA_PRESENTE");
  const cents=q.lines.reduce((n,l)=>n+l.cents*l.qty,0);
  if(!Number.isSafeInteger(cents)||cents<0||!number||!number.trim())throw Error("IMPORTO_O_NUMERO_NON_VALIDO");
  s.invoices.push({id,clientId:q.clientId,kind:"VENDITA",number:number.trim(),cents,quoteId});
 });}
return Object.freeze({overview,createVisit,quoteFromVisit,invoiceFromQuote,euro});
});
