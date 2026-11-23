/* I.T.E. 4.0.283 — integrated commercial controls. TEST only; no tax computation or fiscal issuance. */
(function(root,factory){"use strict";const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITEFinancialControls283=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const safe=x=>Number.isSafeInteger(x)&&x>=0;
function analyze({sales,purchases,receivables,payables,dossier,today}){
if(!/^\d{4}-\d{2}-\d{2}$/.test(today||"")||new Date(today+"T00:00:00Z").toISOString().slice(0,10)!==today)throw Error("DATA_NON_VALIDA");
if(!sales||!purchases||!receivables||!payables||!dossier||!Array.isArray(sales.documents)||!Array.isArray(purchases.documents)||!Array.isArray(sales.receipts)||!Array.isArray(purchases.payments)||!Array.isArray(receivables.receivableDeadlines)||!Array.isArray(payables.deadlines))throw Error("ARCHIVI_INCOMPLETI");
const issues=[],rows=[],totals={salesNetCents:0,purchasesNetCents:0,receivableCents:0,payableCents:0,overdueReceivableCents:0,overduePayableCents:0,unscheduledReceivableCents:0,unscheduledPayableCents:0};
const issue=(code,documentId,detail)=>issues.push({code,documentId,detail});
function audit(direction,docs,settlements,deadlines,baseType,creditType,settlementKey){
const originals=docs.filter(x=>x.type===baseType);
for(const doc of originals){
const credits=docs.filter(x=>x.type===creditType&&x.referenceId===doc.id).reduce((n,x)=>n+x.netCents,0);
const paid=settlements.filter(x=>x.documentId===doc.id).reduce((n,x)=>n+x[settlementKey],0);
const balance=doc.netCents-credits-paid;
if(!safe(doc.netCents)||!safe(credits)||!safe(paid)||!safe(balance))issue("SALDO_NON_VALIDO",doc.id,"Importi incoerenti");
const amount=Math.max(0,balance),due=deadlines.filter(x=>x.invoiceId===doc.id||x.documentId===doc.id).sort((a,b)=>a.dueDate.localeCompare(b.dueDate)||a.id.localeCompare(b.id));
let allocated=0,overdue=0;
for(const item of due){if(!safe(item.amountCents)||!/^\d{4}-\d{2}-\d{2}$/.test(item.dueDate)) {issue("SCADENZA_NON_VALIDA",doc.id,item.id);continue;}const outstanding=Math.min(Math.max(0,amount-allocated),item.amountCents);allocated+=outstanding;if(item.dueDate<today)overdue+=outstanding;}
const unscheduled=Math.max(0,amount-allocated);
if(unscheduled)issue("SCADENZA_MANCANTE",doc.id,String(unscheduled));
if(overdue)issue("SCADUTO",doc.id,String(overdue));
if(doc.taxCalculationRequired===true)issue("IVA_DA_VERIFICARE",doc.id,"Bozza con importi netti");
if(direction==="VENDITA"&&!dossier.clients?.some(x=>x.id===doc.clientId))issue("CLIENTE_MANCANTE",doc.id,doc.clientId||"");
if(doc.siteId&&!dossier.sites?.some(x=>x.id===doc.siteId))issue("SEDE_MANCANTE",doc.id,doc.siteId);
rows.push({direction,id:doc.id,number:doc.number,netCents:doc.netCents,creditCents:credits,settledCents:paid,residualCents:balance,overdueCents:overdue,unscheduledCents:unscheduled});
const prefix=direction==="VENDITA"?"receivable":"payable";totals[prefix+"Cents"]+=amount;totals["overdue"+(direction==="VENDITA"?"Receivable":"Payable")+"Cents"]+=overdue;totals["unscheduled"+(direction==="VENDITA"?"Receivable":"Payable")+"Cents"]+=unscheduled;
totals[direction==="VENDITA"?"salesNetCents":"purchasesNetCents"]+=doc.netCents;
}
for(const item of deadlines)if(!originals.some(x=>x.id===(item.invoiceId||item.documentId)))issue("SCADENZA_ORFANA",item.invoiceId||item.documentId||"",item.id||"");
}
audit("VENDITA",sales.documents,sales.receipts,receivables.receivableDeadlines,"VENDITA","TD04_VENDITA","amountCents");
audit("ACQUISTO",purchases.documents,purchases.payments,payables.deadlines,"ACQUISTO","TD04_ACQUISTO","amountCents");
for(const doc of sales.documents.filter(x=>x.type==="PROFORMA"))issue("PROFORMA_NON_FATTURA",doc.id,"Esclusa dai crediti");
issues.sort((a,b)=>a.code.localeCompare(b.code)||a.documentId.localeCompare(b.documentId));
return {schema:"ITE_FINANCIAL_CONTROLS_283",mode:"TEST_NET_NO_IVA",today,revisions:{sales:sales.revision,purchases:purchases.revision,receivables:receivables.revision,payables:payables.revision,dossier:dossier.revision},totals,rows,issues,readyForFiscalUse:false};
}
return {analyze,exportJSON:input=>JSON.stringify(analyze(input),null,2)};
});