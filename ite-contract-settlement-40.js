/* I.T.E. 4.0.59 — Contract settlement and advances, TEST only.
 * Pure calculations; no fiscal emission, no network, no customer data.
 */
(function(root,factory){const api=factory(
 typeof module==="object"&&module.exports?require("./ite-quotes-40.js"):root.ITEQuotes40,
 typeof module==="object"&&module.exports?require("./ite-invoice-ledger-40.js"):root.ITEInvoiceLedger40
);if(typeof module==="object"&&module.exports)module.exports=api;root.ITEContractSettlement40=api;})(typeof globalThis!=="undefined"?globalThis:this,function(quotes,invoices){
"use strict";
if(!quotes||!invoices)throw Error("Motori contabili mancanti");
const check=(v,m)=>{if(!v)throw Error(m);};
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
const id=v=>check(typeof v==="string"&&/^TEST-[A-Z0-9-]{2,60}$/.test(v),"ID TEST non valido");
const clone=x=>JSON.parse(JSON.stringify(x));
const date=v=>check(typeof v==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&new Date(v+"T12:00:00Z").toISOString().slice(0,10)===v,"Data non valida");
function empty(){return {schema:"ITE-CONTRACT-SETTLEMENT-TEST-1",links:[]};}
function validate(db,quoteDb,invoiceDb){
 quotes.validate(quoteDb);invoices.validate(invoiceDb);
 check(db&&db.schema==="ITE-CONTRACT-SETTLEMENT-TEST-1"&&Array.isArray(db.links)&&db.links.length<=3000,"Archivio contratti incompatibile");
 const invoiceIds=new Set(),refs=new Set();
 for(const link of db.links){
  check(link&&typeof link==="object","Collegamento non valido");id(link.quoteId);id(link.invoiceId);
  check(!invoiceIds.has(link.invoiceId),"Fattura collegata più volte");invoiceIds.add(link.invoiceId);
  check(link.kind==="ADVANCE"||link.kind==="BALANCE","Tipo collegamento non valido");
  date(link.date);
  const quote=quoteDb.quotes.find(q=>q.id===link.quoteId),doc=invoiceDb.documents.find(d=>d.id===link.invoiceId);
  check(quote&&quote.status==="ACCEPTED","Preventivo non accettato o mancante");
  check(doc&&doc.type==="SALE"&&doc.party===quote.customer,"Fattura vendita o cliente incoerente");
  check(link.date===doc.date,"Data fattura non coerente");
  check(!refs.has(link.quoteId+"|"+doc.number),"Numero fattura duplicato per contratto");refs.add(link.quoteId+"|"+doc.number);
 }
 return true;
}
function report(db,quoteDb,invoiceDb,quoteId){
 validate(db,quoteDb,invoiceDb);id(quoteId);
 const quote=quoteDb.quotes.find(q=>q.id===quoteId);check(quote,"Preventivo non trovato");
 const summary=quotes.summarize(quoteDb,quoteId);
 const linked=db.links.filter(x=>x.quoteId===quoteId);
 const rows=linked.map(link=>{
  const doc=invoiceDb.documents.find(d=>d.id===link.invoiceId);
  const paid=round(invoiceDb.payments.filter(p=>p.documentId===doc.id).reduce((s,p)=>s+p.amount,0));
  return {invoiceId:doc.id,number:doc.number,kind:link.kind,total:doc.total,paid,unpaid:round(doc.total-paid)};
 });
 const billed=round(rows.reduce((s,r)=>s+r.total,0)),paid=round(rows.reduce((s,r)=>s+r.paid,0));
 const contract=summary.contractTotal;
 return {quoteId,contractTotal:contract,billed,paid,unpaid:round(billed-paid),remainingToInvoice:round(contract-billed),overbilled:billed>contract,rows,warning:"TEST: gli acconti sono collegamenti a fatture, non aliquote fiscali o incassi automatici."};
}
function link(db,quoteDb,invoiceDb,quoteId,invoiceId,kind){
 validate(db,quoteDb,invoiceDb);id(quoteId);id(invoiceId);
 check(["ADVANCE","BALANCE"].includes(kind),"Tipo collegamento non valido");
 const quote=quoteDb.quotes.find(q=>q.id===quoteId),doc=invoiceDb.documents.find(d=>d.id===invoiceId);
 check(quote&&quote.status==="ACCEPTED","Preventivo non accettato");
 check(doc&&doc.type==="SALE"&&doc.party===quote.customer,"Documento o cliente non coerente");
 check(!db.links.some(x=>x.invoiceId===invoiceId),"Fattura già collegata");
 const next=clone(db);next.links.push({quoteId,invoiceId,kind,date:doc.date});
 validate(next,quoteDb,invoiceDb);
 const status=report(next,quoteDb,invoiceDb,quoteId);
 check(!status.overbilled,"Importo fatturato superiore al contratto");
 return {archive:next,report:status};
}
function importJson(raw,quoteDb,invoiceDb){
 check(typeof raw==="string"&&raw.length<=1000000,"Archivio troppo grande");
 const db=JSON.parse(raw);validate(db,quoteDb,invoiceDb);return clone(db);
}
function exportJson(db,quoteDb,invoiceDb){validate(db,quoteDb,invoiceDb);return JSON.stringify(db,null,2);}
return {empty,validate,link,report,importJson,exportJson};
});
