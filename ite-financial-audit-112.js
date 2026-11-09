/* I.T.E. 4.0.112 — financial audit and draft safety, TEST only, read-only. */
(function(root,factory){const api=factory(typeof module==="object"&&module.exports?require("./ite-workflow-100.js"):root.ITEWorkflow100);if(typeof module==="object"&&module.exports)module.exports=api;root.ITEFinancialAudit112=api;})(typeof globalThis!=="undefined"?globalThis:this,function(base){
"use strict";
if(!base)throw Error("Workflow TEST mancante");
const safe=n=>Number.isSafeInteger(n)&&n>=0&&n<=100000000;
const sum=(a)=>a.reduce((n,x)=>n+x,0);
function inspect(s,clientId){
 base.validate(s);
 if(clientId&&!s.records.clients.some(x=>x.id===clientId))throw Error("Cliente inesistente");
 const issues=[],byId=new Map(s.records.invoices.map(x=>[x.id,x]));
 const quotes=new Map(s.records.quotes.map(x=>[x.id,x])),extras=new Map(s.records.extras.map(x=>[x.id,x]));
 const billed=new Map(),credits=new Map(),scoped=s.records.invoices.filter(x=>!clientId||x.clientId===clientId);
 const flag=(code,id,detail)=>issues.push({code,invoiceId:id,detail});
 for(const inv of scoped){
  if(!safe(inv.totalCents)){flag("INVALID_TOTAL",inv.id,"Totale fuori intervallo");continue;}
  if(inv.type==="TD04"){
   const original=byId.get(inv.originalInvoiceId);
   if(!original||original.type!=="VENDITA"||original.clientId!==inv.clientId){flag("INVALID_CREDIT_REFERENCE",inv.id,"Vendita originale assente o di altro cliente");continue;}
   credits.set(original.id,(credits.get(original.id)||0)+inv.totalCents);continue;
  }
  if(inv.type==="ACQUISTO")continue;
  if(!["VENDITA","PROFORMA"].includes(inv.type)){flag("UNKNOWN_TYPE",inv.id,"Tipo documento sconosciuto");continue;}
  if(!Array.isArray(inv.sourceRows)||!inv.sourceRows.length){flag("NO_SOURCE",inv.id,"Righe origine mancanti");continue;}
  let total=0;const seen=new Set();
  for(const row of inv.sourceRows){
   if(!row||!["quotes","extras"].includes(row.source)||typeof row.id!=="string"){flag("INVALID_SOURCE",inv.id,"Origine non valida");continue;}
   const key=row.source+":"+row.id,src=(row.source==="quotes"?quotes:extras).get(row.id);
   if(seen.has(key))flag("DUPLICATE_ROW",inv.id,key);
   seen.add(key);
   if(!src||src.clientId!==inv.clientId){flag("INVALID_SOURCE",inv.id,key);continue;}
   if(row.source==="extras"){
    const parent=quotes.get(src.quoteId);
    if(!parent||parent.clientId!==inv.clientId)flag("INVALID_EXTRA_PARENT",inv.id,key);
   }
   const approved=row.source==="quotes"?src.status==="ACCETTATO":["APPROVATO","PARZIALE"].includes(src.status);
   if(!approved)flag("SOURCE_NOT_APPROVED",inv.id,key);
   if(!Number.isSafeInteger(row.quantity)||row.quantity<1||row.quantity>10000||!safe(row.unitCents)){flag("INVALID_ROW",inv.id,key);continue;}
   if(row.unitCents!==src.unitCents)flag("PRICE_MISMATCH",inv.id,key);
   const limit=row.source==="extras"?src.approvedQuantity:src.quantity;
   if(!Number.isSafeInteger(limit)||limit<1||row.quantity>limit)flag("EXCESS_QUANTITY",inv.id,key);
   const value=row.quantity*row.unitCents;
   if(!Number.isSafeInteger(value)||!Number.isSafeInteger(total+value)){flag("AMOUNT_OVERFLOW",inv.id,key);continue;}
   total+=value;
   if(inv.type==="VENDITA")billed.set(key,(billed.get(key)||0)+row.quantity);
  }
  if(total!==inv.totalCents)flag("TOTAL_MISMATCH",inv.id,"Somma righe diversa dal totale");
 }
 for(const [key,quantity] of billed){
  const cut=key.indexOf(":"),kind=key.slice(0,cut),id=key.slice(cut+1);
  const src=(kind==="quotes"?quotes:extras).get(id);
  if(!src)continue;
  const limit=kind==="quotes"?src.quantity:src.approvedQuantity;
  if(!Number.isSafeInteger(limit)||quantity>limit)flag("OVERBILLED",null,key);
 }
 for(const [id,value] of credits)if(value>byId.get(id).totalCents)flag("EXCESS_CREDIT",id,"Credito cumulativo superiore alla vendita");
 const clients=s.records.clients.filter(x=>!clientId||x.id===clientId).map(c=>{
  const own=scoped.filter(x=>x.clientId===c.id),amount=t=>sum(own.filter(x=>x.type===t&&safe(x.totalCents)).map(x=>x.totalCents));
  const salesCents=amount("VENDITA"),creditsCents=amount("TD04");
  return {clientId:c.id,salesCents,creditsCents,netSalesCents:salesCents-creditsCents,proformaCents:amount("PROFORMA"),purchasesCents:amount("ACQUISTO")};
 });
 return {schema:"ITE-FINANCIAL-AUDIT-TEST-112",revision:s.revision,clients,issues,valid:issues.length===0,officialReady:false,accounted:false};
}
function gate(s,clientId){const r=inspect(s,clientId);return {canPrepareDraft:r.valid,issues:r.issues,revision:r.revision,officialReady:false};}
return Object.freeze({inspect,gate});
});
