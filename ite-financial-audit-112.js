/* I.T.E. 4.0.113 — consolidated financial audit, TEST only, read-only. */
(function(root,factory){const api=factory(typeof module==="object"&&module.exports?require("./ite-workflow-100.js"):root.ITEWorkflow100);if(typeof module==="object"&&module.exports)module.exports=api;root.ITEFinancialAudit112=api;})(typeof globalThis!=="undefined"?globalThis:this,function(base){
"use strict";
if(!base)throw Error("Workflow TEST mancante");
const safe=n=>Number.isSafeInteger(n)&&n>=0&&n<=100000000;
function inspect(s,clientId){
 base.validate(s);
 if(clientId&&!s.records.clients.some(x=>x.id===clientId))throw Error("Cliente inesistente");
 const issues=[],invoices=s.records.invoices,byId=new Map(invoices.map(x=>[x.id,x]));
 const quotes=new Map(s.records.quotes.map(x=>[x.id,x])),extras=new Map(s.records.extras.map(x=>[x.id,x]));
 const scoped=invoices.filter(x=>!clientId||x.clientId===clientId),billed=new Map(),credits=new Map();
 const flag=(code,id,detail)=>issues.push({code,invoiceId:id,detail});
 // Always aggregate across the entire archive: client filters must not hide cross-client overbilling.
 for(const inv of invoices){
  if(!safe(inv.totalCents)){if(!clientId||inv.clientId===clientId)flag("INVALID_TOTAL",inv.id,"Totale fuori intervallo");continue;}
  if(inv.type==="TD04"){
   const original=byId.get(inv.originalInvoiceId);
   if(!original||original.type!=="VENDITA"||original.clientId!==inv.clientId){
    if(!clientId||inv.clientId===clientId)flag("INVALID_CREDIT_REFERENCE",inv.id,"Vendita originale assente o di altro cliente");
    continue;
   }
   credits.set(original.id,(credits.get(original.id)||0)+inv.totalCents);
   continue;
  }
  if(inv.type==="ACQUISTO")continue;
  if(!["VENDITA","PROFORMA"].includes(inv.type)){if(!clientId||inv.clientId===clientId)flag("UNKNOWN_TYPE",inv.id,"Tipo sconosciuto");continue;}
  if(!Array.isArray(inv.sourceRows)||!inv.sourceRows.length){if(!clientId||inv.clientId===clientId)flag("NO_SOURCE",inv.id,"Righe origine mancanti");continue;}
  let total=0;const seen=new Set();
  for(const row of inv.sourceRows){
   const key=row&&row.source+":"+row.id,src=row&&(row.source==="quotes"?quotes:extras).get(row.id);
   if(!row||!["quotes","extras"].includes(row.source)||typeof row.id!=="string"){
    if(!clientId||inv.clientId===clientId)flag("INVALID_SOURCE",inv.id,"Origine non valida");continue;
   }
   if(seen.has(key)&&(!clientId||inv.clientId===clientId))flag("DUPLICATE_ROW",inv.id,key);
   seen.add(key);
   if(!src||src.clientId!==inv.clientId){if(!clientId||inv.clientId===clientId)flag("INVALID_SOURCE",inv.id,key);continue;}
   if(row.source==="extras"){
    const parent=quotes.get(src.quoteId);
    if((!parent||parent.clientId!==src.clientId)&&(!clientId||inv.clientId===clientId))flag("INVALID_EXTRA_PARENT",inv.id,key);
   }
   const approved=row.source==="quotes"?src.status==="ACCETTATO":["APPROVATO","PARZIALE"].includes(src.status);
   if(!approved&&(!clientId||inv.clientId===clientId))flag("SOURCE_NOT_APPROVED",inv.id,key);
   if(!Number.isSafeInteger(row.quantity)||row.quantity<1||row.quantity>10000||!safe(row.unitCents)){
    if(!clientId||inv.clientId===clientId)flag("INVALID_ROW",inv.id,key);continue;
   }
   if(row.unitCents!==src.unitCents&&(!clientId||inv.clientId===clientId))flag("PRICE_MISMATCH",inv.id,key);
   const limit=row.source==="extras"?src.approvedQuantity:src.quantity;
   if((!Number.isSafeInteger(limit)||limit<1||row.quantity>limit)&&(!clientId||inv.clientId===clientId))flag("EXCESS_QUANTITY",inv.id,key);
   const value=row.quantity*row.unitCents;
   if(!Number.isSafeInteger(value)||!Number.isSafeInteger(total+value)){
    if(!clientId||inv.clientId===clientId)flag("AMOUNT_OVERFLOW",inv.id,key);continue;
   }
   total+=value;
   if(inv.type==="VENDITA"){
    const bkey=inv.clientId+":"+key;
    const previous=billed.get(bkey)||{quantity:0,source:src,kind:row.source,clientId:inv.clientId};
    previous.quantity+=row.quantity;billed.set(bkey,previous);
   }
  }
  if(total!==inv.totalCents&&(!clientId||inv.clientId===clientId))flag("TOTAL_MISMATCH",inv.id,"Somma righe diversa dal totale");
 }
 for(const [key,v] of billed){
  const limit=v.kind==="quotes"?v.source.quantity:v.source.approvedQuantity;
  if((!Number.isSafeInteger(limit)||v.quantity>limit)&&(!clientId||v.clientId===clientId))flag("OVERBILLED",null,key);
 }
 for(const [id,value] of credits){
  const original=byId.get(id);
  if((!Number.isSafeInteger(value)||value>original.totalCents)&&(!clientId||original.clientId===clientId))flag("EXCESS_CREDIT",id,"Credito cumulativo superiore alla vendita");
 }
 const clients=s.records.clients.filter(x=>!clientId||x.id===clientId).map(c=>{
  const own=scoped.filter(x=>x.clientId===c.id);
  const amount=t=>own.filter(x=>x.type===t&&safe(x.totalCents)).reduce((n,x)=>n+x.totalCents,0);
  const salesCents=amount("VENDITA"),creditsCents=amount("TD04");
  return {clientId:c.id,salesCents,creditsCents,netSalesCents:salesCents-creditsCents,proformaCents:amount("PROFORMA"),purchasesCents:amount("ACQUISTO")};
 });
 return {schema:"ITE-FINANCIAL-AUDIT-TEST-113",revision:s.revision,clients,issues,valid:issues.length===0,officialReady:false,accounted:false};
}
function gate(s,clientId){const r=inspect(s,clientId);return {canPrepareDraft:r.valid,issues:r.issues,revision:r.revision,officialReady:false};}
return Object.freeze({inspect,gate});
});