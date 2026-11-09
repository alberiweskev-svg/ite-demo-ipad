/* I.T.E. 4.0.110 — cross-client commercial ledger preflight. TEST only; read-only. */
(function(root,factory){const api=factory(typeof module==="object"&&module.exports?require("./ite-workflow-100.js"):root.ITEWorkflow100);if(typeof module==="object"&&module.exports)module.exports=api;root.ITELedger110=api;})(typeof globalThis!=="undefined"?globalThis:this,function(base){
"use strict";
if(!base)throw Error("Dipendenza workflow 100 mancante");
const clone=x=>JSON.parse(JSON.stringify(x));
const safe=n=>Number.isSafeInteger(n)&&n>=0;
const total=rows=>rows.reduce((n,x)=>n+x,0);
function inspect(s,clientId){
 base.validate(s);
 if(clientId&&!s.records.clients.some(x=>x.id===clientId))throw Error("Cliente inesistente");
 const issues=[],report=[];
 const invoices=s.records.invoices.filter(x=>!clientId||x.clientId===clientId);
 const quotes=new Map(s.records.quotes.map(x=>[x.id,x]));
 const extras=new Map(s.records.extras.map(x=>[x.id,x]));
 const invoiceMap=new Map(s.records.invoices.map(x=>[x.id,x]));
 const billed=new Map(),credited=new Map();
 const flag=(code,invoiceId,detail)=>issues.push({code,invoiceId,detail});
 for(const inv of invoices){
  if(!safe(inv.totalCents)){flag("INVALID_TOTAL",inv.id,"Totale non valido");continue;}
  if(inv.type==="TD04"){
   const original=invoiceMap.get(inv.originalInvoiceId);
   if(!original||original.type!=="VENDITA"||original.clientId!==inv.clientId){flag("INVALID_CREDIT_REFERENCE",inv.id,"Vendita originale non valida");continue;}
   credited.set(original.id,(credited.get(original.id)||0)+inv.totalCents);
   continue;
  }
  if(!["VENDITA","PROFORMA"].includes(inv.type))continue;
  if(!Array.isArray(inv.sourceRows)||!inv.sourceRows.length){flag("NO_SOURCE",inv.id,"Origine righe assente");continue;}
  let sum=0;const local=new Set();
  for(const row of inv.sourceRows){
   const key=row.source+":"+row.id,source=row.source==="quotes"?quotes.get(row.id):row.source==="extras"?extras.get(row.id):null;
   if(local.has(key))flag("DUPLICATE_ROW",inv.id,key);
   local.add(key);
   if(!source||source.clientId!==inv.clientId){flag("INVALID_SOURCE",inv.id,key);continue;}
   if(row.source==="extras"&&!quotes.has(source.quoteId))flag("ORPHAN_EXTRA",inv.id,key);
   if(row.source==="extras"&&quotes.get(source.quoteId)?.clientId!==inv.clientId)flag("EXTRA_QUOTE_CLIENT_MISMATCH",inv.id,key);
   const approved=row.source==="quotes"?source.status==="ACCETTATO":["APPROVATO","PARZIALE"].includes(source.status);
   if(!approved)flag("SOURCE_NOT_APPROVED",inv.id,key);
   if(!safe(row.quantity)||row.quantity===0||!safe(row.unitCents)){flag("INVALID_ROW_AMOUNT",inv.id,key);continue;}
   if(row.unitCents!==source.unitCents)flag("PRICE_MISMATCH",inv.id,key);
   const line=row.quantity*row.unitCents;
   if(!Number.isSafeInteger(line)||!Number.isSafeInteger(sum+line)){flag("AMOUNT_OVERFLOW",inv.id,key);continue;}
   sum+=line;
   const limit=row.source==="extras"?source.approvedQuantity:source.quantity;
   if(!safe(limit)||row.quantity>limit)flag("EXCESS_ROW_QUANTITY",inv.id,key);
   if(inv.type==="VENDITA")billed.set(key,(billed.get(key)||0)+row.quantity);
  }
  if(sum!==inv.totalCents)flag("TOTAL_MISMATCH",inv.id,"Totale diverso dalla somma delle righe");
 }
 for(const [key,qty] of billed){
  const [kind,id]=key.split(":"),source=(kind==="quotes"?quotes:extras).get(id);
  if(!source)continue;
  const limit=kind==="extras"?source.approvedQuantity:source.quantity;
  if(!safe(limit)||qty>limit)flag("OVERBILLED",null,key);
 }
 for(const [id,value] of credited){
  const original=invoiceMap.get(id);
  if(value>original.totalCents)flag("EXCESS_CREDIT",id,"Note di credito superiori alla vendita");
 }
 const clients=clientId?s.records.clients.filter(x=>x.id===clientId):s.records.clients;
 for(const c of clients){
  const own=invoices.filter(x=>x.clientId===c.id),sumType=t=>total(own.filter(x=>x.type===t&&safe(x.totalCents)).map(x=>x.totalCents));
  report.push({clientId:c.id,salesCents:sumType("VENDITA"),creditsCents:sumType("TD04"),proformaCents:sumType("PROFORMA"),purchasesCents:sumType("ACQUISTO"),netSalesCents:sumType("VENDITA")-sumType("TD04")});
 }
 return clone({schema:"ITE-LEDGER-TEST-110",revision:s.revision,clients:report,issues,valid:issues.length===0,officialReady:false,accounted:false});
}
function gate(s,clientId){
 const result=inspect(s,clientId);
 return {canPrepareDraft:result.valid,issues:result.issues,revision:result.revision,officialReady:false};
}
return Object.freeze({inspect,gate});
});