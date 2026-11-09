/* I.T.E. 4.0.109 — billing reconciliation and safeguards, TEST only. */
(function(root,factory){const api=factory(typeof module==="object"&&module.exports?require("./ite-workflow-100.js"):root.ITEWorkflow100,typeof module==="object"&&module.exports?require("./ite-service-commerce-108.js"):root.ITEServiceCommerce108);if(typeof module==="object"&&module.exports)module.exports=api;root.ITEBilling109=api;})(typeof globalThis!=="undefined"?globalThis:this,function(base,service){
"use strict";
if(!base||!service)throw Error("Dipendenze 100/108 mancanti");
const copy=x=>JSON.parse(JSON.stringify(x));
const find=(s,k,id)=>s.records[k].find(x=>x.id===id);
function audit(s,clientId){
 base.validate(s);if(!find(s,"clients",clientId))throw Error("Cliente inesistente");
 const invoices=s.records.invoices.filter(x=>x.clientId===clientId),issues=[],covered=new Map();
 for(const inv of invoices){
  if(["VENDITA","PROFORMA"].includes(inv.type)){
   if(!Array.isArray(inv.sourceRows)||!inv.sourceRows.length){issues.push({code:"NO_SOURCE",id:inv.id});continue;}
   let total=0;const local=new Set();
   for(const row of inv.sourceRows){
    const key=row.source+":"+row.id;
    if(local.has(key))issues.push({code:"DUPLICATE_ROW",id:inv.id,source:key});
    local.add(key);
    const original=find(s,row.source,row.id);
    if(!["quotes","extras"].includes(row.source)||!original||original.clientId!==clientId){issues.push({code:"INVALID_SOURCE",id:inv.id,source:key});continue;}
    if(row.source==="quotes"&&original.status!=="ACCETTATO"||row.source==="extras"&&!["APPROVATO","PARZIALE"].includes(original.status))issues.push({code:"SOURCE_NOT_APPROVED",id:inv.id,source:key});
    if(!Number.isSafeInteger(row.quantity)||row.quantity<1||!Number.isSafeInteger(row.unitCents)||row.unitCents<0){issues.push({code:"INVALID_AMOUNT",id:inv.id,source:key});continue;}
    total+=row.quantity*row.unitCents;
    if(inv.type==="VENDITA"){const prior=covered.get(key)||0;covered.set(key,prior+row.quantity);if(prior+row.quantity>original.quantity)issues.push({code:"OVERBILLED",id:inv.id,source:key});}
   }
   if(total!==inv.totalCents)issues.push({code:"TOTAL_MISMATCH",id:inv.id});
  }
  if(inv.type==="TD04"){
   const original=find(s,"invoices",inv.originalInvoiceId);
   if(!original||original.clientId!==clientId||original.type!=="VENDITA")issues.push({code:"INVALID_CREDIT_REFERENCE",id:inv.id});
  }
 }
 for(const inv of invoices.filter(x=>x.type==="VENDITA")){
  const credited=invoices.filter(x=>x.type==="TD04"&&x.originalInvoiceId===inv.id).reduce((n,x)=>n+x.totalCents,0);
  if(credited>inv.totalCents)issues.push({code:"EXCESS_CREDIT",id:inv.id});
 }
 const sum=t=>invoices.filter(x=>x.type===t).reduce((n,x)=>n+x.totalCents,0);
 return {clientId,issues,salesCents:sum("VENDITA"),creditsCents:sum("TD04"),netSalesCents:sum("VENDITA")-sum("TD04"),proformaCents:sum("PROFORMA"),officialReady:false,accounted:false};
}
function prepareUnique(s,interventionId,id,operator,expected,type="PROFORMA"){
 base.validate(s);if(expected!==s.revision)throw Error("Conflitto revisione");
 if(!["PROFORMA","VENDITA"].includes(type))throw Error("Tipo bozza non ammesso");
 const job=find(s,"interventions",interventionId);if(!job)throw Error("Intervento inesistente");
 const draft=service.prepareInvoice(s,interventionId,id,operator,expected,type);
 const created=find(draft,"invoices",id);
 if(!created||!created.sourceRows?.length)throw Error("Nessuna voce");
 const prior=s.records.invoices.filter(x=>x.type===type&&x.clientId===job.clientId);
 const signature=rows=>rows.map(x=>x.source+":"+x.id+":"+x.quantity+":"+x.unitCents).sort().join("|");
 if(prior.some(x=>signature(x.sourceRows||[])===signature(created.sourceRows)))throw Error("Bozza identica già presente");
 if(type==="VENDITA"){
  const used=new Map();
  for(const inv of s.records.invoices.filter(x=>x.type==="VENDITA"&&x.clientId===job.clientId))
   for(const row of inv.sourceRows||[]){const key=row.source+":"+row.id;used.set(key,(used.get(key)||0)+row.quantity);}
  for(const row of created.sourceRows){const key=row.source+":"+row.id,original=find(s,row.source,row.id);const allowed=row.source==="extras"?original?.approvedQuantity:original?.quantity;if(!original||used.get(key)+row.quantity>allowed && (used.get(key)||0)+row.quantity>allowed)throw Error("Voce già fatturata o quantità eccedente: "+key);}
 }
 return draft;
}
function dossier(s,interventionId){const d=service.dossier(s,interventionId);return copy({...d,reconciliation:audit(s,d.intervention.clientId)});}
return Object.freeze({audit,prepareUnique,dossier});
});