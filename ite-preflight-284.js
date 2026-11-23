/* I.T.E. 4.0.284 — integrated fiscal preflight, synthetic only. No fiscal issuance. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ITEPreflight284=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const validDate=x=>typeof x==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x+"T00:00:00Z"))&&new Date(x+"T00:00:00Z").toISOString().slice(0,10)===x;
const cents=x=>Number.isSafeInteger(x)&&x>=0;
const sum=(a,f)=>a.reduce((n,x)=>n+f(x),0);
function inspect(input){
if(!input||!validDate(input.today))throw Error("DATA_NON_VALIDA");
const {sales,purchases,receivables,payables,dossier,today}=input;
if(!sales||!purchases||!receivables||!payables||!dossier||!Array.isArray(sales.documents)||!Array.isArray(sales.receipts)||!Array.isArray(purchases.documents)||!Array.isArray(purchases.payments)||!Array.isArray(receivables.receivableDeadlines)||!Array.isArray(payables.deadlines))throw Error("ARCHIVI_INCOMPLETI");
const issues=[],rows=[],totals={receivableCents:0,payableCents:0,overdueReceivableCents:0,overduePayableCents:0,unplannedReceivableCents:0,unplannedPayableCents:0};
const flag=(severity,code,id,detail)=>issues.push({severity,code,id,detail:String(detail||"")});
for(const cfg of [{direction:"VENDITA",register:sales,base:"VENDITA",credit:"TD04_VENDITA",settlements:sales.receipts,deadlines:receivables.receivableDeadlines,total:"receivableCents",overdue:"overdueReceivableCents",unplanned:"unplannedReceivableCents"},{direction:"ACQUISTO",register:purchases,base:"ACQUISTO",credit:"TD04_ACQUISTO",settlements:purchases.payments,deadlines:payables.deadlines,total:"payableCents",overdue:"overduePayableCents",unplanned:"unplannedPayableCents"}]){
const docs=cfg.register.documents,originals=docs.filter(x=>x.type===cfg.base),known=new Set(originals.map(x=>x.id));
for(const x of docs.filter(x=>x.type===cfg.credit))if(!known.has(x.referenceId))flag("BLOCK","NOTA_ORFANA",x.id,x.referenceId);
for(const p of cfg.settlements)if(!known.has(p.documentId))flag("BLOCK","MOVIMENTO_ORFANO",p.id,p.documentId);
for(const deadline of cfg.deadlines)if(!known.has(deadline.invoiceId||deadline.documentId))flag("BLOCK","SCADENZA_ORFANA",deadline.id,deadline.invoiceId||deadline.documentId);
for(const doc of originals){
const credits=sum(docs.filter(x=>x.type===cfg.credit&&x.referenceId===doc.id),x=>x.netCents),settled=sum(cfg.settlements.filter(x=>x.documentId===doc.id),x=>x.amountCents),balance=doc.netCents-credits-settled;
if(!cents(doc.netCents)||!cents(credits)||!cents(settled)||!cents(balance)){flag("BLOCK","SALDO_INCOERENTE",doc.id,"Credito e pagamenti eccedono il netto");continue;}
if(doc.taxCalculationRequired)flag("BLOCK","IVA_NON_VERIFICATA",doc.id,"Importo netto dimostrativo");
if(cfg.direction==="VENDITA"&&!dossier.clients?.some(x=>x.id===doc.clientId))flag("BLOCK","CLIENTE_INESISTENTE",doc.id,doc.clientId);
if(doc.siteId&&!dossier.sites?.some(x=>x.id===doc.siteId))flag("BLOCK","SEDE_INESISTENTE",doc.id,doc.siteId);
const schedule=cfg.deadlines.filter(x=>(x.invoiceId||x.documentId)===doc.id).sort((a,b)=>String(a.dueDate).localeCompare(String(b.dueDate))||String(a.id).localeCompare(String(b.id)));
let planned=0,overdue=0;const scheduledTotal=sum(schedule,x=>cents(x.amountCents)?x.amountCents:0);
if(scheduledTotal>doc.netCents-credits)flag("BLOCK","SCADENZE_ECCESSIVE",doc.id,scheduledTotal);
for(const d of schedule){if(!validDate(d.dueDate)||!cents(d.amountCents)){flag("BLOCK","SCADENZA_INVALIDA",d.id,doc.id);continue;}
const remaining=Math.max(0,balance-planned),part=Math.min(remaining,d.amountCents);planned+=part;if(d.dueDate<today)overdue+=part;
}
const unplanned=Math.max(0,balance-planned);if(unplanned)flag("WARN","SENZA_SCADENZA",doc.id,unplanned);if(overdue)flag("WARN","SCADUTO",doc.id,overdue);
rows.push({direction:cfg.direction,id:doc.id,netCents:doc.netCents,creditCents:credits,settledCents:settled,residualCents:balance,overdueCents:overdue,unplannedCents:unplanned});
totals[cfg.total]+=balance;totals[cfg.overdue]+=overdue;totals[cfg.unplanned]+=unplanned;
}}
for(const p of sales.documents.filter(x=>x.type==="PROFORMA"))flag("INFO","PROFORMA_ESCLUSA",p.id,"Non è un credito esigibile");
issues.sort((a,b)=>a.severity.localeCompare(b.severity)||a.code.localeCompare(b.code)||a.id.localeCompare(b.id));
return {schema:"ITE_PREFLIGHT_284",mode:"TEST_ONLY",today,revisions:{sales:sales.revision,purchases:purchases.revision,receivables:receivables.revision,payables:payables.revision,dossier:dossier.revision},rows,totals,issues,blocked:issues.some(x=>x.severity==="BLOCK"),readyForFiscalUse:false};
}
return Object.freeze({inspect,exportJSON:input=>JSON.stringify(inspect(input),null,2)});
});
